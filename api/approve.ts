import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const n8nWebhookUrl = 'https://n8n.bylo.it/webhook/bylo-notification';

const supabase = createClient(supabaseUrl, supabaseKey);

// Funzione helper per aspettare
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Funzione per leggere dal DB con retry
async function fetchPropertyWithRetry(propertyId: string, maxRetries = 3, delayMs = 500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries}: Fetching property ${propertyId}`);
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await sleep(delayMs);
      continue;
    }

    // Verifica che i dati siano validi (non negativi)
    const hasValidData = data.prezzo_acquisto !== null && 
                         data.prezzo_acquisto !== undefined &&
                         (data.avm_agent_pricing_min > 0 || data.avm_immobiliare_insights_min > 0);

    if (hasValidData) {
      console.log(`✅ Attempt ${attempt}: Valid data found`);
      return data;
    }

    console.log(`⚠️ Attempt ${attempt}: Data not yet propagated, retrying...`);
    if (attempt < maxRetries) {
      await sleep(delayMs);
    }
  }

  // Se arriviamo qui, ritorniamo comunque i dati anche se non ideali
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  console.log('⚠️ Returning data after max retries (might not be fully propagated)');
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyId, status } = req.body;

    if (!propertyId || !status) {
      return res.status(400).json({ error: 'propertyId e status sono obbligatori' });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'status deve essere "approved" o "rejected"' });
    }

    console.log(`\n=== PROCESSING ${status.toUpperCase()} FOR PROPERTY ${propertyId} ===`);

    // 1. Leggi i dati dal database con retry logic
    console.log('Step 1: Fetching property from database with retry...');
    const property = await fetchPropertyWithRetry(propertyId);

    if (!property) {
      return res.status(404).json({ error: 'Property non trovata' });
    }

    console.log('Property data from DB:', {
      id: property.id,
      avm_agent_min: property.avm_agent_pricing_min,
      avm_agent_max: property.avm_agent_pricing_max,
      avm_immobiliare_min: property.avm_immobiliare_insights_min,
      avm_immobiliare_max: property.avm_immobiliare_insights_max,
      prezzo_acquisto: property.prezzo_acquisto,
      prezzo_acquisto_meno_5: property.prezzo_acquisto_meno_5,
      status: property.status
    });

    // 2. Aggiorna lo stato in Supabase
    console.log('Step 2: Updating status in database...');
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single();

    if (updateError) {
      console.error('Errore update Supabase:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    console.log('✅ Status updated successfully');

    // 3. Prepara i dati per n8n
    console.log('Step 3: Preparing webhook data...');
    const prezzoMin = Math.max(0, Math.round(property.prezzo_acquisto_meno_5 || 0));
    const prezzoMax = Math.max(0, Math.round(property.prezzo_acquisto || 0));
    
    const webhookData = {
      status,
      lead_email: property.lead_email,
      lead_nome: property.lead_nome,
      indirizzo: property.indirizzo_completo,
      tipo_immobile: property.tipo_immobile || 'Non specificato',
      superficie_mq: property.superficie_mq,
      prezzo_acquisto_min: prezzoMin,
      prezzo_acquisto_max: prezzoMax
    };

    console.log('Webhook data:', webhookData);

    // VALIDATION: Check if prices are zero (shouldn't be for approved)
    if (status === 'approved' && (prezzoMin === 0 && prezzoMax === 0)) {
      console.error('⚠️ WARNING: Prices are zero! This might indicate data not yet saved.');
      return res.status(500).json({ 
        error: 'I dati non sono stati salvati correttamente. Riprova tra qualche secondo.',
        debug: { property, webhookData }
      });
    }

    // 4. Chiama il webhook n8n
    console.log('Step 4: Calling n8n webhook...');
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('Errore webhook n8n:', errorText);
      return res.status(200).json({ 
        success: true, 
        data: updated,
        emailSent: false,
        emailError: errorText
      });
    }

    console.log('✅ Email inviata con successo via n8n\n');

    return res.status(200).json({ 
      success: true, 
      data: updated,
      emailSent: true
    });

  } catch (error: any) {
    console.error('Errore approvazione:', error);
    return res.status(500).json({ error: error.message });
  }
}