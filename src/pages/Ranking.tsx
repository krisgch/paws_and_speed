import { useRef, useState } from 'react';
import useStore from '../store/useStore.ts';
import SizeFilter from '../components/SizeFilter.tsx';
import CourseInfoBar from '../components/CourseInfoBar.tsx';
import Podium from '../components/Podium.tsx';
import SizeTag from '../components/SizeTag.tsx';
import { dogEmoji, SIZES, SIZE_LABELS } from '../constants/index.ts';
import { rankCompetitors } from '../utils/scoring.ts';
import { exportExcel, exportJSON, exportPDF, importJSON, exportSharePNG } from '../utils/export.ts';
import type { Size } from '../types/index.ts';

export default function Ranking() {
  const { competitors, currentRound, rounds, courseTimeConfig, rankingSizeFilter, setRankingSizeFilter, importData, showToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const data = competitors.filter((c) => c.round === currentRound && c.size === rankingSizeFilter);
  const ranked = rankCompetitors(data);
  const scoredCount = ranked.filter((c) => c.rank !== null).length;

  const handleExportExcel = () => {
    exportExcel(competitors, courseTimeConfig, rounds);
    showToast('Excel exported!');
  };

  const handleExportPDF = () => {
    exportPDF(competitors, courseTimeConfig, rounds);
    showToast('PDF exported!');
  };

  const handleExportJSON = () => {
    exportJSON(competitors, courseTimeConfig);
    showToast('JSON backup exported!');
  };

  const availableSizes = SIZES.filter((s) =>
    competitors.some((c) => c.round === currentRound && c.size === s)
  );

  const handleSharePNG = (size: Size) => {
    exportSharePNG(currentRound, size, competitors, courseTimeConfig);
    setShareOpen(false);
    showToast(`PNG exported for ${SIZE_LABELS[size]}!`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importJSON(
      file,
      (d) => { importData(d); showToast('Data imported successfully!'); },
      () => showToast('Invalid JSON file')
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Separate scored with rank from eliminated and pending for display
  const scoredRanked = ranked.filter((c) => c.rank !== null);

  const btnStyle = {
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid #2a2f40',
    background: '#1c2030',
    color: '#8b90a5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  } as const;

  return (
    <div>
      {/* Export bar */}
      <div
        className="flex gap-2.5 items-center flex-wrap mb-5"
        style={{ padding: '14px 20px', background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}
      >
        <span className="text-[12px] font-semibold uppercase tracking-[1px] mr-2" style={{ color: '#555b73' }}>Export</span>
        <button onClick={handleExportExcel} style={btnStyle}>📊 Excel (.xlsx)</button>
        <button onClick={handleExportPDF} style={btnStyle}>📄 PDF</button>
        <button onClick={handleExportJSON} style={btnStyle}>💾 JSON Backup</button>
        <label style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          📂 Import JSON
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
        </label>
        {/* Share PNG */}
        <div className="relative">
          <button
            onClick={() => setShareOpen(!shareOpen)}
            style={{ ...btnStyle, background: shareOpen ? '#1c2030' : btnStyle.background }}
          >
            📤 Share PNG
          </button>
          {shareOpen && (
            <div
              className="absolute top-[calc(100%+6px)] right-0 z-[200] overflow-hidden"
              style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: '160px' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[1px]" style={{ padding: '10px 14px 6px', color: '#555b73' }}>
                {currentRound}
              </div>
              {availableSizes.length === 0 ? (
                <div className="text-[12px]" style={{ padding: '8px 14px 12px', color: '#555b73' }}>No competitors</div>
              ) : (
                availableSizes.map((s) => (
                  <div
                    key={s}
                    onClick={() => handleSharePNG(s)}
                    className="flex items-center gap-2 cursor-pointer text-[13px] font-medium transition-colors duration-150"
                    style={{ padding: '9px 14px', borderTop: '1px solid rgba(42,47,64,0.4)', color: '#f0f2f8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1e28')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <SizeTag size={s} /> {SIZE_LABELS[s]}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <SizeFilter
        mode="single"
        activeSingle={rankingSizeFilter}
        onSelectSingle={setRankingSizeFilter}
      />
      <CourseInfoBar />

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
                <th
                  key={h}
                  className={`text-left text-[10px] font-bold uppercase tracking-[1px] whitespace-nowrap${hiddenClass}`}
                  style={{
                    padding: '10px 14px',
                    color: '#555b73',
                    background: 'rgba(0,0,0,0.2)',
                    borderBottom: '1px solid #2a2f40',
                  }}
                >
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
              const isClear = c.totalFault === 0 && !c.eliminated;

              let rankEl: React.ReactNode;
              if (c.rank === 1) rankEl = <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-[13px] font-bold font-mono" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>🥇</span>;
              else if (c.rank === 2) rankEl = <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-[13px] font-bold font-mono" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>🥈</span>;
              else if (c.rank === 3) rankEl = <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-[13px] font-bold font-mono" style={{ background: 'rgba(217,119,6,0.15)', color: '#d97706' }}>🥉</span>;
              else if (c.rank) rankEl = <span className="font-mono" style={{ color: '#555b73' }}>{c.rank}</span>;
              else rankEl = <span style={{ color: '#555b73' }}>—</span>;

              const tdStyle = { padding: '12px 14px', borderBottom: '1px solid rgba(42,47,64,0.5)', fontSize: '13px' };

              if (isEliminated) {
                return (
                  <tr key={c.id} style={{ opacity: 0.4, textDecoration: 'line-through' }}>
                    <td style={tdStyle}>{rankEl}</td>
                    <td className="hidden sm:table-cell" style={tdStyle}><SizeTag size={c.size} /></td>
                    <td style={tdStyle}>{c.icon || dogEmoji(c.dog)} {c.dog}</td>
                    <td className="hidden sm:table-cell" style={{ ...tdStyle, color: '#8b90a5', fontSize: '12px' }}>{c.breed || '—'}</td>
                    <td style={tdStyle}>{c.human}</td>
                    <td className="hidden md:table-cell" style={tdStyle} />
                    <td className="hidden md:table-cell" style={tdStyle} />
                    <td className="hidden md:table-cell" style={tdStyle} />
                    <td colSpan={2} style={tdStyle}>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                        ELIMINATED
                      </span>
                    </td>
                  </tr>
                );
              }

              if (isPending) {
                return (
                  <tr key={c.id} style={{ opacity: 0.4 }}>
                    <td style={tdStyle}>{rankEl}</td>
                    <td className="hidden sm:table-cell" style={tdStyle}><SizeTag size={c.size} /></td>
                    <td style={tdStyle}>{c.icon || dogEmoji(c.dog)} {c.dog}</td>
                    <td className="hidden sm:table-cell" style={{ ...tdStyle, color: '#8b90a5', fontSize: '12px' }}>{c.breed || '—'}</td>
                    <td style={tdStyle}>{c.human}</td>
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
                  <td style={{ ...tdStyle, color: '#f0f2f8' }}>
                    <span className="font-bold">
                      {c.icon || dogEmoji(c.dog)} {c.dog}
                      {isClear && (
                        <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(45,212,160,0.15)', color: '#2dd4a0' }}>
                          CLEAR
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell" style={{ ...tdStyle, color: '#8b90a5', fontSize: '12px' }}>{c.breed || '—'}</td>
                  <td style={{ ...tdStyle, color: '#8b90a5' }}>{c.human}</td>
                  <td className="hidden md:table-cell" style={{ ...tdStyle, color: c.fault === 0 ? '#2dd4a0' : '#f0f2f8' }}>{c.fault}</td>
                  <td className="hidden md:table-cell" style={{ ...tdStyle, color: c.refusal === 0 ? '#2dd4a0' : '#f0f2f8' }}>{c.refusal}</td>
                  <td className="hidden md:table-cell" style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: (c.timeFault ?? 0) === 0 ? '#2dd4a0' : '#f0f2f8' }}>{c.timeFault ?? 0}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isClear ? '#2dd4a0' : '#ff6b2c' }}>{c.totalFault}</td>
                  <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace" }}>
                    {c.time?.toFixed(2)}s
                    {(c.timeFault ?? 0) > 0 && (
                      <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[6px]" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                        +{c.timeFault}TF
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Ranking logic note */}
      <div
        className="text-[12px] mt-3.5"
        style={{ padding: '12px 16px', background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', color: '#555b73' }}
      >
        <strong style={{ color: '#8b90a5' }}>Ranking Logic:</strong>{' '}
        ① Clear runs (Total Faults = 0) first, ranked by fastest time →{' '}
        ② Then lowest Total Faults →{' '}
        ③ Ties broken by fastest time →{' '}
        ④ Eliminated last
      </div>
    </div>
  );
}
