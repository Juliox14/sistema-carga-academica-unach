interface BloqueDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  materiaNombre: string;
  pendingSelection: { dia: string; hora: number } | null;
  onSelectDuration: (duracion: number) => void;
}

export default function BloqueDurationModal({
  isOpen,
  onClose,
  materiaNombre,
  pendingSelection,
  onSelectDuration
}: BloqueDurationModalProps) {
  if (!isOpen || !pendingSelection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4 text-left">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Programar Clase</h3>
          <p className="text-sm font-bold text-gray-800 mt-1">{materiaNombre}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Seleccione la duración del bloque:</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelectDuration(1)}
            className="w-full py-2.5 bg-gray-50 border border-gray-200 hover:border-[#002d55] text-gray-700 font-semibold text-xs rounded-xl hover:bg-blue-50/25 transition-all text-center cursor-pointer"
          >
            1 Hora ({pendingSelection.hora}:00 - {pendingSelection.hora + 1}:00)
          </button>
          
          <button
            onClick={() => onSelectDuration(2)}
            className="w-full py-2.5 bg-[#002d55] text-white font-semibold text-xs rounded-xl hover:bg-[#001f3b] transition-all text-center cursor-pointer shadow-sm"
          >
            2 Horas ({pendingSelection.hora}:00 - {pendingSelection.hora + 2}:00)
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 border border-gray-200 text-gray-550 font-semibold text-[10px] rounded-xl hover:bg-gray-50 transition-colors text-center cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
