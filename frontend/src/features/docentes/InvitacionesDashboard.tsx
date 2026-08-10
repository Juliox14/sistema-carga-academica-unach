import { useState, useEffect } from 'react';
import { Send, Inbox, CheckCircle, XCircle, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { invitacionesService, type InvitacionDocente } from '../../services/invitaciones.service';

export default function InvitacionesDashboard() {
  const [tab, setTab] = useState<'recibidas' | 'enviadas'>('recibidas');
  const [recibidas, setRecibidas] = useState<InvitacionDocente[]>([]);
  const [enviadas, setEnviadas] = useState<InvitacionDocente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal para rechazar
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [recData, envData] = await Promise.all([
        invitacionesService.obtenerRecibidas(),
        invitacionesService.obtenerEnviadas()
      ]);
      setRecibidas(recData);
      setEnviadas(envData);
    } catch (err) {
      console.error("Error al cargar invitaciones:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAceptar = async (id: number) => {
    try {
      setIsActionLoading(true);
      await invitacionesService.aceptar(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al aceptar invitación");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmRechazar = async () => {
    if (!rejectingId) return;
    try {
      setIsActionLoading(true);
      await invitacionesService.rechazar(rejectingId, respuestaTexto || undefined);
      setRejectingId(null);
      setRespuestaTexto('');
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al rechazar invitación");
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderBadgeEstado = (estado: string) => {
    if (estado === 'ACEPTADA') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={12} /> Aceptada
        </span>
      );
    }
    if (estado === 'RECHAZADA') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={12} /> Rechazada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} /> Pendiente
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Invitaciones entre Unidades</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de solicitudes para compartir docentes en distintas sedes académicas.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-4">
        <button
          onClick={() => setTab('recibidas')}
          className={`pb-3 px-1 font-semibold text-sm flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            tab === 'recibidas'
              ? 'border-[#002d55] text-[#002d55]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox size={18} />
          Invitaciones Recibidas
          {recibidas.filter(r => r.estado === 'PENDIENTE').length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-bold">
              {recibidas.filter(r => r.estado === 'PENDIENTE').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('enviadas')}
          className={`pb-3 px-1 font-semibold text-sm flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            tab === 'enviadas'
              ? 'border-[#002d55] text-[#002d55]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Send size={18} />
          Invitaciones Enviadas
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={24} /> Cargando invitaciones...
          </div>
        ) : tab === 'recibidas' ? (
          /* TAB RECIBIDAS */
          recibidas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
              <Inbox size={48} className="mb-2 text-gray-300" />
              <p className="font-semibold text-gray-600">No hay invitaciones recibidas</p>
              <p className="text-xs text-gray-400 mt-1">Otras unidades no han enviado solicitudes a tu sede.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4">Docente</th>
                    <th className="py-3.5 px-4">Unidad Origen</th>
                    <th className="py-3.5 px-4">Ciclo</th>
                    <th className="py-3.5 px-4 text-center">Horas Propuestas</th>
                    <th className="py-3.5 px-4">Mensaje</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recibidas.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{inv.docente_nombre}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">{inv.unidad_origen_nombre}</td>
                      <td className="py-3.5 px-4">{inv.ciclo_escolar_nombre}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#002d55]">{inv.horas_propuestas} hrs</td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-500">
                        {inv.mensaje ? (
                          <span title={inv.mensaje} className="flex items-center gap-1">
                            <MessageSquare size={12} /> {inv.mensaje}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">{renderBadgeEstado(inv.estado)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {inv.estado === 'PENDIENTE' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleAceptar(inv.id)}
                              disabled={isActionLoading}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => setRejectingId(inv.id)}
                              disabled={isActionLoading}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* TAB ENVIADAS */
          enviadas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
              <Send size={48} className="mb-2 text-gray-300" />
              <p className="font-semibold text-gray-600">No has enviado invitaciones</p>
              <p className="text-xs text-gray-400 mt-1">Puedes invitar docentes a otras sedes desde el menú de la Plantilla Docente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4">Docente</th>
                    <th className="py-3.5 px-4">Unidad Destino</th>
                    <th className="py-3.5 px-4">Ciclo</th>
                    <th className="py-3.5 px-4 text-center">Horas Propuestas</th>
                    <th className="py-3.5 px-4">Mensaje / Respuesta</th>
                    <th className="py-3.5 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enviadas.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{inv.docente_nombre}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">{inv.unidad_destino_nombre}</td>
                      <td className="py-3.5 px-4">{inv.ciclo_escolar_nombre}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#002d55]">{inv.horas_propuestas} hrs</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {inv.respuesta ? (
                          <span className="text-red-600 font-semibold block">Motivo rechazo: {inv.respuesta}</span>
                        ) : inv.mensaje ? (
                          <span>{inv.mensaje}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">{renderBadgeEstado(inv.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal para rechazar invitación */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-[#002d55]">Rechazar Invitación</h3>
            <p className="text-xs text-gray-500">Por favor indica el motivo del rechazo (opcional):</p>
            
            <textarea
              rows={3}
              value={respuestaTexto}
              onChange={(e) => setRespuestaTexto(e.target.value)}
              placeholder="Ej. No se cuenta con disponibilidad presupuestal para este ciclo."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRechazar}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1"
              >
                {isActionLoading && <Loader2 className="animate-spin" size={14} />} Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
