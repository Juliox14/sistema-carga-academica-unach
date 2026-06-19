import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import type { CicloEscolar } from '../../types/ciclos';

import CicloFormSlideOver from '../../components/ciclos/CiclosFormSlideOver';
import { ciclosService } from '../../services/ciclos.service';

export default function CiclosDashboard() {
  const [ciclos, setCiclos] = useState<CicloEscolar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<CicloEscolar | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [cicloToDelete, setCicloToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await ciclosService.obtenerTodos();
      setCiclos(data);
    } catch (error) {
      console.error("Error al cargar ciclos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setCicloToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!cicloToDelete) return;
    try {
      setIsDeleting(true);
      await ciclosService.eliminar(cicloToDelete);
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el ciclo. Es probable que ya tenga cargas académicas registradas.");
    } finally {
      setIsDeleting(false);
      setCicloToDelete(null);
    }
  };

  const openForm = (ciclo: CicloEscolar | null = null) => {
    setEditingCiclo(ciclo);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingCiclo(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Ciclos Escolares</h1>
          <p className="text-sm text-gray-500 mt-1">Administra los periodos de clases (semestres/cuatrimestres) de la institución.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nuevo Ciclo
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre..." className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" />
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
              <th className="py-3 px-4 font-semibold w-2/5">Periodo Escolar</th>
              <th className="py-3 px-4 font-semibold text-center">Año</th>
              <th className="py-3 px-4 font-semibold text-center">Estado</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ciclos.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">No hay ciclos escolares registrados.</td>
              </tr>
            ) : (
              ciclos.map((ciclo) => (
                <tr key={ciclo.id} className={`hover:bg-blue-50/50 transition-colors group ${ciclo.activo ? 'bg-blue-50/20' : ''}`}>
                  <td className="py-3 px-4 font-bold text-[#002d55]">{ciclo.nombre}</td>
                  <td className="py-3 px-4 text-center font-medium text-gray-600">{ciclo.anio}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-sm border ${ciclo.activo ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {ciclo.activo ? 'Activo (Actual)' : 'Histórico'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(ciclo)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(ciclo.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CicloFormSlideOver
        isOpen={isSlideOverOpen}
        ciclo={editingCiclo}
        onClose={closeForm}
        onSuccess={cargarDatos}
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Ciclo Escolar"
        message="¿Estás seguro de que deseas eliminar este ciclo? Todas las aperturas de grupos y asignaciones vinculadas se verán afectadas."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}