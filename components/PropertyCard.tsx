import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function PropertyCard({ property, onClick, onDelete }: PropertyCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questa valutazione?')) {
      onDelete(property.id);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approvato', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' };
      case 'rejected':
        return { label: 'Rifiutato', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' };
      default:
        return { label: 'In Approvazione', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500' };
    }
  };

  const statusConfig = getStatusConfig(property.status);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border-l-8 ${statusConfig.border} border-t border-r border-b border-slate-200 p-2 cursor-pointer hover:shadow-md transition-all relative`}
    >
      {/* Header con Status e Elimina a destra */}
      <div className="flex items-start justify-between mb-2">
        {/* Info principali a sinistra */}
        <div className="flex-1 min-w-0">
          <div className="grid gap-1.5 text-sm" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1.5fr' }}>
            <div>
              <p className="text-xs text-slate-500">Cliente</p>
              <p className="font-semibold text-slate-900 text-xs leading-tight">
                {property.lead_nome} {property.lead_cognome}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-slate-500">Indirizzo</p>
              <p className="font-medium text-slate-900 text-xs leading-tight">
                {property.indirizzo_completo} {property.numero_civico}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Tipologia</p>
              <p className="font-medium text-slate-900 text-xs leading-tight">{property.tipo_immobile || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Condizioni</p>
              <p className="font-medium text-slate-900 text-xs leading-tight">{property.condizioni_immobile || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Superficie</p>
              <p className="font-medium text-slate-900 text-xs leading-tight">{property.superficie_mq} m²</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Range Acquisto</p>
              <p className="font-semibold text-blue-600 text-xs leading-tight">
                {property.prezzo_acquisto_meno_5 && property.prezzo_acquisto 
                  ? `€${Math.round(property.prezzo_acquisto_meno_5).toLocaleString()} - €${Math.round(property.prezzo_acquisto).toLocaleString()}`
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Status e Elimina a destra (sulla stessa riga) */}
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            {statusConfig.label}
          </div>
          <button
            onClick={handleDelete}
            className="px-2 py-0.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[10px] font-medium rounded border border-slate-300 hover:border-red-400 transition-all"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}