import { AlertTriangle, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmAlertProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  color?: 'red' | 'blue';
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmAlert({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading = false,
  color = 'red',
  confirmText,
  cancelText = 'Cancelar'
}: ConfirmAlertProps) {
  if (!isOpen) return null;

  const isBlue = color === 'blue';
  const iconColorClass = isBlue ? 'text-[#002d55]' : 'text-red-600';
  const iconBgClass = isBlue ? 'bg-blue-50' : 'bg-red-50';
  const confirmBtnClass = isBlue
    ? 'px-6 py-2 bg-[#002d55] text-white text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 cursor-pointer'
    : 'px-6 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 cursor-pointer';

  const resolvedConfirmText = confirmText || (isLoading ? (isBlue ? 'Procesando...' : 'Eliminando...') : (isBlue ? 'Aceptar' : 'Sí, eliminar'));

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
        onClick={!isLoading ? onCancel : undefined} 
      />
      
      {/* Caja del Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white w-full max-w-md shadow-2xl pointer-events-auto transform transition-all flex flex-col">
          
          {/* Cabecera */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100">
            <div className={`flex items-center gap-3 ${iconColorClass}`}>
              <div className={`${iconBgClass} p-2 rounded-full`}>
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button 
              onClick={onCancel} 
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cuerpo */}
          <div className="p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Pie / Botones */}
          <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={confirmBtnClass}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              <span>{resolvedConfirmText}</span>
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}