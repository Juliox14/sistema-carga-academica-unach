import { Search } from 'lucide-react';

export default function AssignmentDashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-8" >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Controles Superiores (Plano y limpio) */}
        <section className="bg-white p-5 border border-gray-200 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-6">
            <select className="border-b-2 border-gray-300 bg-transparent py-1 pr-8 focus:outline-none focus:border-[#002d55] text-sm text-gray-700 font-medium">
              <option>LSC Plan 2022</option>
              <option>LSC Plan Anterior</option>
            </select>

            <div className="flex gap-5 text-sm border-l border-gray-300 pl-6 text-gray-600">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors"><input type="radio" name="cat" className="accent-[#002d55]" defaultChecked /> PTC</label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors"><input type="radio" name="cat" className="accent-[#002d55]" /> PMT</label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors"><input type="radio" name="cat" className="accent-[#002d55]" /> Asignatura</label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#002d55] transition-colors"><input type="radio" name="cat" className="accent-[#002d55]" /> Eventual</label>
            </div>
          </div>

          <div className="grow max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar docente por nombre..."
              className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] focus:ring-1 focus:ring-[#002d55] transition-shadow bg-gray-50"
              defaultValue="BELTRAN NATURI ELIAS"
            />
          </div>
        </section>

        {/* Barra de Estado del Docente */}
        <section className="flex items-center justify-between bg-white px-6 py-4 border border-gray-200 border-l-4 border-l-[#002d55]">
          <h2 className="text-lg font-bold text-gray-800">Carga Actual: <span className="text-[#002d55]">ELIAS BELTRAN NATURI</span></h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600">Horas Asignadas: 18 / 40</span>
            <div className="w-56 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#002d55] w-[45%] transition-all duration-500"></div>
            </div>
          </div>
        </section>

        {/* Menú de Pestañas */}
        <nav className="flex gap-8 text-sm font-medium border-b border-gray-300">
          <button className="pb-3 border-b-2 border-[#002d55] text-[#002d55]">Carga Académica</button>
          <button className="pb-3 text-gray-500 hover:text-gray-800 transition-colors">Descargas</button>
          <button className="pb-3 text-gray-500 hover:text-gray-800 transition-colors">Otras Actividades</button>
        </nav>

        {/* Dual Canvas (Área de Tablas Drag & Drop) */}
        <div className="grid grid-cols-2 gap-6 items-start">

          {/* Tabla Izquierda: Materias Disponibles */}
          <div className="bg-white border border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-[#002d55] text-sm uppercase tracking-wide">Materias Sugeridas</h3>
              <span className="text-xs font-medium text-[#10b981] bg-green-50 px-2 py-1 rounded border border-green-100">Ordenado por afinidad</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4 font-medium">Asignatura</th>
                    <th className="py-3 px-2 font-medium text-center">Sem/Grp</th>
                    <th className="py-3 px-2 font-medium text-center">HSM</th>
                    <th className="py-3 px-4 font-medium text-right">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Fila 1 */}
                  <tr className="hover:bg-blue-50/50 cursor-grab transition-colors">
                    <td className="py-3 px-4 text-gray-800 font-medium">Diseño de Base de Datos</td>
                    <td className="py-3 px-2 text-gray-600 text-center">3 / L</td>
                    <td className="py-3 px-2 text-gray-600 text-center">4</td>
                    <td className="py-3 px-4 text-right"><span className="text-[#10b981] font-bold">98%</span></td>
                  </tr>
                  {/* Fila 2 */}
                  <tr className="hover:bg-blue-50/50 cursor-grab transition-colors">
                    <td className="py-3 px-4 text-gray-800 font-medium">Teoría Matemática de la Computación</td>
                    <td className="py-3 px-2 text-gray-600 text-center">3 / J</td>
                    <td className="py-3 px-2 text-gray-600 text-center">5</td>
                    <td className="py-3 px-4 text-right"><span className="text-[#10b981] font-bold">85%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla Derecha: Materias Asignadas */}
          <div className="bg-white border border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-[#002d55] text-sm uppercase tracking-wide">Carga Asignada</h3>
              <button className="text-xs text-[#ef4444] hover:text-red-700 font-medium transition-colors">Limpiar carga</button>
            </div>

            {/* Zona de Drop */}
            <div className="min-h-75 bg-white p-2 flex flex-col">
              {/* Cuando hay materias asignadas */}
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4 font-medium">Asignatura</th>
                    <th className="py-3 px-2 font-medium text-center">Grp</th>
                    <th className="py-3 px-2 font-medium text-center">HSM</th>
                    <th className="py-3 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Fila asignada */}
                  <tr className="group">
                    <td className="py-3 px-4 text-[#002d55] font-semibold">Ingeniería de Software II</td>
                    <td className="py-3 px-2 text-gray-600 text-center">L</td>
                    <td className="py-3 px-2 text-gray-600 text-center">4</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-gray-400 hover:text-[#ef4444] transition-colors" title="Remover materia">
                        ✕
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Placeholder Visual (Se muestra si estuviera vacío) */}
              {/* <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 m-2 rounded-lg text-gray-400">
                    <span className="text-sm font-medium">Arrastra las materias aquí</span>
                  </div> 
                  */}
            </div>
          </div>

        </div>
      </div>
    </main >

  );
}