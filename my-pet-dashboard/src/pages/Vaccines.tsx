import { useQuery } from '@tanstack/react-query';
import { Syringe, AlertCircle, Calendar } from 'lucide-react';
import { vaccinesApi } from '../lib/api';
import { formatShortDate } from '../lib/utils';

export default function Vaccines() {
  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-vaccines'],
    queryFn: () => vaccinesApi.getPending().then((res) => res.data.data),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vacunas</h1>
        <p className="text-gray-500">Gestiona las vacunas y recordatorios</p>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Vacunas Próximas a Vencer
          </h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : pending?.length === 0 ? (
          <div className="p-8 text-center">
            <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay vacunas pendientes próximamente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pending?.map((vaccine: any) => (
              <div key={vaccine.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{vaccine.vaccine_name}</p>
                  <p className="text-sm text-gray-500">
                    {vaccine.pet_name} • {vaccine.owner_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-amber-600">{formatShortDate(vaccine.next_dose_date)}</p>
                  <p className="text-xs text-gray-500">{vaccine.owner_phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
