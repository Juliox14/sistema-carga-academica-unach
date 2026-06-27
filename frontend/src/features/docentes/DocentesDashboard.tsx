import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import type { Docente } from '../../types/docentes';
import type { CategoriaDocente } from '../../types/categorias';
import type { AreaConocimiento } from '../../types/areas';

import { docentesService } from '../../services/docentes.service';
import { categoriasService } from '../../services/categorias.service';
import { areasService } from '../../services/areas.service';

import DocenteFormSlideOver from './components/DocentesFormSlideOver';


export default function DocentesDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
  if (userRole !== 'SECRETARIA_ACADEMICA') return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDocente[]>([]);
  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [docenteToDelete, setDocenteToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [docentesData, categoriasData, areasData] = await Promise.all([
        docentesService.obtenerTodos(),
        categoriasService.obtenerTodos(),
        areasService.obtenerTodos()
      ]);
      setDocentes(docentesData);
      setCategorias(categoriasData);
      setAreas(areasData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setDocenteToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!docenteToDelete) return;
    try {
      setIsDeleting(true);
      await docentesService.eliminar(docenteToDelete);
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el docente. Verifique dependencias.");
    } finally {
      setIsDeleting(false);
      setDocenteToDelete(null);
    }
  };

  const openForm = (docente: Docente | null = null) => {
    setEditingDocente(docente);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingDocente(null), 300);
  };

  const getNombreCategoria = (id: number) => {
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.siglas : 'N/A';
  };

  // Convertimos las categorías para el select del formulario
  const categoriasOptions = categorias.map(cat => ({
    value: String(cat.id),
    label: `${cat.siglas} - ${cat.nombre}`
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Plantilla Docente</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de profesores, plazas y áreas de conocimiento.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nuevo Docente
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o plaza..." className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" />
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
              <th className="py-3 px-4 font-semibold">Plaza</th>
              <th className="py-3 px-4 font-semibold">Nombre Completo</th>
              <th className="py-3 px-4 font-semibold">Categoría</th>
              <th className="py-3 px-4 font-semibold">Áreas</th>
              <th className="py-3 px-4 font-semibold text-center">Estatus</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docentes.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">No hay docentes registrados.</td>
              </tr>
            ) : (
              docentes.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 font-bold text-gray-700">{doc.plaza}</td>
                  <td className="py-3 px-4 font-medium text-[#002d55]">{doc.apellidos} {doc.nombre}</td>
                  <td className="py-3 px-4 text-gray-600">{getNombreCategoria(doc.categoria_id)}</td>
                  
                  {/* Pintamos las áreas como etiquetas pequeñas */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.areas_conocimiento && doc.areas_conocimiento.length > 0 ? (
                        doc.areas_conocimiento.map(a => (
                          <span key={a.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                            {a.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin áreas</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${
                      doc.estatus === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-200' : 
                      doc.estatus === 'SABATICO' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {doc.estatus}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(doc)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(doc.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DocenteFormSlideOver 
        isOpen={isSlideOverOpen} 
        docente={editingDocente} 
        categoriasOptions={categoriasOptions}
        areasDisponibles={areas}
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Docente"
        message="¿Estás seguro de que deseas eliminar este registro? Perderá todo su historial académico."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}