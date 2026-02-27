import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEventRounds,
  getEventCompetitors,
  saveCompetitorScore,
  eliminateCompetitor as dbEliminateCompetitor,
} from '../../lib/db.ts';
import { dogEmoji, SIZES, SIZE_LABELS, SIZE_COLORS } from '../../constants/index.ts';
import { calcTimeFault, isOverMCT } from '../../utils/scoring.ts';
import SizeTag from '../../components/SizeTag.tsx';
import type { EventRound, EventCompetitor } from '../../types/supabase.ts';
import type { Size } from '../../types/index.ts';

export default function ScoringPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size>('S');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Form fields
  const [fault, setFault] = useState('');
  const [refusal, setRefusal] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!eventId) return;
    Promise.all([getEventRounds(eventId), getEventCompetitors(eventId)])
      .then(([rds, comps]) => {
        setRounds(rds);
        setCompetitors(comps);
        if (rds.length > 0) setSelectedRoundId(rds[0].id);
        // Default to first active size
        const firstSize = (['S', 'M', 'I', 'L'] as Size[]).find((s) => comps.some((c) => c.size === s));
        if (firstSize) setSelectedSize(firstSize);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const queueData = competitors
    .filter((c) => c.round_id === selectedRoundId && c.size === selectedSize)
    .sort((a, b) => a.run_order - b.run_order);

  const competitor = competitors.find((c) => c.id === selectedId) ?? null;

  // Sync form when competitor changes
  useEffect(() => {
    if (competitor) {
      setFault(competitor.fault?.toString() ?? '');
      setRefusal(competitor.refusal?.toString() ?? '');
      setTime(competitor.time_sec?.toString() ?? '');
    } else {
      setFault(''); setRefusal(''); setTime('');
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const f = parseInt(fault) || 0;
  const r = parseInt(refusal) || 0;
  const t = parseFloat(time) || 0;
  const sct = selectedRound?.sct ?? 0;
  const mct = selectedRound?.mct ?? 0;
  const tf = calcTimeFault(t, sct);
  const overMCT = isOverMCT(t, mct);
  const total = f + r + tf;

  const applyUpdate = (updated: EventCompetitor) => {
    setCompetitors((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleSave = async () => {
    if (!competitor) return;
    setSaving(true);
    try {
      const updated = await saveCompetitorScore(competitor.id, {
        fault: f, refusal: r, time_sec: t, time_fault: tf,
        total_fault: overMCT ? null : total,
        eliminated: overMCT,
      });
      applyUpdate(updated);
      setSavedId(competitor.id);
      setTimeout(() => setSavedId(null), 1500);
      // Auto-advance to next unscored
      const idx = queueData.findIndex((c) => c.id === competitor.id);
      const next = queueData.slice(idx + 1).find((c) => c.total_fault === null && !c.eliminated);
      if (next) setSelectedId(next.id);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminate = async () => {
    if (!competitor) return;
    setSaving(true);
    try {
      await dbEliminateCompetitor(competitor.id);
      applyUpdate({ ...competitor, eliminated: true, fault: null, refusal: null, time_sec: null, time_fault: null, total_fault: null });
      // Auto-advance
      const idx = queueData.findIndex((c) => c.id === competitor.id);
      const next = queueData.slice(idx + 1).find((c) => c.total_fault === null && !c.eliminated);
      if (next) setSelectedId(next.id);
    } finally {
      setSaving(false);
    }
  };

  const activeSizes = SIZES.filter((s) => competitors.some((c) => c.round_id === selectedRoundId && c.size === s));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  return (
    <main className="max-w-[1000px] mx-auto px-5 py-8">
      <Link to={`/host/events/${eventId}`} className="text-[13px] no-underline mb-6 inline-block" style={{ color: '#8b90a5' }}>← Event Hub</Link>
      <h1 className="font-display text-[22px] mb-5" style={{ color: '#f0f2f8' }}>Scoring</h1>

      {/* Round tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {rounds.map((r) => (
          <button key={r.id} onClick={() => { setSelectedRoundId(r.id); setSelectedId(null); }}
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
            <button key={s} onClick={() => { setSelectedSize(s); setSelectedId(null); }}
              className="cursor-pointer text-[12px] font-bold"
              style={{ padding: '5px 14px', borderRadius: '20px', border: `2px solid ${selectedSize === s ? color : '#2a2f40'}`, background: selectedSize === s ? `${color}1a` : 'transparent', color: selectedSize === s ? color : '#8b90a5' }}>
              {s} — {SIZE_LABELS[s]}
            </button>
          );
        })}
      </div>

      {/* SCT / MCT */}
      {selectedRound && (
        <p className="text-[12px] mb-5" style={{ color: '#555b73' }}>
          SCT {selectedRound.sct}s · MCT {selectedRound.mct}s
        </p>
      )}

      {queueData.length === 0 ? (
        <div className="text-center py-12" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
          <p className="text-[13px]" style={{ color: '#8b90a5' }}>
            {rounds.length === 0 ? 'No rounds configured.' : 'No competitors for this round & size. Approve registrations first.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-[300px_1fr]">
          {/* Queue sidebar */}
          <div className="sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto" style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40' }}>
            <div className="font-display text-[13px]" style={{ padding: '14px 18px', borderBottom: '1px solid #2a2f40', color: '#f0f2f8' }}>
              Queue · {queueData.length}
            </div>
            {queueData.map((c) => {
              const isActive = selectedId === c.id;
              const scored = c.total_fault !== null || c.eliminated;
              return (
                <div key={c.id} onClick={() => setSelectedId(c.id)}
                  className="flex items-center gap-2.5 cursor-pointer"
                  style={{ padding: '10px 18px', borderBottom: '1px solid rgba(42,47,64,0.4)', background: isActive ? 'rgba(255,107,44,0.15)' : 'transparent', borderLeft: isActive ? '3px solid #ff6b2c' : '3px solid transparent', opacity: scored && !isActive ? 0.5 : 1 }}>
                  <span className="font-mono text-[12px] font-bold w-[22px]" style={{ color: '#555b73' }}>{c.run_order}</span>
                  <div>
                    <div className="font-bold text-[13px]" style={{ color: '#f0f2f8' }}>
                      {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
                      {savedId === c.id && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(45,212,160,0.2)', color: '#2dd4a0' }}>Saved ✓</span>}
                      {c.eliminated && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>ELIM</span>}
                      {!c.eliminated && c.total_fault !== null && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(45,212,160,0.15)', color: '#2dd4a0' }}>✓ {c.total_fault}</span>}
                    </div>
                    <div className="text-[11px]" style={{ color: '#8b90a5' }}>{c.human_name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scoring form */}
          <div style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40', height: 'fit-content' }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #2a2f40' }}>
              <div className="font-display text-[24px] mb-1" style={{ color: '#f0f2f8' }}>
                {competitor ? `${competitor.icon || dogEmoji(competitor.dog_name)} ${competitor.dog_name}` : 'Select a competitor'}
              </div>
              <div className="text-[13px] flex gap-3 items-center flex-wrap" style={{ color: '#8b90a5' }}>
                <span>{competitor?.human_name ?? '—'}</span>
                {competitor && (
                  <>
                    <SizeTag size={competitor.size} />
                    <span style={{ color: '#555b73' }}>{competitor.breed !== '—' ? competitor.breed : ''}</span>
                    <span style={{ color: '#f0f2f8' }}>#{competitor.run_order}</span>
                  </>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div style={{ padding: '20px' }}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Faults (course)', value: fault, onChange: setFault, step: '5' },
                  { label: 'Refusals', value: refusal, onChange: setRefusal, step: '5' },
                  { label: 'Time (sec)', value: time, onChange: setTime, step: '0.01', placeholder: '0.00' },
                ].map(({ label, value, onChange, step, placeholder }) => (
                  <div key={label}>
                    <label className="block text-[10px] font-bold uppercase tracking-[1px] mb-1.5" style={{ color: '#555b73' }}>{label}</label>
                    <input type="number" min="0" step={step} placeholder={placeholder ?? '0'} value={value}
                      onChange={(e) => onChange(e.target.value)} disabled={!competitor}
                      className="w-full outline-none text-center"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '2px solid #2a2f40', background: '#1c2030', color: '#f0f2f8', fontFamily: "'JetBrains Mono', monospace", fontSize: '16px', fontWeight: 600 }}
                    />
                  </div>
                ))}
              </div>

              {/* Fault breakdown */}
              <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: 'repeat(7, 1fr)', background: '#1c2030', border: '1px solid #2a2f40', borderRadius: '8px', padding: '14px' }}>
                {[
                  { label: 'Course', value: f, color: '#f0f2f8' },
                  { label: '+', value: null, color: '#555b73', op: true },
                  { label: 'Refusals', value: r, color: '#f0f2f8' },
                  { label: '+', value: null, color: '#555b73', op: true },
                  { label: 'Time Faults', value: tf, color: tf > 0 ? '#fbbf24' : '#2dd4a0' },
                  { label: '=', value: null, color: '#555b73', op: true },
                  { label: 'Total', value: overMCT ? 'ELIM' : total, color: overMCT ? '#ef4444' : total === 0 ? '#2dd4a0' : '#ff6b2c' },
                ].map((item, i) => (
                  item.op ? (
                    <div key={i} className="flex items-center justify-center text-[18px]" style={{ color: item.color }}>{item.label}</div>
                  ) : (
                    <div key={i} className="text-center">
                      <div className="text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>{item.label}</div>
                      <div className="font-mono font-bold" style={{ fontSize: item.label === 'Total' ? '18px' : '15px', color: item.color }}>{item.value}</div>
                    </div>
                  )
                ))}
              </div>

              {overMCT && (
                <div className="text-center font-bold text-[13px] mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#ef4444' }}>
                  ⚠️ OVER MAXIMUM COURSE TIME — Auto-Eliminated
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end flex-wrap">
                <button onClick={handleEliminate} disabled={!competitor || saving}
                  className="cursor-pointer text-[13px] font-bold disabled:opacity-40"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  🚫 Eliminate
                </button>
                <button onClick={() => { setFault(''); setRefusal(''); setTime(''); }}
                  className="cursor-pointer text-[13px] font-bold"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #2a2f40', background: '#1c2030', color: '#8b90a5' }}>
                  Clear
                </button>
                <button onClick={handleSave} disabled={!competitor || saving}
                  className="cursor-pointer text-[13px] font-bold disabled:opacity-40"
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#ff6b2c', color: '#fff' }}>
                  {saving ? 'Saving…' : '✅ Save Score'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
