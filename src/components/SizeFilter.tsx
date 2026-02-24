import type { Size } from '../types/index.ts';
import { SIZES, SIZE_LABELS } from '../constants/index.ts';

const activeStyles: Record<Size, { borderColor: string; background: string; color: string }> = {
  S: { borderColor: '#f472b6', background: 'rgba(244,114,182,0.1)', color: '#f472b6' },
  M: { borderColor: '#60a5fa', background: 'rgba(96,165,250,0.1)', color: '#60a5fa' },
  I: { borderColor: '#34d399', background: 'rgba(52,211,153,0.1)', color: '#34d399' },
  L: { borderColor: '#fbbf24', background: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
};

interface SizeFilterProps {
  mode: 'multi' | 'single';
  activeMulti?: Size[];
  activeSingle?: Size;
  onToggleMulti?: (size: Size) => void;
  onSelectSingle?: (size: Size) => void;
  showLabel?: boolean;
}

export default function SizeFilter({
  mode,
  activeMulti = [],
  activeSingle,
  onToggleMulti,
  onSelectSingle,
  showLabel = true,
}: SizeFilterProps) {
  const isActive = (s: Size) =>
    mode === 'multi' ? activeMulti.includes(s) : activeSingle === s;

  const handleClick = (s: Size) => {
    if (mode === 'multi' && onToggleMulti) onToggleMulti(s);
    if (mode === 'single' && onSelectSingle) onSelectSingle(s);
  };

  return (
    <div className="flex gap-2 mb-5 flex-wrap items-center">
      {showLabel && (
        <label className="text-[12px] font-semibold uppercase tracking-[1px] mr-1.5" style={{ color: '#555b73' }}>
          Size
        </label>
      )}
      {SIZES.map((s) => {
        const active = isActive(s);
        const styles = active ? activeStyles[s] : { borderColor: '#2a2f40', background: 'transparent', color: '#8b90a5' };
        return (
          <button
            key={s}
            onClick={() => handleClick(s)}
            className="cursor-pointer text-[12px] font-bold transition-all duration-200"
            style={{
              padding: '5px 16px',
              borderRadius: '20px',
              border: `2px solid ${active ? styles.borderColor : '#2a2f40'}`,
              background: active ? styles.background : 'transparent',
              color: active ? styles.color : '#8b90a5',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {mode === 'single' ? `${s} — ${SIZE_LABELS[s]}` : s}
          </button>
        );
      })}
    </div>
  );
}
