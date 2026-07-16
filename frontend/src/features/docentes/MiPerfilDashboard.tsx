import { useState, useEffect } from 'react';
import type { SyntheticEvent } from 'react';
import { useAuthStore } from '../auth/store/useAuthStore';
import { FlatInput } from '../../components/ui/Form';
import { Loader2, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MiPerfilDashboard() {
  const { user, actualizarPadDocente } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(true);

  const docente = user?.docente;

  useEffect(() => {
    if (docente) {
      const isMissingInfo = !docente.rfc || !docente.curp || !docente.fecha_ingreso || !docente.perfil_academico || !docente.ultimo_grado_estudio;
      setIsComplete(!isMissingInfo);
    }
  }, [docente]);

  if (!docente) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden p-8 items-center justify-center">
        <User size={64} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">No hay información disponible</h2>
        <p className="text-gray-500 mt-2">No se encontró un perfil de docente vinculado a tu usuario.</p>
      </div>
    );
  }

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const datos = {
      rfc: (formData.get('rfc') as string) || undefined,
      curp: (formData.get('curp') as string) || undefined,
      fecha_ingreso: (formData.get('fecha_ingreso') as string) || undefined,
      perfil_academico: (formData.get('perfil_academico') as string) || undefined,
      ultimo_grado_estudio: (formData.get('ultimo_grado_estudio') as string) || undefined,
      telefono: (formData.get('telefono') as string) || undefined,
    };

    try {
      setIsSaving(true);
      await actualizarPadDocente(datos);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error('No se pudo actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#002d55]/10 flex items-center justify-center shrink-0">
            <User className="text-[#002d55]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002d55]">Mi Perfil</h1>
            <p className="text-sm text-gray-500 mt-1">Completa o actualiza tu información para los reportes de carga académica (PAD).</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {!isComplete && (
            <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 p-4 rounded-lg shadow-sm">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Información incompleta</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Tu perfil aún no está completo. Por favor, llena todos los campos en la sección "Información para PAD" para asegurar que los reportes de carga académica se generen correctamente.
                </p>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mb-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-lg shadow-sm">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-emerald-800">¡Perfil Completo!</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Toda tu información requerida para el PAD está completa y actualizada.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECCIÓN 1: DATOS INSTITUCIONALES (SOLO LECTURA) */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-[#002d55] mb-4">Datos Institucionales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre Completo</label>
                  <div className="text-gray-900 font-medium">{docente.apellidos} {docente.nombre}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Clave de Plaza</label>
                  <div className="text-gray-900 font-medium">{docente.plaza}</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">
                * Si requieres modificar tus datos institucionales, contacta a Secretaría Académica.
              </p>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN DE CONTACTO Y PAD */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-[#002d55] mb-4">Información para PAD y Contacto</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FlatInput 
                    name="correo_institucional" 
                    type="email" 
                    label="Correo Institucional" 
                    defaultValue={docente?.correo_institucional} 
                    placeholder="Ej. juan.perez@unach.mx" 
                    disabled={true}
                  />
                  <FlatInput 
                    name="telefono" 
                    label="Teléfono" 
                    defaultValue={docente?.telefono} 
                    placeholder="Ej. 961 123 4567" 
                  />
                </div>

                <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FlatInput
                    name="rfc"
                    label="RFC (13 caracteres)"
                    defaultValue={docente?.rfc}
                    placeholder="Ej. PELJ800101ABC"
                    className="uppercase"
                    maxLength={13}
                  />
                  <FlatInput
                    name="curp"
                    label="CURP (18 caracteres)"
                    defaultValue={docente?.curp}
                    placeholder="Ej. PELJ800101HCHRNN09"
                    className="uppercase"
                    maxLength={18}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FlatInput
                    name="fecha_ingreso"
                    type="date"
                    label="Fecha de Ingreso a la Institución"
                    defaultValue={docente?.fecha_ingreso ? (typeof docente.fecha_ingreso === 'string' ? docente.fecha_ingreso.split('T')[0] : docente.fecha_ingreso) : undefined}
                  />
                  <FlatInput
                    name="perfil_academico"
                    label="Perfil Académico"
                    defaultValue={docente?.perfil_academico}
                    placeholder="Ej. Ingeniería en Sistemas Computacionales"
                  />
                </div>
                
                <div className="grid grid-cols-1">
                  <FlatInput
                    name="ultimo_grado_estudio"
                    label="Último Grado de Estudio"
                    defaultValue={docente?.ultimo_grado_estudio}
                    placeholder="Ej. Maestría en Ciencias Computacionales"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isSaving} 
                className="px-8 py-3 bg-[#002d55] text-white text-sm font-bold rounded-lg hover:bg-[#001f3b] shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70 transition-colors"
              >
                {isSaving && <Loader2 size={18} className="animate-spin" />}
                {isSaving ? 'Guardando...' : 'Guardar Información'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
