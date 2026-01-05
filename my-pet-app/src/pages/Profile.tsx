import { useAuthStore } from '../store/authStore';
import { User, Mail, Phone, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Account Info */}
        <section className="card divide-y divide-gray-100">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
          
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-900">{user?.phone || 'No registrado'}</p>
            </div>
          </div>
        </section>

        {/* Menu Items */}
        <section className="card divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-900">Editar perfil</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-900">Notificaciones</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-900">Privacidad</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-900">Ayuda</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full btn bg-red-50 text-red-600 hover:bg-red-100"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>

        {/* Version */}
        <p className="text-center text-xs text-gray-400">
          My Pet v1.0.0
        </p>
      </div>
    </div>
  );
}
