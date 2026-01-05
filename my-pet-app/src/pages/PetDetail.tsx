import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Syringe, Stethoscope, FileText, 
  Calendar, Weight, Dna, Heart, Loader2 
} from 'lucide-react';
import { petsApi, medicalApi, vaccinesApi, reportsApi } from '../lib/api';
import { getSpeciesEmoji, formatDate, calculateAge, downloadBlob } from '../lib/utils';

export default function PetDetail() {
  const { petId } = useParams<{ petId: string }>();

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => petsApi.getPetDetail(petId!).then((res) => res.data.data),
    enabled: !!petId,
  });

  const { data: medicalRecords } = useQuery({
    queryKey: ['medical-records', petId],
    queryFn: () => medicalApi.getMyRecords(petId).then((res) => res.data.data),
    enabled: !!petId,
  });

  const { data: vaccines } = useQuery({
    queryKey: ['vaccines', petId],
    queryFn: () => vaccinesApi.getMyVaccines(petId).then((res) => res.data.data),
    enabled: !!petId,
  });

  const handleDownloadCard = async () => {
    try {
      const response = await reportsApi.downloadPetCard(petId!);
      downloadBlob(response.data, `tarjeta-${pet?.name}.pdf`);
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await reportsApi.downloadMedicalReport(petId!);
      downloadBlob(response.data, `expediente-${pet?.name}.pdf`);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-gray-500">Mascota no encontrada</p>
        <Link to="/pets" className="mt-4 text-primary-600 font-medium">
          Volver a mis mascotas
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 pt-12 pb-20">
        <Link to="/pets" className="inline-flex items-center text-white/80 hover:text-white mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Mis Mascotas
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl overflow-hidden">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              getSpeciesEmoji(pet.species)
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{pet.name}</h1>
            <p className="text-primary-200">{pet.breed || pet.species}</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-6 pb-6">
        {/* Quick Info Card */}
        <div className="card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {pet.birth_date && (
              <div>
                <Calendar className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">{calculateAge(pet.birth_date)}</p>
                <p className="text-xs text-gray-500">Edad</p>
              </div>
            )}
            {pet.weight && (
              <div>
                <Weight className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">{pet.weight} kg</p>
                <p className="text-xs text-gray-500">Peso</p>
              </div>
            )}
            {pet.gender && (
              <div>
                <Heart className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">
                  {pet.gender === 'male' ? 'Macho' : 'Hembra'}
                </p>
                <p className="text-xs text-gray-500">Género</p>
              </div>
            )}
          </div>

          {/* Additional info */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {pet.microchip_number && (
              <div className="flex items-center gap-3 text-sm">
                <Dna className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Microchip:</span>
                <span className="font-medium">{pet.microchip_number}</span>
              </div>
            )}
            {pet.passport_number && (
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Pasaporte:</span>
                <span className="font-medium">{pet.passport_number}</span>
              </div>
            )}
            {pet.is_neutered !== undefined && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">Esterilizado:</span>
                <span className="font-medium">{pet.is_neutered ? 'Sí' : 'No'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Download buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleDownloadCard} className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            Tarjeta
          </button>
          <button onClick={handleDownloadReport} className="btn-primary text-sm">
            <FileText className="w-4 h-4" />
            Expediente PDF
          </button>
        </div>

        {/* Vaccines */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Syringe className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Vacunas</h2>
          </div>

          {!vaccines?.length ? (
            <p className="text-gray-500 text-sm">Sin vacunas registradas</p>
          ) : (
            <div className="space-y-3">
              {vaccines.slice(0, 5).map((vaccine: any) => (
                <div key={vaccine.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{vaccine.vaccine_name}</p>
                    <p className="text-xs text-gray-500">{vaccine.veterinary_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatDate(vaccine.application_date)}</p>
                    {vaccine.next_dose_date && (
                      <p className="text-xs text-amber-600">
                        Próxima: {formatDate(vaccine.next_dose_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Medical Records */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Historial Médico</h2>
          </div>

          {!medicalRecords?.length ? (
            <p className="text-gray-500 text-sm">Sin registros médicos</p>
          ) : (
            <div className="space-y-4">
              {medicalRecords.slice(0, 5).map((record: any) => (
                <div key={record.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(record.visit_date)}
                    </p>
                    <span className="text-xs text-gray-500">{record.veterinary_name}</span>
                  </div>
                  {record.reason && (
                    <p className="text-sm text-gray-600"><strong>Motivo:</strong> {record.reason}</p>
                  )}
                  {record.diagnosis && (
                    <p className="text-sm text-gray-600"><strong>Diagnóstico:</strong> {record.diagnosis}</p>
                  )}
                  {record.treatment && (
                    <p className="text-sm text-gray-600"><strong>Tratamiento:</strong> {record.treatment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
