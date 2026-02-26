import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore.ts';
import { getHostEvents } from '../../lib/db.ts';
import EventCard from '../../components/EventCard.tsx';
import type { Event } from '../../types/supabase.ts';

export default function HostDashboard() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 1500);
    getHostEvents(user.id)
      .then(setEvents)
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
    return () => clearTimeout(timeout);
  }, [user]);

  return (
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
  );
}
