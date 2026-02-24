import type { Size } from '../types/index.ts';

const bgColors: Record<Size, string> = {
  S: 'rgba(244,114,182,0.15)',
  M: 'rgba(96,165,250,0.15)',
  I: 'rgba(52,211,153,0.15)',
  L: 'rgba(251,191,36,0.15)',
};

const textColors: Record<Size, string> = {
  S: '#f472b6',
  M: '#60a5fa',
  I: '#34d399',
  L: '#fbbf24',
};

export default function SizeTag({ size }: { size: Size }) {
  return (
    <span
      className="inline-flex items-center justify-center w-[30px] h-[22px] rounded-[6px] text-[11px] font-bold font-mono"
      style={{ background: bgColors[size], color: textColors[size] }}
    >
      {size}
    </span>
  );
}
