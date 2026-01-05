import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, QrCode } from 'lucide-react';
import { clientsApi } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ClientNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => clientsApi.add(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate(`/clients/${response.data.data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error al crear cliente');
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const { data } = await clientsApi.list({ search: searchEmail });
      if (data.data.clients?.length > 0) {
        setSearchResult(data.data.clients[0]);
      } else {
        setSearchError('No se encontró ningún usuario con ese email. Puedes crear uno nuevo.');
        setFormData({ ...formData, email: searchEmail });
      }
    } catch (err) {
      setSearchError('Error al buscar');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to="/clients" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver a clientes
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agregar Cliente</h1>

      {/* Mode Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            mode === 'search' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
          }`}
        >
          <Search className="w-6 h-6 mx-auto mb-2 text-primary-600" />
          <p className="font-medium">Buscar por Email</p>
          <p className="text-sm text-gray-500">Encuentra un usuario existente</p>
        </button>
        <button
          onClick={() => setMode('create')}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            mode === 'create' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
          }`}
        >
          <QrCode className="w-6 h-6 mx-auto mb-2 text-primary-600" />
          <p className="font-medium">Crear Nuevo</p>
          <p className="text-sm text-gray-500">Registra un cliente manualmente</p>
        </button>
      </div>

      <div className="card p-6">
        {mode === 'search' ? (
          <>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="label">Email del usuario</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="input flex-1"
                    placeholder="usuario@email.com"
                    required
                  />
                  <button type="submit" disabled={searching} className="btn-primary">
                    {searching ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>
            </form>

            {searchError && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">{searchError}</p>
                <button
                  onClick={() => setMode('create')}
                  className="mt-2 text-primary-600 font-medium hover:underline"
                >
                  Crear cliente nuevo →
                </button>
              </div>
            )}

            {searchResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">¡Usuario encontrado!</p>
                <p className="text-green-700">{searchResult.name} - {searchResult.email}</p>
                <Link
                  to={`/clients/${searchResult.id}`}
                  className="mt-2 inline-block text-primary-600 font-medium hover:underline"
                >
                  Ver perfil del cliente →
                </Link>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">Nombre completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Nombre del cliente"
                required
              />
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="email@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="55 1234 5678"
              />
            </div>

            <div>
              <label className="label">Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                placeholder="Calle, número, colonia"
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary w-full"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Cliente'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
