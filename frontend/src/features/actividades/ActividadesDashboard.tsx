import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import type { OtraActividad } from '../../types/actividades';
import ActividadFormSlideOver from './components/ActividadesFormSlideOver';
import { actividadesService } from '../../services/actividades.service';

export default function ActividadesDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
  if (userRole !== 'SECRETARIA_ACADEMICA') return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;

  const [actividades, setActividades] = useState<OtraActividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<OtraActividad | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [actividadToDelete, setActividadToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await actividadesService.obtenerTodos();
      setActividades(data);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setActividadToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!actividadToDelete) return;
    try {
      setIsDeleting(true);
      await actividadesService.eliminar(actividadToDelete);
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar la actividad.");
    } finally {
      setIsDeleting(false);
      setActividadToDelete(null);
    }
  };

  const openForm = (actividad: OtraActividad | null = null) => {
    setEditingActividad(actividad);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingActividad(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Otras Actividades</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de actividades complementarias para carga horaria.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nueva Actividad
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar actividad..." className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto grow relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-[#002d55]" size={32} />
          </div>
        )}
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-3 px-4 font-semibold w-2/3">Actividad</th>
              <th className="py-3 px-4 font-semibold text-center">HSM</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {actividades.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400">No hay actividades registradas.</td>
              </tr>
            ) : (
              actividades.map((act) => (
                <tr key={act.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 font-bold text-[#002d55]">{act.nombre}</td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-600">{act.hsm} hrs</td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(act)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(act.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ActividadFormSlideOver isOpen={isSlideOverOpen} actividad={editingActividad} onClose={closeForm} onSuccess={cargarDatos} />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Actividad"
        message="¿Estás seguro de eliminar esta actividad complementaria?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}