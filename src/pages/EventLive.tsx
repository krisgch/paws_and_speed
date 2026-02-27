import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent.ts';
import { useEventCompetitors } from '../hooks/useEventCompetitors.ts';
import { dogEmoji, SIZES, SIZE_LABELS, SIZE_COLORS } from '../constants/index.ts';
import { rankCompetitors } from '../utils/scoring.ts';
import SizeTag from '../components/SizeTag.tsx';
import type { Size } from '../types/index.ts';

const SIZES_ORDER: Record<Size, number> = { S: 0, M: 1, I: 2, L: 3 };

export default function EventLive() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, rounds, liveState, loading: eventLoading } = useEvent(eventId);
  const { competitors, loading: compLoading } = useEventCompetitors(eventId);

  const [tab, setTab] = useState<'order' | 'rankings'>('order');
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState<Size | 'all'>('all');

  // Default to live round, then first round
  useEffect(() => {
    if (selectedRoundId) return;
    const target = liveState?.live_round_id ?? rounds[0]?.id ?? null;
    if (target) setSelectedRoundId(target);
  }, [liveState, rounds, selectedRoundId]);

  const loading = eventLoading || compLoading;
  const liveRoundId = liveState?.live_round_id ?? null;
  const selectedRound = rounds.find((r) => r.id === selectedRoundId) ?? null;
  const isLiveRound = selectedRoundId === liveRoundId;

  // Now Running — always from live round
  const liveData = competitors
    .filter((c) => c.round_id === liveRoundId)
    .sort((a, b) => SIZES_ORDER[a.size as Size] - SIZES_ORDER[b.size as Size] || a.run_order - b.run_order);
  const liveQueue = liveData.filter((c) => c.total_fault === null && !c.eliminated);
  const nowRunning = liveQueue[0] ?? null;
  const upNext = liveQueue.slice(1, 4);

  // Selected round competitors
  const roundCompetitors = competitors
    .filter((c) => c.round_id === selectedRoundId)
    .sort((a, b) => SIZES_ORDER[a.size as Size] - SIZES_ORDER[b.size as Size] || a.run_order - b.run_order);

  const displayed = sizeFilter === 'all' ? roundCompetitors : roundCompetitors.filter((c) => c.size === sizeFilter);
  const activeSizes = SIZES.filter((s) => roundCompetitors.some((c) => c.size === s));

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
    <div className="min-h-screen pb-12" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-[100]" style={{ background: 'rgba(12,14,18,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1c2030' }}>
        <div className="max-w-[760px] mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="font-display text-[15px] no-underline shrink-0" style={{ color: '#ff6b2c' }}>🐾</Link>
            <div className="min-w-0">
              <p className="font-display text-[14px] truncate" style={{ color: '#f0f2f8' }}>{event.name}</p>
              {event.venue && <p className="text-[11px] truncate" style={{ color: '#555b73' }}>📍 {event.venue}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {liveRoundId && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: '#ff6b2c' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff6b2c' }} />
                LIVE
              </span>
            )}
            <Link to={`/events/${eventId}`} className="text-[12px] no-underline" style={{ color: '#555b73' }}>Info</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[760px] mx-auto px-4 pt-5">

        {/* Now Running */}
        {nowRunning ? (
          <div className="mb-5 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,107,44,0.14) 0%, rgba(255,107,44,0.04) 100%)', border: '1px solid rgba(255,107,44,0.3)' }}>
            <div className="flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: '#ff6b2c' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: '#ff6b2c' }}>Now Running</span>
                </div>
                <p className="font-display text-[24px] leading-tight mb-0.5" style={{ color: '#f0f2f8' }}>
                  {nowRunning.icon || dogEmoji(nowRunning.dog_name)} {nowRunning.dog_name}
                </p>
                <p className="text-[13px]" style={{ color: '#8b90a5' }}>
                  {nowRunning.human_name}
                  <span className="mx-1.5" style={{ color: '#2a2f40' }}>·</span>
                  <span style={{ color: '#555b73' }}>{SIZE_LABELS[nowRunning.size as Size]}</span>
                </p>
              </div>
              {upNext.length > 0 && (
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[1px] mb-1.5" style={{ color: '#555b73' }}>Up Next</p>
                  <div className="flex flex-col gap-1">
                    {upNext.map((c, i) => (
                      <p key={c.id} className="text-[12px]" style={{ color: i === 0 ? '#8b90a5' : '#555b73' }}>
                        {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : liveRoundId ? (
          <div className="mb-5 p-3 rounded-xl text-center" style={{ background: '#14171e', border: '1px solid #2a2f40' }}>
            <p className="text-[13px]" style={{ color: '#2dd4a0' }}>✓ All competitors done in the live round</p>
          </div>
        ) : null}

        {/* Round tabs */}
        {rounds.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {rounds.map((r) => (
              <button key={r.id} onClick={() => setSelectedRoundId(r.id)}
                className="cursor-pointer text-[12px] font-semibold"
                style={{
                  padding: '5px 14px', borderRadius: '20px',
                  border: `2px solid ${selectedRoundId === r.id ? '#ff6b2c' : '#2a2f40'}`,
                  background: selectedRoundId === r.id ? 'rgba(255,107,44,0.1)' : 'transparent',
                  color: selectedRoundId === r.id ? '#ff6b2c' : '#8b90a5',
                }}>
                {r.name}
                {r.id === liveRoundId && (
                  <span className="ml-1.5 w-[6px] h-[6px] rounded-full inline-block align-middle animate-pulse" style={{ background: '#ff6b2c' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 mb-4 w-fit" style={{ background: '#1c2030', borderRadius: '10px' }}>
          {(['order', 'rankings'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="cursor-pointer text-[13px] font-semibold"
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: tab === t ? '#ff6b2c' : 'transparent', color: tab === t ? '#fff' : '#8b90a5' }}>
              {t === 'order' ? '📋 Order' : '🏆 Rankings'}
            </button>
          ))}
        </div>

        {/* Size filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          <button onClick={() => setSizeFilter('all')}
            className="cursor-pointer text-[12px] font-bold"
            style={{ padding: '5px 14px', borderRadius: '20px', border: `2px solid ${sizeFilter === 'all' ? '#ff6b2c' : '#2a2f40'}`, background: sizeFilter === 'all' ? 'rgba(255,107,44,0.1)' : 'transparent', color: sizeFilter === 'all' ? '#ff6b2c' : '#8b90a5' }}>
            All
          </button>
          {activeSizes.map((s) => {
            const color = SIZE_COLORS[s];
            return (
              <button key={s} onClick={() => setSizeFilter(s)}
                className="cursor-pointer text-[12px] font-bold"
                style={{ padding: '5px 14px', borderRadius: '20px', border: `2px solid ${sizeFilter === s ? color : '#2a2f40'}`, background: sizeFilter === s ? `${color}1a` : 'transparent', color: sizeFilter === s ? color : '#8b90a5' }}>
                {s} — {SIZE_LABELS[s]}
              </button>
            );
          })}
        </div>

        {/* SCT info */}
        {selectedRound && (
          <p className="text-[11px] mb-4" style={{ color: '#555b73' }}>
            {selectedRound.name} · SCT {selectedRound.sct}s · MCT {selectedRound.mct}s
            {isLiveRound && liveRoundId && (
              <span className="ml-2 font-bold" style={{ color: '#ff6b2c' }}>● Live round</span>
            )}
          </p>
        )}

        {/* Content */}
        {tab === 'order' ? (
          <RunningOrderTab competitors={displayed} nowRunningId={nowRunning?.id ?? null} isLiveRound={isLiveRound} />
        ) : (
          <RankingsTab competitors={displayed} />
        )}
      </div>
    </div>
  );
}

// ── Running Order tab ─────────────────────────────────────────────────────────

function RunningOrderTab({
  competitors,
  nowRunningId,
  isLiveRound,
}: {
  competitors: ReturnType<typeof useEventCompetitors>['competitors'];
  nowRunningId: string | null;
  isLiveRound: boolean;
}) {
  if (!competitors.length) {
    return <p className="text-[13px] text-center py-10" style={{ color: '#555b73' }}>No competitors in this round yet.</p>;
  }

  const sizes = SIZES.filter((s) => competitors.some((c) => c.size === s));

  return (
    <div className="flex flex-col gap-5 pb-4">
      {sizes.map((size) => {
        const group = competitors.filter((c) => c.size === size).sort((a, b) => a.run_order - b.run_order);
        if (!group.length) return null;
        const color = SIZE_COLORS[size];
        return (
          <div key={size}>
            <div className="flex items-center gap-2 mb-2">
              <SizeTag size={size} />
              <span className="text-[12px] font-bold" style={{ color }}>{SIZE_LABELS[size]}</span>
              <span className="text-[11px] font-mono" style={{ color: '#555b73' }}>{group.length} dog{group.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {group.map((c) => {
                const isRunning = isLiveRound && c.id === nowRunningId;
                const isDone = c.total_fault !== null && !c.eliminated;
                const isElim = c.eliminated;

                return (
                  <div key={c.id} className="flex items-center gap-3"
                    style={{
                      background: isRunning ? 'rgba(255,107,44,0.1)' : '#14171e',
                      border: `1px solid ${isRunning ? 'rgba(255,107,44,0.4)' : '#2a2f40'}`,
                      borderRadius: '10px', padding: '10px 14px',
                      opacity: (isDone || isElim) ? 0.55 : 1,
                    }}>
                    <span className="font-mono text-[13px] w-6 text-right shrink-0" style={{ color: '#555b73' }}>{c.run_order}</span>
                    <span className="font-bold text-[14px] flex-1 truncate" style={{ color: '#f0f2f8', textDecoration: isElim ? 'line-through' : undefined }}>
                      {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
                    </span>
                    <span className="text-[12px] shrink-0" style={{ color: '#8b90a5' }}>{c.human_name}</span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: '#ff6b2c' }}>
                        <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: 'currentColor' }} />Running
                      </span>
                    )}
                    {isElim && <span className="text-[11px] font-bold shrink-0" style={{ color: '#ef4444' }}>ELIM</span>}
                    {isDone && !isRunning && (
                      <span className="text-[12px] font-bold shrink-0" style={{ color: '#2dd4a0' }}>{c.total_fault}F · {c.time_sec?.toFixed(2)}s</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Rankings tab ──────────────────────────────────────────────────────────────

function RankingsTab({
  competitors,
}: {
  competitors: ReturnType<typeof useEventCompetitors>['competitors'];
}) {
  const sizes = SIZES.filter((s) => competitors.some((c) => c.size === s));

  if (!competitors.length) {
    return <p className="text-[13px] text-center py-10" style={{ color: '#555b73' }}>No competitors in this round yet.</p>;
  }

  const hasAnyScores = competitors.some((c) => c.total_fault !== null || c.eliminated);
  if (!hasAnyScores) {
    return <p className="text-[13px] text-center py-10" style={{ color: '#555b73' }}>No scores recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {sizes.map((size) => {
        const group = competitors.filter((c) => c.size === size);
        const ranked = rankCompetitors(group);
        const scored = ranked.filter((c) => c.rank !== null);
        if (!scored.length && !ranked.some((c) => c.eliminated)) return null;

        const color = SIZE_COLORS[size];

        return (
          <div key={size}>
            <div className="flex items-center gap-2 mb-3">
              <SizeTag size={size} />
              <span className="text-[12px] font-bold" style={{ color }}>{SIZE_LABELS[size]}</span>
              <span className="text-[11px] font-mono" style={{ color: '#555b73' }}>{scored.length} scored</span>
            </div>

            {/* Top 3 podium strip */}
            {scored.length >= 1 && (
              <div className="flex gap-2 mb-3">
                {scored.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex-1 text-center p-3 rounded-xl"
                    style={{ background: c.rank === 1 ? 'rgba(251,191,36,0.08)' : c.rank === 2 ? 'rgba(148,163,184,0.06)' : 'rgba(217,119,6,0.06)', border: `1px solid ${c.rank === 1 ? 'rgba(251,191,36,0.3)' : c.rank === 2 ? 'rgba(148,163,184,0.2)' : 'rgba(217,119,6,0.2)'}` }}>
                    <div className="text-[20px] mb-1">{c.rank === 1 ? '🥇' : c.rank === 2 ? '🥈' : '🥉'}</div>
                    <p className="text-[13px] font-bold truncate" style={{ color: '#f0f2f8' }}>{c.icon || dogEmoji(c.dog_name)} {c.dog_name}</p>
                    <p className="text-[11px] truncate" style={{ color: '#8b90a5' }}>{c.human_name}</p>
                    <p className="text-[12px] font-bold mt-1" style={{ color: c.total_fault === 0 ? '#2dd4a0' : '#ff6b2c' }}>
                      {c.total_fault === 0 ? 'CLEAR' : `${c.total_fault}F`}
                      <span className="ml-1 font-normal" style={{ color: '#555b73' }}>{c.time_sec?.toFixed(2)}s</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Full list */}
            <div className="flex flex-col gap-1.5">
              {ranked.map((c) => {
                const isPending = c.rank === null && !c.eliminated;
                const isClear = c.total_fault === 0 && !c.eliminated;
                return (
                  <div key={c.id} className="flex items-center gap-3"
                    style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '10px 14px', opacity: (c.eliminated || isPending) ? 0.5 : 1 }}>
                    <span className="w-6 text-center font-mono text-[13px] shrink-0" style={{ color: c.rank === 1 ? '#fbbf24' : c.rank === 2 ? '#94a3b8' : c.rank === 3 ? '#d97706' : '#555b73' }}>
                      {c.eliminated ? 'E' : c.rank ?? '—'}
                    </span>
                    <span className="font-bold text-[13px] flex-1 truncate" style={{ color: '#f0f2f8', textDecoration: c.eliminated ? 'line-through' : undefined }}>
                      {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
                    </span>
                    <span className="text-[12px] shrink-0" style={{ color: '#8b90a5' }}>{c.human_name}</span>
                    {isPending && <span className="text-[11px] shrink-0" style={{ color: '#555b73' }}>Pending</span>}
                    {c.eliminated && <span className="text-[11px] font-bold shrink-0" style={{ color: '#ef4444' }}>ELIM</span>}
                    {!c.eliminated && !isPending && (
                      <span className="text-[12px] font-bold shrink-0" style={{ color: isClear ? '#2dd4a0' : '#ff6b2c' }}>
                        {isClear ? 'CLEAR' : `${c.total_fault}F`}
                        <span className="ml-1 font-normal" style={{ color: '#555b73' }}>{c.time_sec?.toFixed(2)}s</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
