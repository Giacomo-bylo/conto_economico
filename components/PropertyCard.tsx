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
        return { label: 'Approvato', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'rejected':
        return { label: 'Rifiutato', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default:
        return { label: 'In Approvazione', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    }
  };

  const statusConfig = getStatusConfig(property.status);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all relative"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
          {statusConfig.label}
        </div>
        <button
          onClick={handleDelete}
          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
        >
          ELIMINA
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Cliente</p>
          <p className="font-semibold text-slate-900 text-sm">
            {property.lead_nome} {property.lead_cognome}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-slate-500">Indirizzo</p>
          <p className="font-medium text-slate-900 text-sm">
            {property.indirizzo_completo} {property.numero_civico}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Tipologia</p>
          <p className="font-medium text-slate-900 text-sm">{property.tipo_immobile || '-'}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Condizioni</p>
          <p className="font-medium text-slate-900 text-sm">{property.condizioni_immobile || '-'}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Superficie</p>
          <p className="font-medium text-slate-900 text-sm">{property.superficie_mq} m²</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Range Acquisto</p>
          <p className="font-semibold text-blue-600 text-sm">
            {property.prezzo_acquisto_meno_5 && property.prezzo_acquisto 
              ? `€${Math.round(property.prezzo_acquisto_meno_5).toLocaleString()} - €${Math.round(property.prezzo_acquisto).toLocaleString()}`
              : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}