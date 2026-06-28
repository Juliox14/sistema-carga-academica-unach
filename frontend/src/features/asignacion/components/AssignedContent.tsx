import { useState } from 'react';
import { X, ExternalLink, AlertTriangle, Inbox, Lock } from 'lucide-react';
import { useAsignacionStore } from '../store/useAsignacionStore';
import { Droppable } from '@hello-pangea/dnd';
import { useConfigStore } from '../../configuracion/store/useConfigStore';

export default function AssignedContent() {
  const {
    activeTab,
    cargaAsignada,
    descargas,
    otrasActividades,
    desvincularMateria,
    removerDescarga,
    eliminarOtraActividad,
    asignarDescarga,
    docenteSeleccionadoId
  } = useAsignacionStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asignacionALiberar, setAsignacionALiberar] = useState<number | null>(null);
  const [motivoDescarga, setMotivoDescarga] = useState('');

  const { configs } = useConfigStore();
  const motivoObligatorio = configs.DESCARGA_MOTIVO_OBLIGATORIO;

  if (!docenteSeleccionadoId) {
    return (
      <div className="bg-gray-50 border border-gray-200 flex flex-col h-full shadow-sm items-center justify-center p-8 text-center min-h-100">
        <div className="w-16 h-16 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mb-4 text-gray-400">
          <Lock size={28} />
        </div>
        <h3 className="text-gray-600 font-bold text-lg">Panel Bloqueado</h3>
        <p className="text-gray-500 text-sm mt-2 max-w-sm">
          Busca y selecciona a un docente en la barra superior para comenzar a asignarle carga académica o actividades.
        </p>
      </div>
    );
  }

  const handleOpenModal = (asignacionId: number) => {
    setAsignacionALiberar(asignacionId);
    setMotivoDescarga('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAsignacionALiberar(null);
    setMotivoDescarga('');
  };

  const handleConfirmarDescarga = async () => {
    if (!asignacionALiberar) return;

    if (configs.DESCARGA_MOTIVO_OBLIGATORIO && motivoDescarga.trim() === '') {
      return; 
    }

    const motivoFinal = motivoDescarga.trim() !== '' ? motivoDescarga.trim() : 'Sin motivo especificado';

    await asignarDescarga(asignacionALiberar, motivoFinal);
    handleCloseModal();
  };

  return (
    <div className="bg-white border border-gray-200 flex flex-col h-full shadow-sm relative">
      <div className={`px-4 py-3 border-b flex justify-between items-center ${activeTab === 'descargas' ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`font-bold text-sm uppercase tracking-wide ${activeTab === 'carga' ? 'text-[#002d55]' : activeTab === 'descargas' ? 'text-purple-800' : 'text-teal-700'}`}>
          {activeTab === 'carga' ? 'Carga Académica Asignada' : activeTab === 'descargas' ? 'Materias Descargadas' : 'Otras Actividades Asignadas'}
        </h3>
      </div>

      <div className="flex-1 flex flex-col min-h-100">
        {/* VISTA: CARGA ACADÉMICA */}
        {activeTab === 'carga' && (
          <Droppable droppableId="tablero-carga" type="materia">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
              >
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4 font-medium">Asignatura</th>
                      <th className="py-3 px-2 font-medium text-center">Grp</th>
                      <th className="py-3 px-2 font-medium text-center">HSM</th>
                      <th className="py-3 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cargaAsignada.map(m => (
                      <tr key={m.asignacion_id} className="group hover:bg-gray-50 bg-white">
                        <td className="py-3 px-4 text-[#002d55] font-semibold">
                          {m.asignatura}
                          {m.es_temporal && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">SUPLENCIA</span>}
                        </td>
                        <td className="py-3 px-2 text-gray-600 text-center font-bold">{m.grupo}</td>
                        <td className="py-3 px-2 text-gray-600 text-center font-bold">{m.hsm}</td>
                        <td className="py-3 px-4 flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(m.asignacion_id)}
                            className="text-xs text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={14} /> Liberar
                          </button>
                          <button
                            onClick={() => desvincularMateria(m.asignacion_id)}
                            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Desvincular materia"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {cargaAsignada.length === 0 && (
                  <div className={`flex-1 m-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-50 transition-colors ${snapshot.isDraggingOver ? 'border-blue-400 bg-blue-100/50 text-blue-600' : 'border-blue-200 text-blue-400 bg-blue-50/30'}`}>
                    <Inbox size={24} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">Suelta una materia aquí para asignarla</span>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* VISTA: DESCARGAS (No interactiva para Drag & Drop) */}
        {activeTab === 'descargas' && (
          <table className="w-full text-sm text-left border-collapse">
            {/* ... tu tabla de descargas sin cambios ... */}
            <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Asignatura</th>
                <th className="py-3 px-2 font-medium text-center">Grp</th>
                <th className="py-3 px-2 font-medium text-center">HSM</th>
                <th className="py-3 px-4 font-medium">Motivo</th>
                <th className="py-3 px-4 font-medium">Profesor que cubre</th>
                <th className="py-3 px-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {descargas.map(d => (
                <tr key={d.asignacion_id} className="hover:bg-purple-50/30">
                  <td className="py-3 px-4 text-purple-800 font-semibold">{d.asignatura}</td>
                  <td className="py-3 px-2 text-gray-600 text-center font-bold">{d.grupo}</td>
                  <td className="py-3 px-2 text-gray-600 text-center font-bold">{d.hsm}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{d.motivo_descarga}</td>
                  <td className="py-3 px-4">
                    {(d as any).profesor_cubre ? (
                      <span className="text-sm text-gray-700">{(d as any).profesor_cubre}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <AlertTriangle size={14} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => removerDescarga(d.asignacion_id)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                      title="Revertir descarga"
                    >
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* VISTA: OTRAS ACTIVIDADES */}
        {activeTab === 'otras' && (
          <Droppable droppableId="tablero-otras" type="actividad">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-teal-50/50' : ''}`}
              >
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4 font-medium">Actividad</th>
                      <th className="py-3 px-2 font-medium text-center">HSM</th>
                      <th className="py-3 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {otrasActividades.map(a => (
                      <tr key={a.asignacion_actividad_id} className="group hover:bg-gray-50 bg-white">
                        <td className="py-3 px-4 text-teal-800 font-semibold">{a.actividad}</td>
                        <td className="py-3 px-2 text-gray-600 text-center font-bold">{a.horas}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => eliminarOtraActividad(a.asignacion_actividad_id)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                            title="Eliminar actividad"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {otrasActividades.length === 0 && (
                  <div className={`flex-1 m-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-50 transition-colors ${snapshot.isDraggingOver ? 'border-teal-400 bg-teal-100/50 text-teal-600' : 'border-teal-200 text-teal-400 bg-teal-50/30'}`}>
                    <Inbox size={24} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">Suelta una actividad aquí</span>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>

      {/* --- MODAL PARA DESCARGAS --- */}
      {/* ... (Tu modal sigue igual, no interfiere con el DND) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-purple-50">
              <h3 className="text-lg font-bold text-purple-900">Motivo de Descarga</h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-3">
                Por favor, ingresa el motivo administrativo o académico por el cual esta materia será descargada del tablero del docente.
              </p>
              <textarea
                value={motivoDescarga}
                onChange={(e) => setMotivoDescarga(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-25"
                placeholder="Ej. Cambio a cargo directivo, licencia médica, comisión académica..."
                autoFocus
              ></textarea>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarDescarga}
                disabled={motivoObligatorio && motivoDescarga.trim() === ''}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                Confirmar Descarga
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}