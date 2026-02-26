import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore.ts';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0e12' }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }}
      />
    </div>
  );
}

export function AuthRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function HostRoute() {
  const { user, profile, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'host' && profile?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, profile, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (user) {
    return <Navigate to={profile?.role === 'host' || profile?.role === 'super_admin' ? '/host' : '/dashboard'} replace />;
  }
  return <Outlet />;
}
