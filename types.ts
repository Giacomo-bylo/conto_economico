export interface Property {
  id: string;
  created_at: string;
  updated_at: string;
  
  lead_nome: string;
  lead_cognome: string;
  lead_email: string;
  lead_telefono?: string;
  
  indirizzo_completo: string;
  numero_civico?: string;
  tipo_immobile?: string;
  condizioni_immobile?: string;
  superficie_mq: number;
  numero_locali?: number;
  numero_bagni?: number;
  aree_esterne?: string;
  pertinenze?: string;
  anno_costruzione?: string;
  piano_immobile?: string;
  ascensore?: string;
  
  avm_agent_pricing_min?: number;
  avm_agent_pricing_max?: number;
  avm_immobiliare_insights_min?: number;
  avm_immobiliare_insights_max?: number;
  prezzo_riferimento?: number;
  prezzo_rivendita?: number;
  
  costo_ristrutturazione?: number;
  costo_studio_tecnico?: number;
  costo_architetto?: number;
  costo_imposte?: number;
  costo_notaio?: number;
  costo_avvocato?: number;
  costo_agibilita?: number;
  costo_cambio_destinazione?: number;
  costo_agenzia_in?: number;
  costo_agenzia_out?: number;
  costo_condominio_risc?: number;
  costo_pulizia_cantiere?: number;
  costo_utenze?: number;
  costo_imprevisti?: number;
  costo_altro?: number;
  
  esposizione?: number;
  roi?: number;
  totale_costi_escluso_acquisto?: number;
  totale_costi?: number;
  totale_rivendita?: number;
  prezzo_acquisto?: number;
  prezzo_acquisto_meno_5?: number;
  utile_lordo?: number;
  roe?: number;
  
  offerta_definitiva?: number;
  
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  
  raw_json?: any;
  created_by?: string;
}

export interface GlobalParameters {
  id: string;
  created_at: string;
  updated_at: string;
  
  ristrutturazione_per_mq: number;
  studio_tecnico: number;
  architetto: number;
  notaio: number;
  avvocato: number;
  agibilita: number;
  cambio_destinazione_uso: number;
  condominio_risc: number;
  pulizia_cantiere: number;
  utenze: number;
  
  agenzia_in_percentuale: number;
  agenzia_out_percentuale: number;
  imprevisti_percentuale: number;
  
  esposizione_default: number;
  roi_target: number;
  imposte_percentuale: number;
  imposte_fisso: number;
  
  updated_by?: string;
}