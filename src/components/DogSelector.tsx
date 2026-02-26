import { useEffect, useState } from 'react';
import { getDogs, addDog } from '../lib/db.ts';
import useAuthStore from '../store/useAuthStore.ts';
import type { Dog } from '../types/supabase.ts';
import { AGILITY_BREEDS, SIZES } from '../constants/index.ts';

interface DogSelectorProps {
  selected: Dog | null;
  onSelect: (dog: Dog) => void;
}

const SIZE_LABELS: Record<string, string> = { S: 'Small', M: 'Medium', I: 'Intermediate', L: 'Large' };

export default function DogSelector({ selected, onSelect }: DogSelectorProps) {
  const { user } = useAuthStore();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newSize, setNewSize] = useState<'S' | 'M' | 'I' | 'L'>('M');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDogs(user.id)
      .then(setDogs)
      .finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setSaving(true);
    try {
      const dog = await addDog({
        owner_id: user.id,
        name: newName.trim(),
        breed: newBreed.trim() || '—',
        size: newSize,
        icon: null,
      });
      setDogs((prev) => [...prev, dog]);
      onSelect(dog);
      setAdding(false);
      setNewName('');
      setNewBreed('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-[13px]" style={{ color: '#8b90a5' }}>Loading dogs…</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {dogs.map((dog) => (
        <button
          key={dog.id}
          type="button"
          onClick={() => onSelect(dog)}
          className="w-full text-left cursor-pointer transition-all duration-150"
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            border: `2px solid ${selected?.id === dog.id ? '#ff6b2c' : '#2a2f40'}`,
            background: selected?.id === dog.id ? 'rgba(255,107,44,0.08)' : '#1c2030',
            color: '#f0f2f8',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-[14px]">{dog.icon} {dog.name}</span>
              <span className="text-[12px] ml-2" style={{ color: '#8b90a5' }}>{dog.breed}</span>
            </div>
            <span
              className="text-[11px] font-bold uppercase"
              style={{ color: '#ff6b2c', background: 'rgba(255,107,44,0.12)', padding: '2px 8px', borderRadius: '6px' }}
            >
              {SIZE_LABELS[dog.size]}
            </span>
          </div>
        </button>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 p-4" style={{ background: '#1c2030', borderRadius: '10px', border: '1px solid #2a2f40' }}>
          <p className="text-[13px] font-semibold" style={{ color: '#f0f2f8' }}>Add a new dog</p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dog name"
            required
            className="w-full outline-none"
            style={inputStyle}
          />
          <select
            value={newBreed}
            onChange={(e) => setNewBreed(e.target.value)}
            className="w-full outline-none"
            style={inputStyle}
          >
            <option value="">— Breed (optional) —</option>
            {AGILITY_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewSize(s)}
                className="flex-1 cursor-pointer text-[12px] font-bold"
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  border: `2px solid ${newSize === s ? '#ff6b2c' : '#2a2f40'}`,
                  background: newSize === s ? 'rgba(255,107,44,0.1)' : 'transparent',
                  color: newSize === s ? '#ff6b2c' : '#8b90a5',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="flex-1 cursor-pointer text-[13px]" style={cancelBtnStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 cursor-pointer text-[13px] font-bold disabled:opacity-50" style={primaryBtnStyle}>
              {saving ? 'Saving…' : 'Add Dog'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full cursor-pointer text-[13px] font-semibold"
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: '2px dashed #2a2f40',
            background: 'transparent',
            color: '#8b90a5',
          }}
        >
          + Add a new dog
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: '8px',
  border: '2px solid #2a2f40',
  background: '#14171e',
  color: '#f0f2f8',
  fontSize: '13px',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '9px',
  borderRadius: '8px',
  border: 'none',
  background: '#ff6b2c',
  color: '#fff',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px',
  borderRadius: '8px',
  border: '1px solid #2a2f40',
  background: 'transparent',
  color: '#8b90a5',
};
