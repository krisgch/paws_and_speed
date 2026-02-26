import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import useStore from '../store/useStore.ts';
import useAuthStore from '../store/useAuthStore.ts';
import RoundDropdown from './RoundDropdown.tsx';
import { signOut } from '../lib/auth.ts';

type EventTab = { path: string; label: string; icon: string };

const EVENT_TABS: EventTab[] = [
  { path: 'running-order', label: 'Order', icon: '📋' },
  { path: 'scoring', label: 'Scoring', icon: '✏️' },
  { path: 'competitors', label: 'Competitors', icon: '🐕' },
  { path: 'rankings', label: 'Rankings', icon: '🏆' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const { user, profile, setUser, setProfile } = useAuthStore();
  // Keep useStore for the existing round dropdown & competitor data
  const { hostUnlocked } = useStore();

  const isActive = (tabPath: string) => location.pathname.endsWith(tabPath);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    navigate('/');
  };

  // Determine which tabs to show: host sees all, competitor sees order + rankings
  const visibleTabs = EVENT_TABS.filter((tab) => {
    if (tab.path === 'scoring' || tab.path === 'competitors') {
      return profile?.role === 'host' || hostUnlocked;
    }
    return true;
  });

  return (
    <header
      className="sticky top-0 z-[100]"
      style={{
        background: 'rgba(12,14,18,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #2a2f40',
        padding: '0 12px',
      }}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between h-16 gap-4 max-[900px]:flex-wrap max-[900px]:h-auto max-[900px]:py-3 max-[900px]:gap-2">
        {/* Logo */}
        <Link to={user ? (profile?.role === 'host' ? '/host' : '/dashboard') : '/'} className="flex items-center gap-3 shrink-0 no-underline">
          <div
            className="w-9 h-9 flex items-center justify-center text-[18px] -rotate-6"
            style={{ background: '#ff6b2c', borderRadius: '10px' }}
          >
            🐾
          </div>
          <div className="font-display text-[18px] tracking-[-0.5px]" style={{ color: '#f0f2f8' }}>
            Paws<span style={{ color: '#ff6b2c' }}>&</span>Speed
          </div>
        </Link>

        {/* Nav Tabs (only show when in event context) */}
        {eventId && (
          <nav
            className="flex gap-1 p-1 max-[900px]:order-3 max-[900px]:w-full max-[900px]:justify-center max-[900px]:overflow-x-auto"
            style={{ background: '#1c2030', borderRadius: '10px' }}
          >
            {visibleTabs.map((tab) => {
              const href = `/host/events/${eventId}/${tab.path}`;
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(href)}
                  className="flex items-center gap-[7px] whitespace-nowrap cursor-pointer transition-all duration-200"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? '#ff6b2c' : 'transparent',
                    color: active ? '#fff' : '#8b90a5',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#f0f2f8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#8b90a5'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right section */}
        <div className="flex items-center gap-3 shrink-0">
          {eventId && <RoundDropdown />}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] hidden sm:inline" style={{ color: '#8b90a5' }}>
                {profile?.display_name}
              </span>
              {profile?.role === 'host' && (
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.5px]"
                  style={{ background: 'rgba(45,212,160,0.12)', color: '#2dd4a0', padding: '2px 6px', borderRadius: '4px' }}
                >
                  Host
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="cursor-pointer text-[11px] font-bold"
                style={{
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: 'none',
                  background: 'rgba(85,91,115,0.2)',
                  color: '#555b73',
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="no-underline text-[12px] font-bold"
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                background: '#ff6b2c',
                color: '#fff',
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
