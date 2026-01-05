import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Save } from 'lucide-react';
import { veterinaryApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Settings() {
  const { staff } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  const { data: vetInfo, isLoading } = useQuery({
    queryKey: ['veterinary-info'],
    queryFn: () => veterinaryApi.getInfo().then((res) => {
      const info = res.data.data;
      setFormData({
        name: info.name || '',
        email: info.email || '',
        phone: info.phone || '',
        address: info.address || '',
        city: info.city || '',
      });
      return info;
    }),
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => veterinaryApi.getStaff().then((res) => res.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => veterinaryApi.updateInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinary-info'] });
      alert('Información actualizada');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Administra la información de tu veterinaria</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Veterinary Info */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              Información de la Veterinaria
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="label">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={updateMutation.isPending}>
              <Save className="w-5 h-5" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Staff */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Personal
            </h2>
          </div>
          <div className="p-4">
            {staffList?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay personal registrado</p>
            ) : (
              <div className="space-y-3">
                {staffList?.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'vet' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
