import { Navigate, Outlet } from 'react-router';
import { useAuth } from './auth-context';
import { paths } from '../paths';

/** Sends students to `/app` if they hit `/app/admin/*` while signed in with a student profile. */
export function RequireAdmin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to={paths.app} replace />;
  }
  return <Outlet />;
}
