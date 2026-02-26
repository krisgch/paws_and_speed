import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent.ts';
import { useEventCompetitors } from '../hooks/useEventCompetitors.ts';
import type { Size } from '../types/index.ts';

const SIZES: Size[] = ['S', 'M', 'I', 'L'];
const SIZE_LABELS: Record<Size, string> = { S: 'Small', M: 'Medium', I: 'Intermediate', L: 'Large' };
const SIZES_ORDER: Record<Size, number> = { S: 0, M: 1, I: 2, L: 3 };

export default function EventLive() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, rounds, liveState, loading: eventLoading } = useEvent(eventId);
  const { competitors, loading: compLoading } = useEventCompetitors(eventId);
  const [tab, setTab] = useState<'order' | 'rankings'>('order');
  const [sizeFilter, setSizeFilter] = useState<Size | 'all'>('all');

  const loading = eventLoading || compLoading;

  const liveRound = liveState?.live_round_id
    ? rounds.find((r) => r.id === liveState.live_round_id)
    : null;

  const liveCompetitors = liveRound
    ? competitors
        .filter((c) => c.round_id === liveRound.id)
        .sort((a, b) => SIZES_ORDER[a.size as Size] - SIZES_ORDER[b.size as Size] || a.run_order - b.run_order)
    : [];

  const liveQueue = liveCompetitors.filter((c) => c.total_fault === null && !c.eliminated);
  const nowRunning = liveQueue[0];

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
          <Link to="/" style={{ color: '#ff6b2c' }}>← Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-[100]"
        style={{ background: 'rgba(12,14,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2a2f40', padding: '0 16px' }}
      >
        <div className="max-w-[960px] mx-auto flex items-center justify-between h-14">
          <div>
            <p className="font-display text-[15px]" style={{ color: '#f0f2f8' }}>{event.name}</p>
            {liveRound && (
              <p className="text-[11px]" style={{ color: '#ff6b2c' }}>🔴 Live — {liveRound.name}</p>
            )}
          </div>
          <Link to={`/events/${eventId}`} className="text-[12px] no-underline" style={{ color: '#8b90a5' }}>
            Info
          </Link>
        </div>
      </header>

      {/* Now Running banner */}
      {nowRunning && (
        <div
          className="mx-4 mt-4 rounded-xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,44,0.15) 0%, rgba(255,107,44,0.05) 100%)', border: '1px solid rgba(255,107,44,0.3)' }}
        >
          <div style={{ padding: '12px 16px' }}>
            <p className="text-[11px] font-bold uppercase tracking-[1px] mb-1" style={{ color: '#ff6b2c' }}>
              🐕 Now Running
            </p>
            <p className="font-display text-[20px]" style={{ color: '#f0f2f8' }}>
              {nowRunning.icon} {nowRunning.dog_name}
            </p>
            <p className="text-[12px]" style={{ color: '#8b90a5' }}>{nowRunning.human_name} · {nowRunning.size}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-[960px] mx-auto px-4 mt-4">
        <div className="flex gap-1 p-1 mb-4 w-fit" style={{ background: '#1c2030', borderRadius: '10px' }}>
          {(['order', 'rankings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="cursor-pointer text-[13px] font-semibold capitalize"
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                border: 'none',
                background: tab === t ? '#ff6b2c' : 'transparent',
                color: tab === t ? '#fff' : '#8b90a5',
              }}
            >
              {t === 'order' ? '📋 Order' : '🏆 Rankings'}
            </button>
          ))}
        </div>

        {/* Round selector */}
        {rounds.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {rounds.map((r) => (
              <span
                key={r.id}
                className="text-[11px] font-semibold"
                style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: liveState?.live_round_id === r.id ? 'rgba(255,107,44,0.15)' : '#1c2030',
                  color: liveState?.live_round_id === r.id ? '#ff6b2c' : '#8b90a5',
                  border: liveState?.live_round_id === r.id ? '1px solid rgba(255,107,44,0.3)' : '1px solid #2a2f40',
                }}
              >
                {r.name}
              </span>
            ))}
          </div>
        )}

        {/* Size filter */}
        <div className="flex gap-2 mb-4">
          {(['all', ...SIZES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSizeFilter(s)}
              className="cursor-pointer text-[12px] font-bold uppercase"
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: 'none',
                background: sizeFilter === s ? '#ff6b2c' : '#1c2030',
                color: sizeFilter === s ? '#fff' : '#8b90a5',
              }}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'order' ? (
          <RunningOrderView
            competitors={liveCompetitors.filter((c) => sizeFilter === 'all' || c.size === sizeFilter)}
            sizeFilter={sizeFilter}
          />
        ) : (
          <RankingsView
            competitors={competitors.filter((c) => sizeFilter === 'all' || c.size === sizeFilter)}
            rounds={rounds}
            sizeFilter={sizeFilter}
          />
        )}
      </div>
    </div>
  );
}

