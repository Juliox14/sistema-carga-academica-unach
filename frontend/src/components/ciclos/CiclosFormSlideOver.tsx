import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../../components/ui/Form';
import type { SyntheticEvent } from 'react';
import type { CicloEscolar } from '../../types/ciclos';
import { ciclosService } from '../../services/ciclos.service';

interface CicloFormProps {
  isOpen: boolean;
  ciclo: CicloEscolar | null;
  onClose: () => void;
  onSuccess: () => void;
}

const mesesOptions = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export default function CicloFormSlideOver({ isOpen, ciclo, onClose, onSuccess }: CicloFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen && formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Parseamos a Number los campos cronológicos
    const datos = {
      nombre: formData.get('nombre') as string,
      mes_inicio: Number(formData.get('mes_inicio')),
      mes_final: Number(formData.get('mes_final')),
      anio: Number(formData.get('anio')),
      activo: formData.get('activo') === 'true',
    };

    try {
      setIsSaving(true);
      if (ciclo?.id) {
        await ciclosService.actualizar(ciclo.id, datos);
      } else {
        await ciclosService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el ciclo escolar.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-[#002d55] flex items-center gap-2">
            <Calendar size={20} />
            {ciclo ? 'Editar Ciclo' : 'Registrar Ciclo'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={ciclo?.id || 'nuevo'} className="space-y-5">
            <FlatInput 
              name="nombre" 
              label="Nombre del Periodo Escolar (Visible)" 
              defaultValue={ciclo?.nombre} 
              placeholder="Ej. AGOSTO - DICIEMBRE 2026" 
              className="uppercase" 
              required 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FlatSelect 
                name="mes_inicio" 
                label="Mes de Inicio" 
                defaultValue={ciclo ? String(ciclo.mes_inicio) : '8'} 
                options={mesesOptions} 
              />
              <FlatSelect 
                name="mes_final" 
                label="Mes Final" 
                defaultValue={ciclo ? String(ciclo.mes_final) : '12'} 
                options={mesesOptions} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FlatInput 
                name="anio" 
                label="Año" 
                type="number"
                min="2000"
                max="2100"
                defaultValue={ciclo ? String(ciclo.anio) : String(currentYear)} 
                required 
              />
              <FlatSelect 
                name="activo" 
                label="Estado del Ciclo" 
                defaultValue={ciclo ? (ciclo.activo ? 'true' : 'false') : 'true'} 
                options={[
                  { value: 'true', label: 'Activo' }, 
                  { value: 'false', label: 'Histórico' }
                ]} 
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Ciclo'}
          </button>
        </div>
      </form>
    </>
  );
}