export default function LeyendaHorarios() {
  return (
    <div className="mb-4 flex flex-wrap gap-4 items-center bg-gray-50 border border-gray-200 rounded-2xl p-3 text-[11px] text-gray-600">
      <span className="font-bold text-gray-700 mr-2 uppercase tracking-wide text-[9px]">Sugerencias de Horarios:</span>
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-md bg-green-50 border border-green-200 inline-block shrink-0"></span>
        <span>Afinidad Alta (Recomendado)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-md bg-blue-50 border border-blue-200 inline-block shrink-0"></span>
        <span>Afinidad Media (Neutral)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-md bg-rose-50 border border-rose-200 inline-block shrink-0"></span>
        <span>Afinidad Baja (Evitar por docente)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-md bg-gray-200 border border-gray-300 shrink-0 flex items-center justify-center text-[9px] text-gray-500 font-bold font-mono">i</span>
        <span>Inhabilitado / Conflicto</span>
      </div>
    </div>
  );
}
