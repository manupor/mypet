import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    veterinaryName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.register({
        veterinaryName: formData.veterinaryName,
        email: formData.adminEmail, // Backend uses same email for vet and admin
        password: formData.adminPassword,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        adminName: formData.adminName,
      });
      
      if (data.success) {
        login({
          id: data.data.staff.id,
          email: data.data.staff.email,
          name: data.data.staff.name,
          role: data.data.staff.role,
          veterinaryId: data.data.veterinary.id,
          veterinaryName: data.data.veterinary.name,
        }, data.data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <Link to="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al login
        </Link>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <PawPrint className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Registra tu Veterinaria
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Únete a My Pet y gestiona tu clínica de forma eficiente
        </p>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-300'}`} />
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`} />
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Datos de la Veterinaria
                </h2>
                
                <div>
                  <label className="label">Nombre de la veterinaria *</label>
                  <input
                    type="text"
                    name="veterinaryName"
                    value={formData.veterinaryName}
                    onChange={handleChange}
                    className="input"
                    placeholder="Clínica Veterinaria..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Email de contacto *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="contacto@miveterinaria.com"
                    required
                  />
                </div>

                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="55 1234 5678"
                  />
                </div>

                <div>
                  <label className="label">Dirección</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                    placeholder="Calle y número"
                  />
                </div>

                <div>
                  <label className="label">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ciudad"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full"
                  disabled={!formData.veterinaryName || !formData.email}
                >
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Datos del Administrador
                </h2>

                <div>
                  <label className="label">Nombre completo *</label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    className="input"
                    placeholder="Dr. Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="label">Email de acceso *</label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="input"
                    placeholder="admin@miveterinaria.com"
                    required
                  />
                </div>

                <div>
                  <label className="label">Contraseña *</label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="label">Cédula profesional</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="input"
                    placeholder="Número de cédula"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
