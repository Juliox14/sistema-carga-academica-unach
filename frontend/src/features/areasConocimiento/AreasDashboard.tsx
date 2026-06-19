import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import AreaFormSlideOver from '../../components/areasConocimiento/AreaFormSlideOver';
import { areasService } from '../../services/areas.service';

import type { AreaConocimiento } from '../../types/areas';

export default function AreasDashboard() {

  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del SlideOver
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaConocimiento | null>(null);

  // Estados del ConfirmAlert
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await areasService.obtenerTodos();
      setAreas(data);
    } catch (error) {
      console.error("Error al cargar áreas:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Eliminación
  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setAreaToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!areaToDelete) return;
    try {
      setIsDeleting(true);
      await areasService.eliminar(areaToDelete);
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el área. Verifique si está asignada a docentes actualmente.");
    } finally {
      setIsDeleting(false);
      setAreaToDelete(null);
    }
  };

  const openForm = (area: AreaConocimiento | null = null) => {
    setEditingArea(area);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingArea(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Áreas de Conocimiento</h1>
          <p className="text-sm text-gray-500 mt-1">Clasificación de disciplinas para agrupar docentes y materias.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nueva Área
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar área..." className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" />
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
              <th className="py-3 px-4 font-semibold w-1/3">Nombre del Área</th>
              <th className="py-3 px-4 font-semibold w-1/2">Descripción</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {areas.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400">No hay áreas de conocimiento registradas.</td>
              </tr>
            ) : (
              areas.map((area) => (
                <tr key={area.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 font-bold text-[#002d55]">{area.nombre}</td>
                  <td className="py-3 px-4 text-gray-600 italic">
                    {area.descripcion ? area.descripcion : <span className="text-gray-400">Sin descripción</span>}
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(area)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(area.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AreaFormSlideOver 
        isOpen={isSlideOverOpen} 
        area={editingArea} 
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Área de Conocimiento"
        message="¿Estás seguro de que deseas eliminar esta área? Podría afectar a los docentes que la tienen asignada en su perfil."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}