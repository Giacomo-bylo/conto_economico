import React from 'react';
import { Property } from '../types';
import { X } from 'lucide-react';

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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-all relative group"
    >
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
        title="Elimina valutazione"
      >
        <X size={18} />
      </button>

      <div className="grid grid-cols-6 gap-4 pr-8">
        <div>
          <p className="text-xs text-slate-500 mb-1">Cliente</p>
          <p className="font-semibold text-slate-900">
            {property.lead_nome} {property.lead_cognome}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-slate-500 mb-1">Indirizzo</p>
          <p className="font-medium text-slate-900">
            {property.indirizzo_completo} {property.numero_civico}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">Tipologia</p>
          <p className="font-medium text-slate-900">{property.tipo_immobile || '-'}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">Condizioni</p>
          <p className="font-medium text-slate-900">{property.condizioni_immobile || '-'}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">Superficie</p>
          <p className="font-medium text-slate-900">{property.superficie_mq} m²</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">Range Acquisto</p>
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