import { useState, useEffect } from 'react';
import useStore from '../../store/useStore.ts';
import SizeTag from '../../components/SizeTag.tsx';
import { dogEmoji } from '../../constants/index.ts';
import { calcTimeFault, isOverMCT } from '../../utils/scoring.ts';

export default function ScoringForm() {
  const { competitors, selectedCompetitorId, currentRound, courseTimeConfig, saveScore, eliminateCompetitor, showToast } = useStore();

  const competitor = competitors.find((c) => c.id === selectedCompetitorId);
  const ct = courseTimeConfig[currentRound] ?? { sct: 0, mct: 0 };

  const [fault, setFault] = useState('');
  const [refusal, setRefusal] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (competitor) {
      setFault(competitor.fault?.toString() ?? '');
      setRefusal(competitor.refusal?.toString() ?? '');
      setTime(competitor.time?.toString() ?? '');
    } else {
      setFault('');
      setRefusal('');
      setTime('');
    }
  }, [competitor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const f = parseInt(fault) || 0;
  const r = parseInt(refusal) || 0;
  const t = parseFloat(time) || 0;
  const tf = calcTimeFault(t, ct.sct);
  const overMCT = isOverMCT(t, ct.mct);
  const total = f + r + tf;

  const handleSave = () => {
    if (!competitor) return;
    saveScore(competitor.id, f, r, t);
    if (overMCT) {
      showToast(`${competitor.dog} eliminated — over MCT (${ct.mct}s)`);
    } else {
      showToast(`Score saved for ${competitor.dog}! Total: ${f + r + tf} faults`);
    }
  };

  const handleEliminate = () => {
    if (!competitor) return;
    eliminateCompetitor(competitor.id);
    showToast(`${competitor.dog} eliminated`);
  };

  const handleClear = () => {
    setFault('');
    setRefusal('');
    setTime('');
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #2a2f40',
    background: '#1c2030',
    color: '#f0f2f8',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    fontWeight: 600,
    textAlign: 'center' as const,
    outline: 'none',
  };

  return (
    <div style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40', height: 'fit-content' }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="font-display text-[24px] mb-1" style={{ color: '#f0f2f8' }}>
          {competitor ? `${competitor.icon || dogEmoji(competitor.dog)} ${competitor.dog}` : 'Select a competitor'}
        </div>
        <div className="text-[13px] flex gap-3.5 items-center" style={{ color: '#8b90a5' }}>
          <span>{competitor?.human ?? '—'}</span>
          {competitor && (
            <>
              <SizeTag size={competitor.size} />
              <span style={{ color: '#555b73' }}>{competitor.breed}</span>
              <span style={{ color: '#f0f2f8' }}>#{competitor.order}</span>
            </>
          )}
        </div>
      </div>

      {/* Form body */}
      <div style={{ padding: '20px' }}>
        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3.5 mb-3.5 max-[900px]:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[1px] mb-1.5" style={{ color: '#555b73' }}>
              Faults (course)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              placeholder="0"
              value={fault}
              onChange={(e) => setFault(e.target.value)}
              style={inputStyle}
              disabled={!competitor}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[1px] mb-1.5" style={{ color: '#555b73' }}>
              Refusals
            </label>
            <input
              type="number"
              min="0"
              step="5"
              placeholder="0"
              value={refusal}
              onChange={(e) => setRefusal(e.target.value)}
              style={inputStyle}
              disabled={!competitor}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[1px] mb-1.5" style={{ color: '#555b73' }}>
              Time (sec)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={inputStyle}
              disabled={!competitor}
            />
          </div>
        </div>

        {/* Fault breakdown */}
        <div
          className="grid gap-2.5 mb-5"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            background: '#1c2030',
            border: '1px solid #2a2f40',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div className="text-center">
            <div className="text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>Course</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: '#f0f2f8' }}>{f}</div>
          </div>
          <div className="flex items-center justify-center text-[18px]" style={{ color: '#555b73' }}>+</div>
          <div className="text-center">
            <div className="text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>Refusals</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: '#f0f2f8' }}>{r}</div>
          </div>
          <div className="flex items-center justify-center text-[18px]" style={{ color: '#555b73' }}>+</div>
          <div className="text-center">
            <div className="text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>Time Faults</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: tf > 0 ? '#fbbf24' : '#2dd4a0' }}>{tf}</div>
          </div>
          <div className="flex items-center justify-center text-[18px]" style={{ color: '#555b73' }}>=</div>
          <div className="text-center">
            <div className="text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>Total</div>
            <div
              className="font-mono text-[18px] font-bold"
              style={{ color: overMCT ? '#ef4444' : total === 0 ? '#2dd4a0' : '#ff6b2c' }}
            >
              {overMCT ? 'ELIM' : total}
            </div>
          </div>
        </div>

        {/* Over MCT warning */}
        {overMCT && (
          <div
            className="text-center font-bold text-[13px] mb-4"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#ef4444',
            }}
          >
            ⚠️ OVER MAXIMUM COURSE TIME — Auto-Eliminated
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5 justify-end flex-wrap">
          <button
            onClick={handleEliminate}
            disabled={!competitor}
            className="cursor-pointer text-[13px] font-bold flex items-center gap-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
            }}
          >
            🚫 Eliminate
          </button>
          <button
            onClick={handleClear}
            className="cursor-pointer text-[13px] font-bold transition-all duration-200"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid #2a2f40',
              background: '#1c2030',
              color: '#8b90a5',
            }}
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={!competitor}
            className="cursor-pointer text-[13px] font-bold flex items-center gap-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#ff6b2c',
              color: '#fff',
            }}
          >
            ✅ Save Score
          </button>
        </div>
      </div>
    </div>
  );
}
