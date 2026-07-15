import { useEffect, useState } from 'react';
import { useAsignacionStore } from '../store/useAsignacionStore';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { Clock, Eye, EyeOff, Lock, Unlock, Loader2 } from 'lucide-react';
import { ConfirmAlert } from '../../../components/ui/ConfirmAlert';
import { asignacionesService } from '../../../services/asignaciones.service';
import CoverageCardsGrid from './CoverageCardsGrid';
import IncompleteLoadPanel from './IncompleteLoadPanel';
import VacanciesLoadPanel from './VacanciesLoadPanel';

export default function AcademicLoadSummary() {
  const { 
    resumenCarga, 
    fetchResumenCarga, 
    setDocente, 
    docenteSeleccionadoId,
    selectedCategoriaId,
    categoriasDocentes,
    setSelectedCategoriaId,
    cicloActivo,
    finalizarCargaAcademica,
    desfinalizarCargaAcademica
  } = useAsignacionStore();

  const { user } = useAuthStore();

  const [isPanelVisible, setIsPanelVisible] = useState(() => {
    const saved = localStorage.getItem('sipad_load_summary_visible');
    return saved !== 'false';
  });

  // Estados de Vacantes
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [isLoadingVacantes, setIsLoadingVacantes] = useState(false);

  // Estados de Confirmación para Finalizar
  const [isFinalizeAlertOpen, setIsFinalizeAlertOpen] = useState(false);
  const [finalizeMessage, setFinalizeMessage] = useState('');
  const [isCheckingVacancies, setIsCheckingVacancies] = useState(false);

  const cargarVacantes = async () => {
    setIsLoadingVacantes(true);
    try {
      const data = await asignacionesService.obtenerVacantes();
      setVacantes(data || []);
    } catch (error) {
      console.error('Error al cargar vacantes:', error);
    } finally {
      setIsLoadingVacantes(false);
    }
  };

  useEffect(() => {
    fetchResumenCarga();
  }, [fetchResumenCarga]);

  useEffect(() => {
    cargarVacantes();
  }, [cicloActivo?.carga_finalizada]);

  const toggleVisibility = () => {
    const nextState = !isPanelVisible;
    setIsPanelVisible(nextState);
    localStorage.setItem('sipad_load_summary_visible', String(nextState));
  };

  const handleFinalizeClick = async () => {
    setIsCheckingVacancies(true);
    try {
      const data = await asignacionesService.obtenerVacantes();
      if (data && data.length > 0) {
        setFinalizeMessage(`Aún quedan ${data.length} materias/grupos sin asignar. Si finaliza la carga académica ahora, estas materias quedarán guardadas automáticamente como VACANTES para el ciclo actual. ¿Desea proceder?`);
      } else {
        setFinalizeMessage('¿Estás seguro de que deseas finalizar la carga académica? No se podrán realizar más asignaciones a menos que se reabra la carga.');
      }
      setIsFinalizeAlertOpen(true);
    } catch (error) {
      console.error('Error al verificar vacantes:', error);
      setFinalizeMessage('¿Estás seguro de que deseas finalizar la carga académica?');
      setIsFinalizeAlertOpen(true);
    } finally {
      setIsCheckingVacancies(false);
    }
  };

  const handleConfirmFinalize = async () => {
    setIsFinalizeAlertOpen(false);
    await finalizarCargaAcademica();
  };

  if (!resumenCarga) {
    return (
      <div className="bg-white p-6 border border-gray-200 shadow-sm animate-pulse flex flex-col gap-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const { cobertura, docentes_incompletos } = resumenCarga;

  // Encontrar siglas de la categoría seleccionada
  const selectedCatObj = categoriasDocentes.find(c => c.id === selectedCategoriaId);
  const selectedSiglas = selectedCatObj ? selectedCatObj.siglas : '';

  const filteredIncompletos = selectedSiglas
    ? docentes_incompletos.filter(doc => doc.siglas === selectedSiglas)
    : docentes_incompletos;

  return (
    <section className="space-y-4">
      <div className="w-full flex justify-end">
        {/* Botón Finalizar Carga Académica */}
        {(user?.rol === 'SECRETARIA_ACADEMICA' || user?.rol === 'SUPER_ADMIN') && (
          cicloActivo?.carga_finalizada ? (
            <button
              onClick={desfinalizarCargaAcademica}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-sm text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Unlock size={14} /> Reabrir Carga
            </button>
          ) : (
            <button
              onClick={handleFinalizeClick}
              disabled={isCheckingVacancies}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-sm text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {isCheckingVacancies ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>Finalizar Carga</span>
            </button>
          )
        )}
      </div>

      {/* Barra de cabecera con botón de Ocultar/Mostrar */}
      <div className="flex justify-between items-center bg-white border border-gray-200 px-5 py-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#002d55]" />
          <h2 className="text-sm font-bold text-gray-800">
            Resumen de Cobertura y Carga Docente
            {selectedSiglas && (
              <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                Filtrado por: {selectedSiglas}
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={toggleVisibility}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#002d55] transition-colors focus:outline-none px-2.5 py-1.5 rounded hover:bg-gray-100 cursor-pointer"
        >
          {isPanelVisible ? (
            <>
              <EyeOff size={14} />
              <span>Ocultar Panel</span>
            </>
          ) : (
            <>
              <Eye size={14} />
              <span>Mostrar Resumen ({filteredIncompletos.length} incompletos)</span>
            </>
          )}
        </button>
      </div>

      {isPanelVisible && (
        <div className="space-y-4 transition-all duration-300">
          {/* 1. Grid de tarjetas de cobertura */}
          <CoverageCardsGrid 
            cobertura={cobertura}
            selectedSiglas={selectedSiglas}
            docenteSeleccionadoId={docenteSeleccionadoId}
            setDocente={setDocente}
          />

          {/* 2. Cargas Incompletas Accordion */}
          <IncompleteLoadPanel 
            incompletos={docentes_incompletos}
            selectedSiglas={selectedSiglas}
            docenteSeleccionadoId={docenteSeleccionadoId}
            setDocente={setDocente}
            setSelectedCategoriaId={setSelectedCategoriaId}
          />

          {/* 3. Vacantes Disponibles Accordion */}
          <VacanciesLoadPanel 
            vacantes={vacantes}
            isLoadingVacantes={isLoadingVacantes}
            onOpen={cargarVacantes}
          />
        </div>
      )}

      <ConfirmAlert
        isOpen={isFinalizeAlertOpen}
        title="Finalizar Carga Académica"
        message={finalizeMessage}
        onConfirm={handleConfirmFinalize}
        onCancel={() => setIsFinalizeAlertOpen(false)}
        color="blue"
        confirmText="Sí, Finalizar"
        cancelText="Cancelar"
      />
    </section>
  );
}
