import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Syringe, AlertCircle, Calendar, Plus, X, Search } from 'lucide-react';
import { vaccinesApi, petsApi } from '../lib/api';
import { formatShortDate } from '../lib/utils';

export default function Vaccines() {
  const [showModal, setShowModal] = useState(false);
  const [searchPet, setSearchPet] = useState('');
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [formData, setFormData] = useState({
    vaccineName: '',
    appliedDate: new Date().toISOString().split('T')[0],
    nextDoseDate: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-vaccines'],
    queryFn: () => vaccinesApi.getPending().then((res) => res.data.data),
  });

  const { data: petsData } = useQuery({
    queryKey: ['pets-search', searchPet],
    queryFn: () => petsApi.list({ search: searchPet, limit: 10 }).then((res) => res.data.data),
    enabled: searchPet.length > 1,
  });

  const createVaccineMutation = useMutation({
    mutationFn: (data: any) => vaccinesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-vaccines'] });
      setShowModal(false);
      setSelectedPet(null);
      setFormData({
        vaccineName: '',
        appliedDate: new Date().toISOString().split('T')[0],
        nextDoseDate: '',
        notes: '',
      });
      setSearchPet('');
    },
  });

  const handleCreateVaccine = () => {
    if (!selectedPet || !formData.vaccineName) return;
    createVaccineMutation.mutate({
      petId: selectedPet.id,
      vaccineName: formData.vaccineName,
      appliedDate: formData.appliedDate,
      nextDoseDate: formData.nextDoseDate || null,
      notes: formData.notes,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacunas</h1>
          <p className="text-gray-500">Gestiona las vacunas y recordatorios</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Registrar Vacuna
        </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Registrar Vacuna</h2>
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

              {/* Vaccine Name */}
              <div>
                <label className="label">Nombre de la Vacuna *</label>
                <select
                  value={formData.vaccineName}
                  onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar vacuna...</option>
                  <option value="Rabia">Rabia</option>
                  <option value="Parvovirus">Parvovirus</option>
                  <option value="Moquillo">Moquillo</option>
                  <option value="Hepatitis">Hepatitis</option>
                  <option value="Leptospirosis">Leptospirosis</option>
                  <option value="Bordetella">Bordetella (Tos de las perreras)</option>
                  <option value="Triple Felina">Triple Felina</option>
                  <option value="Leucemia Felina">Leucemia Felina</option>
                  <option value="Polivalente">Polivalente</option>
                </select>
              </div>

              {/* Applied Date */}
              <div>
                <label className="label">Fecha de Aplicación</label>
                <input
                  type="date"
                  value={formData.appliedDate}
                  onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                  className="input"
                />
              </div>

              {/* Next Dose */}
              <div>
                <label className="label">Próxima Dosis (opcional)</label>
                <input
                  type="date"
                  value={formData.nextDoseDate}
                  onChange={(e) => setFormData({ ...formData, nextDoseDate: e.target.value })}
                  className="input"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Observaciones..."
                />
              </div>

              <button
                onClick={handleCreateVaccine}
                disabled={!selectedPet || !formData.vaccineName || createVaccineMutation.isPending}
                className="btn-primary w-full"
              >
                {createVaccineMutation.isPending ? 'Registrando...' : 'Registrar Vacuna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
