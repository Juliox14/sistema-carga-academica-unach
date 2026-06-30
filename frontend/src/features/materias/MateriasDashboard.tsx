// src/features/materias/MateriasDashboard.tsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import type { Materia } from '../../types/materias';
import { planesEstudioService } from '../../services/planesEstudio.service';

import MateriaFormSlideOver from './components/MateriaFormSlideOver';
import { materiasService } from '../../services/materias.service';

export default function MateriasDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
  if (userRole !== 'SECRETARIA_ACADEMICA') return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;

  // Estados de datos
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [planes, setPlanes] = useState<{ id: number; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del SlideOver
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);

  // Estados del ConfirmAlert
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      // Peticiones paralelas para máxima velocidad
      const [materiasData, planesData] = await Promise.all([
        materiasService.obtenerTodos(),
        planesEstudioService.obtenerTodos()
      ]);
      setMaterias(materiasData);
      setPlanes(planesData as any);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Convertir planes para el <FlatSelect> del formulario
  const planesOptions = planes.map(plan => ({
    value: String(plan.id),
    label: plan.nombre
  }));

  // Helper para pintar el nombre del plan en la tabla
  const getNombrePlan = (id: number) => {
    const plan = planes.find(p => p.id === id);
    return plan ? plan.nombre : 'Desconocido';
  };

  // Lógica de Eliminación
  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setMateriaToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!materiaToDelete) return;
    try {
      setIsDeleting(true);
      await materiasService.eliminar(materiaToDelete);
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar la materia. Verifique si tiene dependencias asignadas.");
    } finally {
      setIsDeleting(false);
      setMateriaToDelete(null);
    }
  };

  const openForm = (materia: Materia | null = null) => {
    setEditingMateria(materia);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingMateria(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Unidades de Aprendizaje</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de materias y sus HSM correspondientes.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nueva Materia
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
              <th className="py-3 px-4 font-semibold">Materia</th>
              <th className="py-3 px-4 font-semibold text-center">Periodo</th>
              <th className="py-3 px-4 font-semibold text-center">HSM</th>
              <th className="py-3 px-4 font-semibold">Plan de Estudios</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materias.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">No hay materias registradas.</td>
              </tr>
            ) : (
              materias.map((materia) => (
                <tr key={materia.id} className="hover:bg-blue-50/50 transition-colors group">                  <td className="py-3 px-4 font-medium text-[#002d55]">{materia.nombre_asignatura}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{materia.numero_periodo}º</td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-700">{materia.hsm} hrs</td>
                  <td className="py-3 px-4 text-gray-600">{getNombrePlan(materia.plan_estudios_id)}</td>
                  
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(materia)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(materia.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MateriaFormSlideOver 
        isOpen={isSlideOverOpen} 
        materia={editingMateria} 
        planesOptions={planesOptions}
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Unidad de Aprendizaje"
        message="¿Estás seguro de que deseas eliminar esta materia? Al hacerlo, no podrás asignarla en futuros ciclos escolares."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}