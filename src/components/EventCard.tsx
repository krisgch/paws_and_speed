import { Link } from 'react-router-dom';
import type { Event } from '../types/supabase.ts';

const STATUS_COLORS: Record<string, string> = {
  draft: '#555b73',
  registration_open: '#2dd4a0',
  registration_closed: '#fbbf24',
  live: '#ff6b2c',
  completed: '#8b90a5',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration_open: 'Registration Open',
  registration_closed: 'Reg. Closed',
  live: 'Live',
  completed: 'Completed',
};

interface EventCardProps {
  event: Event;
  hostView?: boolean;
}

export default function EventCard({ event, hostView }: EventCardProps) {
  const href = hostView ? `/host/events/${event.id}` : `/events/${event.id}`;
  const color = STATUS_COLORS[event.status] ?? '#555b73';

  return (
    <Link
      to={href}
      className="block no-underline transition-all duration-200"
      style={{
        background: '#14171e',
        border: '1px solid #2a2f40',
        borderRadius: '12px',
        padding: '20px 24px',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3a4060'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[16px] truncate mb-1" style={{ color: '#f0f2f8' }}>
            {event.name}
          </h3>
          {event.venue && (
            <p className="text-[12px] truncate" style={{ color: '#8b90a5' }}>
              📍 {event.venue}
            </p>
          )}
          {event.event_date && (
            <p className="text-[12px] mt-0.5" style={{ color: '#8b90a5' }}>
              🗓️ {new Date(event.event_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-[0.5px] whitespace-nowrap"
          style={{
            padding: '3px 9px',
            borderRadius: '20px',
            background: `${color}20`,
            color,
          }}
        >
          {STATUS_LABELS[event.status]}
        </span>
      </div>
    </Link>
  );
}
