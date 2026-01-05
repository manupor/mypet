import { useQuery } from '@tanstack/react-query';
import { Syringe, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { vaccinesApi } from '../lib/api';
import { formatDate, getSpeciesEmoji } from '../lib/utils';

export default function Vaccines() {
  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ['vaccine-reminders'],
    queryFn: () => vaccinesApi.getReminders().then((res) => res.data.data),
  });

  const { data: allVaccines, isLoading: loadingVaccines } = useQuery({
    queryKey: ['all-vaccines'],
    queryFn: () => vaccinesApi.getMyVaccines().then((res) => res.data.data),
  });

  const isLoading = loadingReminders || loadingVaccines;

  const getDaysUntil = (date: string) => {
    const days = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Vacunas</h1>
        <p className="text-gray-500 mt-1">Control de vacunación de tus mascotas</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="px-6 py-6 space-y-6">
          {/* Upcoming Reminders */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Próximas Vacunas
            </h2>

            {!reminders?.length ? (
              <div className="card p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900">¡Todo al día!</p>
                <p className="text-sm text-gray-500 mt-1">
                  No tienes vacunas pendientes próximamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder: any) => {
                  const daysUntil = getDaysUntil(reminder.next_dose_date);
                  const isUrgent = daysUntil <= 3;
                  
                  return (
                    <div 
                      key={reminder.id} 
                      className={`card p-4 border-l-4 ${
                        isUrgent ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl flex-shrink-0">
                          {getSpeciesEmoji(reminder.pet_species)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isUrgent && <AlertCircle className="w-4 h-4 text-red-500" />}
                            <p className="font-semibold text-gray-900">{reminder.vaccine_name}</p>
                          </div>
                          <p className="text-sm text-gray-600">{reminder.pet_name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {reminder.veterinary_name} • {reminder.veterinary_phone}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                            {daysUntil <= 0 ? 'HOY' : `${daysUntil}d`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(reminder.next_dose_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Vaccine History */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Syringe className="w-5 h-5 text-primary-600" />
              Historial de Vacunas
            </h2>

            {!allVaccines?.length ? (
              <div className="card p-6 text-center">
                <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Sin vacunas registradas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allVaccines.map((vaccine: any) => (
                  <div key={vaccine.id} className="card p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{vaccine.vaccine_name}</p>
                        <p className="text-sm text-gray-500">
                          {vaccine.pet_name} • {vaccine.veterinary_name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(vaccine.application_date)}
                        </p>
                        {vaccine.is_international && (
                          <span className="text-xs text-blue-600">✈️ Internacional</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
