import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRegistrations, getEventRounds } from '../../lib/db.ts';
import { supabase } from '../../lib/supabase.ts';
import RegistrationCard from '../../components/RegistrationCard.tsx';
import type { Registration, EventRound } from '../../types/supabase.ts';

interface EnrichedRegistration extends Registration {
  dogName: string;
  competitorName: string;
}

type FilterStatus = 'pending_review' | 'approved' | 'rejected' | 'pending_payment' | 'all';

export default function RegistrationQueue() {
  const { eventId } = useParams<{ eventId: string }>();
  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([]);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending_review');

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      getRegistrations(eventId),
      getEventRounds(eventId),
    ]).then(async ([regs, rds]) => {
      setRounds(rds);

      // Enrich with dog name and competitor name
      const enriched: EnrichedRegistration[] = [];
      for (const reg of regs) {
        const [{ data: dog }, { data: profile }] = await Promise.all([
          supabase.from('dogs').select('name').eq('id', reg.dog_id).single(),
          supabase.from('profiles').select('display_name').eq('id', reg.competitor_id).single(),
        ]);
        enriched.push({
          ...reg,
          dogName: dog?.name ?? '—',
          competitorName: profile?.display_name ?? '—',
        });
      }
      setRegistrations(enriched);
    }).finally(() => setLoading(false));
  }, [eventId]);

  const filtered = filter === 'all' ? registrations : registrations.filter((r) => r.status === filter);

  const counts: Record<FilterStatus, number> = {
    all: registrations.length,
    pending_review: registrations.filter((r) => r.status === 'pending_review').length,
    pending_payment: registrations.filter((r) => r.status === 'pending_payment').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <Link to={`/host/events/${eventId}`} className="text-[13px] no-underline" style={{ color: '#8b90a5' }}>← Event Hub</Link>
          <span className="text-[14px] font-semibold" style={{ color: '#f0f2f8' }}>Registrations</span>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="font-display text-[22px] mb-5" style={{ color: '#f0f2f8' }}>Registration Queue</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {(['pending_review', 'pending_payment', 'approved', 'rejected', 'all'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="cursor-pointer text-[12px] font-semibold capitalize"
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: `2px solid ${filter === f ? '#ff6b2c' : '#2a2f40'}`,
                background: filter === f ? 'rgba(255,107,44,0.1)' : 'transparent',
                color: filter === f ? '#ff6b2c' : '#8b90a5',
              }}
            >
              {f.replace(/_/g, ' ')}
              {counts[f] > 0 && (
                <span className="ml-1.5 font-mono">{counts[f]}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
            <p className="text-[13px]" style={{ color: '#8b90a5' }}>No registrations in this category.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((reg) => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                dogName={reg.dogName}
                competitorName={reg.competitorName}
                roundNames={reg.selected_round_ids.map((id) => rounds.find((r) => r.id === id)?.name ?? id)}
                onUpdate={(updated) => {
                  setRegistrations((prev) =>
                    prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
                  );
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
