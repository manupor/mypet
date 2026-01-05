import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, Plus } from 'lucide-react';
import { servicesApi, veterinaryApi } from '../lib/api';
import { formatCurrency, formatShortDate } from '../lib/utils';

export default function Services() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showModal, setShowModal] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list({ limit: 50 }).then((res) => res.data.data),
  });

  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => veterinaryApi.getServiceTypes().then((res) => res.data.data),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-500">Historial de servicios realizados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Registrar Servicio
        </button>
      </div>

      {/* Service Types */}
      <div className="card p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Tipos de Servicio</h3>
        <div className="flex flex-wrap gap-2">
          {serviceTypes?.map((type: any) => (
            <span key={type.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
              {type.name} - {formatCurrency(type.price)}
              {type.loyalty_threshold && ` (${type.loyalty_threshold + 1}° gratis)`}
            </span>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : services?.services?.length === 0 ? (
          <div className="p-12 text-center">
            <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay servicios registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Servicio</th>
                <th className="table-header">Mascota</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services?.services?.map((service: any) => (
                <tr key={service.id}>
                  <td className="table-cell font-medium">{service.service_name}</td>
                  <td className="table-cell">{service.pet_name}</td>
                  <td className="table-cell">{formatShortDate(service.service_date)}</td>
                  <td className="table-cell">
                    {service.is_free ? (
                      <span className="text-green-600 font-medium">GRATIS</span>
                    ) : (
                      formatCurrency(service.price)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
