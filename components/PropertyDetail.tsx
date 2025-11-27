import React, { useState, useCallback, useMemo } from 'react';
import { NumericFormat } from 'react-number-format';
import { Property, GlobalParameters } from '../types';
import { supabase } from '../services/supabaseClient';
import { X, Check, XCircle, Save } from 'lucide-react';

interface PropertyDetailProps {
  property: Property;
  params: GlobalParameters;
  onClose: () => void;
  onUpdate: (property: Property) => void;
}

export function PropertyDetail({ property, params, onClose, onUpdate }: PropertyDetailProps) {
  const [localProperty, setLocalProperty] = useState(property);
  
  const [editableCosts, setEditableCosts] = useState({
    costo_ristrutturazione: property.costo_ristrutturazione ?? (params.ristrutturazione_per_mq * property.superficie_mq),
    costo_studio_tecnico: property.costo_studio_tecnico ?? params.studio_tecnico,
    costo_architetto: property.costo_architetto ?? params.architetto,
    costo_imposte: property.costo_imposte ?? ((property.esposizione ?? params.esposizione_default) * (params.imposte_percentuale / 100) + params.imposte_fisso),
    costo_notaio: property.costo_notaio ?? params.notaio,
    costo_avvocato: property.costo_avvocato ?? params.avvocato,
    costo_agibilita: property.costo_agibilita ?? params.agibilita,
    costo_cambio_destinazione: property.costo_cambio_destinazione ?? params.cambio_destinazione_uso,
    costo_agenzia_in: property.costo_agenzia_in ?? 0,
    costo_agenzia_out: property.costo_agenzia_out ?? 0,
    costo_condominio_risc: property.costo_condominio_risc ?? params.condominio_risc,
    costo_pulizia_cantiere: property.costo_pulizia_cantiere ?? params.pulizia_cantiere,
    costo_utenze: property.costo_utenze ?? params.utenze,
    costo_imprevisti: property.costo_imprevisti ?? 0,
    costo_altro: property.costo_altro ?? 0,
    esposizione: property.esposizione ?? params.esposizione_default,
    roi_target: property.roi ?? params.roi_target,
  });
  
  const [saving, setSaving] = useState(false);

  const calculated = useMemo(() => {
    const avm_agent_pricing_min = localProperty.avm_agent_pricing_min || 0;
    const avm_agent_pricing_max = localProperty.avm_agent_pricing_max || 0;
    const avm_immobiliare_insights_min = localProperty.avm_immobiliare_insights_min || 0;
    const avm_immobiliare_insights_max = localProperty.avm_immobiliare_insights_max || 0;

    const avm_values = [avm_agent_pricing_min, avm_agent_pricing_max, avm_immobiliare_insights_min, avm_immobiliare_insights_max].filter((v) => v > 0);
    const prezzo_riferimento = avm_values.length > 0 ? Math.min(...avm_values) : 0;

    const avg_agent = avm_agent_pricing_min && avm_agent_pricing_max ? (avm_agent_pricing_min + avm_agent_pricing_max) / 2 : avm_agent_pricing_min || avm_agent_pricing_max || 0;
    const avg_immobiliare = avm_immobiliare_insights_min && avm_immobiliare_insights_max ? (avm_immobiliare_insights_min + avm_immobiliare_insights_max) / 2 : avm_immobiliare_insights_min || avm_immobiliare_insights_max || 0;
    const prezzo_rivendita = avg_agent && avg_immobiliare ? (avg_agent + avg_immobiliare) / 2 : avg_agent || avg_immobiliare || 0;

    const totale_costi_escluso_acquisto =
      editableCosts.costo_ristrutturazione +
      editableCosts.costo_studio_tecnico +
      editableCosts.costo_architetto +
      editableCosts.costo_imposte +
      editableCosts.costo_notaio +
      editableCosts.costo_avvocato +
      editableCosts.costo_agibilita +
      editableCosts.costo_cambio_destinazione +
      editableCosts.costo_agenzia_in +
      editableCosts.costo_agenzia_out +
      editableCosts.costo_condominio_risc +
      editableCosts.costo_pulizia_cantiere +
      editableCosts.costo_utenze +
      editableCosts.costo_imprevisti +
      editableCosts.costo_altro;

    const totale_rivendita = prezzo_rivendita;
    const totale_costi = totale_rivendita / (1 + editableCosts.roi_target / 100);
    const prezzo_acquisto = totale_costi - totale_costi_escluso_acquisto;
    const prezzo_acquisto_meno_5 = prezzo_acquisto * 0.95;
    const utile_lordo = totale_rivendita - totale_costi;
    const roe = editableCosts.esposizione > 0 ? (utile_lordo / editableCosts.esposizione) * 100 : 0;

    return {
      prezzo_riferimento,
      prezzo_rivendita,
      totale_costi_escluso_acquisto,
      totale_costi,
      totale_rivendita,
      prezzo_acquisto,
      prezzo_acquisto_meno_5,
      utile_lordo,
      roe,
      ...editableCosts,
    };
  }, [localProperty, editableCosts]);

  const handleFieldChange = useCallback((field: keyof Property, value: any) => {
    setLocalProperty(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCostChange = useCallback((field: string, value: number) => {
    setEditableCosts(prev => ({ ...prev, [field]: value }));
  }, []);

  const saveChanges = useCallback(async () => {
    setSaving(true);
    
    // IMPORTANTE: Salviamo SOLO i campi che esistono nel database
    // NON salviamo i valori calcolati con nomi diversi (es. roi_target)
    const updates = {
      // Valori AVM (modificabili dall'utente)
      avm_agent_pricing_min: localProperty.avm_agent_pricing_min,
      avm_agent_pricing_max: localProperty.avm_agent_pricing_max,
      avm_immobiliare_insights_min: localProperty.avm_immobiliare_insights_min,
      avm_immobiliare_insights_max: localProperty.avm_immobiliare_insights_max,
      
      // Costi modificabili
      costo_ristrutturazione: calculated.costo_ristrutturazione,
      costo_studio_tecnico: calculated.costo_studio_tecnico,
      costo_architetto: calculated.costo_architetto,
      costo_imposte: calculated.costo_imposte,
      costo_notaio: calculated.costo_notaio,
      costo_avvocato: calculated.costo_avvocato,
      costo_agibilita: calculated.costo_agibilita,
      costo_cambio_destinazione: calculated.costo_cambio_destinazione,
      costo_agenzia_in: calculated.costo_agenzia_in,
      costo_agenzia_out: calculated.costo_agenzia_out,
      costo_condominio_risc: calculated.costo_condominio_risc,
      costo_pulizia_cantiere: calculated.costo_pulizia_cantiere,
      costo_utenze: calculated.costo_utenze,
      costo_imprevisti: calculated.costo_imprevisti,
      costo_altro: calculated.costo_altro,
      
      // Valori calcolati da salvare
      prezzo_riferimento: calculated.prezzo_riferimento,
      prezzo_rivendita: calculated.prezzo_rivendita,
      totale_costi_escluso_acquisto: calculated.totale_costi_escluso_acquisto,
      totale_costi: calculated.totale_costi,
      totale_rivendita: calculated.totale_rivendita,
      
      // PREZZI ARROTONDATI ALLE MIGLIAIA (fonte di verità per email)
      prezzo_acquisto: roundToThousand(calculated.prezzo_acquisto),
      prezzo_acquisto_meno_5: roundToThousand(calculated.prezzo_acquisto_meno_5),
      
      utile_lordo: calculated.utile_lordo,
      
      // Parametri operativi (nota: roi_target nel frontend, ma 'roi' nel DB)
      esposizione: calculated.esposizione,
      roi: calculated.roi_target,
      roe: calculated.roe,
    };

    console.log('Saving updates:', updates);

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', localProperty.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("Error saving property:", error);
      alert(`Errore durante il salvataggio: ${error.message}`);
      throw error;
    }

    const updated = { ...localProperty, ...updates };
    setLocalProperty(updated);
    onUpdate(updated);
    console.log('Saved successfully:', data);
    return updated;
  }, [localProperty, calculated, onUpdate]);

  const handleApprove = useCallback(async () => {
    if (!confirm('Confermi di voler approvare questa valutazione? Verrà inviata l\'email al cliente.')) return;
    
    setSaving(true);
    
    try {
      // Prima salviamo le modifiche e aspettiamo che finiscano
      console.log('Step 1: Saving changes...');
      const savedData = await saveChanges();
      console.log('Step 2: Changes saved, now approving with data:', savedData);
      
      // Poi chiamiamo l'API passando i dati già calcolati
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: localProperty.id,
          status: 'approved',
          // Passiamo i dati per l'email
          emailData: {
            lead_email: localProperty.lead_email,
            lead_nome: localProperty.lead_nome,
            indirizzo: localProperty.indirizzo_completo,
            tipo_immobile: localProperty.tipo_immobile || 'Non specificato',
            superficie_mq: localProperty.superficie_mq,
            prezzo_acquisto_min: Math.max(0, roundToThousand(calculated.prezzo_acquisto_meno_5)),
            prezzo_acquisto_max: Math.max(0, roundToThousand(calculated.prezzo_acquisto))
          }
        }),
      });

      const result = await response.json();
      console.log('Step 3: Approval response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante l\'approvazione');
      }

      if (result.success) {
        onUpdate(result.data);
        alert('✅ Valutazione approvata! ' + (result.emailSent ? 'Email inviata al cliente.' : 'Email non inviata (controllare n8n).'));
        onClose();
      }
    } catch (error: any) {
      console.error('Errore approvazione:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [localProperty, calculated, saveChanges, onUpdate, onClose]);

  const handleReject = useCallback(async () => {
    if (!confirm('Confermi di voler rifiutare questa valutazione? Verrà inviata l\'email al cliente.')) return;
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: localProperty.id,
          status: 'rejected',
          // Passiamo i dati per l'email
          emailData: {
            lead_email: localProperty.lead_email,
            lead_nome: localProperty.lead_nome,
            indirizzo: localProperty.indirizzo_completo,
            tipo_immobile: localProperty.tipo_immobile || 'Non specificato',
            superficie_mq: localProperty.superficie_mq,
            prezzo_acquisto_min: 0,
            prezzo_acquisto_max: 0
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il rifiuto');
      }

      if (result.success) {
        onUpdate(result.data);
        alert('❌ Valutazione rifiutata. ' + (result.emailSent ? 'Email inviata al cliente.' : 'Email non inviata (controllare n8n).'));
        onClose();
      }
    } catch (error: any) {
      console.error('Errore rifiuto:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [localProperty, onUpdate, onClose]);

  const formatCurrency = (value: number) => `€${Math.round(value).toLocaleString('it-IT')}`;

  // Arrotonda alle migliaia: se >= 500, arrotonda su, altrimenti giù
  const roundToThousand = (value: number) => {
    const hundreds = value % 1000;
    if (hundreds >= 500) {
      return Math.ceil(value / 1000) * 1000;
    } else {
      return Math.floor(value / 1000) * 1000;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {localProperty.lead_nome} {localProperty.lead_cognome}
            </h2>
            <p className="text-slate-600 mt-1">{localProperty.indirizzo_completo} {localProperty.numero_civico}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Dati Immobile */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">🏠 Dati Immobile</h3>
            <div className="grid grid-cols-5 gap-3 text-sm bg-slate-50 p-4 rounded-lg">
              <div><span className="text-slate-500 text-xs">Tipologia</span><p className="font-medium">{localProperty.tipo_immobile || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Superficie</span><p className="font-medium">{localProperty.superficie_mq} m²</p></div>
              <div><span className="text-slate-500 text-xs">Locali</span><p className="font-medium">{localProperty.numero_locali || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Bagni</span><p className="font-medium">{localProperty.numero_bagni || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Piano</span><p className="font-medium">{localProperty.piano_immobile || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Ascensore</span><p className="font-medium">{localProperty.ascensore || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Anno</span><p className="font-medium">{localProperty.anno_costruzione || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Condizioni</span><p className="font-medium">{localProperty.condizioni_immobile || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Aree esterne</span><p className="font-medium">{localProperty.aree_esterne || '-'}</p></div>
              <div><span className="text-slate-500 text-xs">Pertinenze</span><p className="font-medium">{localProperty.pertinenze || '-'}</p></div>
            </div>
          </div>

          {/* AVM */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">📊 Valutazioni AVM</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agent Pricing Min</label>
                <NumericFormat
                  value={localProperty.avm_agent_pricing_min || ''}
                  onValueChange={(values) => handleFieldChange('avm_agent_pricing_min', values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  placeholder="Es. 300.000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agent Pricing Max</label>
                <NumericFormat
                  value={localProperty.avm_agent_pricing_max || ''}
                  onValueChange={(values) => handleFieldChange('avm_agent_pricing_max', values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  placeholder="Es. 320.000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Immobiliare Insights Min</label>
                <NumericFormat
                  value={localProperty.avm_immobiliare_insights_min || ''}
                  onValueChange={(values) => handleFieldChange('avm_immobiliare_insights_min', values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  placeholder="Es. 290.000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Immobiliare Insights Max</label>
                <NumericFormat
                  value={localProperty.avm_immobiliare_insights_max || ''}
                  onValueChange={(values) => handleFieldChange('avm_immobiliare_insights_max', values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  placeholder="Es. 310.000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            
            {/* Prezzo Riferimento e Rivendita */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 text-center">
                <div className="text-xs text-slate-600">Prezzo Riferimento</div>
                <div className="text-xl font-bold text-blue-600">{formatCurrency(calculated.prezzo_riferimento)}</div>
              </div>
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center">
                <div className="text-xs text-slate-600">Prezzo Rivendita</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(calculated.prezzo_rivendita)}</div>
              </div>
            </div>
          </div>

          {/* CONTO ECONOMICO Unificato */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">💶 Conto Economico</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              <div className="pt-2 space-y-2">
                {/* Ristrutturazione */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Ristrutturazione</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.ristrutturazione_per_mq}€/m²</span>
                  <NumericFormat value={editableCosts.costo_ristrutturazione} onValueChange={(values) => handleCostChange('costo_ristrutturazione', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Studio Tecnico */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Studio Tecnico</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.studio_tecnico}€</span>
                  <NumericFormat value={editableCosts.costo_studio_tecnico} onValueChange={(values) => handleCostChange('costo_studio_tecnico', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Architetto */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Architetto</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.architetto}€</span>
                  <NumericFormat value={editableCosts.costo_architetto} onValueChange={(values) => handleCostChange('costo_architetto', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Imposte */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Imposte</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.imposte_percentuale}% + {params.imposte_fisso}€</span>
                  <NumericFormat value={editableCosts.costo_imposte} onValueChange={(values) => handleCostChange('costo_imposte', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Notaio */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Notaio</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.notaio}€</span>
                  <NumericFormat value={editableCosts.costo_notaio} onValueChange={(values) => handleCostChange('costo_notaio', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Avvocato */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Avvocato</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.avvocato}€</span>
                  <NumericFormat value={editableCosts.costo_avvocato} onValueChange={(values) => handleCostChange('costo_avvocato', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Agibilità */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Agibilità</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.agibilita}€</span>
                  <NumericFormat value={editableCosts.costo_agibilita} onValueChange={(values) => handleCostChange('costo_agibilita', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Cambio Destinazione */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Cambio Destinazione</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.cambio_destinazione_uso}€</span>
                  <NumericFormat value={editableCosts.costo_cambio_destinazione} onValueChange={(values) => handleCostChange('costo_cambio_destinazione', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Agenzia In */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Agenzia In</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.agenzia_in_percentuale}%</span>
                  <NumericFormat value={editableCosts.costo_agenzia_in} onValueChange={(values) => handleCostChange('costo_agenzia_in', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Agenzia Out */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Agenzia Out</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.agenzia_out_percentuale}%</span>
                  <NumericFormat value={editableCosts.costo_agenzia_out} onValueChange={(values) => handleCostChange('costo_agenzia_out', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Condominio Risc. */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Condominio Risc.</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.condominio_risc}€</span>
                  <NumericFormat value={editableCosts.costo_condominio_risc} onValueChange={(values) => handleCostChange('costo_condominio_risc', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Pulizia Cantiere */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Pulizia Cantiere</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.pulizia_cantiere}€</span>
                  <NumericFormat value={editableCosts.costo_pulizia_cantiere} onValueChange={(values) => handleCostChange('costo_pulizia_cantiere', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Utenze */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Utenze</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.utenze}€</span>
                  <NumericFormat value={editableCosts.costo_utenze} onValueChange={(values) => handleCostChange('costo_utenze', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Imprevisti */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Imprevisti</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">{params.imprevisti_percentuale}%</span>
                  <NumericFormat value={editableCosts.costo_imprevisti} onValueChange={(values) => handleCostChange('costo_imprevisti', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                {/* Altro */}
                <div className="flex items-center gap-3">
                  <div className="flex-1"><span className="text-sm text-slate-600">Altro</span></div>
                  <span className="text-xs text-slate-400 w-32 text-right">0€</span>
                  <NumericFormat value={editableCosts.costo_altro} onValueChange={(values) => handleCostChange('costo_altro', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-40 px-3 py-1.5 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
              </div>

              <div className="flex justify-between text-sm py-2 border-t-2 border-slate-300 mt-3 pt-3">
                <span className="font-semibold text-slate-700">Totale Costi (escluso acquisto):</span>
                <span className="font-semibold">{formatCurrency(calculated.totale_costi_escluso_acquisto)}</span>
              </div>
              
              <div className="flex justify-between text-sm py-2">
                <span className="font-bold text-blue-700">Prezzo Acquisto:</span>
                <span className="font-bold text-blue-600">{formatCurrency(calculated.prezzo_acquisto)}</span>
              </div>
              
              <div className="flex justify-between text-sm py-2">
                <span className="font-semibold text-slate-700">Totale Costi:</span>
                <span className="font-semibold">{formatCurrency(calculated.totale_costi)}</span>
              </div>
              
              <div className="flex justify-between text-sm py-2">
                <span className="font-semibold text-green-700">Prezzo Rivendita:</span>
                <span className="font-semibold text-green-600">{formatCurrency(calculated.totale_rivendita)}</span>
              </div>
              
              <div className="flex justify-between text-sm py-2 border-t-2 border-green-200 mt-4 pt-4">
                <span className="font-bold text-green-700">Utile Lordo:</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(calculated.utile_lordo)}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Esposizione (€)</label>
                  <NumericFormat value={editableCosts.esposizione} onValueChange={(values) => handleCostChange('esposizione', values.floatValue || 0)} thousandSeparator="." decimalSeparator="," className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">ROI Target (%)</label>
                  <input type="number" value={editableCosts.roi_target} onChange={(e) => handleCostChange('roi_target', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <span className="block text-xs text-slate-600 mb-1">ROE</span>
                  <div className="text-sm font-semibold text-blue-600 py-1.5">{calculated.roe?.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Offerta Finale */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">🔨 Offerta Finale</h3>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
              <div className="text-sm text-slate-600 mb-2">Range Offerta</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(roundToThousand(calculated.prezzo_acquisto_meno_5))} - {formatCurrency(roundToThousand(calculated.prezzo_acquisto))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button 
              onClick={async () => {
                try {
                  await saveChanges();
                  alert('✅ Modifiche salvate con successo!');
                } catch (error) {
                  // L'errore è già gestito in saveChanges
                }
              }} 
              disabled={saving} 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
            <button onClick={handleApprove} disabled={saving} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Check size={20} />
              {saving ? 'Approvazione...' : 'Approva'}
            </button>
            <button onClick={handleReject} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              <XCircle size={20} />
              {saving ? 'Rifiuto...' : 'Rifiuta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}