import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore.ts';
import { signOut } from '../lib/auth.ts';

export default function UserMenu() {
  const { user, profile, setUser, setProfile } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const dashboardPath = profile?.role === 'host' || profile?.role === 'super_admin' ? '/host' : '/dashboard';

  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
    signOut().catch(() => {});
    navigate('/');
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/"
        className="text-[13px] font-semibold no-underline transition-all duration-150"
        style={{ padding: '6px 14px', borderRadius: '8px', color: '#c8ccdc', border: '1px solid #2a2f40', background: '#1c2030' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b2c'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; (e.currentTarget as HTMLElement).style.color = '#c8ccdc'; }}
      >
        Home
      </Link>
      <Link
        to={dashboardPath}
        className="text-[13px] font-semibold no-underline transition-all duration-150"
        style={{ padding: '6px 14px', borderRadius: '8px', color: '#c8ccdc', border: '1px solid #2a2f40', background: '#1c2030' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b2c'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; (e.currentTarget as HTMLElement).style.color = '#c8ccdc'; }}
      >
        My Dashboard
      </Link>
      <Link
        to="/profile"
        className="text-[13px] font-semibold no-underline transition-all duration-150"
        style={{ padding: '6px 14px', borderRadius: '8px', color: '#c8ccdc', border: '1px solid #2a2f40', background: '#1c2030' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b2c'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; (e.currentTarget as HTMLElement).style.color = '#c8ccdc'; }}
      >
        My Profile
      </Link>
      <button
        onClick={handleSignOut}
        className="text-[13px] font-semibold cursor-pointer transition-all duration-150"
        style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#b91c1c'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#dc2626'; }}
      >
        Sign Out
      </button>
    </div>
  );
}
