import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PawPrint, Syringe, Gift, Calendar, ChevronRight, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { petsApi, vaccinesApi, loyaltyApi } from '../lib/api';
import { getSpeciesEmoji, formatShortDate } from '../lib/utils';

export default function Home() {
  const user = useAuthStore((state) => state.user);

  const { data: petsData } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => petsApi.getMyPets().then((res) => res.data.data),
  });

  const { data: reminders } = useQuery({
    queryKey: ['vaccine-reminders'],
    queryFn: () => vaccinesApi.getReminders().then((res) => res.data.data),
  });

  const { data: loyaltyCards } = useQuery({
    queryKey: ['loyalty-cards'],
    queryFn: () => loyaltyApi.getMyCards().then((res) => res.data.data),
  });

  const pets = petsData || [];
  const upcomingVaccines = reminders?.slice(0, 3) || [];
  const totalPoints = loyaltyCards?.reduce((sum: number, card: any) => sum + (card.total_points || 0), 0) || 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-200 text-sm">Bienvenido,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name?.split(' ')[0]}</h1>
          </div>
          <button className="relative p-2 bg-white/10 rounded-full">
            <Bell className="w-6 h-6 text-white" />
            {upcomingVaccines.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {upcomingVaccines.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/pets" className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
            <PawPrint className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{pets.length}</p>
            <p className="text-xs text-primary-200">Mascotas</p>
          </Link>
          <Link to="/vaccines" className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
            <Syringe className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{upcomingVaccines.length}</p>
            <p className="text-xs text-primary-200">Pendientes</p>
          </Link>
          <Link to="/loyalty" className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
            <Gift className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{totalPoints}</p>
            <p className="text-xs text-primary-200">Puntos</p>
          </Link>
        </div>
      </div>

      <div className="px-6 -mt-4 space-y-6">
        {/* My Pets */}
        <section className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mis Mascotas</h2>
            <Link to="/pets" className="text-primary-600 text-sm font-medium flex items-center">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-8">
              <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aún no tienes mascotas registradas</p>
              <p className="text-sm text-gray-400 mt-1">
                Pide a tu veterinaria que te agregue
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {pets.map((pet: any) => (
                <Link
                  key={pet.id}
                  to={`/pets/${pet.id}`}
                  className="flex-shrink-0 w-24 text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-3xl mb-2 overflow-hidden">
                    {pet.photo ? (
                      <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      getSpeciesEmoji(pet.species)
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{pet.name}</p>
                  <p className="text-xs text-gray-500">{pet.breed || pet.species}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Vaccines */}
        {upcomingVaccines.length > 0 && (
          <section className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Próximas Vacunas</h2>
              <Link to="/vaccines" className="text-primary-600 text-sm font-medium flex items-center">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingVaccines.map((vaccine: any) => (
                <div
                  key={vaccine.id}
                  className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{vaccine.vaccine_name}</p>
                    <p className="text-sm text-gray-500">
                      {vaccine.pet_name} • {vaccine.veterinary_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-600">
                      {formatShortDate(vaccine.next_dose_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loyalty Summary */}
        {loyaltyCards && loyaltyCards.length > 0 && (
          <section className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Programa de Lealtad</h2>
              <Link to="/loyalty" className="text-primary-600 text-sm font-medium flex items-center">
                Ver detalles <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {loyaltyCards.slice(0, 2).map((card: any) => (
                <div
                  key={card.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{card.veterinary_name}</p>
                    <p className="text-sm text-gray-500">{card.total_points} puntos</p>
                  </div>
                  {card.serviceCounters?.map((counter: any) => (
                    counter.loyalty_threshold && (
                      <div key={counter.id} className="text-right">
                        <p className="text-xs text-gray-500">{counter.service_name}</p>
                        <p className="text-sm font-semibold text-primary-600">
                          {counter.count}/{counter.loyalty_threshold + 1}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
