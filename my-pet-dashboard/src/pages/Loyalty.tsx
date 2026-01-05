import { Gift } from 'lucide-react';

export default function Loyalty() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programa de Lealtad</h1>
        <p className="text-gray-500">Gestiona puntos y promociones de clientes</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración del Programa</h2>
            <p className="text-sm text-gray-500">Define los puntos por servicio y promociones</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Puntos por Servicio</h3>
            <p className="text-sm text-gray-600">
              Cada tipo de servicio otorga puntos configurables. Los puntos se acumulan automáticamente.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <h3 className="font-medium text-amber-800 mb-2">Promoción "N+1 Gratis"</h3>
            <p className="text-sm text-amber-700">
              Para servicios con umbral configurado (ej: baños), después de N servicios pagados, 
              el siguiente es gratis. El contador se reinicia automáticamente.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">Canje de Puntos</h3>
            <p className="text-sm text-green-700">
              Los clientes pueden canjear sus puntos acumulados por descuentos en servicios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
