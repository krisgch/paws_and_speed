import { useState } from 'react';
import useStore from '../../store/useStore.ts';

export default function CourseTimePanel() {
  const { currentRound, courseTimeConfig, updateCourseTime, showToast } = useStore();
  const [open, setOpen] = useState(false);
  const ct = courseTimeConfig[currentRound] ?? { sct: 0, mct: 0 };

  const handleChange = (field: 'sct' | 'mct', value: string) => {
    const num = parseFloat(value) || 0;
    const newSct = field === 'sct' ? num : ct.sct;
    const newMct = field === 'mct' ? num : ct.mct;
    updateCourseTime(currentRound, newSct, newMct);
    showToast('Course times updated');
  };

  return (
    <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden' }}>
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        style={{ padding: '14px 20px', borderBottom: open ? '1px solid #2a2f40' : 'none' }}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1e28')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="font-display text-[13px] flex items-center gap-2.5" style={{ color: '#f0f2f8' }}>
          ⏱️ Course Time Settings
        </div>
        <div className="text-[12px]" style={{ color: '#555b73' }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ padding: '16px' }}>
          <div
            className="flex gap-5 items-center flex-wrap"
            style={{ background: '#1c2030', borderRadius: '8px', padding: '14px', border: '1px solid #2a2f40' }}
          >
            <div className="font-bold text-[12px] flex items-center gap-1.5 min-w-[120px]" style={{ color: '#f0f2f8' }}>
              <span className="text-[14px]">📍</span> {currentRound}
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>
                Standard Course Time (sec)
              </label>
              <input
                type="number"
                step="0.01"
                value={ct.sct}
                onChange={(e) => handleChange('sct', e.target.value)}
                className="w-full text-center outline-none transition-colors duration-200"
                style={{
                  padding: '7px 8px',
                  borderRadius: '6px',
                  border: '2px solid #2a2f40',
                  background: '#0c0e12',
                  color: '#f0f2f8',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[9px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: '#555b73' }}>
                Max Course Time (sec)
              </label>
              <input
                type="number"
                step="0.01"
                value={ct.mct}
                onChange={(e) => handleChange('mct', e.target.value)}
                className="w-full text-center outline-none transition-colors duration-200"
                style={{
                  padding: '7px 8px',
                  borderRadius: '6px',
                  border: '2px solid #2a2f40',
                  background: '#0c0e12',
                  color: '#f0f2f8',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-right" style={{ color: '#555b73' }}>
            1 fault per full second over SCT &nbsp;|&nbsp; Over MCT = Eliminated
          </div>
        </div>
      )}
    </div>
  );
}
