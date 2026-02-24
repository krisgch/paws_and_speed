import { useState } from 'react';
import useStore from '../../store/useStore.ts';
import type { Size } from '../../types/index.ts';
import SizeTag from '../../components/SizeTag.tsx';
import { dogEmoji } from '../../constants/index.ts';

export default function ManageCompetitors() {
  const { competitors, currentRound, addCompetitor, removeCompetitor, showToast } = useStore();
  const [open, setOpen] = useState(false);
  const [dog, setDog] = useState('');
  const [human, setHuman] = useState('');
  const [breed, setBreed] = useState('');
  const [size, setSize] = useState<Size>('S');

  const handleAdd = () => {
    if (!dog.trim() || !human.trim()) {
      showToast('Please fill in dog name and handler');
      return;
    }
    addCompetitor({ dog: dog.trim(), human: human.trim(), breed: breed.trim(), size });
    showToast(`${dog.trim()} added to ${currentRound} (${size})`);
    setDog('');
    setHuman('');
    setBreed('');
  };

  const handleRemove = (id: string) => {
    const c = competitors.find((x) => x.id === id);
    if (!c) return;
    if (!window.confirm(`Remove ${c.dog} (${c.human}) from ${c.round}?`)) return;
    removeCompetitor(id);
    showToast(`${c.dog} removed`);
  };

  const data = competitors
    .filter((c) => c.round === currentRound)
    .sort((a, b) => a.size.localeCompare(b.size) || a.order - b.order);

  const inputStyle = {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '2px solid #2a2f40',
    background: '#1c2030',
    color: '#f0f2f8',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    width: '100%',
  } as const;

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
          🐕 Manage Competitors
        </div>
        <div className="text-[12px]" style={{ color: '#555b73' }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ padding: '16px' }}>
          {/* Add form */}
          <div className="flex gap-2.5 flex-wrap items-end mb-4 pb-4" style={{ borderBottom: '1px solid #2a2f40' }}>
            <div className="flex-[1.3] min-w-[120px]">
              <label className="block text-[9px] font-bold uppercase tracking-[1px] mb-1" style={{ color: '#555b73' }}>Dog Name</label>
              <input style={inputStyle} value={dog} onChange={(e) => setDog(e.target.value)} placeholder="e.g. Pixel" />
            </div>
            <div className="flex-[1.3] min-w-[120px]">
              <label className="block text-[9px] font-bold uppercase tracking-[1px] mb-1" style={{ color: '#555b73' }}>Handler</label>
              <input style={inputStyle} value={human} onChange={(e) => setHuman(e.target.value)} placeholder="e.g. Anna Schmidt" />
            </div>
            <div className="flex-[1.3] min-w-[120px]">
              <label className="block text-[9px] font-bold uppercase tracking-[1px] mb-1" style={{ color: '#555b73' }}>Breed</label>
              <input style={inputStyle} value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Border Collie" />
            </div>
            <div className="flex-[0.5] min-w-[70px]">
              <label className="block text-[9px] font-bold uppercase tracking-[1px] mb-1" style={{ color: '#555b73' }}>Size</label>
              <select style={{ ...inputStyle, background: '#1c2030' }} value={size} onChange={(e) => setSize(e.target.value as Size)}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="I">I</option>
                <option value="L">L</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="cursor-pointer text-[12px] font-bold h-[37px] self-end"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(45,212,160,0.3)',
                background: 'rgba(45,212,160,0.1)',
                color: '#2dd4a0',
              }}
            >
              ➕ Add
            </button>
          </div>

          {/* Dog list */}
          <div className="max-h-[300px] overflow-y-auto">
            {data.length === 0 ? (
              <div className="text-center text-[13px] p-4" style={{ color: '#555b73' }}>
                No competitors yet. Add one above.
              </div>
            ) : (
              data.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 text-[13px]"
                  style={{ padding: '8px 12px', borderBottom: '1px solid rgba(42,47,64,0.4)' }}
                >
                  <span className="font-mono font-bold text-center w-7" style={{ color: '#555b73' }}>{c.order}</span>
                  <SizeTag size={c.size} />
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: '#f0f2f8' }}>
                      {dogEmoji(c.dog)} {c.dog}{' '}
                      <span className="font-normal text-[11px]" style={{ color: '#555b73' }}>{c.breed}</span>
                    </div>
                    <div className="text-[11px]" style={{ color: '#8b90a5' }}>{c.human}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="cursor-pointer text-[11px] font-bold transition-all duration-150"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
