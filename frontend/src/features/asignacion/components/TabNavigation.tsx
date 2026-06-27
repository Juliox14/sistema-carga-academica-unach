import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useAsignacionStore } from '../store/useAsignacionStore';

export default function TabNavigation() {
  const { activeTab, setActiveTab, isLoading } = useAsignacionStore();

  return (
    <div className="flex justify-between items-end border-b border-gray-300">
      <nav className="flex gap-8 text-sm font-medium">
        <button 
          onClick={() => setActiveTab('carga')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'carga' ? 'border-[#002d55] text-[#002d55]' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Carga Académica
        </button>
        <button 
          onClick={() => setActiveTab('descargas')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'descargas' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Descargas
        </button>
        <button 
          onClick={() => setActiveTab('otras')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'otras' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Otras Actividades
        </button>
      </nav>

      {/* INDICADOR DE ESTADO DE LA API (Guardado Automático) */}
      <div className="mb-2 flex items-center">
        {isLoading ? (
          <span className="px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200">
            <RefreshCw size={14} className="animate-spin" />
            Sincronizando...
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-2 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] transition-opacity duration-500">
            <CheckCircle2 size={14} />
            Guardado
          </span>
        )}
      </div>
    </div>
  );
}