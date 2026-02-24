import useStore from '../store/useStore.ts';

export default function CourseInfoBar() {
  const { currentRound, courseTimeConfig } = useStore();
  const ct = courseTimeConfig[currentRound] ?? { sct: 0, mct: 0 };

  return (
    <div className="flex gap-2.5 mb-4 flex-wrap">
      <div
        className="flex items-center gap-1.5 text-[12px] font-semibold"
        style={{
          padding: '6px 14px',
          borderRadius: '8px',
          background: '#14171e',
          border: '1px solid #2a2f40',
        }}
      >
        <span className="font-bold text-[12px]" style={{ color: '#f0f2f8' }}>{currentRound}</span>
        <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: '#555b73' }}>SCT</span>
        <span className="font-mono font-bold" style={{ color: '#5b9cf6' }}>{ct.sct}s</span>
        <span style={{ color: '#555b73' }}>|</span>
        <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: '#555b73' }}>MCT</span>
        <span className="font-mono font-bold" style={{ color: '#ef4444' }}>{ct.mct}s</span>
      </div>
    </div>
  );
}
