import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PawPrint, ChevronRight, Loader2 } from 'lucide-react';
import { petsApi } from '../lib/api';
import { getSpeciesEmoji, getSpeciesLabel, calculateAge } from '../lib/utils';

export default function MyPets() {
  const { data: pets, isLoading } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => petsApi.getMyPets().then((res) => res.data.data),
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Mis Mascotas</h1>
        <p className="text-gray-500 mt-1">Gestiona la información de tus compañeros</p>
      </div>

      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : pets?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PawPrint className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin mascotas registradas
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Cuando visites una veterinaria con My Pet, tus mascotas aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pets?.map((pet: any) => (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                  {pet.photo ? (
                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    getSpeciesEmoji(pet.species)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {getSpeciesLabel(pet.species)} • {pet.breed || 'Sin raza'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {pet.birth_date && <span>{calculateAge(pet.birth_date)}</span>}
                    {pet.weight && <span>{pet.weight} kg</span>}
                    {pet.gender && (
                      <span>{pet.gender === 'male' ? '♂ Macho' : '♀ Hembra'}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
