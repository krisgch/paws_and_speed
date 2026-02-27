import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, updateEvent } from '../../lib/db.ts';
import type { Event, EventStatus } from '../../types/supabase.ts';

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'registration_open', label: 'Registration Open' },
  { value: 'registration_closed', label: 'Registration Closed' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

interface HubLink {
  to: string;
  icon: string;
  label: string;
  description: string;
}

export default function EventHub() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then(setEvent).finally(() => setLoading(false));
  }, [eventId]);

  const changeStatus = async (status: EventStatus) => {
    if (!event) return;
    setSavingStatus(true);
    const updated = await updateEvent(event.id, { status });
    setEvent(updated);
    setSavingStatus(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0e12' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  if (!event || !eventId) return null;

  const links: HubLink[] = [
    { to: `/host/events/${eventId}/rounds`, icon: '🔄', label: 'Rounds', description: 'Add and configure competition rounds' },
    { to: `/host/events/${eventId}/pricing`, icon: '💰', label: 'Pricing', description: 'Set entry fee tiers' },
    { to: `/host/events/${eventId}/registrations`, icon: '📋', label: 'Registrations', description: 'Review and approve registrations' },
    { to: `/host/events/${eventId}/running-order`, icon: '🏃', label: 'Running Order', description: 'Manage competitor order' },
    { to: `/host/events/${eventId}/scoring`, icon: '✏️', label: 'Scoring', description: 'Enter scores live' },
    { to: `/host/events/${eventId}/rankings`, icon: '🏆', label: 'Rankings', description: 'View results & export' },
  ];

  return (
    <main className="max-w-[760px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link to="/host" className="text-[13px] no-underline" style={{ color: '#8b90a5' }}>← My Events</Link>
        <Link
          to={`/events/${eventId}/live`}
          className="text-[12px] font-bold no-underline"
          style={{ padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,107,44,0.12)', color: '#ff6b2c' }}
        >
          👁 Live View
        </Link>
      </div>
        <div className="mb-6">
        <h1 className="font-display text-[26px] mb-1" style={{ color: '#f0f2f8' }}>{event.name}</h1>
          {event.venue && <p className="text-[13px]" style={{ color: '#8b90a5' }}>📍 {event.venue}</p>}
        </div>

        {/* Status control */}
        <div className="mb-8 p-4" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
          <p className="text-[11px] font-bold uppercase tracking-[1px] mb-3" style={{ color: '#8b90a5' }}>Event Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                disabled={savingStatus}
                onClick={() => changeStatus(opt.value)}
                className="cursor-pointer text-[12px] font-semibold disabled:opacity-50"
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '2px solid',
                  borderColor: event.status === opt.value ? '#ff6b2c' : '#2a2f40',
                  background: event.status === opt.value ? 'rgba(255,107,44,0.12)' : 'transparent',
                  color: event.status === opt.value ? '#ff6b2c' : '#8b90a5',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Management links */}
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="no-underline transition-all duration-150"
              style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', padding: '16px 20px', display: 'block' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3a4060'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; }}
            >
              <div className="flex items-start gap-3">
                <span className="text-[24px]">{link.icon}</span>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>{link.label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: '#8b90a5' }}>{link.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
    </main>
  );
}
