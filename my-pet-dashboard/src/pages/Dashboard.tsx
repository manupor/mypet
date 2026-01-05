import { useQuery } from '@tanstack/react-query';
import { Users, PawPrint, Calendar, Syringe, TrendingUp, Clock } from 'lucide-react';
import { veterinaryApi } from '../lib/api';
import { formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => veterinaryApi.getStats().then((res) => res.data.data),
  });

  const statCards = [
    { label: 'Total Clientes', value: stats?.totalClients || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Mascotas', value: stats?.totalPets || 0, icon: PawPrint, color: 'bg-green-500' },
    { label: 'Citas Hoy', value: stats?.appointmentsToday || 0, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Vacunas Pendientes', value: stats?.pendingVaccines || 0, icon: Syringe, color: 'bg-amber-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen de tu veterinaria</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {isLoading ? '-' : stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Services */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Servicios Recientes
            </h2>
          </div>
          <div className="p-4">
            {stats?.recentServices?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay servicios recientes
              </p>
            ) : (
              <div className="space-y-4">
                {stats?.recentServices?.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{service.service_name}</p>
                      <p className="text-sm text-gray-500">{service.pet_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(service.price)}</p>
                      <p className="text-xs text-gray-500">{service.service_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Resumen del Mes
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Servicios realizados</span>
                <span className="text-xl font-bold text-gray-900">
                  {stats?.monthlyServices || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Nuevos clientes</span>
                <span className="text-xl font-bold text-gray-900">
                  {stats?.newClientsThisMonth || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-green-700">Ingresos del mes</span>
                <span className="text-xl font-bold text-green-700">
                  {formatCurrency(stats?.monthlyRevenue || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
