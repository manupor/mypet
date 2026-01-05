import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, PawPrint, ChevronRight } from 'lucide-react';
import { petsApi } from '../lib/api';
import { getSpeciesEmoji, getSpeciesLabel } from '../lib/utils';

export default function Pets() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pets', search],
    queryFn: () => petsApi.list({ search }).then((res) => res.data.data),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mascotas</h1>
          <p className="text-gray-500">Gestiona las mascotas registradas</p>
        </div>
        <Link to="/pets/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          Nueva Mascota
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o dueño..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : data?.pets?.length === 0 ? (
          <div className="p-12 text-center">
            <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin mascotas</h3>
            <p className="text-gray-500">No hay mascotas que coincidan con la búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.pets?.map((pet: any) => (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
                  {getSpeciesEmoji(pet.species)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-500">
                    {getSpeciesLabel(pet.species)} • {pet.breed || 'Sin raza'} • {pet.owner_name}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
