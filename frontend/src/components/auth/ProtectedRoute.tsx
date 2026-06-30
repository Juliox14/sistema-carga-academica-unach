import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useAuthStore();
  
  // 1. Si no hay token guardado ni usuario cargado, lo mandamos al login
  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.rol;

  // Si hay token pero aún no se carga el usuario (esperando a cargarPerfil),
  // mostramos un estado de carga básico o retornamos null (se controlará en App.tsx también)
  if (token && !userRole) {
    return null; 
  }

  // 2. Si el usuario está logueado pero su rol no está en la lista permitida
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  // 3. Si todo está bien, Outlet renderiza la página hija
  return <Outlet />;
}