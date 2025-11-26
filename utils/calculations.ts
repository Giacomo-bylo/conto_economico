export interface PropertyCalculationInput {
  superficie_mq: number;
  avm_agent_pricing_min?: number;
  avm_agent_pricing_max?: number;
  avm_immobiliare_insights_min?: number;
  avm_immobiliare_insights_max?: number;
  roi_target?: number;
  esposizione?: number;
  costo_altro?: number;
}

export interface GlobalParameters {
  ristrutturazione_per_mq: number;
  studio_tecnico: number;
  architetto: number;
  notaio: number;
  avvocato: number;
  agibilita: number;
  cambio_destinazione_uso: number;
  agenzia_in_percentuale: number;
  agenzia_out_percentuale: number;
  condominio_risc: number;
  pulizia_cantiere: number;
  utenze: number;
  imprevisti_percentuale: number;
  esposizione_default: number;
  roi_target: number;
  imposte_percentuale: number;
  imposte_fisso: number;
}

export function calculateProperty(
  input: PropertyCalculationInput,
  params: GlobalParameters
) {
  const mq = input.superficie_mq;
  const roi_target = input.roi_target ?? params.roi_target;
  const esposizione = input.esposizione ?? params.esposizione_default;

  // 1. Prezzo riferimento (MIN di tutti gli AVM)
  const avm_values = [
    input.avm_agent_pricing_min,
    input.avm_agent_pricing_max,
    input.avm_immobiliare_insights_min,
    input.avm_immobiliare_insights_max,
  ].filter((v) => v !== undefined && v !== null) as number[];

  const prezzo_riferimento = avm_values.length > 0 ? Math.min(...avm_values) : 0;

  // 2. Prezzo rivendita (media delle medie)
  const avg_agent =
    input.avm_agent_pricing_min && input.avm_agent_pricing_max
      ? (input.avm_agent_pricing_min + input.avm_agent_pricing_max) / 2
      : input.avm_agent_pricing_min || input.avm_agent_pricing_max || 0;

  const avg_immobiliare =
    input.avm_immobiliare_insights_min && input.avm_immobiliare_insights_max
      ? (input.avm_immobiliare_insights_min + input.avm_immobiliare_insights_max) / 2
      : input.avm_immobiliare_insights_min || input.avm_immobiliare_insights_max || 0;

  const prezzo_rivendita = (avg_agent + avg_immobiliare) / 2;

  // 3. Calcolo costi operativi
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

  // Imposte: (esposizione * 0.5%) + 200
  const costo_imposte = esposizione * (params.imposte_percentuale / 100) + params.imposte_fisso;

  // Imprevisti: % sul costo ristrutturazione
  const costo_imprevisti = costo_ristrutturazione * (params.imprevisti_percentuale / 100);

  // Agenzia out: % sul prezzo rivendita
  const costo_agenzia_out = prezzo_rivendita * (params.agenzia_out_percentuale / 100);

  // Agenzia in: (non applicata nell'excel, ma la mettiamo)
  const costo_agenzia_in = 0;

  const costo_altro = input.costo_altro || 0;

  // 4. Totale costi escluso acquisto
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

  // 5. Totale rivendita
  const totale_rivendita = prezzo_rivendita;

  // 6. Totale costi (calcolo inverso dal ROI)
  const totale_costi = totale_rivendita / (1 + roi_target / 100);

  // 7. Prezzo acquisto
  const prezzo_acquisto = totale_costi - totale_costi_escluso_acquisto;

  // 8. Prezzo acquisto -5%
  const prezzo_acquisto_meno_5 = prezzo_acquisto * 0.95;

  // 9. Utile lordo
  const utile_lordo = totale_rivendita - totale_costi;

  // 10. ROE
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