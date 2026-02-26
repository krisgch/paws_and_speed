import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore.ts';
import { getHostEvents } from '../../lib/db.ts';
import { signOut } from '../../lib/auth.ts';
import EventCard from '../../components/EventCard.tsx';
import type { Event } from '../../types/supabase.ts';

export default function HostDashboard() {
  const { user, profile, setUser, setProfile } = useAuthStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getHostEvents(user.id)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 flex items-center justify-center text-[14px] -rotate-6" style={{ background: '#ff6b2c', borderRadius: '8px' }}>🐾</div>
            <span className="font-display text-[16px]" style={{ color: '#f0f2f8' }}>Paws<span style={{ color: '#ff6b2c' }}>&</span>Speed</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: '#2dd4a0', background: 'rgba(45,212,160,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              Host
            </span>
            <span className="text-[12px]" style={{ color: '#8b90a5' }}>{profile?.display_name}</span>
            <button onClick={handleSignOut} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#555b73' }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-[26px]" style={{ color: '#f0f2f8' }}>My Events</h1>
          <Link
            to="/host/events/new"
            className="text-[13px] font-bold no-underline"
            style={{ padding: '9px 20px', borderRadius: '20px', background: '#ff6b2c', color: '#fff' }}
          >
            + New Event
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '16px' }}>
            <p className="text-[32px] mb-3">🎯</p>
            <p className="font-semibold text-[15px] mb-2" style={{ color: '#f0f2f8' }}>No events yet</p>
            <p className="text-[13px] mb-6" style={{ color: '#8b90a5' }}>Create your first event to get started.</p>
            <Link to="/host/events/new" className="text-[13px] font-bold no-underline" style={{ padding: '9px 24px', borderRadius: '20px', background: '#ff6b2c', color: '#fff' }}>
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((ev) => <EventCard key={ev.id} event={ev} hostView />)}
          </div>
        )}
      </main>
    </div>
  );
}
