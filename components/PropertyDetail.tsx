import React, { useState, useCallback, useMemo } from 'react';
import { Property, GlobalParameters } from '../types';
import { supabase } from '../services/supabaseClient';
import { X, Check, XCircle, FileDown, Save } from 'lucide-react';

interface PropertyDetailProps {
  property: Property;
  params: GlobalParameters;
  onClose: () => void;
  onUpdate: (property: Property) => void;
}

export function PropertyDetail({ property, params, onClose, onUpdate }: PropertyDetailProps) {
  const [localProperty, setLocalProperty] = useState(property);
  const [localParams, setLocalParams] = useState({
    ristrutturazione_per_mq: property.costo_ristrutturazione ? property.costo_ristrutturazione / property.superficie_mq : params.ristrutturazione_per_mq,
    studio_tecnico: property.costo_studio_tecnico ?? params.studio_tecnico,
    architetto: property.costo_architetto ?? params.architetto,
    notaio: property.costo_notaio ?? params.notaio,
    avvocato: property.costo_avvocato ?? params.avvocato,
    agibilita: property.costo_agibilita ?? params.agibilita,
    cambio_destinazione_uso: property.costo_cambio_destinazione ?? params.cambio_destinazione_uso,
    agenzia_in_percentuale: params.agenzia_in_percentuale,
    agenzia_out_percentuale: params.agenzia_out_percentuale,
    condominio_risc: property.costo_condominio_risc ?? params.condominio_risc,
    pulizia_cantiere: property.costo_pulizia_cantiere ?? params.pulizia_cantiere,
    utenze: property.costo_utenze ?? params.utenze,
    imprevisti_percentuale: params.imprevisti_percentuale,
    esposizione: property.esposizione ?? params.esposizione_default,
    roi_target: property.roi ?? params.roi_target,
    imposte_percentuale: params.imposte_percentuale,
    imposte_fisso: params.imposte_fisso,
    costo_altro: property.costo_altro ?? 0,
  });
  
  const [saving, setSaving] = useState(false);

  const calculated = useMemo(() => {
    const mq = localProperty.superficie_mq;
    const roi_target = localParams.roi_target;
    const esposizione = localParams.esposizione;

    const avm_agent_pricing_min = localProperty.avm_agent_pricing_min || 0;
    const avm_agent_pricing_max = localProperty.avm_agent_pricing_max || 0;
    const avm_immobiliare_insights_min = localProperty.avm_immobiliare_insights_min || 0;
    const avm_immobiliare_insights_max = localProperty.avm_immobiliare_insights_max || 0;

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

    const costo_ristrutturazione = localParams.ristrutturazione_per_mq * mq;
    const costo_studio_tecnico = localParams.studio_tecnico;
    const costo_architetto = localParams.architetto;
    const costo_notaio = localParams.notaio;
    const costo_avvocato = localParams.avvocato;
    const costo_agibilita = localParams.agibilita;
    const costo_cambio_destinazione = localParams.cambio_destinazione_uso;
    const costo_condominio_risc = localParams.condominio_risc;
    const costo_pulizia_cantiere = localParams.pulizia_cantiere;
    const costo_utenze = localParams.utenze;
    const costo_altro = localParams.costo_altro;

    const costo_imposte = esposizione * (localParams.imposte_percentuale / 100) + localParams.imposte_fisso;
    const costo_imprevisti = costo_ristrutturazione * (localParams.imprevisti_percentuale / 100);
    const costo_agenzia_out = prezzo_rivendita * (localParams.agenzia_out_percentuale / 100);
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
  }, [localProperty, localParams]);

  const handleFieldChange = useCallback((field: keyof Property, value: any) => {
    setLocalProperty(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleParamChange = useCallback((field: string, value: number) => {
    setLocalParams(prev => ({ ...prev, [field]: value }));
  }, []);

  const saveChanges = useCallback(async () => {
    setSaving(true);
    const updates = {
      ...calculated,
      avm_agent_pricing_min: localProperty.avm_agent_pricing_min,
      avm_agent_pricing_max: localProperty.avm_agent_pricing_max,
      avm_immobiliare_insights_min: localProperty.avm_immobiliare_insights_min,
      avm_immobiliare_insights_max: localProperty.avm_immobiliare_insights_max,
    };

    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', localProperty.id);

    if (!error) {
      const updated = { ...localProperty, ...updates };
      setLocalProperty(updated);
      onUpdate(updated);
      alert('Modifiche salvate!');
    } else {
      console.error("Error saving property:", error);
      alert("Errore durante il salvataggio.");
    }
    setSaving(false);
  }, [localProperty, calculated, onUpdate]);

  const handleApprove = useCallback(async () => {
    await saveChanges();
    const { error } = await supabase
      .from('properties')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', localProperty.id);

    if (!error) {
      onUpdate({ ...localProperty, status: 'approved' });
      onClose();
    }
  }, [localProperty, saveChanges, onUpdate, onClose]);

  const handleReject = useCallback(async () => {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'rejected' })
      .eq('id', localProperty.id);

    if (!error) {
      onUpdate({ ...localProperty, status: 'rejected' });
      onClose();
    }
  }, [localProperty, onUpdate, onClose]);

  const formatCurrency = (value: number) => `€${Math.round(value).toLocaleString('it-IT')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {localProperty.lead_nome} {localProperty.lead_cognome}
            </h2>
            <p className="text-slate-600 mt-1">{localProperty.indirizzo_completo} {localProperty.numero_civico}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Dati Immobile */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">🏠 Dati Immobile</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
              <div><span className="text-slate-500">Tipologia:</span> <p className="font-medium">{localProperty.tipo_immobile || '-'}</p></div>
              <div><span className="text-slate-500">Superficie:</span> <p className="font-medium">{localProperty.superficie_mq} m²</p></div>
              <div><span className="text-slate-500">Locali:</span> <p className="font-medium">{localProperty.numero_locali || '-'}</p></div>
              <div><span className="text-slate-500">Bagni:</span> <p className="font-medium">{localProperty.numero_bagni || '-'}</p></div>
              <div><span className="text-slate-500">Piano:</span> <p className="font-medium">{localProperty.piano_immobile || '-'}</p></div>
              <div><span className="text-slate-500">Ascensore:</span> <p className="font-medium">{localProperty.ascensore || '-'}</p></div>
              <div><span className="text-slate-500">Anno:</span> <p className="font-medium">{localProperty.anno_costruzione || '-'}</p></div>
              <div><span className="text-slate-500">Condizioni:</span> <p className="font-medium">{localProperty.condizioni_immobile || '-'}</p></div>
              <div><span className="text-slate-500">Aree esterne:</span> <p className="font-medium">{localProperty.aree_esterne || '-'}</p></div>
              <div><span className="text-slate-500">Pertinenze:</span> <p className="font-medium">{localProperty.pertinenze || '-'}</p></div>
            </div>
          </div>

          {/* AVM */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">📊 Valutazioni AVM</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agent Pricing Min</label>
                <input type="number" value={localProperty.avm_agent_pricing_min || 0} onChange={(e) => handleFieldChange('avm_agent_pricing_min', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agent Pricing Max</label>
                <input type="number" value={localProperty.avm_agent_pricing_max || 0} onChange={(e) => handleFieldChange('avm_agent_pricing_max', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Immobiliare Insights Min</label>
                <input type="number" value={localProperty.avm_immobiliare_insights_min || 0} onChange={(e) => handleFieldChange('avm_immobiliare_insights_min', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Immobiliare Insights Max</label>
                <input type="number" value={localProperty.avm_immobiliare_insights_max || 0} onChange={(e) => handleFieldChange('avm_immobiliare_insights_max', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* CONTO ECONOMICO - Parametri Editabili */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">💶 Conto Economico - Parametri</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Ristrutturazione (€/m²)</label>
                <input type="number" value={localParams.ristrutturazione_per_mq} onChange={(e) => handleParamChange('ristrutturazione_per_mq', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Studio Tecnico (€)</label>
                <input type="number" value={localParams.studio_tecnico} onChange={(e) => handleParamChange('studio_tecnico', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Architetto (€)</label>
                <input type="number" value={localParams.architetto} onChange={(e) => handleParamChange('architetto', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Notaio (€)</label>
                <input type="number" value={localParams.notaio} onChange={(e) => handleParamChange('notaio', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Avvocato (€)</label>
                <input type="number" value={localParams.avvocato} onChange={(e) => handleParamChange('avvocato', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agibilità (€)</label>
                <input type="number" value={localParams.agibilita} onChange={(e) => handleParamChange('agibilita', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Cambio Destinazione (€)</label>
                <input type="number" value={localParams.cambio_destinazione_uso} onChange={(e) => handleParamChange('cambio_destinazione_uso', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agenzia Out (%)</label>
                <input type="number" value={localParams.agenzia_out_percentuale} onChange={(e) => handleParamChange('agenzia_out_percentuale', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Condominio Risc. (€)</label>
                <input type="number" value={localParams.condominio_risc} onChange={(e) => handleParamChange('condominio_risc', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Pulizia Cantiere (€)</label>
                <input type="number" value={localParams.pulizia_cantiere} onChange={(e) => handleParamChange('pulizia_cantiere', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Utenze (€)</label>
                <input type="number" value={localParams.utenze} onChange={(e) => handleParamChange('utenze', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Imprevisti (%)</label>
                <input type="number" value={localParams.imprevisti_percentuale} onChange={(e) => handleParamChange('imprevisti_percentuale', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Altro (€)</label>
                <input type="number" value={localParams.costo_altro} onChange={(e) => handleParamChange('costo_altro', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Esposizione (€)</label>
                <input type="number" value={localParams.esposizione} onChange={(e) => handleParamChange('esposizione', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ROI Target (%)</label>
                <input type="number" value={localParams.roi_target} onChange={(e) => handleParamChange('roi_target', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* CONTO ECONOMICO - Risultati */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">📋 Conto Economico - Risultati</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
              <div className="flex justify-between"><span className="text-slate-600">Prezzo Riferimento:</span><span className="font-medium">{formatCurrency(calculated.prezzo_riferimento)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Prezzo Rivendita:</span><span className="font-medium">{formatCurrency(calculated.prezzo_rivendita)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Costo Ristrutturazione:</span><span className="font-medium">{formatCurrency(calculated.costo_ristrutturazione)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Studio Tecnico:</span><span className="font-medium">{formatCurrency(calculated.costo_studio_tecnico)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Architetto:</span><span className="font-medium">{formatCurrency(calculated.costo_architetto)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Imposte:</span><span className="font-medium">{formatCurrency(calculated.costo_imposte)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Notaio:</span><span className="font-medium">{formatCurrency(calculated.costo_notaio)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Avvocato:</span><span className="font-medium">{formatCurrency(calculated.costo_avvocato)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Agenzia Out:</span><span className="font-medium">{formatCurrency(calculated.costo_agenzia_out)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Condominio:</span><span className="font-medium">{formatCurrency(calculated.costo_condominio_risc)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Pulizia:</span><span className="font-medium">{formatCurrency(calculated.costo_pulizia_cantiere)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Utenze:</span><span className="font-medium">{formatCurrency(calculated.costo_utenze)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Imprevisti:</span><span className="font-medium">{formatCurrency(calculated.costo_imprevisti)}</span></div>
              <div className="flex justify-between border-t border-slate-300 pt-2 mt-2"><span className="font-semibold text-slate-700">Totale Costi (escluso acquisto):</span><span className="font-semibold">{formatCurrency(calculated.totale_costi_escluso_acquisto)}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-700">Prezzo Acquisto:</span><span className="font-bold text-blue-600 text-lg">{formatCurrency(calculated.prezzo_acquisto)}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-700">Totale Costi:</span><span className="font-semibold">{formatCurrency(calculated.totale_costi)}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-700">Totale Rivendita:</span><span className="font-semibold">{formatCurrency(calculated.totale_rivendita)}</span></div>
              <div className="flex justify-between border-t border-slate-300 pt-2 mt-2"><span className="font-bold text-green-700">Utile Lordo:</span><span className="font-bold text-green-600 text-lg">{formatCurrency(calculated.utile_lordo)}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-700">ROI:</span><span className="font-semibold text-blue-600">{calculated.roi?.toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-700">ROE:</span><span className="font-semibold text-blue-600">{calculated.roe?.toFixed(2)}%</span></div>
            </div>
          </div>

          {/* Offerta Finale */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">🔨 Offerta Finale</h3>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
              <div className="text-sm text-slate-600 mb-2">Range Offerta</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(calculated.prezzo_acquisto_meno_5)} - {formatCurrency(calculated.prezzo_acquisto)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button onClick={saveChanges} disabled={saving} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={20} />
              Salva Modifiche
            </button>
            <button onClick={handleApprove} disabled={saving} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Check size={20} />
              Approva
            </button>
            <button onClick={handleReject} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              <XCircle size={20} />
              Rifiuta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}