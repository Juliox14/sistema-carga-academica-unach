import { useEffect, useState, useRef, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { asignacionesService } from '../../../services/asignaciones.service';
import type { PlanEstudio, DocenteFiltrado } from '../../../types/asignaciones';
import { useAsignacionStore } from '../store/useAsignacionStore';

export default function AssignmentHeader() {
  const {
    docenteSeleccionadoId,
    nombreDocente,
    setDocente,
    setPlanEstudio,
    setActividadesDisponibles,
    selectedCategoriaId,
    setSelectedCategoriaId,
    categoriasDocentes,
    setCategoriasDocentes,
  } = useAsignacionStore();


  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [docentes, setDocentes] = useState<DocenteFiltrado[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<number | ''>('');
  const [selectedDocente, setSelectedDocente] = useState<number | ''>('');
  const [soloPrioritarios, setSoloPrioritarios] = useState(false);

  // Sincronizar selección de docente externa
  useEffect(() => {
    if (docenteSeleccionadoId !== null) {
      setSelectedDocente(docenteSeleccionadoId);
    } else {
      setSelectedDocente('');
    }
  }, [docenteSeleccionadoId]);

  // Estados para el Custom Select tipo SIPAD
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Cargar los catálogos base al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const data = await asignacionesService.obtenerCatalogosBase();
        setPlanes(data.planes_estudio || []);
        setCategoriasDocentes(data.categorias_docentes || []);
        setActividadesDisponibles(data.actividades || []);
      } catch (error) {
        console.error('Error al cargar catálogos base:', error);
      }
    };
    cargarCatalogos();
  }, [setActividadesDisponibles, setCategoriasDocentes]);

  // 2. Traer docentes del backend SOLO cuando cambia la categoría
  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        const data = await asignacionesService.obtenerDocentesFiltrados(selectedCategoriaId, "");
        setDocentes(data || []);

        if (selectedDocente !== '' && !data.some(d => d.id === selectedDocente)) {
          setSelectedDocente('');
        }
      } catch (error) {
        console.error('Error al cargar docentes por categoría:', error);
      }
    };
    cargarDocentes();
  }, [selectedCategoriaId, selectedDocente]);

  // 3. Cierra el menú desplegable si hacen clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Filtrado local ultra-rápido por texto y prioridad
  const filteredDocentes = useMemo(() => {
    let list = docentes;
    if (soloPrioritarios) {
      list = list.filter(d => d.es_prioritario);
    }
    if (!searchQuery) return list;
    return list.filter(d =>
      d.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [docentes, searchQuery, soloPrioritarios]);

  return (
    <section className="bg-white p-5 border w-full border-gray-200 flex flex-wrap gap-6 items-center justify-between shadow-sm">
      <div className="flex flex-wrap items-center gap-6">

        {/* Selector de Plan de Estudios */}
        <div className="relative group">
          <select
            value={selectedPlan}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedPlan(val === '' ? '' : Number(val));
              if (val !== '') setPlanEstudio(Number(val));
            }}
            className="border-b-2 border-gray-300 bg-transparent py-1 pr-8 focus:outline-none focus:border-[#002d55] text-sm text-gray-700 font-medium cursor-pointer appearance-none min-w-37.5"
          >
            <option value="" disabled>Seleccione un Plan...</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtros de Categoría */}
        <div className="flex flex-wrap gap-5 text-sm border-l border-gray-300 pl-6 text-gray-600">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors">
            <input
              type="radio"
              name="categoria_docente"
              checked={selectedCategoriaId === ''}
              onChange={() => setSelectedCategoriaId('')}
              className="accent-[#002d55]"
            /> Todos
          </label>

          {categoriasDocentes.map((cat) => (
            <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors" title={cat.nombre}>
              <input
                type="radio"
                name="categoria_docente"
                checked={selectedCategoriaId === cat.id}
                onChange={() => setSelectedCategoriaId(cat.id)}
                className="accent-[#002d55]"
              /> {cat.siglas}
            </label>
          ))}
        </div>

        {/* Filtro Solo Prioritarios */}
        <div className="flex items-center gap-1.5 text-sm border-l border-gray-300 pl-6 text-gray-600">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors font-medium">
            <input
              type="checkbox"
              checked={soloPrioritarios}
              onChange={(e) => setSoloPrioritarios(e.target.checked)}
              className="accent-[#002d55] h-4 w-4 rounded-sm border-gray-300"
            /> Solo Prioritarios
          </label>
        </div>
      </div>

      {/* --- CUSTOM SELECT TIPO SIPAD --- */}
      <div ref={dropdownRef} className="w-75 relative">

        {/* Botón que abre el menú (Se ve como un select) */}
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full border-b-2 border-[#002d55] px-3 py-2 text-sm font-semibold text-[#002d55] bg-teal-50/50 flex justify-between items-center cursor-pointer hover:bg-teal-50 transition-colors"
        >
          <span>
            {docenteSeleccionadoId && nombreDocente
              ? nombreDocente
              : 'Seleccione a un docente'}
          </span>
          {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {/* Menú Desplegable con Input Integrado */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-xl z-50 rounded-b-md overflow-hidden">

            {/* Input de Búsqueda */}
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar docente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Lista de Resultados Filtrados */}
            <ul className="max-h-60 overflow-y-auto">
              {filteredDocentes.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron resultados</li>
              ) : (
                filteredDocentes.map((docente) => (
                  <li
                    key={docente.id}
                    onClick={() => {
                      setSelectedDocente(docente.id);
                      setDocente(docente.id);
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${selectedDocente === docente.id
                      ? 'bg-[#007bff] text-white font-medium'
                      : 'text-gray-700 hover:bg-[#007bff] hover:text-white'
                      }`}
                  >
                    {docente.nombre_completo}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}