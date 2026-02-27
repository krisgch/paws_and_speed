import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore.ts';
import { createEvent } from '../../lib/db.ts';

export default function CreateEvent() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const ev = await createEvent({
        host_id: user.id,
        name: name.trim(),
        venue: venue.trim(),
        event_date: eventDate || null,
        status: 'draft',
        bank_account: '',
        pricing_tiers: [],
      });
      navigate(`/host/events/${ev.id}`);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-[560px] mx-auto px-5 py-8">
      <Link to="/host" className="text-[13px] no-underline mb-6 inline-block" style={{ color: '#8b90a5' }}>← My Events</Link>
        <h1 className="font-display text-[24px] mb-6" style={{ color: '#f0f2f8' }}>Create Event</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>Event Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bangkok Agility Open 2026"
              className="w-full outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>Venue</label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Muang Thong Agility Park"
              className="w-full outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full outline-none"
              style={inputStyle}
            />
          </div>

          {error && <p className="text-[12px]" style={{ color: '#ef4444' }}>{error}</p>}

          <div className="flex gap-3 mt-2">
            <Link
              to="/host"
              className="flex-1 text-center text-[13px] font-semibold no-underline"
              style={{ padding: '11px', borderRadius: '8px', border: '1px solid #2a2f40', color: '#8b90a5' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 cursor-pointer text-[14px] font-bold disabled:opacity-50"
              style={{ padding: '11px', borderRadius: '8px', border: 'none', background: '#ff6b2c', color: '#fff' }}
            >
              {saving ? 'Creating…' : 'Create Event →'}
            </button>
          </div>
        </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '2px solid #2a2f40',
  background: '#1c2030',
  color: '#f0f2f8',
  fontSize: '14px',
};
