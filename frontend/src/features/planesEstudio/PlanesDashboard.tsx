import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';

import { planesEstudioService } from '../../services/planesEstudio.service';
import { programasService } from '../../services/programas.service';

import type { PlanEstudios } from '../../types/planesEstudio';
import type { ProgramaEducativo } from '../../types/programas';

import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import PlanFormSlideOver from '../../components/planesEstudio/PlanesFormSlideOver';

export default function PlanesDashboard() {
  const [planes, setPlanes] = useState<PlanEstudios[]>([]);
  const [programas, setProgramas] = useState<ProgramaEducativo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanEstudios | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [planesData, programasData] = await Promise.all([
        planesEstudioService.obtenerTodos(),
        programasService.obtenerTodos()
      ]);
      setPlanes(planesData as any);
      setProgramas(programasData as any);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const programasOptions = programas.map(prog => ({
    value: String(prog.id),
    label: `${prog.clave} - ${prog.nombre}`
  }));

  const getNombrePrograma = (id: number) => {
    const prog = programas.find(p => p.id === id);
    return prog ? prog.clave : 'Desconocido';
  };

  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setPlanToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      setIsDeleting(true);
      await planesEstudioService.eliminar(planToDelete);
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el plan. Verifique dependencias.");
    } finally {
      setIsDeleting(false);
      setPlanToDelete(null);
    }
  };

  const openForm = (plan: PlanEstudios | null = null) => {
    setEditingPlan(plan);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingPlan(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Planes de Estudio</h1>
          <p className="text-sm text-gray-500 mt-1">Estructuras curriculares dependientes de un programa educativo.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nuevo Plan
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar plan..." className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" />
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
              <th className="py-3 px-4 font-semibold">Plan de Estudios</th>
              <th className="py-3 px-4 font-semibold">Programa Padre</th>
              <th className="py-3 px-4 font-semibold text-center">Estatus</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {planes.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">No hay planes registrados.</td>
              </tr>
            ) : (
              planes.map((plan: PlanEstudios) => (
                <tr key={plan.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 font-bold text-[#002d55]">{plan.nombre}</td>
                  {/* Buscamos el nombre del programa en nuestro estado local */}
                  <td className="py-3 px-4 font-medium text-gray-600">{getNombrePrograma(plan.programa_educativo_id)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-sm border ${plan.vigente ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {plan.vigente ? 'Vigente' : 'En Liquidación'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(plan)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(plan.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanFormSlideOver 
        isOpen={isSlideOverOpen} 
        plan={editingPlan} 
        programasOptions={programasOptions}
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Plan de Estudios"
        message="¿Estás seguro de que deseas eliminar este plan? Se perderán todas las referencias curriculares asociadas a él."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}