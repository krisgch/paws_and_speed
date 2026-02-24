import useStore from '../../store/useStore.ts';
import { dogEmoji } from '../../constants/index.ts';

export default function ScoringQueue() {
  const { competitors, currentRound, scoringSizeFilter, selectedCompetitorId, setSelectedCompetitorId } = useStore();

  const data = competitors
    .filter((c) => c.round === currentRound && c.size === scoringSizeFilter)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      className="sticky top-[88px] max-h-[calc(100vh-110px)] overflow-y-auto"
      style={{ background: '#14171e', borderRadius: '12px', border: '1px solid #2a2f40' }}
    >
      <div className="font-display text-[13px]" style={{ padding: '14px 18px', borderBottom: '1px solid #2a2f40', color: '#f0f2f8' }}>
        Queue
      </div>
      {data.map((c) => {
        const isActive = selectedCompetitorId === c.id;
        const scored = c.totalFault !== null || c.eliminated;
        return (
          <div
            key={c.id}
            onClick={() => setSelectedCompetitorId(c.id)}
            className="flex items-center gap-2.5 cursor-pointer transition-all duration-150"
            style={{
              padding: '10px 18px',
              borderBottom: '1px solid rgba(42,47,64,0.4)',
              background: isActive ? 'rgba(255,107,44,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #ff6b2c' : '3px solid transparent',
              opacity: scored && !isActive ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#1a1e28'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="font-mono text-[12px] font-bold w-[22px]" style={{ color: '#555b73' }}>{c.order}</span>
            <div>
              <div className="font-bold text-[13px]" style={{ color: '#f0f2f8' }}>
                {c.icon || dogEmoji(c.dog)} {c.dog}
                {c.eliminated ? (
                  <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    ELIM
                  </span>
                ) : c.totalFault !== null && (
                  <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(45,212,160,0.15)', color: '#2dd4a0' }}>
                    ✓
                  </span>
                )}
              </div>
              <div className="text-[11px]" style={{ color: '#8b90a5' }}>
                {c.human} · <span style={{ color: '#555b73' }}>{c.breed}</span>
              </div>
            </div>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="text-center text-[13px] p-4" style={{ color: '#555b73' }}>
          No competitors for this size
        </div>
      )}
    </div>
  );
}
