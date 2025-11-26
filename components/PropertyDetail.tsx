import React, { useState, useCallback, useMemo } from 'react';
import { Property, GlobalParameters } from '../types';
import { calculateProperty } from '../utils/calculations';
import { exportPropertyToPDF } from '../utils/export';
import { supabase } from '../services/supabaseClient';
import { X, Check, XCircle, FileDown } from 'lucide-react';

interface PropertyDetailProps {
  property: Property;
  params: GlobalParameters;
  onClose: () => void;
  onUpdate: (property: Property) => void;
}

export function PropertyDetail({ property, params, onClose, onUpdate }: PropertyDetailProps) {
  const [localProperty, setLocalProperty] = useState(property);
  const [saving, setSaving] = useState(false);

  const calculated = useMemo(
    () => calculateProperty(localProperty, params),
    [localProperty, params]
  );

  const handleFieldChange = useCallback((field: keyof Property, value: number) => {
    setLocalProperty(prev => ({ ...prev, [field]: value }));
  }, []);

  const saveChanges = useCallback(async (updates: Partial<Property>) => {
    setSaving(true);
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', localProperty.id);

    if (!error) {
      const updated = { ...localProperty, ...updates };
      setLocalProperty(updated);
      onUpdate(updated);
    } else {
      console.error("Error saving property:", error);
      alert("Errore durante il salvataggio.");
    }
    setSaving(false);
  }, [localProperty, onUpdate]);

  const handleApprove = useCallback(async () => {
    // 1. Save local calculation state to DB
    await saveChanges({
      ...calculated,
      status: 'approved',
      approved_at: new Date().toISOString()
    });

    // 2. Mock Webhook Notification
    // In a real scenario, this would POST to n8n
    console.log("Mocking N8N notification for Approval:", calculated);
    
    onClose();
  }, [calculated, saveChanges, onClose]);

  const handleReject = useCallback(async () => {
    await saveChanges({ status: 'rejected' });
    
    // Mock Webhook Notification
    console.log("Mocking N8N notification for Rejection:", localProperty.id);

    onClose();
  }, [localProperty.id, saveChanges, onClose]);

  const formatCurrency = (value: number) => 
    `€${value.toLocaleString('it-IT')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {localProperty.lead_nome} {localProperty.lead_cognome}
            </h2>
            <p className="text-slate-600 mt-1">{localProperty.indirizzo_completo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Section: Immobile Data */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">🏠 Dati Immobile</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Superficie</span>
                <p className="font-medium text-slate-900">{localProperty.superficie_mq} mq</p>
              </div>
              <div>
                <span className="text-slate-500">Locali</span>
                <p className="font-medium text-slate-900">{localProperty.numero_locali || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Bagni</span>
                <p className="font-medium text-slate-900">{localProperty.numero_bagni || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Piano</span>
                <p className="font-medium text-slate-900">{localProperty.piano_immobile || '-'}</p>
              </div>
            </div>
          </div>

          {/* Section: AVM Inputs */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">📊 Valutazioni AVM</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agent Pricing Min</label>
                <input
                  type="number"
                  value={localProperty.avm_agent_pricing_min || 0}
                  onChange={(e) => handleFieldChange('avm_agent_pricing_min', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agent Pricing Max</label>
                <input
                  type="number"
                  value={localProperty.avm_agent_pricing_max || 0}
                  onChange={(e) => handleFieldChange('avm_agent_pricing_max', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Immobiliare Insights Min</label>
                <input
                  type="number"
                  value={localProperty.avm_immobiliare_insights_min || 0}
                  onChange={(e) => handleFieldChange('avm_immobiliare_insights_min', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Immobiliare Insights Max</label>
                <input
                  type="number"
                  value={localProperty.avm_immobiliare_insights_max || 0}
                  onChange={(e) => handleFieldChange('avm_immobiliare_insights_max', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Automatic Calculations */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">💰 Calcoli Automatici</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-600">Prezzo Riferimento</span>
                <span className="font-medium text-slate-900">{formatCurrency(calculated.prezzo_riferimento || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Prezzo Rivendita</span>
                <span className="font-medium text-slate-900">{formatCurrency(calculated.prezzo_rivendita || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Costo Ristrutturazione</span>
                <span className="font-medium text-slate-900">{formatCurrency(calculated.costo_ristrutturazione || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">Totale Costi</span>
                <span className="font-semibold text-slate-900">{formatCurrency(calculated.totale_costi || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Utile Lordo</span>
                <span className="font-semibold text-green-600">{formatCurrency(calculated.utile_lordo || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">ROE</span>
                <span className="font-semibold text-primary-600">{calculated.roe?.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Section: Final Offer */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">🔨 Offerta Finale</h3>
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <div className="text-center">
                <div className="text-sm text-slate-600 mb-1">Range Offerta</div>
                <div className="text-2xl font-bold text-primary-600">
                  {formatCurrency(calculated.prezzo_acquisto_meno_5 || 0)} - {formatCurrency(calculated.prezzo_acquisto || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApprove}
              disabled={saving}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <Check size={20} />
              Approva Operazione
            </button>
            <button
              onClick={handleReject}
              disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <XCircle size={20} />
              Rifiuta Operazione
            </button>
            <button
              onClick={() => exportPropertyToPDF(calculated)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileDown size={20} />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}