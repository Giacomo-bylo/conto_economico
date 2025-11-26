import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const n8nWebhookUrl = 'https://n8n.bylo.it/webhook/bylo-notification';

const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log(`Processing ${status} for property ${propertyId}`);

    // 1. Recupera la property dal database
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchError || !property) {
      console.error('Errore fetch property:', fetchError);
      return res.status(404).json({ error: 'Property non trovata' });
    }

    // 2. Aggiorna lo stato in Supabase
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

    // 3. Prepara i dati per n8n
    const webhookData = {
      status,
      lead_email: property.lead_email,
      lead_nome: property.lead_nome,
      indirizzo: property.indirizzo_completo,
      tipo_immobile: property.tipo_immobile || 'Non specificato',
      superficie_mq: property.superficie_mq,
      prezzo_acquisto_min: Math.round(property.prezzo_acquisto_meno_5 || 0),
      prezzo_acquisto_max: Math.round(property.prezzo_acquisto || 0)
    };

    console.log('Invio dati a n8n:', webhookData);

    // 4. Chiama il webhook n8n
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: webhookData })
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('Errore webhook n8n:', errorText);
      // Non blocchiamo l'update anche se l'email fallisce
      return res.status(200).json({ 
        success: true, 
        data: updated,
        emailSent: false,
        emailError: errorText
      });
    }

    console.log('✅ Email inviata con successo via n8n');

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