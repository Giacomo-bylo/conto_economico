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
      {/* Mobile: Stack verticale | Desktop: Griglia fissa */}
      <div className="flex flex-col gap-3 md:grid md:items-center md:gap-2" style={{ gridTemplateColumns: '1.2fr 2.5fr 0.8fr 1fr 0.6fr 1.3fr 0.6fr 0.5fr' }}>
        {/* Cliente */}
        <div>
          <p className="text-xs text-slate-500">Cliente</p>
          <p className="font-semibold text-slate-900 text-sm md:text-xs leading-tight truncate">
            {property.lead_nome} {property.lead_cognome}
          </p>
        </div>
        
        {/* Indirizzo */}
        <div>
          <p className="text-xs text-slate-500">Indirizzo</p>
          <p className="font-medium text-slate-900 text-sm md:text-xs leading-tight truncate">
            {property.indirizzo_completo} {property.numero_civico}
          </p>
        </div>

        {/* Riga mobile: Tipologia + Condizioni */}
        <div className="grid grid-cols-2 gap-2 md:contents">
          {/* Tipologia */}
          <div>
            <p className="text-xs text-slate-500">Tipologia</p>
            <p className="font-medium text-slate-900 text-sm md:text-xs leading-tight truncate">{property.tipo_immobile || '-'}</p>
          </div>

          {/* Condizioni */}
          <div>
            <p className="text-xs text-slate-500">Condizioni</p>
            <p className="font-medium text-slate-900 text-sm md:text-xs leading-tight truncate">{property.condizioni_immobile || '-'}</p>
          </div>
        </div>

        {/* Superficie - solo su desktop, nascosto su mobile */}
        <div className="hidden md:block">
          <p className="text-xs text-slate-500">Superficie</p>
          <p className="font-medium text-slate-900 text-xs leading-tight">{property.superficie_mq} m²</p>
        </div>

        {/* Range Acquisto */}
        <div>
          <p className="text-xs text-slate-500">Range Acquisto</p>
          <p className="font-semibold text-blue-600 text-sm md:text-xs leading-tight truncate">
            {property.prezzo_acquisto_meno_5 && property.prezzo_acquisto 
              ? `€${Math.round(property.prezzo_acquisto_meno_5).toLocaleString()} - €${Math.round(property.prezzo_acquisto).toLocaleString()}`
              : '-'}
          </p>
        </div>

        {/* Status e Elimina - Mobile: Stack | Desktop: affiancati */}
        <div className="flex flex-row items-center justify-between gap-2 md:contents">
          {/* Status - centrato su desktop */}
          <div className="md:flex md:justify-center">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} whitespace-nowrap`}>
              {statusConfig.label}
            </div>
          </div>

          {/* Elimina - allineato a destra su desktop */}
          <div className="md:flex md:justify-end">
            <button
              onClick={handleDelete}
              className="px-2 py-0.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[10px] font-medium rounded border border-slate-300 hover:border-red-400 transition-all"
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}