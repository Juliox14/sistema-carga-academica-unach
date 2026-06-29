import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import AssignmentHeader from './components/AssignmentHeader';
import AcademicLoadSummary from './components/AcademicLoadSummary';
import TeacherStatsBar from './components/TeacherStatsBar';
import TabNavigation from './components/TabNavigation';
import SmartSuggestions from './components/SmartSuggestions';
import CatalogTable from './components/CatalogTable';
import AssignedContent from './components/AssignedContent';
import { useAsignacionStore } from './store/useAsignacionStore';

export default function AssignmentDashboard() {
  const { activeTab, vincularMateria, asignarOtraActividad } = useAsignacionStore();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === 'tablero-carga') {
      const { selectedMateriaIds, clearSelection } = useAsignacionStore.getState();

      // Verificar si la materia que están arrastrando forma parte de un grupo seleccionado
      if (selectedMateriaIds.includes(draggableId)) {
        // Asignación en lote (Múltiples materias)
        const promesasAsignacion = selectedMateriaIds.map(async (id) => {
          const [, materiaIdStr, grupoIdStr] = id.split('-');
          return vincularMateria(Number(materiaIdStr), Number(grupoIdStr));
        });

        // Esperar a que todas las peticiones terminen en paralelo
        await Promise.all(promesasAsignacion);
        
        // Limpiar los checkboxes después de la asignación exitosa
        clearSelection(); 
      } else {
        // Asignación individual (Por si arrastran una materia que no tenía el checkbox marcado)
        const [, materiaIdStr, grupoIdStr] = draggableId.split('-');
        await vincularMateria(Number(materiaIdStr), Number(grupoIdStr));
      }
      
      return;
    }
    
    // CASO 2: Destino -> Tablero de Otras Actividades
    if (destination.droppableId === 'tablero-otras') {
      const [, actividadIdStr, hsmStr] = draggableId.split('-');
      await asignarOtraActividad(Number(actividadIdStr), Number(hsmStr), 'Asignado desde el catálogo');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
        <div className="max-w-7xl mx-auto space-y-6">

          <AcademicLoadSummary />

          <AssignmentHeader />

          <TeacherStatsBar />

          <TabNavigation />

          <div className={`grid gap-6 items-start ${activeTab === 'descargas' ? 'grid-cols-1 max-w-5xl mx-auto' : 'grid-cols-2'}`}>

            {activeTab !== 'descargas' && (
              <div className="flex flex-col gap-4">
                {activeTab === 'carga' && (
                  <SmartSuggestions />
                )}
                <CatalogTable />
              </div>
            )}

            <AssignedContent />

          </div>
        </div>
      </main>
    </DragDropContext>
  );
}