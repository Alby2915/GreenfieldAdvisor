import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Caricamento…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;

  return <Outlet />;
}
