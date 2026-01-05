import { useQuery } from '@tanstack/react-query';
import { Gift, Star, Trophy, Loader2 } from 'lucide-react';
import { loyaltyApi } from '../lib/api';

export default function Loyalty() {
  const { data: cards, isLoading } = useQuery({
    queryKey: ['loyalty-cards'],
    queryFn: () => loyaltyApi.getMyCards().then((res) => res.data.data),
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Programa de Lealtad</h1>
        </div>
        <p className="text-amber-100">Acumula puntos y obtén beneficios</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : !cards?.length ? (
        <div className="px-6 py-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin tarjetas de lealtad
          </h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Cuando visites una veterinaria con My Pet, tu tarjeta de lealtad aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="px-6 py-6 space-y-6">
          {cards.map((card: any) => (
            <div key={card.id} className="card overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {card.veterinary_logo ? (
                      <img 
                        src={card.veterinary_logo} 
                        alt={card.veterinary_name}
                        className="w-12 h-12 rounded-full bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{card.veterinary_name}</p>
                      <p className="text-sm text-primary-200">Nivel: {card.tier}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{card.total_points}</p>
                    <p className="text-xs text-primary-200">puntos</p>
                  </div>
                </div>
              </div>

              {/* Service Counters */}
              {card.serviceCounters?.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-3">Progreso de Servicios</p>
                  <div className="space-y-3">
                    {card.serviceCounters.map((counter: any) => {
                      if (!counter.loyalty_threshold) return null;
                      
                      const progress = (counter.count / (counter.loyalty_threshold + 1)) * 100;
                      const remaining = counter.loyalty_threshold + 1 - counter.count;
                      
                      return (
                        <div key={counter.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {counter.service_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {counter.count}/{counter.loyalty_threshold + 1}
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {remaining === 1 
                              ? '¡El próximo es GRATIS!' 
                              : `${remaining} más para el gratis`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="p-4 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Acumula puntos en cada visita y canjéalos por descuentos
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
