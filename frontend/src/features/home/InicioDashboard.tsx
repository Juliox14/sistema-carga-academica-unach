import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/store/useAuthStore';

// Import Role Subcomponents
import AdminHome from './components/AdminHome';
import SecretariaHome from './components/SecretariaHome';
import CapturistaHome from './components/CapturistaHome';
import DocenteHome from './components/DocenteHome';

export default function InicioDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userRole = user?.rol || 'DOCENTE';

  // Obtener nombre a mostrar a partir de email
  const displayNombre = user?.nombre || (user?.email
    ? (user.email.includes('@') ? user.email.split('@')[0] : user.email)
    : 'Usuario');

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      {userRole === 'SUPER_ADMIN' && (
        <AdminHome displayNombre={displayNombre} navigate={navigate} />
      )}
      {userRole === 'SECRETARIA_ACADEMICA' && (
        <SecretariaHome displayNombre={displayNombre} navigate={navigate} />
      )}
      {userRole === 'CAPTURISTA' && (
        <CapturistaHome displayNombre={displayNombre} navigate={navigate} />
      )}
      {userRole === 'DOCENTE' && (
        <DocenteHome displayNombre={displayNombre} navigate={navigate} />
      )}
    </div>
  );
}
