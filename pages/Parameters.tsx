import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { GlobalParameters } from '../types';
import { Save } from 'lucide-react';
import { DashboardNav } from '../components/DashboardNav';

export default function ParametersPage() {
  const [params, setParams] = useState<GlobalParameters | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchParams() {
      const { data } = await supabase
        .from('parameters')
        .select('*')
        .single();
      
      if (data) setParams(data);
    }
    fetchParams();
  }, []);

  const handleChange = (field: keyof GlobalParameters, value: number) => {
    if (!params) return;
    setParams({ ...params, [field]: value });
  };

  const handleSave = async () => {
    if (!params) return;
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('parameters')
      .update(params)
      .eq('id', params.id);

    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      console.error(error);
      alert('Errore salvataggio parametri');
    }
  };

  if (!params) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="max-w-7xl mx-auto p-6 text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Parametri Globali</h1>
          <p className="text-slate-600 mt-2">Modifica i parametri utilizzati per i calcoli automatici</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">💶 Costi Fissi</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Ristrutturazione per mq (€)', key: 'ristrutturazione_per_mq' },
                { label: 'Studio Tecnico (€)', key: 'studio_tecnico' },
                { label: 'Architetto (€)', key: 'architetto' },
                { label: 'Notaio (€)', key: 'notaio' },
                { label: 'Avvocato (€)', key: 'avvocato' },
                { label: 'Condominio Risc. (€)', key: 'condominio_risc' },
                { label: 'Pulizia Cantiere (€)', key: 'pulizia_cantiere' },
                { label: 'Utenze (€)', key: 'utenze' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm text-slate-600 mb-1">{item.label}</label>
                  <input
                    type="number"
                    value={params[item.key as keyof GlobalParameters] as number}
                    onChange={(e) => handleChange(item.key as keyof GlobalParameters, parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">📊 Percentuali</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agenzia In (%)</label>
                <input
                  type="number"
                  value={params.agenzia_in_percentuale}
                  onChange={(e) => handleChange('agenzia_in_percentuale', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Agenzia Out (%)</label>
                <input
                  type="number"
                  value={params.agenzia_out_percentuale}
                  onChange={(e) => handleChange('agenzia_out_percentuale', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Imprevisti (%)</label>
                <input
                  type="number"
                  value={params.imprevisti_percentuale}
                  onChange={(e) => handleChange('imprevisti_percentuale', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">🎯 Strategici</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Esposizione Default (€)</label>
                <input
                  type="number"
                  value={params.esposizione_default}
                  onChange={(e) => handleChange('esposizione_default', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ROI Target (%)</label>
                <input
                  type="number"
                  value={params.roi_target}
                  onChange={(e) => handleChange('roi_target', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Imposte (%)</label>
                <input
                  type="number"
                  value={params.imposte_percentuale}
                  onChange={(e) => handleChange('imposte_percentuale', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Imposte Fisso (€)</label>
                <input
                  type="number"
                  value={params.imposte_fisso}
                  onChange={(e) => handleChange('imposte_fisso', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              <Save size={20} />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
            
            {success && (
              <span className="text-green-600 font-medium">✓ Salvato con successo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}