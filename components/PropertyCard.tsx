import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusLabels = {
    pending: 'In Attesa',
    approved: 'Approvato',
    rejected: 'Rifiutato'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-200 p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">
            {property.lead_nome} {property.lead_cognome}
          </h3>
          <p className="text-sm text-slate-600 mt-1">{property.indirizzo_completo}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[property.status]}`}>
          {statusLabels[property.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Superficie</span>
          <p className="font-medium text-slate-900">{property.superficie_mq} mq</p>
        </div>
        <div>
          <span className="text-slate-500">Tipo</span>
          <p className="font-medium text-slate-900">{property.tipo_immobile || '-'}</p>
        </div>
      </div>

      {property.prezzo_acquisto ? (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Offerta suggerita</div>
          <div className="text-lg font-bold text-primary-600">
            €{property.prezzo_acquisto.toLocaleString('it-IT')}
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Stato</div>
          <div className="text-sm font-medium text-slate-400">In attesa di calcolo</div>
        </div>
      )}
    </div>
  );
}