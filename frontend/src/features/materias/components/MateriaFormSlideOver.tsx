// src/features/materias/MateriaFormSlideOver.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Library, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../../../components/ui/Form';
import type { SyntheticEvent } from 'react';
import { materiasService } from '../../../services/materias.service';
import { areasService } from '../../../services/areas.service';
import type { Materia } from '../../../types/materias';

interface MateriaFormProps {
  isOpen: boolean;
  materia: Materia | null;
  planesOptions: { value: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MateriaFormSlideOver({ isOpen, materia, planesOptions, onClose, onSuccess }: MateriaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [areasOptions, setAreasOptions] = useState<{ value: string; label: string }[]>([]);
  const [esEspecial, setEsEspecial] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Cargar áreas de conocimiento al abrir
  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const areasData = await areasService.obtenerTodos();
        setAreasOptions(areasData.map(a => ({
          value: String(a.id),
          label: a.nombre
        })));
      } catch (error) {
        console.error("Error al cargar áreas de conocimiento:", error);
      }
    };
    if (isOpen) {
      cargarAreas();
      if (materia) {
        setEsEspecial(!!materia.es_especial);
      } else {
        setEsEspecial(false);
      }
    }
  }, [isOpen, materia]);

  // Limpiar el formulario físicamente al cerrarse
  useEffect(() => {
    if (!isOpen && formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Convertimos los campos numéricos a Number() para evitar errores en FastAPI
    const datos = {
      nombre_asignatura: formData.get('nombre_asignatura') as string,
      numero_periodo: Number(formData.get('numero_periodo')),
      hsm: Number(formData.get('hsm')),
      plan_estudios_id: Number(formData.get('plan_estudios_id')),
      area_conocimiento_id: Number(formData.get('area_conocimiento_id')),
      es_especial: esEspecial,
    };

    try {
      setIsSaving(true);
      if (materia?.id) {
        await materiasService.actualizar(materia.id, datos);
      } else {
        await materiasService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar la materia.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`fixed top-0 right-0 h-full w-100 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-[#002d55] flex items-center gap-2">
            <Library size={20} />
            {materia ? 'Editar Materia' : 'Registrar Materia'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={materia?.id || 'nuevo'} className="space-y-5">
            <FlatSelect 
              name="plan_estudios_id" 
              label="Plan de Estudios" 
              defaultValue={materia ? String(materia.plan_estudios_id) : ''} 
              options={planesOptions} 
            />
            
            {/* Switch para Materia Especial */}
            <div className="flex items-center justify-between bg-amber-50 p-4 border border-amber-100 rounded-xl">
              <div>
                <h4 className="text-sm font-semibold text-amber-950">Materia Especial (Grupo Único)</h4>
                <p className="text-xs text-amber-700">Se abrirá un único grupo por periodo para todos los alumnos.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={esEspecial} 
                  onChange={(e) => setEsEspecial(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="flex gap-4">
              <FlatInput 
                name="nombre_asignatura" 
                label="Nombre de la Materia" 
                defaultValue={materia?.nombre_asignatura} 
                placeholder="Ej. Matemáticas Discretas" 
                className="uppercase w-full" 
                required 
              />
            </div>

            <FlatSelect 
              name="area_conocimiento_id" 
              label="Área de Conocimiento" 
              defaultValue={materia ? String(materia.area_conocimiento_id) : ''} 
              options={areasOptions} 
            />

            <div className="flex gap-4">
              <FlatInput 
                name="numero_periodo" 
                label="Periodo" 
                type="number"
                min="1"
                max="10"
                defaultValue={materia ? String(materia.numero_periodo) : ''} 
                required 
              />
              <FlatInput 
                name="hsm" 
                label="HSM (Horas)" 
                type="number"
                min="1"
                defaultValue={materia ? String(materia.hsm) : ''} 
                required 
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Materia'}
          </button>
        </div>
      </form>
    </>
  );
}