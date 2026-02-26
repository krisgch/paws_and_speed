import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicEvents } from '../lib/db.ts';
import EventCard from '../components/EventCard.tsx';
import useAuthStore from '../store/useAuthStore.ts';
import type { Event } from '../types/supabase.ts';

export default function Landing() {
  const { user, profile } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const openEvents = events.filter((e) => e.status === 'registration_open');
  const otherEvents = events.filter((e) => e.status !== 'registration_open');

  return (
    <div
      className="min-h-screen"
      style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-[100]"
        style={{
          background: 'rgba(12,14,18,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #2a2f40',
          padding: '0 20px',
        }}
      >
        <div className="max-w-[960px] mx-auto flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div
              className="w-8 h-8 flex items-center justify-center text-[16px] -rotate-6"
              style={{ background: '#ff6b2c', borderRadius: '8px' }}
            >
              🐾
            </div>
            <span className="font-display text-[17px] tracking-[-0.5px]" style={{ color: '#f0f2f8' }}>
              Paws<span style={{ color: '#ff6b2c' }}>&</span>Speed
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={profile?.role === 'host' ? '/host' : '/dashboard'}
                  className="text-[13px] font-semibold no-underline"
                  style={{ color: '#f0f2f8' }}
                >
                  My Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[13px] font-semibold no-underline" style={{ color: '#8b90a5' }}>
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-[13px] font-bold no-underline"
                  style={{ padding: '6px 16px', borderRadius: '20px', background: '#ff6b2c', color: '#fff' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[960px] mx-auto px-5 pt-16 pb-12 text-center">
        <h1 className="font-display text-[42px] sm:text-[52px] mb-4 leading-[1.1]" style={{ color: '#f0f2f8' }}>
          Dog Agility<br />
          <span style={{ color: '#ff6b2c' }}>Competitions</span>
        </h1>
        <p className="text-[16px] max-w-[480px] mx-auto mb-8" style={{ color: '#8b90a5' }}>
          Register your dog, track live scores, and celebrate with the community.
        </p>
        {!user && (
          <Link
            to="/signup"
            className="inline-block text-[15px] font-bold no-underline"
            style={{ padding: '12px 32px', borderRadius: '24px', background: '#ff6b2c', color: '#fff' }}
          >
            Get Started →
          </Link>
        )}
      </section>

      {/* Events */}
      <section className="max-w-[960px] mx-auto px-5 pb-20">
        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }}
            />
          </div>
        ) : events.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              background: '#14171e',
              border: '1px solid #2a2f40',
              borderRadius: '16px',
            }}
          >
            <p className="text-[16px] font-semibold mb-2" style={{ color: '#f0f2f8' }}>
              No upcoming events yet
            </p>
            <p className="text-[13px]" style={{ color: '#8b90a5' }}>
              Check back soon — or ask a host to open registration.
            </p>
          </div>
        ) : (
          <>
            {openEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[12px] font-bold uppercase tracking-[1px] mb-4" style={{ color: '#8b90a5' }}>
                  Open for Registration
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {openEvents.map((ev) => <EventCard key={ev.id} event={ev} />)}
                </div>
              </div>
            )}
            {otherEvents.length > 0 && (
              <div>
                <h2 className="text-[12px] font-bold uppercase tracking-[1px] mb-4" style={{ color: '#8b90a5' }}>
                  Other Events
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {otherEvents.map((ev) => <EventCard key={ev.id} event={ev} />)}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
