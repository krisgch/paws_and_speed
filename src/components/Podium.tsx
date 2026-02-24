import type { RankedCompetitor } from '../utils/scoring.ts';
import { dogEmoji } from '../constants/index.ts';

interface PodiumProps {
  ranked: RankedCompetitor[];
}

const podiumConfig = [
  {
    place: 2,
    height: '68px',
    borderColor: '#94a3b8',
    avatarBg: 'rgba(148,163,184,0.1)',
    barBg: 'linear-gradient(180deg,rgba(148,163,184,0.15),rgba(148,163,184,0.03))',
    barColor: '#94a3b8',
  },
  {
    place: 1,
    height: '90px',
    borderColor: '#fbbf24',
    avatarBg: 'rgba(251,191,36,0.1)',
    barBg: 'linear-gradient(180deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05))',
    barColor: '#fbbf24',
  },
  {
    place: 3,
    height: '50px',
    borderColor: '#d97706',
    avatarBg: 'rgba(217,119,6,0.1)',
    barBg: 'linear-gradient(180deg,rgba(217,119,6,0.15),rgba(217,119,6,0.03))',
    barColor: '#d97706',
  },
];

export default function Podium({ ranked }: PodiumProps) {
  if (ranked.length < 3) return null;

  // Display order: 2nd, 1st, 3rd
  const display = [ranked[1], ranked[0], ranked[2]];

  return (
    <div className="flex justify-center items-end gap-3 mb-7 py-4">
      {display.map((c, i) => {
        const cfg = podiumConfig[i];
        return (
          <div key={c.id} className="flex flex-col items-center gap-1.5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                border: `3px solid ${cfg.borderColor}`,
                background: cfg.avatarBg,
              }}
            >
              {dogEmoji(c.dog)}
            </div>
            <div className="font-bold text-[13px] text-center" style={{ color: '#f0f2f8' }}>{c.dog}</div>
            <div className="text-[11px] text-center" style={{ color: '#8b90a5' }}>{c.human}</div>
            <div className="font-mono text-[10px]" style={{ color: '#555b73' }}>
              {c.totalFault}F · {c.time?.toFixed(2)}s
            </div>
            <div
              className="w-[110px] flex items-center justify-center font-display text-[22px]"
              style={{
                height: cfg.height,
                background: cfg.barBg,
                color: cfg.barColor,
                borderRadius: '8px 8px 0 0',
              }}
            >
              {cfg.place}
            </div>
          </div>
        );
      })}
    </div>
  );
}
