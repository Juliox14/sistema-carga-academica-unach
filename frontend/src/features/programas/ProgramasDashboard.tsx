import { useState, useEffect } from 'react';
import type { ProgramaEducativo } from "../../types/programas";
import { programasService } from "../../services/programas.service";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import ProgramaFormSlideOver from "../../components/programas/ProgramaFormSlideOver";
import { ConfirmAlert } from "../../components/ui/ConfirmAlert";

export default function ProgramasDashboard() {
  const [programas, setProgramas] = useState<ProgramaEducativo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<ProgramaEducativo | null>(null);

  useEffect(() => {
    cargarProgramas();
  }, []);

  const cargarProgramas = async () => {
    try {
      setIsLoading(true);
      const data: any = await programasService.obtenerTodos();
      setProgramas(data);
    } catch (error) {
      console.error("Error al cargar programas:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setProgramaToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!programaToDelete) return;

    try {
      setIsDeleting(true);
      await programasService.eliminar(programaToDelete);
      await cargarProgramas(); // Recargamos la tabla
      setDeleteAlertOpen(false); // Cerramos el modal
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el programa. Es posible que tenga planes de estudio asociados.");
    } finally {
      setIsDeleting(false);
      setProgramaToDelete(null); // Limpiamos el ID
    }
  };

  const openForm = (programa: ProgramaEducativo | null = null) => {
    setEditingPrograma(programa);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingPrograma(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Programas Educativos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las licenciaturas, maestrías y posgrados de la facultad.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nuevo Programa
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar programa..." className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" />
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
              <th className="py-3 px-4 font-semibold">Clave</th>
              <th className="py-3 px-4 font-semibold">Nombre del Programa</th>
              <th className="py-3 px-4 font-semibold text-center">Estado</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programas.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">No hay programas registrados.</td>
              </tr>
            ) : (
              programas.map((prog) => (
                <tr key={prog.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 font-bold text-gray-700">{prog.clave}</td>
                  <td className="py-3 px-4 font-medium text-[#002d55]">{prog.nombre}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-sm border ${prog.activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {prog.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(prog)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    {/* Al dar clic al basurero, llamamos a handleDelete con el ID */}
                    <button
                      onClick={() => requestDelete(prog.id)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Instanciamos nuestro nuevo Componente Formulario */}
      <ProgramaFormSlideOver
        isOpen={isSlideOverOpen}
        programa={editingPrograma}
        onClose={closeForm}
        onSuccess={cargarProgramas}
      />
      {/* Instanciamos nuestro nuevo Componente de Confirmación */}
      <ConfirmAlert
        isOpen={isDeleteAlertOpen}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que deseas eliminar este programa educativo? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteAlertOpen(false);
          setProgramaToDelete(null);
        }}
        isLoading={isDeleting}
      />

    </div>
  );
}