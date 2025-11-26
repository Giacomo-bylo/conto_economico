import React from 'react';
import { Property } from '../types';
import { Trash2 } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export default function PropertyCard({ property, onClick, onDelete }: PropertyCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questa valutazione?')) {
      onDelete(property.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 flex justify-between items-center gap-6"
    >
      <div className="flex-1 grid grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-semibold text-gray-900">
            {property.lead_nome} {property.lead_cognome}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Indirizzo</p>
          <p className="font-medium text-gray-900">
            {property.indirizzo_completo} {property.numero_civico}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Tipologia</p>
          <p className="font-medium text-gray-900">{property.tipo_immobile || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Condizioni</p>
          <p className="font-medium text-gray-900">{property.condizioni_immobile || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Superficie</p>
          <p className="font-medium text-gray-900">{property.superficie_mq} m²</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Locali / Bagni</p>
          <p className="font-medium text-gray-900">
            {property.numero_locali || '-'} / {property.numero_bagni || '-'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Piano</p>
          <p className="font-medium text-gray-900">
            {property.piano_immobile || '-'} {property.ascensore === 'Si' ? '(Asc.)' : ''}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Anno</p>
          <p className="font-medium text-gray-900">{property.anno_costruzione || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Aree esterne</p>
          <p className="font-medium text-gray-900">{property.aree_esterne || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Pertinenze</p>
          <p className="font-medium text-gray-900">{property.pertinenze || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Prezzo Acquisto</p>
          <p className="font-semibold text-blue-600">
            {property.prezzo_acquisto ? `€${property.prezzo_acquisto.toLocaleString()}` : '-'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">ROI</p>
          <p className="font-semibold text-green-600">{property.roi || '-'}%</p>
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        title="Elimina valutazione"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}