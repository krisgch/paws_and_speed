import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore.ts';

export default function RoundDropdown() {
  const { currentRound, setRound, rounds } = useStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 min-w-[180px] justify-between cursor-pointer transition-colors duration-200"
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #2a2f40',
          background: '#1c2030',
          color: '#f0f2f8',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span>{currentRound}</span>
        <span
          className="text-[10px] transition-transform duration-200"
          style={{ color: '#555b73', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-[200] overflow-hidden"
          style={{
            background: '#14171e',
            border: '1px solid #2a2f40',
            borderRadius: '8px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}
        >
          {rounds.map((r) => (
            <div
              key={r}
              onClick={() => { setRound(r); setOpen(false); }}
              className="cursor-pointer text-[13px] font-medium transition-colors duration-150"
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(42,47,64,0.4)',
                background: r === currentRound ? 'rgba(255,107,44,0.15)' : 'transparent',
                color: r === currentRound ? '#ff6b2c' : '#f0f2f8',
                fontWeight: r === currentRound ? 700 : 500,
              }}
              onMouseEnter={(e) => { if (r !== currentRound) (e.target as HTMLElement).style.background = '#1a1e28'; }}
              onMouseLeave={(e) => { if (r !== currentRound) (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
