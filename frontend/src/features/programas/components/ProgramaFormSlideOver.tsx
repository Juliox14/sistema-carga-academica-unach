import { useState, useEffect, useRef } from 'react';
import { X, Building2, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../../../components/ui/Form';
import type { SyntheticEvent } from 'react';

import { programasService } from '../../../services/programas.service';
import type { ProgramaEducativo } from '../../../types/programas';

interface ProgramaFormProps {
  isOpen: boolean;
  programa: ProgramaEducativo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProgramaFormSlideOver({ isOpen, programa, onClose, onSuccess }: ProgramaFormProps) {
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
    const datos = {
      clave: formData.get('clave') as string,
      nombre: formData.get('nombre') as string,
      activo: formData.get('activo') === 'true',
    };

    try {
      setIsSaving(true);
      if (programa?.id) {
        // Ejecutamos el PUT
        await programasService.actualizar(programa.id, datos);
      } else {
        // Ejecutamos el POST
        await programasService.crear(datos);
      }
      onSuccess(); // Le avisamos al padre que terminó con éxito
      onClose();   // Cerramos el panel
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el programa educativo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Fondo oscuro */}
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>}
      
      {/* Panel Formulario */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`fixed top-0 right-0 h-full w-100 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-[#002d55] flex items-center gap-2">
            <Building2 size={20} />
            {programa ? 'Editar Programa' : 'Registrar Programa'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800"><X size={20} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Usamos key={programa?.id} para forzar a React a resetear el formulario cuando cambias de registro */}
          <div key={programa?.id || 'nuevo'} className="space-y-5">
            <FlatInput name="clave" label="Clave Institucional" defaultValue={programa?.clave} placeholder="Ej. LSC" className="uppercase" required />
            <FlatInput name="nombre" label="Nombre del Programa Educativo" defaultValue={programa?.nombre} placeholder="Ej. LICENCIATURA EN SISTEMAS..." className="uppercase" required />
            <FlatSelect name="activo" label="Estado del Programa" defaultValue={programa ? (programa.activo ? 'true' : 'false') : 'true'} options={[{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]} />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 disabled:opacity-70 cursor-pointer">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Programa'}
          </button>
        </div>
      </form>
    </>
  );
}