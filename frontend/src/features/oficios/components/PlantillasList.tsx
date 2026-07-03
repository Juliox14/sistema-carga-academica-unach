import { CheckCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import type { Plantilla } from '../store/useOficiosStore';

interface PlantillasListProps {
  plantillas: Plantilla[];
  isLoading: boolean;
  onActivar: (id: number) => void;
  onEdit: (plantilla: Plantilla) => void;
  onEliminar: (id: number) => void;
}

export default function PlantillasList({ plantillas, isLoading, onActivar, onEdit, onEliminar }: PlantillasListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        Plantillas Existentes
      </h3>
      
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex justify-center">
          <Loader2 className="animate-spin text-[#002d55]" size={28} />
        </div>
      ) : (
        <div className="space-y-3">
          {plantillas.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-xs text-gray-400 font-semibold">
              No hay plantillas registradas. Crea una a la derecha.
            </div>
          ) : (
            plantillas.map(p => (
              <div 
                key={p.id} 
                className={`bg-white p-4 rounded-xl border transition-all ${
                  p.es_activa 
                    ? 'border-[#002d55] shadow-xs' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{p.nombre}</h4>
                    <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-[#002d55] border border-blue-200 mt-1.5">
                      Contrato: {p.tipo_contrato}
                    </span>
                  </div>
                  {p.es_activa ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                      <CheckCircle size={10} />
                      Activa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onActivar(p.id)}
                      className="px-2 py-1 bg-[#002d55] hover:bg-[#0038C3] text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Activar
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">
                    Firma: {p.requiere_firma ? 'SÍ' : 'NO'}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-md transition-colors cursor-pointer"
                      title="Editar plantilla"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(p.id)}
                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      title="Eliminar plantilla"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
