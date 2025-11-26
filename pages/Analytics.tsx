import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Property } from '../types';
import { DashboardNav } from '../components/DashboardNav';

export default function AnalyticsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase
        .from('properties')
        .select('*');
      
      if (data) setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="max-w-7xl mx-auto p-6 text-center">Caricamento...</div>
      </div>
    );
  }

  const total = properties.length;
  const approved = properties.filter(p => p.status === 'approved').length;
  const pending = properties.filter(p => p.status === 'pending').length;
  const rejected = properties.filter(p => p.status === 'rejected').length;
  const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
  
  const avgROI = properties.length > 0
    ? (properties.reduce((sum, p) => sum + (p.roi || 0), 0) / properties.length).toFixed(1)
    : 0;
  
  const totalValue = properties
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.prezzo_acquisto || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-2">Panoramica delle valutazioni</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">Totale Valutazioni</div>
            <div className="text-3xl font-bold text-slate-900">{total}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">Tasso Approvazione</div>
            <div className="text-3xl font-bold text-green-600">{approvalRate}%</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">ROI Medio</div>
            <div className="text-3xl font-bold text-primary-600">{avgROI}%</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">Valore Portfolio</div>
            <div className="text-3xl font-bold text-slate-900">
              €{totalValue.toLocaleString('it-IT')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Status Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">In Attesa</span>
                  <span className="text-sm font-medium">{pending}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">Approvati</span>
                  <span className="text-sm font-medium">{approved}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${total > 0 ? (approved / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">Rifiutati</span>
                  <span className="text-sm font-medium">{rejected}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${total > 0 ? (rejected / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
            <h3 className="font-semibold text-slate-900 mb-4">Ultime Valutazioni</h3>
            <div className="space-y-2">
              {properties.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-900">
                      {p.lead_nome} {p.lead_cognome}
                    </div>
                    <div className="text-sm text-slate-600">{p.indirizzo_completo}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    p.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {p.status === 'pending' ? 'In Attesa' : p.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}