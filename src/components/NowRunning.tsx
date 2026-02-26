import type { EventCompetitor } from '../types/supabase.ts';
import { dogEmoji, SIZE_LABELS } from '../constants/index.ts';
import SizeTag from './SizeTag.tsx';

interface NowRunningProps {
  competitor: EventCompetitor | undefined;
  upNext: EventCompetitor[];
  liveRound?: string;
  isViewingLive?: boolean;
}

export default function NowRunning({ competitor, upNext, liveRound, isViewingLive = true }: NowRunningProps) {
  if (!competitor) return null;

  const hasUpNext = upNext.length > 0;

  return (
    <div className="mb-5">
      {/* Now Running */}
      <div
        className="flex items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2.5"
        style={{
          background: 'linear-gradient(135deg,rgba(255,107,44,0.08),rgba(255,107,44,0.02))',
          border: '1px solid rgba(255,107,44,0.2)',
          borderRadius: hasUpNext ? '12px 12px 0 0' : '12px',
          padding: '16px 20px',
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-[7px] text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: '#ff6b2c' }}>
            <div className="w-[7px] h-[7px] rounded-full animate-pulse" style={{ background: '#ff6b2c' }} />
            NOW RUNNING
          </div>
          {!isViewingLive && liveRound && (
            <div className="text-[10px] font-semibold uppercase tracking-[1px]" style={{ color: '#555b73' }}>
              {liveRound}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-display text-[20px]" style={{ color: '#f0f2f8' }}>
            {competitor.icon || dogEmoji(competitor.dog_name)} {competitor.dog_name}
          </div>
          <div className="text-[14px]" style={{ color: '#8b90a5' }}>{competitor.human_name}</div>
        </div>
        <div className="flex gap-2.5 max-sm:ml-0">
          <div className="flex items-center gap-[5px] text-[12px] font-semibold" style={{ padding: '5px 12px', borderRadius: '8px', background: '#1c2030' }}>
            <SizeTag size={competitor.size} /> {SIZE_LABELS[competitor.size]}
          </div>
          <div className="flex items-center gap-[5px] text-[12px] font-semibold" style={{ padding: '5px 12px', borderRadius: '8px', background: '#1c2030', color: '#f0f2f8' }}>
            #{competitor.run_order}
          </div>
        </div>
      </div>

      {/* Up Next */}
      {hasUpNext && (
        <div
          style={{
            background: 'rgba(255,107,44,0.02)',
            border: '1px solid rgba(255,107,44,0.1)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '10px 20px',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] shrink-0" style={{ color: '#555b73' }}>
            Up Next
          </span>
          {upNext.map((c) => (
            <div key={c.id} className="flex items-center gap-[6px]">
              <SizeTag size={c.size} />
              <span className="text-[13px] font-semibold" style={{ color: '#f0f2f8' }}>
                {c.icon || dogEmoji(c.dog_name)} {c.dog_name}
              </span>
              <span className="text-[12px]" style={{ color: '#555b73' }}>{c.human_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
