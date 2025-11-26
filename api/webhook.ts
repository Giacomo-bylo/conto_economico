import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webflowData = req.body.body?.data || req.body;

    // Mappa i campi da Webflow al formato database
    const propertyData = {
      lead_nome: webflowData.Nome,
      lead_cognome: webflowData.Cognome,
      lead_email: webflowData.Email,
      lead_telefono: webflowData.Telefono,
      indirizzo_completo: webflowData.indirizzo_immobile,
      numero_civico: webflowData.numero_civico,
      tipo_immobile: webflowData.tipo_immobile,
      condizioni_immobile: webflowData.condizioni_immobile,
      superficie_mq: parseFloat(webflowData.superficie_mq),
      numero_locali: webflowData.numero_locali ? parseInt(webflowData.numero_locali) : null,
      numero_bagni: webflowData.numero_bagni ? parseInt(webflowData.numero_bagni) : null,
      aree_esterne: webflowData.aree_esterne_selezionate,
      pertinenze: webflowData.pertinenze_selezionate,
      anno_costruzione: webflowData.anno_costruzione,
      piano_immobile: webflowData.piano_immobile,
      ascensore: webflowData.ascensore,
      raw_json: req.body // Salva anche il payload originale
    };

    const { data: inserted, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data: inserted });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

**Poi in n8n rimetti il body originale:**
```
{{ JSON.stringify($json) }}