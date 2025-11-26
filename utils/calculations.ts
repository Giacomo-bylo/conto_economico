import { Property, GlobalParameters } from '../types';

export function calculateProperty(property: Property, params: GlobalParameters): Property {
  // 1. AVM medio
  const avmMin = (property.avm_agent_pricing_min || 0) + (property.avm_immobiliare_insights_min || 0);
  const avmMax = (property.avm_agent_pricing_max || 0) + (property.avm_immobiliare_insights_max || 0);
  
  // Prevent division by zero if AVMs are missing, though technically we need at least one source
  const divisor = (property.avm_agent_pricing_min ? 1 : 0) + (property.avm_immobiliare_insights_min ? 1 : 0) + 
                  (property.avm_agent_pricing_max ? 1 : 0) + (property.avm_immobiliare_insights_max ? 1 : 0);
                  
  // Fallback to strict prompt logic: "prezzoRiferimento = (avmMin + avmMax) / 4"
  // If data is 0, it effectively averages the zeros.
  const prezzoRiferimento = (avmMin + avmMax) / 4;
  
  // 2. Prezzo rivendita (conservativo: 10% sotto AVM)
  const prezzoRivendita = prezzoRiferimento * 0.9;
  
  // 3. Costi base
  const costoRistrutturazione = params.ristrutturazione_per_mq * (property.superficie_mq || 0);
  const costoAgenziaIn = prezzoRiferimento * (params.agenzia_in_percentuale / 100);
  const costoAgenziaOut = prezzoRivendita * (params.agenzia_out_percentuale / 100);
  const costoImprevisti = costoRistrutturazione * (params.imprevisti_percentuale / 100);
  
  // 4. Totale costi (escluso acquisto)
  const totaleCostiEsclusoAcquisto = 
    costoRistrutturazione +
    params.studio_tecnico +
    params.architetto +
    (property.costo_imposte || 0) +
    params.notaio +
    params.avvocato +
    params.agibilita +
    params.cambio_destinazione_uso +
    costoAgenziaIn +
    costoAgenziaOut +
    params.condominio_risc +
    params.pulizia_cantiere +
    params.utenze +
    costoImprevisti +
    (property.costo_altro || 0);
  
  // 5. Totale rivendita
  const totaleRivendita = prezzoRivendita - costoAgenziaOut;
  
  // 6. Calcolo prezzo acquisto
  const esposizione = property.esposizione || params.esposizione_default;
  const roi = property.roi || params.roi_target;
  
  // Formula: (RivenditaNetta - Costi - Esposizione) / (1 + ROI%)? 
  // From prompt: (totaleRivendita - totaleCostiEsclusoAcquisto - esposizione) / (1 + roi / 100)
  const prezzoAcquisto = (totaleRivendita - totaleCostiEsclusoAcquisto - esposizione) / (1 + roi / 100);
  const prezzoAcquistoMeno5 = prezzoAcquisto * 0.95;
  
  // 7. Totale costi (con acquisto)
  const totaleCosti = totaleCostiEsclusoAcquisto + prezzoAcquisto;
  
  // 8. Utile e ROE
  const utileLordo = totaleRivendita - totaleCosti;
  const roe = esposizione > 0 ? (utileLordo / esposizione) * 100 : 0;
  
  return {
    ...property,
    prezzo_riferimento: Math.round(prezzoRiferimento),
    prezzo_rivendita: Math.round(prezzoRivendita),
    costo_ristrutturazione: Math.round(costoRistrutturazione),
    costo_agenzia_in: Math.round(costoAgenziaIn),
    costo_agenzia_out: Math.round(costoAgenziaOut),
    costo_imprevisti: Math.round(costoImprevisti),
    costo_studio_tecnico: params.studio_tecnico,
    costo_architetto: params.architetto,
    costo_notaio: params.notaio,
    costo_avvocato: params.avvocato,
    costo_agibilita: params.agibilita,
    costo_cambio_destinazione: params.cambio_destinazione_uso,
    costo_condominio_risc: params.condominio_risc,
    costo_pulizia_cantiere: params.pulizia_cantiere,
    costo_utenze: params.utenze,
    totale_costi_escluso_acquisto: Math.round(totaleCostiEsclusoAcquisto),
    totale_costi: Math.round(totaleCosti),
    totale_rivendita: Math.round(totaleRivendita),
    prezzo_acquisto: Math.round(prezzoAcquisto),
    prezzo_acquisto_meno_5: Math.round(prezzoAcquistoMeno5),
    utile_lordo: Math.round(utileLordo),
    roe: Math.round(roe * 100) / 100
  };
}