import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventRounds, getEventCompetitors } from '../../lib/db.ts';
import { dogEmoji, SIZES, SIZE_LABELS, SIZE_COLORS } from '../../constants/index.ts';
import { rankCompetitors } from '../../utils/scoring.ts';
import { exportExcel, exportPDF, exportSharePNG } from '../../utils/export.ts';
import Podium from '../../components/Podium.tsx';
import SizeTag from '../../components/SizeTag.tsx';
import type { EventRound, EventCompetitor } from '../../types/supabase.ts';
import type { Size } from '../../types/index.ts';

export default function RankingsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size>('S');
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([getEventRounds(eventId), getEventCompetitors(eventId)])
      .then(([rds, comps]) => {
        setRounds(rds);
        setCompetitors(comps);
        if (rds.length > 0) setSelectedRoundId(rds[0].id);
        const firstSize = (['S', 'M', 'I', 'L'] as Size[]).find((s) => comps.some((c) => c.size === s));
        if (firstSize) setSelectedSize(firstSize);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const activeSizes = SIZES.filter((s) =>
    competitors.some((c) => c.round_id === selectedRoundId && c.size === s)
  );

  const data = competitors.filter((c) => c.round_id === selectedRoundId && c.size === selectedSize);
  const ranked = rankCompetitors(data);
  const scoredCount = ranked.filter((c) => c.rank !== null).length;
  const scoredRanked = ranked.filter((c) => c.rank !== null);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  const handleExportExcel = () => exportExcel(competitors, rounds);
  const handleExportPDF = () => exportPDF(competitors, rounds);
  const handleSharePNG = (size: Size) => {
    if (selectedRound) exportSharePNG(selectedRound, size, competitors);
    setShareOpen(false);
  };

  const btnStyle: React.CSSProperties = {
    padding: '6px 14px', borderRadius: '8px', border: '1px solid #2a2f40',
    background: '#1c2030', color: '#8b90a5', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
  };

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
      <h1 className="font-display text-[22px] mb-5" style={{ color: '#f0f2f8' }}>Rankings</h1>

      {/* Export bar */}
      <div className="flex gap-2 items-center flex-wrap mb-5" style={{ padding: '14px 20px', background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
        <span className="text-[12px] font-semibold uppercase tracking-[1px] mr-2" style={{ color: '#555b73' }}>Export</span>
        <button onClick={handleExportExcel} style={btnStyle}>📊 Excel (.xlsx)</button>
        <button onClick={handleExportPDF} style={btnStyle}>📄 PDF</button>
        <div className="relative">
          <button onClick={() => setShareOpen((v) => !v)} style={btnStyle}>📤 Share PNG</button>
          {shareOpen && (
            <div className="absolute top-[calc(100%+6px)] right-0 z-[200] overflow-hidden"
              style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: '160px' }}>
              <div className="text-[10px] font-bold uppercase tracking-[1px]" style={{ padding: '10px 14px 6px', color: '#555b73' }}>
                {selectedRound?.name ?? ''}
              </div>
              {activeSizes.length === 0 ? (
                <div className="text-[12px]" style={{ padding: '8px 14px 12px', color: '#555b73' }}>No competitors</div>
              ) : (
                activeSizes.map((s) => (
                  <div key={s} onClick={() => handleSharePNG(s)}
                    className="flex items-center gap-2 cursor-pointer text-[13px] font-medium"
                    style={{ padding: '9px 14px', borderTop: '1px solid rgba(42,47,64,0.4)', color: '#f0f2f8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1e28')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <SizeTag size={s} /> {SIZE_LABELS[s]}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Round tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {rounds.map((r) => (
          <button key={r.id} onClick={() => setSelectedRoundId(r.id)}
            className="cursor-pointer text-[12px] font-semibold"
            style={{ padding: '5px 14px', borderRadius: '20px', border: `2px solid ${selectedRoundId === r.id ? '#ff6b2c' : '#2a2f40'}`, background: selectedRoundId === r.id ? 'rgba(255,107,44,0.1)' : 'transparent', color: selectedRoundId === r.id ? '#ff6b2c' : '#8b90a5' }}>
            {r.name}
          </button>
        ))}
      </div>

      {/* Size tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {activeSizes.map((s) => {
          const color = SIZE_COLORS[s];
          return (
            <button key={s} onClick={() => setSelectedSize(s)}
              className="cursor-pointer text-[12px] font-bold"
              style={{ padding: '5px 14px', borderRadius: '20px', border: `2px solid ${selectedSize === s ? color : '#2a2f40'}`, background: selectedSize === s ? `${color}1a` : 'transparent', color: selectedSize === s ? color : '#8b90a5' }}>
              {s} — {SIZE_LABELS[s]}
            </button>
          );
        })}
      </div>

      {activeSizes.length === 0 ? (
        <div className="text-center py-12" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
          <p className="text-[13px]" style={{ color: '#8b90a5' }}>No scored competitors yet.</p>
        </div>
      ) : (
        <>
          <Podium ranked={scoredRanked} />

          <div style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40', overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
              <div className="font-display text-[15px] flex items-center gap-2.5" style={{ color: '#f0f2f8' }}>
                🏆 Results
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-[6px]" style={{ background: '#1c2030', color: '#555b73' }}>
                  {scoredCount} scored
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {(['Rank', 'Size', 'Dog', 'Breed', 'Handler', 'C.Faults', 'Refusals', 'T.Faults', 'Total F', 'Time'] as const).map((h) => {
                      const hiddenClass =
                        h === 'Breed' || h === 'Size' ? ' hidden sm:table-cell'
                        : h === 'C.Faults' || h === 'Refusals' || h === 'T.Faults' ? ' hidden md:table-cell'
                        : '';
                      return (
                        <th key={h} className={`text-left text-[10px] font-bold uppercase tracking-[1px] whitespace-nowrap${hiddenClass}`}
                          style={{ padding: '10px 14px', color: '#555b73', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #2a2f40' }}>
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((c) => {
                    const isEliminated = c.eliminated;
                    const isPending = c.rank === null && !c.eliminated;
                    const isClear = c.total_fault === 0 && !c.eliminated;
                    const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', fontSize: '13px' };

                    let rankEl: React.ReactNode;
                    if (c.rank === 1) rankEl = <span className="text-[20px]">🥇</span>;
                    else if (c.rank === 2) rankEl = <span className="text-[20px]">🥈</span>;
                    else if (c.rank === 3) rankEl = <span className="text-[20px]">🥉</span>;
                    else if (c.rank) rankEl = <span className="font-mono" style={{ color: '#555b73' }}>{c.rank}</span>;
                    else rankEl = <span style={{ color: '#555b73' }}>—</span>;

                    if (isEliminated) {
                      return (
                        <tr key={c.id} style={{ opacity: 0.4, textDecoration: 'line-through' }}>
                          <td style={tdStyle}>{rankEl}</td>
                          <td className="hidden sm:table-cell" style={tdStyle}><SizeTag size={c.size} /></td>
                          <td style={tdStyle}>{c.icon || dogEmoji(c.dog_name)} {c.dog_name}</td>
                          <td className="hidden sm:table-cell" style={{ ...tdStyle, color: '#8b90a5', fontSize: '12px' }}>{c.breed !== '—' ? c.breed : '—'}</td>
                          <td style={tdStyle}>{c.human_name}</td>
                          <td className="hidden md:table-cell" style={tdStyle} />
                          <td className="hidden md:table-cell" style={tdStyle} />
                          <td className="hidden md:table-cell" style={tdStyle} />
                          <td colSpan={2} style={tdStyle}>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>ELIMINATED</span>
                          </td>
                        </tr>
                      );
                    }

                    if (isPending) {
                      return (
                        <tr key={c.id} style={{ opacity: 0.4 }}>
                          <td style={tdStyle}>{rankEl}</td>
                          <td className="hidden sm:table-cell" style={tdStyle}><SizeTag size={c.size} /></td>
                          <td style={tdStyle}>{c.icon || dogEmoji(c.dog_name)} {c.dog_name}</td>
                          <td className="hidden sm:table-cell" style={{ ...tdStyle, color: '#8b90a5', fontSize: '12px' }}>{c.breed !== '—' ? c.breed : '—'}</td>
                          <td style={tdStyle}>{c.human_name}</td>
                          <td className="hidden md:table-cell" style={tdStyle} />
                          <td className="hidden md:table-cell" style={tdStyle} />
                          <td className="hidden md:table-cell" style={tdStyle} />
                          <td colSpan={2} style={{ ...tdStyle, color: '#555b73', fontStyle: 'italic' }}>Pending…</td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={c.id}>
                        <td style={tdStyle}>{rankEl}</td>
                        <td className="hidden sm:table-cell" style={tdStyle}><SizeTag size={c.size} /></td>
                        <td style={{ ...tdStyle, color: '#f0f2f8', fontWeight: 700 }}>
                          {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
                          {isClear && <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(45,212,160,0.15)', color: '#2dd4a0' }}>CLEAR</span>}
                        </td>
                        <td className="hidden sm:table-cell" style={{ ...tdStyle, color: '#8b90a5', fontSize: '12px' }}>{c.breed !== '—' ? c.breed : '—'}</td>
                        <td style={{ ...tdStyle, color: '#8b90a5' }}>{c.human_name}</td>
                        <td className="hidden md:table-cell" style={{ ...tdStyle, color: c.fault === 0 ? '#2dd4a0' : '#f0f2f8' }}>{c.fault}</td>
                        <td className="hidden md:table-cell" style={{ ...tdStyle, color: c.refusal === 0 ? '#2dd4a0' : '#f0f2f8' }}>{c.refusal}</td>
                        <td className="hidden md:table-cell" style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: (c.time_fault ?? 0) === 0 ? '#2dd4a0' : '#f0f2f8' }}>{c.time_fault ?? 0}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isClear ? '#2dd4a0' : '#ff6b2c' }}>{c.total_fault}</td>
                        <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace" }}>
                          {c.time_sec?.toFixed(2)}s
                          {(c.time_fault ?? 0) > 0 && (
                            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[6px]" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>+{c.time_fault}TF</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[12px] mt-3" style={{ padding: '12px 16px', background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', color: '#555b73' }}>
            <strong style={{ color: '#8b90a5' }}>Ranking Logic:</strong>{' '}
            ① Clear runs (0 faults) ranked by fastest time → ② Lowest total faults → ③ Ties by fastest time → ④ Eliminated last
          </div>
        </>
      )}
    </main>
  );
}
