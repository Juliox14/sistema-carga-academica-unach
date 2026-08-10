import { useState, useEffect } from 'react';
import { X, Send, Loader2, UserCheck } from 'lucide-react';
import type { Docente } from '../../../types/docentes';
import { unidadesService, type UnidadAcademica } from '../../../services/unidades.service';
import { ciclosService, type CicloEscolar } from '../../../services/ciclos.service';
import { invitacionesService } from '../../../services/invitaciones.service';
import { useAuthStore } from '../../auth/store/useAuthStore';

interface ModalEnviarInvitacionProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEnviarInvitacion({
  isOpen,
  docente,
  onClose,
  onSuccess
}: ModalEnviarInvitacionProps) {
  const { user } = useAuthStore();
  const [unidades, setUnidades] = useState<UnidadAcademica[]>([]);
  const [ciclos, setCiclos] = useState<CicloEscolar[]>([]);
  const [unidadDestinoId, setUnidadDestinoId] = useState<string>('');
  const [cicloId, setCicloId] = useState<string>('');
  const [horasPropuestas, setHorasPropuestas] = useState<string>('5');
  const [mensaje, setMensaje] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setMensaje('');
      setHorasPropuestas('5');
      
      Promise.all([
        unidadesService.obtenerTodas(),
        ciclosService.obtenerTodos()
      ]).then(([unidadesData, ciclosData]) => {
        // Filtrar la unidad del usuario actual (origen)
        const filteredUnidades = unidadesData.filter(u => u.id !== user?.unidad_academica_id);
        setUnidades(filteredUnidades);
        if (filteredUnidades.length > 0) setUnidadDestinoId(String(filteredUnidades[0].id));

        setCiclos(ciclosData);
        const activo = ciclosData.find(c => c.activo);
        if (activo) setCicloId(String(activo.id));
        else if (ciclosData.length > 0) setCicloId(String(ciclosData[0].id));
      }).catch(err => console.error("Error al cargar datos:", err));
    }
  }, [isOpen, user]);

  if (!isOpen || !docente) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadDestinoId || !cicloId || !horasPropuestas) {
      setErrorMsg("Completa todos los campos requeridos.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await invitacionesService.crearInvitacion({
        docente_id: docente.id!,
        unidad_destino_id: Number(unidadDestinoId),
        ciclo_escolar_id: Number(cicloId),
        horas_propuestas: Number(horasPropuestas),
        mensaje: mensaje || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "No se pudo enviar la invitación.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#002d55] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Send size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Invitar Docente a Otra Unidad</h2>
              <p className="text-xs text-blue-200">Solicitar asignación de horas en unidad secundaria</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Docente info banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#002d55] text-white rounded-full">
              <UserCheck size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Docente a compartir:</span>
              <p className="text-sm font-bold text-[#002d55]">{docente.apellidos} {docente.nombre}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Unidad Académica Destino *
            </label>
            <select
              value={unidadDestinoId}
              onChange={(e) => setUnidadDestinoId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-800"
              required
            >
              {unidades.map(u => (
                <option key={u.id} value={u.id}>{u.clave} - {u.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Ciclo Escolar *
              </label>
              <select
                value={cicloId}
                onChange={(e) => setCicloId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-800"
                required
              >
                {ciclos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.activo ? '(Activo)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Horas Propuestas *
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={horasPropuestas}
                onChange={(e) => setHorasPropuestas(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-800"
                placeholder="Ej. 10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Mensaje Opcional
            </label>
            <textarea
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Detalles sobre las asignaciones proyectadas o razón del préstamo..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-800"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#002d55] hover:bg-[#001f3b] rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Enviar Invitación
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
