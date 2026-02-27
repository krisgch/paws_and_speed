import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import useStore from '../store/useStore.ts';
import useAuthStore from '../store/useAuthStore.ts';
import RoundDropdown from './RoundDropdown.tsx';
import UserMenu from './UserMenu.tsx';

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

  const { user, profile } = useAuthStore();
  // Keep useStore for the existing round dropdown & competitor data
  const { hostUnlocked } = useStore();

  const isActive = (tabPath: string) => location.pathname.endsWith(tabPath);

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
        <Link to="/" className="flex items-center gap-3 shrink-0 no-underline">
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
          {user && profile && (
            <div className="flex flex-col items-end leading-tight max-[600px]:hidden">
              <span style={{ color: '#f0f2f8', fontSize: '13px', fontWeight: 600 }}>{profile.display_name}</span>
              <span style={{ color: '#ff6b2c', fontSize: '11px', fontWeight: 500, textTransform: 'capitalize' }}>{profile.role.replace('_', ' ')}</span>
            </div>
          )}
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-[13px] font-semibold no-underline transition-all duration-150"
                style={{ padding: '6px 14px', borderRadius: '8px', color: '#c8ccdc', border: '1px solid #2a2f40', background: '#1c2030' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b2c'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; (e.currentTarget as HTMLElement).style.color = '#c8ccdc'; }}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-[13px] font-bold no-underline"
                style={{ padding: '6px 16px', borderRadius: '8px', background: '#ff6b2c', color: '#fff' }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