function RunningOrderView({
  competitors,
}: {
  competitors: ReturnType<typeof useEventCompetitors>['competitors'];
  sizeFilter: Size | 'all';
}) {
  if (!competitors.length) {
    return <p className="text-[13px] text-center py-8" style={{ color: '#555b73' }}>No running order for this round yet.</p>;
  }

  const sizes = SIZES.filter((s) => competitors.some((c) => c.size === s));

  return (
    <div className="flex flex-col gap-6 pb-10">
      {sizes.map((size) => {
        const group = competitors.filter((c) => c.size === size).sort((a, b) => a.run_order - b.run_order);
        if (!group.length) return null;
        return (
          <div key={size}>
            <h3 className="text-[11px] font-bold uppercase tracking-[1px] mb-2" style={{ color: '#8b90a5' }}>
              {SIZE_LABELS[size]}
            </h3>
            <div className="flex flex-col gap-2">
              {group.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3"
                  style={{
                    background: '#14171e',
                    border: '1px solid #2a2f40',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    opacity: c.total_fault !== null || c.eliminated ? 0.5 : 1,
                  }}
                >
                  <span className="text-[13px] font-mono w-5 text-right shrink-0" style={{ color: '#555b73' }}>{i + 1}</span>
                  <span className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>
                    {c.icon} {c.dog_name}
                  </span>
                  <span className="text-[12px] flex-1" style={{ color: '#8b90a5' }}>{c.human_name}</span>
                  {c.eliminated && <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>E</span>}
                  {c.total_fault !== null && !c.eliminated && (
                    <span className="text-[12px] font-bold" style={{ color: '#2dd4a0' }}>{c.total_fault}F</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankingsView({
  competitors,
  rounds,
  sizeFilter,
}: {
  competitors: ReturnType<typeof useEventCompetitors>['competitors'];
  rounds: ReturnType<typeof useEvent>['rounds'];
  sizeFilter: Size | 'all';
}) {
  const sizes = sizeFilter === 'all' ? SIZES : [sizeFilter];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {rounds.map((round) => {
        const roundComps = competitors.filter((c) => c.round_id === round.id && (c.total_fault !== null || c.eliminated));
        if (!roundComps.length) return null;

        return (
          <div key={round.id}>
            <h2 className="font-display text-[16px] mb-4" style={{ color: '#f0f2f8' }}>{round.name}</h2>
            {sizes.map((size) => {
              const group = roundComps
                .filter((c) => c.size === size)
                .sort((a, b) => {
                  if (a.eliminated && !b.eliminated) return 1;
                  if (!a.eliminated && b.eliminated) return -1;
                  return (a.total_fault ?? Infinity) - (b.total_fault ?? Infinity) || (a.time_sec ?? Infinity) - (b.time_sec ?? Infinity);
                });
              if (!group.length) return null;
              return (
                <div key={size} className="mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[1px] mb-2" style={{ color: '#8b90a5' }}>{SIZE_LABELS[size]}</h3>
                  <div className="flex flex-col gap-2">
                    {group.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-3" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '8px', padding: '10px 14px' }}>
                        <span className="w-5 text-center font-bold text-[13px]" style={{ color: i === 0 ? '#fbbf24' : '#555b73' }}>
                          {c.eliminated ? 'E' : i + 1}
                        </span>
                        <span className="font-semibold text-[14px] flex-1" style={{ color: '#f0f2f8' }}>
                          {c.icon} {c.dog_name}
                        </span>
                        {!c.eliminated && c.total_fault !== null && (
                          <span className="text-[13px] font-bold" style={{ color: '#2dd4a0' }}>{c.total_fault}F</span>
                        )}
                        {c.time_sec !== null && (
                          <span className="text-[12px]" style={{ color: '#8b90a5' }}>{c.time_sec.toFixed(2)}s</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
