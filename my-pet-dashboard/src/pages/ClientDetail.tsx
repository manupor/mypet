import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ClientDetail() {
  const { clientId } = useParams();
  
  return (
    <div className="p-6">
      <Link to="/clients" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver a clientes
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Detalle del Cliente</h1>
      <p className="text-gray-500">ID: {clientId}</p>
      <p className="mt-4 text-gray-600">Implementación pendiente - Ver mascotas, historial, puntos de lealtad</p>
    </div>
  );
}
