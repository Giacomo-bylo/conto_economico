import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Property, GlobalParameters } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyDetail } from '../components/PropertyDetail';
import { Search, Download } from 'lucide-react';
import { exportPropertiesToExcel } from '../utils/export';
import { DashboardNav } from '../components/DashboardNav';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [params, setParams] = useState<GlobalParameters | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchData = useCallback(async () => {
    const [propertiesResult, paramsResult] = await Promise.all([
      supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('parameters')
        .select('*')
        .single()
    ]);

    if (propertiesResult.data) setProperties(propertiesResult.data);
    if (paramsResult.data) setParams(paramsResult.data);
    
    if ((!propertiesResult.data || propertiesResult.data.length === 0) && !propertiesResult.error) {
    }
    
    setLoading(false);
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      alert('Errore durante l\'eliminazione');
    } else {
      setProperties(properties.filter(p => p.id !== id));
      if (selectedProperty?.id === id) {
        setSelectedProperty(null);
      }
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('properties-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProperties(prev => [payload.new as Property, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProperties(prev =>
              prev.map(p => p.id === payload.new.id ? payload.new as Property : p)
            );
            if (selectedProperty?.id === payload.new.id) {
              setSelectedProperty(payload.new as Property);
            }
          } else if (payload.eventType === 'DELETE') {
            setProperties(prev => prev.filter(p => p.id !== payload.old.id));
            if (selectedProperty?.id === payload.old.id) {
              setSelectedProperty(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, selectedProperty?.id]);

  const filteredProperties = properties.filter(property => {
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      property.lead_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.lead_cognome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.indirizzo_completo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Valutazioni</h1>
          <p className="text-slate-600 mt-2">Gestisci le valutazioni immobiliari</p>
        </div>

        {loading ? (
           <div className="flex items-center justify-center h-64">
             <div className="text-slate-600">Caricamento...</div>
           </div>
        ) : (
          <>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        placeholder="Cerca per nome o indirizzo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          filterStatus === status
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'all' ? 'Tutti' : status === 'pending' ? 'In Attesa' : status === 'approved' ? 'Approvati' : 'Rifiutati'}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => exportPropertiesToExcel(filteredProperties)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition shadow-sm hover:shadow-md"
                    >
                      <Download size={18} />
                      Excel
                    </button>
                  </div>
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                  <p className="text-slate-600">Nessuna proprietà trovata</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProperties.map(property => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onClick={() => setSelectedProperty(property)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {selectedProperty && params && (
              <PropertyDetail
                property={selectedProperty}
                params={params}
                onClose={() => setSelectedProperty(null)}
                onUpdate={(updated) => {
                  setProperties(prev =>
                    prev.map(p => p.id === updated.id ? updated : p)
                  );
                  setSelectedProperty(updated);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}