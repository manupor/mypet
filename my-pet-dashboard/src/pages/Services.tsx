import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors, Plus, X, Search } from 'lucide-react';
import { servicesApi, veterinaryApi, petsApi, loyaltyApi } from '../lib/api';
import { formatCurrency, formatShortDate } from '../lib/utils';

export default function Services() {
  const [showModal, setShowModal] = useState(false);
  const [searchPet, setSearchPet] = useState('');
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedService, setSelectedService] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list({ limit: 50 }).then((res) => res.data.data),
  });

  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => veterinaryApi.getServiceTypes().then((res) => res.data.data),
  });

  const { data: petsData } = useQuery({
    queryKey: ['pets-search', searchPet],
    queryFn: () => petsApi.list({ search: searchPet, limit: 10 }).then((res) => res.data.data),
    enabled: searchPet.length > 1,
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: any) => loyaltyApi.processService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowModal(false);
      setSelectedPet(null);
      setSelectedService('');
      setNotes('');
      setSearchPet('');
    },
  });

  const handleCreateService = () => {
    if (!selectedPet || !selectedService) return;
    createServiceMutation.mutate({
      petId: selectedPet.id,
      serviceTypeId: selectedService,
      notes,
    });
  };

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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Registrar Servicio</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Search Pet */}
              <div>
                <label className="label">Buscar Mascota</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchPet}
                    onChange={(e) => setSearchPet(e.target.value)}
                    className="input pl-10"
                    placeholder="Nombre de mascota o dueño..."
                  />
                </div>
                {petsData?.pets?.length > 0 && !selectedPet && (
                  <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {petsData.pets.map((pet: any) => (
                      <button
                        key={pet.id}
                        onClick={() => {
                          setSelectedPet(pet);
                          setSearchPet('');
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {pet.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.owner_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Pet */}
              {selectedPet && (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      {selectedPet.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedPet.name}</p>
                      <p className="text-sm text-gray-500">{selectedPet.owner_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPet(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Service Type */}
              <div>
                <label className="label">Tipo de Servicio</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="input"
                >
                  <option value="">Seleccionar servicio...</option>
                  {serviceTypes?.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {formatCurrency(type.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Observaciones del servicio..."
                />
              </div>

              <button
                onClick={handleCreateService}
                disabled={!selectedPet || !selectedService || createServiceMutation.isPending}
                className="btn-primary w-full"
              >
                {createServiceMutation.isPending ? 'Registrando...' : 'Registrar Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
