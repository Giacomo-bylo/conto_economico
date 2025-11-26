import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

function calculateProperty(property: any, params: any) {
  const mq = property.superficie_mq;
  const roi_target = params.roi_target;
  const esposizione = params.esposizione_default;

  const avm_agent_pricing_min = property.avm_agent_pricing_min || 0;
  const avm_agent_pricing_max = property.avm_agent_pricing_max || 0;
  const avm_immobiliare_insights_min = property.avm_immobiliare_insights_min || 0;
  const avm_immobiliare_insights_max = property.avm_immobiliare_insights_max || 0;

  const avm_values = [
    avm_agent_pricing_min,
    avm_agent_pricing_max,
    avm_immobiliare_insights_min,
    avm_immobiliare_insights_max,
  ].filter((v) => v > 0);

  const prezzo_riferimento = avm_values.length > 0 ? Math.min(...avm_values) : 0;

  const avg_agent =
    avm_agent_pricing_min && avm_agent_pricing_max
      ? (avm_agent_pricing_min + avm_agent_pricing_max) / 2
      : avm_agent_pricing_min || avm_agent_pricing_max || 0;

  const avg_immobiliare =
    avm_immobiliare_insights_min && avm_immobiliare_insights_max
      ? (avm_immobiliare_insights_min + avm_immobiliare_insights_max) / 2
      : avm_immobiliare_insights_min || avm_immobiliare_insights_max || 0;

  const prezzo_rivendita = avg_agent && avg_immobiliare ? (avg_agent + avg_immobiliare) / 2 : avg_agent || avg_immobiliare || 0;

  const costo_ristrutturazione = params.ristrutturazione_per_mq * mq;
  const costo_studio_tecnico = params.studio_tecnico;
  const costo_architetto = params.architetto;
  const costo_notaio = params.notaio;
  const costo_avvocato = params.avvocato;
  const costo_agibilita = params.agibilita;
  const costo_cambio_destinazione = params.cambio_destinazione_uso;
  const costo_condominio_risc = params.condominio_risc;
  const costo_pulizia_cantiere = params.pulizia_cantiere;
  const costo_utenze = params.utenze;
  const costo_altro = 0;

  const costo_imposte = esposizione * (params.imposte_percentuale / 100) + params.imposte_fisso;
  const costo_imprevisti = costo_ristrutturazione * (params.imprevisti_percentuale / 100);
  const costo_agenzia_out = prezzo_rivendita * (params.agenzia_out_percentuale / 100);
  const costo_agenzia_in = 0;

  const totale_costi_escluso_acquisto =
    costo_ristrutturazione +
    costo_studio_tecnico +
    costo_architetto +
    costo_imposte +
    costo_notaio +
    costo_avvocato +
    costo_agibilita +
    costo_cambio_destinazione +
    costo_agenzia_in +
    costo_agenzia_out +
    costo_condominio_risc +
    costo_pulizia_cantiere +
    costo_utenze +
    costo_imprevisti +
    costo_altro;

  const totale_rivendita = prezzo_rivendita;
  const totale_costi = totale_rivendita / (1 + roi_target / 100);
  const prezzo_acquisto = totale_costi - totale_costi_escluso_acquisto;
  const prezzo_acquisto_meno_5 = prezzo_acquisto * 0.95;
  const utile_lordo = totale_rivendita - totale_costi;
  const roe = esposizione > 0 ? (utile_lordo / esposizione) * 100 : 0;

  return {
    prezzo_riferimento,
    prezzo_rivendita,
    costo_ristrutturazione,
    costo_studio_tecnico,
    costo_architetto,
    costo_imposte,
    costo_notaio,
    costo_avvocato,
    costo_agibilita,
    costo_cambio_destinazione,
    costo_agenzia_in,
    costo_agenzia_out,
    costo_condominio_risc,
    costo_pulizia_cantiere,
    costo_utenze,
    costo_imprevisti,
    costo_altro,
    totale_costi_escluso_acquisto,
    totale_costi,
    totale_rivendita,
    prezzo_acquisto,
    prezzo_acquisto_meno_5,
    utile_lordo,
    esposizione,
    roi: roi_target,
    roe,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const params = req.body;

    // 1. Salva i parametri globali
    const { data: updatedParams, error: paramsError } = await supabase
      .from('parameters')
      .update(params)
      .eq('id', params.id)
      .select()
      .single();

    if (paramsError) {
      console.error('Supabase params error:', paramsError);
      return res.status(500).json({ error: paramsError.message });
    }

    // 2. Recupera tutte le properties con status = 'pending'
    const { data: pendingProperties, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Fetch pending properties error:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    // 3. Ricalcola e aggiorna ogni property pending
    if (pendingProperties && pendingProperties.length > 0) {
      for (const property of pendingProperties) {
        const calculated = calculateProperty(property, updatedParams);
        
        await supabase
          .from('properties')
          .update(calculated)
          .eq('id', property.id);
      }
    }

    return res.status(200).json({ 
      success: true, 
      data: updatedParams,
      recalculated: pendingProperties?.length || 0
    });
  } catch (error: any) {
    console.error('Parameters update error:', error);
    return res.status(500).json({ error: error.message });
  }
}