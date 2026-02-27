import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEventRounds,
  getEventCompetitors,
  getEventLiveState,
  setEventLiveRound,
  reorderCompetitors,
} from '../../lib/db.ts';
import { dogEmoji, SIZES, SIZE_LABELS, SIZE_COLORS } from '../../constants/index.ts';
import SizeTag from '../../components/SizeTag.tsx';
import type { EventRound, EventCompetitor } from '../../types/supabase.ts';
import type { Size } from '../../types/index.ts';

const SIZES_ORDER: Record<Size, number> = { S: 0, M: 1, I: 2, L: 3 };

export default function RunningOrderPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [liveRoundId, setLiveRoundId] = useState<string | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [viewSize, setViewSize] = useState<Size | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [savingLive, setSavingLive] = useState(false);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      getEventRounds(eventId),
      getEventCompetitors(eventId),
      getEventLiveState(eventId),
    ]).then(([rds, comps, liveState]) => {
      setRounds(rds);
      setCompetitors(comps);
      setLiveRoundId(liveState?.live_round_id ?? null);
      if (rds.length > 0) setSelectedRoundId(rds[0].id);
    }).finally(() => setLoading(false));
  }, [eventId]);

  // All competitors in selected round, sorted S→M→I→L then by run_order
  const roundData = competitors
    .filter((c) => c.round_id === selectedRoundId)
    .sort((a, b) => SIZES_ORDER[a.size] - SIZES_ORDER[b.size] || a.run_order - b.run_order);

  const displayData = viewSize === 'all' ? roundData : roundData.filter((c) => c.size === viewSize);
  const activeSizes = SIZES.filter((s) => roundData.some((c) => c.size === s));
  const sizesToRender = viewSize === 'all' ? activeSizes : activeSizes.filter((s) => s === viewSize);

  // Now running banner: first unscored, uneliminated competitor in the live round
  const liveData = competitors
    .filter((c) => c.round_id === liveRoundId)
    .sort((a, b) => SIZES_ORDER[a.size] - SIZES_ORDER[b.size] || a.run_order - b.run_order);
  const liveQueue = liveData.filter((c) => c.total_fault === null && !c.eliminated);
  const nowRunning = liveQueue[0] ?? null;
  const upNext = liveQueue.slice(1, 4);

  // ── Set live round ──────────────────────────────────────────────────────────
  const handleSetLive = async () => {
    if (!eventId || !selectedRoundId) return;
    setSavingLive(true);
    await setEventLiveRound(eventId, selectedRoundId);
    setLiveRoundId(selectedRoundId);
    setSavingLive(false);
  };

  // ── Randomize size group ────────────────────────────────────────────────────
  const randomizeGroup = async (size: Size) => {
    const group = roundData.filter((c) => c.size === size);
    if (group.length < 2) return;
    const ids = group.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const updates = ids.map((id, idx) => ({ id, run_order: idx + 1 }));
    await reorderCompetitors(updates);
    setCompetitors((prev) =>
      prev.map((c) => {
        const u = updates.find((u) => u.id === c.id);
        return u ? { ...c, run_order: u.run_order } : c;
      })
    );
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((id: string) => setDraggedId(id), []);
  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  }, []);
  const handleDragEnd = useCallback(() => { setDraggedId(null); setDragOverId(null); }, []);

  const handleDrop = useCallback(async (targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const dragged = roundData.find((c) => c.id === draggedId);
    const target = roundData.find((c) => c.id === targetId);
    if (!dragged || !target || dragged.size !== target.size) { setDraggedId(null); setDragOverId(null); return; }

    const group = roundData.filter((c) => c.size === dragged.size).sort((a, b) => a.run_order - b.run_order);
    const fromIdx = group.findIndex((c) => c.id === draggedId);
    const toIdx = group.findIndex((c) => c.id === targetId);
    const newOrder = [...group];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    const updates = newOrder.map((c, idx) => ({ id: c.id, run_order: idx + 1 }));
    setDraggedId(null);
    setDragOverId(null);

    // Optimistic update
    setCompetitors((prev) =>
      prev.map((c) => {
        const u = updates.find((u) => u.id === c.id);
        return u ? { ...c, run_order: u.run_order } : c;
      })
    );
    await reorderCompetitors(updates);
  }, [draggedId, roundData]);

  const isLiveRound = selectedRoundId === liveRoundId;
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  return (
    <main className="max-w-[900px] mx-auto px-5 py-8">
      <Link to={`/host/events/${eventId}`} className="text-[13px] no-underline mb-6 inline-block" style={{ color: '#8b90a5' }}>← Event Hub</Link>
      <h1 className="font-display text-[22px] mb-5" style={{ color: '#f0f2f8' }}>Running Order</h1>

      {/* Now Running banner */}
      {nowRunning && (
        <div className="mb-5 p-4 flex items-center gap-4" style={{ background: 'rgba(255,107,44,0.08)', border: '1px solid rgba(255,107,44,0.3)', borderRadius: '12px' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff6b2c' }} />
              <span className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: '#ff6b2c' }}>Now Running</span>
            </div>
            <p className="text-[15px] font-bold" style={{ color: '#f0f2f8' }}>{nowRunning.icon || dogEmoji(nowRunning.dog_name)} {nowRunning.dog_name}</p>
            <p className="text-[12px]" style={{ color: '#8b90a5' }}>{nowRunning.human_name}</p>
          </div>
          {upNext.length > 0 && (
            <div className="ml-auto text-right">
              <p className="text-[10px] font-bold uppercase tracking-[1px] mb-1" style={{ color: '#555b73' }}>Up Next</p>
              {upNext.map((c) => (
                <p key={c.id} className="text-[12px]" style={{ color: '#8b90a5' }}>{c.icon || dogEmoji(c.dog_name)} {c.dog_name}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Round tabs */}
      {rounds.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {rounds.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedRoundId(r.id); setViewSize('all'); }}
              className="cursor-pointer text-[12px] font-semibold"
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: `2px solid ${selectedRoundId === r.id ? '#ff6b2c' : '#2a2f40'}`,
                background: selectedRoundId === r.id ? 'rgba(255,107,44,0.1)' : 'transparent',
                color: selectedRoundId === r.id ? '#ff6b2c' : '#8b90a5',
              }}
            >
              {r.name}
              {r.id === liveRoundId && (
                <span className="ml-1.5 w-[6px] h-[6px] rounded-full inline-block align-middle animate-pulse" style={{ background: '#ff6b2c' }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Size filter + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="flex gap-2 flex-wrap">
          {(['all', ...SIZES] as const).map((s) => {
            const isAll = s === 'all';
            const active = viewSize === s;
            const color = isAll ? '#ff6b2c' : SIZE_COLORS[s as Size];
            return (
              <button
                key={s}
                onClick={() => setViewSize(s as Size | 'all')}
                className="cursor-pointer text-[12px] font-bold"
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: `2px solid ${active ? color : '#2a2f40'}`,
                  background: active ? `${color}1a` : 'transparent',
                  color: active ? color : '#8b90a5',
                }}
              >
                {isAll ? 'All' : `${s} — ${SIZE_LABELS[s as Size]}`}
              </button>
            );
          })}
        </div>

        {!isLiveRound && selectedRoundId && (
          <button
            onClick={handleSetLive}
            disabled={savingLive}
            className="cursor-pointer text-[12px] font-bold disabled:opacity-50"
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,107,44,0.4)', background: 'rgba(255,107,44,0.08)', color: '#ff6b2c' }}
          >
            {savingLive ? '…' : '▶ Set as Live'}
          </button>
        )}
        {isLiveRound && (
          <span className="text-[11px] font-bold px-3 py-1 rounded-[20px]" style={{ background: 'rgba(255,107,44,0.12)', color: '#ff6b2c' }}>
            ● LIVE
          </span>
        )}
      </div>

      {/* SCT / MCT info */}
      {selectedRound && (
        <p className="text-[12px] mb-4" style={{ color: '#555b73' }}>
          SCT {selectedRound.sct}s · MCT {selectedRound.mct}s
        </p>
      )}

      {/* Table */}
      <div style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40', overflow: 'hidden' }}>
        <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #2a2f40' }}>
          <span className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>🐕 Running Order</span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: '#1c2030', color: '#555b73' }}>
            {displayData.length}
          </span>
          <span className="ml-auto text-[11px]" style={{ color: '#555b73' }}>⠿ Drag · 🔀 Randomize</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={{ width: '32px', padding: '10px 6px 10px 14px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #2a2f40' }} />
                {['#', 'Dog', 'Breed', 'Handler', 'Status'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-[1px]"
                    style={{ padding: '10px 14px', color: '#555b73', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #2a2f40' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizesToRender.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[13px]" style={{ padding: '40px', color: '#555b73' }}>
                    {rounds.length === 0 ? 'No rounds configured for this event.' : 'No competitors in this round yet. Approve registrations to populate.'}
                  </td>
                </tr>
              ) : (
                sizesToRender.map((size) => {
                  const group = displayData.filter((c) => c.size === size);
                  const color = SIZE_COLORS[size];
                  return (
                    <React.Fragment key={size}>
                      {/* Size group header */}
                      <tr>
                        <td colSpan={6} style={{ padding: '8px 16px', background: `${color}0d`, borderTop: '1px solid rgba(42,47,64,0.5)', borderBottom: `1px solid ${color}28` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <SizeTag size={size} />
                              <span className="text-[12px] font-bold" style={{ color }}>{SIZE_LABELS[size]}</span>
                              <span className="font-mono text-[11px]" style={{ color: '#555b73' }}>{group.length} dog{group.length !== 1 ? 's' : ''}</span>
                            </div>
                            <button
                              onClick={() => randomizeGroup(size)}
                              className="cursor-pointer text-[11px] font-bold"
                              style={{ padding: '3px 10px', borderRadius: '6px', border: `1px solid ${color}40`, background: `${color}0d`, color }}
                            >
                              🔀 Randomize
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Competitor rows */}
                      {group.map((c) => {
                        const isRunning = c.id === nowRunning?.id && isLiveRound;
                        const isDone = c.total_fault !== null && !c.eliminated;
                        const isDragging = draggedId === c.id;
                        const isDragOver = dragOverId === c.id;

                        let statusEl: React.ReactNode;
                        if (c.eliminated) {
                          statusEl = <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(85,91,115,0.2)', color: '#555b73' }}>🚫 Elim</span>;
                        } else if (isDone) {
                          statusEl = <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(45,212,160,0.15)', color: '#2dd4a0' }}><span className="w-[5px] h-[5px] rounded-full" style={{ background: 'currentColor' }} /> Done</span>;
                        } else if (isRunning) {
                          statusEl = <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(255,107,44,0.15)', color: '#ff6b2c' }}><span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: 'currentColor' }} /> Running</span>;
                        } else {
                          statusEl = <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(85,91,115,0.2)', color: '#555b73' }}><span className="w-[5px] h-[5px] rounded-full" style={{ background: 'currentColor' }} /> Waiting</span>;
                        }

                        return (
                          <tr
                            key={c.id}
                            draggable
                            onDragStart={() => handleDragStart(c.id)}
                            onDragOver={(e) => handleDragOver(e, c.id)}
                            onDrop={() => handleDrop(c.id)}
                            onDragEnd={handleDragEnd}
                            style={{
                              opacity: isDragging ? 0.4 : c.eliminated ? 0.4 : 1,
                              textDecoration: c.eliminated ? 'line-through' : undefined,
                              borderTop: isDragOver && !isDragging ? '2px solid #ff6b2c' : undefined,
                              cursor: 'grab',
                              transition: 'opacity 0.15s',
                            }}
                          >
                            <td style={{ padding: '12px 6px 12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#2a2f40', fontSize: '16px', userSelect: 'none' }}>⠿</td>
                            <td className="text-[13px]" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)' }}>
                              <span className="font-mono font-bold text-[14px]" style={{ color: '#ff6b2c' }}>{c.run_order}</span>
                            </td>
                            <td className="text-[13px] font-bold" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#f0f2f8' }}>
                              {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
                            </td>
                            <td className="text-[12px]" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#8b90a5' }}>
                              {c.breed !== '—' ? c.breed : '—'}
                            </td>
                            <td className="text-[13px]" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#8b90a5' }}>
                              {c.human_name}
                            </td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)' }}>
                              {statusEl}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
