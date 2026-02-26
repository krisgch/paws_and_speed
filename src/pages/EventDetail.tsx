import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, getEventRounds } from '../lib/db.ts';
import useAuthStore from '../store/useAuthStore.ts';
import type { Event, EventRound } from '../types/supabase.ts';

const STATUS_COLORS: Record<string, string> = {
  draft: '#555b73',
  registration_open: '#2dd4a0',
  registration_closed: '#fbbf24',
  live: '#ff6b2c',
  completed: '#8b90a5',
};

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([getEvent(eventId), getEventRounds(eventId)])
      .then(([ev, rds]) => {
        setEvent(ev);
        setRounds(rds);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0e12' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0e12', color: '#f0f2f8' }}>
        <div className="text-center">
          <p className="text-[18px] font-semibold mb-3">Event not found</p>
          <Link to="/" style={{ color: '#ff6b2c' }}>← Back to events</Link>
        </div>
      </div>
    );
  }

  const color = STATUS_COLORS[event.status] ?? '#555b73';
  const canRegister = event.status === 'registration_open';

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <Link to="/" className="text-[13px] no-underline" style={{ color: '#8b90a5' }}>
            ← Events
          </Link>
          {(event.status === 'live' || event.status === 'completed') && (
            <Link
              to={`/events/${eventId}/live`}
              className="text-[13px] font-bold no-underline"
              style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,107,44,0.15)', color: '#ff6b2c' }}
            >
              🔴 Live View
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-10">
        {/* Status badge */}
        <span
          className="text-[10px] font-bold uppercase tracking-[0.5px] mb-4 inline-block"
          style={{ padding: '3px 10px', borderRadius: '20px', background: `${color}20`, color }}
        >
          {event.status.replace('_', ' ')}
        </span>

        <h1 className="font-display text-[32px] leading-[1.15] mb-2" style={{ color: '#f0f2f8' }}>
          {event.name}
        </h1>

        <div className="flex flex-wrap gap-4 mb-8 text-[13px]" style={{ color: '#8b90a5' }}>
          {event.venue && <span>📍 {event.venue}</span>}
          {event.event_date && <span>🗓️ {new Date(event.event_date).toLocaleDateString()}</span>}
        </div>

        {/* Rounds */}
        {rounds.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[1px] mb-3" style={{ color: '#8b90a5' }}>
              Rounds
            </h2>
            <div className="grid gap-2">
              {rounds.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between"
                  style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '8px', padding: '10px 14px' }}
                >
                  <span className="font-semibold text-[13px]" style={{ color: '#f0f2f8' }}>{r.name}</span>
                  <span className="text-[12px]" style={{ color: '#8b90a5' }}>SCT {r.sct}s</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        {event.pricing_tiers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[1px] mb-3" style={{ color: '#8b90a5' }}>
              Entry Fees
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {event.pricing_tiers.map((tier) => (
                <div
                  key={tier.runs}
                  style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '8px', padding: '10px 14px' }}
                  className="flex items-center justify-between"
                >
                  <span className="text-[13px]" style={{ color: '#f0f2f8' }}>{tier.label}</span>
                  <span className="font-bold text-[15px]" style={{ color: '#ff6b2c' }}>
                    ฿{tier.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {canRegister && (
          <div>
            {user ? (
              <button
                onClick={() => navigate(`/events/${eventId}/register`)}
                className="cursor-pointer text-[15px] font-bold"
                style={{ padding: '12px 32px', borderRadius: '24px', border: 'none', background: '#ff6b2c', color: '#fff' }}
              >
                Register My Dog →
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to={`/signup?next=/events/${eventId}/register`}
                  className="text-[14px] font-bold no-underline"
                  style={{ padding: '11px 28px', borderRadius: '24px', background: '#ff6b2c', color: '#fff' }}
                >
                  Sign up to register
                </Link>
                <Link to={`/login?next=/events/${eventId}/register`} className="text-[13px] no-underline" style={{ color: '#8b90a5' }}>
                  Already have an account →
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
