import React, { useState } from 'react';
import useStore from '../store/useStore.ts';
import CourseInfoBar from '../components/CourseInfoBar.tsx';
import NowRunning from '../components/NowRunning.tsx';
import SizeTag from '../components/SizeTag.tsx';
import { dogEmoji, SIZES, SIZE_LABELS, SIZE_COLORS } from '../constants/index.ts';
import type { Size } from '../types/index.ts';

const SIZES_ORDER: Record<Size, number> = { S: 0, M: 1, I: 2, L: 3 };

export default function RunningOrder() {
  const {
    competitors, currentRound,
    hostUnlocked, reorderCompetitorsInGroup,
  } = useStore();

  const [viewSize, setViewSize] = useState<Size | 'all'>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // All competitors in this round in competition order (S→M→I→L, then by run order)
  const allData = competitors
    .filter((c) => c.round === currentRound)
    .sort((a, b) => SIZES_ORDER[a.size] - SIZES_ORDER[b.size] || a.order - b.order);

  // Queue always computed from all sizes (so NowRunning is accurate regardless of filter)
  const queue = allData.filter((c) => c.totalFault === null && !c.eliminated);
  const nowRunning = queue[0];
  const upNext = queue.slice(1, 4);

  // Displayed data respects the size view filter
  const displayData = viewSize === 'all' ? allData : allData.filter((c) => c.size === viewSize);

  // Sizes that have at least one competitor in this round
  const activeSizes = SIZES.filter((s) => allData.some((c) => c.size === s));
  const sizesToRender = viewSize === 'all' ? activeSizes : activeSizes.filter((s) => s === viewSize);

  // ---- Drag & drop ----
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const dragged = allData.find((c) => c.id === draggedId);
    const target = allData.find((c) => c.id === targetId);
    if (!dragged || !target || dragged.size !== target.size) { setDraggedId(null); setDragOverId(null); return; }

    const group = allData.filter((c) => c.size === dragged.size).sort((a, b) => a.order - b.order);
    const fromIdx = group.findIndex((c) => c.id === draggedId);
    const toIdx = group.findIndex((c) => c.id === targetId);
    const newOrder = [...group];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    reorderCompetitorsInGroup(currentRound, dragged.size, newOrder.map((c) => c.id));
    setDraggedId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  // ---- Randomize ----
  const randomizeGroup = (size: Size) => {
    const group = allData.filter((c) => c.size === size);
    if (group.length < 2) return;
    const ids = group.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    reorderCompetitorsInGroup(currentRound, size, ids);
  };

  const totalCols = hostUnlocked ? 6 : 5;

  return (
    <div>
      <CourseInfoBar />
      <NowRunning competitor={nowRunning} upNext={upNext} />

      {/* Size view selector */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <label className="text-[12px] font-semibold uppercase tracking-[1px] mr-1.5" style={{ color: '#555b73' }}>
          Size
        </label>
        {(['all', ...SIZES] as const).map((s) => {
          const isAll = s === 'all';
          const active = viewSize === s;
          const color = isAll ? '#ff6b2c' : SIZE_COLORS[s as Size];
          return (
            <button
              key={s}
              onClick={() => setViewSize(s as Size | 'all')}
              className="cursor-pointer text-[12px] font-bold transition-all duration-200"
              style={{
                padding: '5px 16px',
                borderRadius: '20px',
                border: `2px solid ${active ? color : '#2a2f40'}`,
                background: active ? `${color}1a` : 'transparent',
                color: active ? color : '#8b90a5',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {isAll ? 'All' : `${s} — ${SIZE_LABELS[s as Size]}`}
            </button>
          );
        })}
      </div>

      <div style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40', overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
          <div className="font-display text-[15px] flex items-center gap-2.5" style={{ color: '#f0f2f8' }}>
            🐕 Running Order
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-[6px]" style={{ background: '#1c2030', color: '#555b73' }}>
              {displayData.length}
            </span>
          </div>
          {hostUnlocked && (
            <span className="text-[11px]" style={{ color: '#555b73' }}>
              ⠿ Drag to reorder · 🔀 Randomize per size group
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {hostUnlocked && <th style={{ width: '32px', padding: '10px 6px 10px 14px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #2a2f40' }} />}
              {['#', 'Dog', 'Breed', 'Handler', 'Status'].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-bold uppercase tracking-[1px] whitespace-nowrap"
                  style={{ padding: '10px 14px', color: '#555b73', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #2a2f40' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizesToRender.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center text-[13px]" style={{ padding: '40px', color: '#555b73' }}>
                  No competitors in this round
                </td>
              </tr>
            ) : (
              sizesToRender.map((size) => {
                const group = displayData.filter((c) => c.size === size);
                const color = SIZE_COLORS[size];

                return (
                  <React.Fragment key={size}>
                    {/* Size group header row */}
                    <tr>
                      <td
                        colSpan={totalCols}
                        style={{
                          padding: '8px 16px',
                          background: `${color}0d`,
                          borderTop: '1px solid rgba(42,47,64,0.5)',
                          borderBottom: `1px solid ${color}28`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <SizeTag size={size} />
                            <span className="text-[12px] font-bold" style={{ color }}>{SIZE_LABELS[size]}</span>
                            <span className="font-mono text-[11px]" style={{ color: '#555b73' }}>
                              {group.length} dog{group.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {hostUnlocked && (
                            <button
                              onClick={() => randomizeGroup(size)}
                              className="cursor-pointer text-[11px] font-bold transition-all duration-150"
                              style={{
                                padding: '3px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${color}40`,
                                background: `${color}0d`,
                                color,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = `${color}22`)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = `${color}0d`)}
                            >
                              🔀 Randomize
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Competitor rows */}
                    {group.map((c) => {
                      const isRunning = nowRunning?.id === c.id;
                      const isDone = c.totalFault !== null && !c.eliminated;
                      const isEliminated = c.eliminated;
                      const isDragging = draggedId === c.id;
                      const isDragOver = dragOverId === c.id;

                      let statusEl: React.ReactNode;
                      if (isEliminated) {
                        statusEl = (
                          <span className="inline-flex items-center gap-[5px] px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(85,91,115,0.2)', color: '#555b73' }}>
                            🚫 Elim
                          </span>
                        );
                      } else if (isDone) {
                        statusEl = (
                          <span className="inline-flex items-center gap-[5px] px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(45,212,160,0.15)', color: '#2dd4a0' }}>
                            <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'currentColor' }} />
                            Done
                          </span>
                        );
                      } else if (isRunning) {
                        statusEl = (
                          <span className="inline-flex items-center gap-[5px] px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(255,107,44,0.15)', color: '#ff6b2c' }}>
                            <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: 'currentColor' }} />
                            Running
                          </span>
                        );
                      } else {
                        statusEl = (
                          <span className="inline-flex items-center gap-[5px] px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(85,91,115,0.2)', color: '#555b73' }}>
                            <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'currentColor' }} />
                            Waiting
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={c.id}
                          draggable={hostUnlocked}
                          onDragStart={() => handleDragStart(c.id)}
                          onDragOver={(e) => handleDragOver(e, c.id)}
                          onDrop={() => handleDrop(c.id)}
                          onDragEnd={handleDragEnd}
                          style={{
                            opacity: isDragging ? 0.4 : isEliminated ? 0.4 : 1,
                            textDecoration: isEliminated ? 'line-through' : undefined,
                            borderTop: isDragOver && !isDragging ? '2px solid #ff6b2c' : undefined,
                            cursor: hostUnlocked ? 'grab' : undefined,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          {hostUnlocked && (
                            <td style={{ padding: '12px 6px 12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#2a2f40', fontSize: '16px', userSelect: 'none' }}>
                              ⠿
                            </td>
                          )}
                          <td className="text-[13px]" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)' }}>
                            <span className="font-mono font-bold text-[14px]" style={{ color: '#ff6b2c' }}>{c.order}</span>
                          </td>
                          <td className="text-[13px] font-bold" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#f0f2f8' }}>
                            {c.icon || dogEmoji(c.dog)} {c.dog}
                          </td>
                          <td className="text-[12px]" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#8b90a5' }}>
                            {c.breed || '—'}
                          </td>
                          <td className="text-[13px]" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', color: '#8b90a5' }}>
                            {c.human}
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
    </div>
  );
}
