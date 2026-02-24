import { useState, useEffect } from 'react';
import useStore from '../store/useStore.ts';
import { HOST_PIN, dogEmoji, AGILITY_BREEDS } from '../constants/index.ts';
import type { Size } from '../types/index.ts';
import SizeTag from '../components/SizeTag.tsx';

interface DogRow {
  key: string;
  dog: string;
  breed: string;
  size: Size;
  human: string;
  icon?: string;
}

const EMOJI_PRESETS = [
  '🐶','🐕','🐩','🦮','🐾','🎮','🍡','🫘','🌿','🍬',
  '✨','💨','🌸','🍪','🌪️','🔥','💫','♠️','🌱','⚡',
  '👑','🗺️','🌟','🎖️','🚀','💎','🎯','🏆','🌈','🎀',
];

const inputStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '2px solid #2a2f40',
  background: '#1c2030',
  color: '#f0f2f8',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13px',
  fontWeight: 600,
  outline: 'none',
} as const;

const thStyle = {
  padding: '12px 14px',
  color: '#555b73',
  background: 'rgba(0,0,0,0.2)',
  borderBottom: '1px solid #2a2f40',
  textAlign: 'left' as const,
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  whiteSpace: 'nowrap' as const,
};

export default function Competitors() {
  const {
    competitors, rounds, roundAbbreviations,
    addCompetitorToRound, removeCompetitor, clearAllCompetitors,
    addRound, renameRound, deleteRound, updateCompetitorIcon, showToast,
  } = useStore();

  const [pendingDogs, setPendingDogs] = useState<DogRow[]>([]);

  // Add dog form
  const [newDog, setNewDog] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newSize, setNewSize] = useState<Size>('M');
  const [newHuman, setNewHuman] = useState('');
  const [newIcon, setNewIcon] = useState('');

  // Clear all modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPin, setClearPin] = useState('');
  const [clearPinError, setClearPinError] = useState(false);

  // Manage rounds panel
  const [roundsOpen, setRoundsOpen] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundAbbr, setNewRoundAbbr] = useState('');
  const [editingRound, setEditingRound] = useState<string | null>(null);
  const [editingRoundName, setEditingRoundName] = useState('');
  const [editingRoundAbbr, setEditingRoundAbbr] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState<'dog' | 'breed' | 'size' | 'human'>('size');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Emoji picker
  const [emojiPickerKey, setEmojiPickerKey] = useState<string | null>(null);
  const [emojiPickerPos, setEmojiPickerPos] = useState({ x: 0, y: 0 });
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiPickerKey) return;
    const close = (e: MouseEvent) => {
      const picker = document.getElementById('emoji-picker-overlay');
      if (picker && !picker.contains(e.target as Node)) setEmojiPickerKey(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [emojiPickerKey]);

  // Derive unique dogs from live competitor records
  const dogMap = new Map<string, DogRow>();
  for (const c of competitors) {
    const key = `${c.dog}|${c.human}`;
    if (!dogMap.has(key)) {
      dogMap.set(key, { key, dog: c.dog, breed: c.breed, size: c.size, human: c.human, icon: c.icon });
    } else if (c.icon && !dogMap.get(key)!.icon) {
      dogMap.get(key)!.icon = c.icon;
    }
  }

  const unsortedRows: DogRow[] = [
    ...Array.from(dogMap.values()),
    ...pendingDogs.filter((p) => !dogMap.has(p.key)),
  ];

  const SIZE_ORDER: Record<string, number> = { S: 0, M: 1, I: 2, L: 3 };

  const allDogRows: DogRow[] = [...unsortedRows].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'dog':   cmp = a.dog.localeCompare(b.dog); break;
      case 'breed': cmp = (a.breed || '').localeCompare(b.breed || ''); break;
      case 'size':  cmp = (SIZE_ORDER[a.size] ?? 0) - (SIZE_ORDER[b.size] ?? 0); break;
      case 'human': cmp = a.human.localeCompare(b.human); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sortArrow = (col: typeof sortBy) =>
    sortBy === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const isEntered = (dog: DogRow, round: string) =>
    competitors.some((c) => c.dog === dog.dog && c.human === dog.human && c.round === round);

  const isScored = (dog: DogRow, round: string) =>
    competitors.some(
      (c) => c.dog === dog.dog && c.human === dog.human && c.round === round && (c.time !== null || c.eliminated)
    );

  const toggleRound = (dog: DogRow, round: string) => {
    if (isEntered(dog, round)) {
      if (isScored(dog, round)) {
        showToast(`${dog.dog} already has results in ${round} — remove scores first`);
        return;
      }
      const c = competitors.find((x) => x.dog === dog.dog && x.human === dog.human && x.round === round);
      if (c) removeCompetitor(c.id);
    } else {
      addCompetitorToRound({ dog: dog.dog, human: dog.human, breed: dog.breed, size: dog.size, round, icon: dog.icon });
      setPendingDogs((prev) => prev.filter((p) => p.key !== dog.key));
    }
  };

  const handleAddDog = () => {
    if (!newDog.trim() || !newHuman.trim()) {
      showToast('Dog name and handler are required');
      return;
    }
    const key = `${newDog.trim()}|${newHuman.trim()}`;
    if (dogMap.has(key) || pendingDogs.some((p) => p.key === key)) {
      showToast('This dog + handler combination already exists');
      return;
    }
    setPendingDogs((prev) => [
      ...prev,
      { key, dog: newDog.trim(), breed: newBreed.trim() || '—', size: newSize, human: newHuman.trim(), icon: newIcon.trim() || undefined },
    ]);
    setNewDog('');
    setNewBreed('');
    setNewHuman('');
    setNewIcon('');
  };

  const removeDogFromAll = (dog: DogRow) => {
    const dogComps = competitors.filter((c) => c.dog === dog.dog && c.human === dog.human);
    const hasResults = dogComps.some((c) => c.time !== null || c.eliminated);
    const msg = hasResults
      ? `Remove ${dog.dog} from all rounds? This will also delete their scored results.`
      : `Remove ${dog.dog} from all rounds?`;
    if (!window.confirm(msg)) return;
    dogComps.forEach((c) => removeCompetitor(c.id));
    setPendingDogs((prev) => prev.filter((p) => p.key !== dog.key));
    showToast(`${dog.dog} removed from all rounds`);
  };

  const handleClearAll = () => {
    if (clearPin === HOST_PIN) {
      clearAllCompetitors();
      setPendingDogs([]);
      setShowClearModal(false);
      setClearPin('');
      setClearPinError(false);
      showToast('All competitors removed');
    } else {
      setClearPinError(true);
    }
  };

  // ---- Manage Rounds ----
  const suggestAbbr = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name.substring(0, 4).toUpperCase();
    return parts.map((p) => p[0]).join('').toUpperCase().substring(0, 4);
  };

  const handleAddRound = () => {
    const name = newRoundName.trim();
    if (!name) return;
    if (rounds.includes(name)) { showToast('Round already exists'); return; }
    const abbr = newRoundAbbr.trim().substring(0, 4) || suggestAbbr(name);
    addRound(name, abbr);
    setNewRoundName('');
    setNewRoundAbbr('');
    showToast(`Round "${name}" (${abbr}) added`);
  };

  const startEditRound = (name: string) => {
    setEditingRound(name);
    setEditingRoundName(name);
    setEditingRoundAbbr(roundAbbreviations[name] ?? suggestAbbr(name));
  };

  const handleSaveRoundEdit = (oldName: string) => {
    const newName = editingRoundName.trim();
    const newAbbr = editingRoundAbbr.trim().substring(0, 4);
    if (!newName) { setEditingRound(null); return; }
    if (newName !== oldName && rounds.includes(newName)) {
      showToast('A round with that name already exists');
      return;
    }
    const nameChanged = newName !== oldName;
    const abbrChanged = newAbbr !== (roundAbbreviations[oldName] ?? '');
    if (!nameChanged && !abbrChanged) { setEditingRound(null); return; }
    renameRound(oldName, newName, newAbbr || undefined);
    setEditingRound(null);
    if (nameChanged) showToast(`Renamed to "${newName}"`);
    else if (abbrChanged) showToast(`Abbreviation updated to "${newAbbr}"`);
  };

  const handleDeleteRound = (name: string) => {
    if (competitors.some((c) => c.round === name)) {
      showToast(`Remove all competitors from "${name}" before deleting it`);
      return;
    }
    if (!window.confirm(`Delete round "${name}"?`)) return;
    deleteRound(name);
    showToast(`Round "${name}" deleted`);
  };

  // ---- Emoji picker ----
  const openEmojiPicker = (dog: DogRow, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setEmojiPickerPos({ x: rect.left, y: rect.bottom + 6 });
    setEmojiPickerKey(dog.key);
    setCustomEmojiInput('');
  };

  const applyEmoji = (dogKey: string, emoji: string) => {
    const dog = allDogRows.find((d) => d.key === dogKey);
    if (!dog) return;
    if (dogMap.has(dog.key)) {
      updateCompetitorIcon(dog.dog, dog.human, emoji);
    } else {
      setPendingDogs((prev) => prev.map((p) => p.key === dog.key ? { ...p, icon: emoji } : p));
    }
    setEmojiPickerKey(null);
  };

  const totalColumns = 4 + rounds.length + 1;

  return (
    <div>
      {/* Breed datalist */}
      <datalist id="agility-breeds">
        {AGILITY_BREEDS.map((b) => <option key={b} value={b} />)}
      </datalist>

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-[18px]" style={{ color: '#f0f2f8' }}>
          🐕 Manage Competitors
        </h2>
        <button
          onClick={() => { setShowClearModal(true); setClearPin(''); setClearPinError(false); }}
          className="cursor-pointer text-[12px] font-bold"
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
          }}
        >
          🗑 Remove All
        </button>
      </div>

      {/* Manage Rounds */}
      <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          style={{ padding: '12px 18px', borderBottom: roundsOpen ? '1px solid #2a2f40' : 'none' }}
          onClick={() => setRoundsOpen(!roundsOpen)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1e28')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="text-[13px] font-bold flex items-center gap-2" style={{ color: '#f0f2f8' }}>
            ⚙️ Manage Rounds
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-[6px]" style={{ background: '#1c2030', color: '#555b73' }}>
              {rounds.length}
            </span>
          </span>
          <span className="text-[10px]" style={{ color: '#555b73' }}>{roundsOpen ? '▲' : '▼'}</span>
        </div>
        {roundsOpen && (
          <div style={{ padding: '14px 18px' }}>
            <div className="flex items-center gap-2 mb-1.5" style={{ color: '#555b73', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <span style={{ flex: 1 }}>Round Name</span>
              <span style={{ width: '72px' }}>Abbr (≤4)</span>
              <span style={{ width: '32px' }} />
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              {rounds.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  {editingRound === r ? (
                    <>
                      <input
                        autoFocus
                        value={editingRoundName}
                        onChange={(e) => setEditingRoundName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRoundEdit(r);
                          if (e.key === 'Escape') setEditingRound(null);
                        }}
                        className="flex-1 outline-none text-[13px] font-semibold"
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '2px solid #ff6b2c', background: '#1c2030', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}
                      />
                      <input
                        value={editingRoundAbbr}
                        onChange={(e) => setEditingRoundAbbr(e.target.value.toUpperCase().substring(0, 4))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRoundEdit(r);
                          if (e.key === 'Escape') setEditingRound(null);
                        }}
                        maxLength={4}
                        placeholder="Abbr"
                        className="outline-none text-[13px] font-bold"
                        style={{ width: '72px', padding: '5px 8px', borderRadius: '6px', border: '2px solid #ff6b2c', background: '#1c2030', color: '#ff6b2c', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', letterSpacing: '1px' }}
                      />
                      <button
                        onClick={() => handleSaveRoundEdit(r)}
                        className="cursor-pointer text-[11px] font-bold"
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(45,212,160,0.3)', background: 'rgba(45,212,160,0.1)', color: '#2dd4a0', whiteSpace: 'nowrap' }}
                      >
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="flex-1 text-[13px] font-semibold cursor-text"
                        style={{ padding: '5px 10px', borderRadius: '6px', background: '#1c2030', color: '#f0f2f8' }}
                        onClick={() => startEditRound(r)}
                        title="Click to rename"
                      >
                        {r}
                      </span>
                      <span
                        className="text-[12px] font-bold cursor-pointer"
                        style={{ width: '72px', padding: '5px 8px', borderRadius: '6px', background: '#1c2030', color: '#ff6b2c', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', letterSpacing: '1px' }}
                        onClick={() => startEditRound(r)}
                        title="Click to edit abbreviation"
                      >
                        {roundAbbreviations[r] ?? suggestAbbr(r)}
                      </span>
                      <button
                        onClick={() => handleDeleteRound(r)}
                        className="cursor-pointer text-[11px] font-bold"
                        style={{ width: '32px', padding: '4px 0', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', textAlign: 'center' }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newRoundName}
                onChange={(e) => {
                  setNewRoundName(e.target.value);
                  if (!newRoundAbbr) setNewRoundAbbr(suggestAbbr(e.target.value).substring(0, 4));
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRound(); }}
                placeholder="New round name…"
                className="flex-1 outline-none text-[13px]"
                style={{ padding: '6px 10px', borderRadius: '6px', border: '2px solid #2a2f40', background: '#1c2030', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              />
              <input
                value={newRoundAbbr}
                onChange={(e) => setNewRoundAbbr(e.target.value.toUpperCase().substring(0, 4))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRound(); }}
                placeholder="Abbr"
                maxLength={4}
                className="outline-none text-[13px] font-bold"
                style={{ width: '72px', padding: '6px 8px', borderRadius: '6px', border: '2px solid #2a2f40', background: '#1c2030', color: '#ff6b2c', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', letterSpacing: '1px' }}
              />
              <button
                onClick={handleAddRound}
                className="cursor-pointer text-[12px] font-bold"
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(45,212,160,0.3)', background: 'rgba(45,212,160,0.1)', color: '#2dd4a0', whiteSpace: 'nowrap' }}
              >
                ➕ Add
              </button>
            </div>
            <p className="text-[11px] mt-2" style={{ color: '#555b73' }}>
              Click a round name or abbreviation to edit it. Rounds with competitors cannot be deleted.
            </p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full border-collapse" style={{ minWidth: '860px' }}>
            <thead>
              <tr>
                {(['dog', 'breed', 'size', 'human'] as const).map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    style={{
                      ...thStyle,
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: sortBy === col ? '#ff6b2c' : '#555b73',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f0f2f8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = sortBy === col ? '#ff6b2c' : '#555b73')}
                  >
                    {col === 'dog' ? 'Dog' : col === 'breed' ? 'Breed' : col === 'size' ? 'Size' : 'Handler'}
                    {sortArrow(col)}
                  </th>
                ))}
                {rounds.map((r) => (
                  <th key={r} title={r} style={{ ...thStyle, textAlign: 'center', padding: '12px 8px', minWidth: '48px' }}>
                    {roundAbbreviations[r] ?? suggestAbbr(r)}
                  </th>
                ))}
                <th style={{ ...thStyle, width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {/* Add dog form row — always at top */}
              <tr style={{ borderBottom: '1px solid #2a2f40', background: 'rgba(255,107,44,0.03)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setEmojiPickerPos({ x: rect.left, y: rect.bottom + 6 });
                        setEmojiPickerKey('__new__');
                        setCustomEmojiInput('');
                      }}
                      title="Pick emoji"
                      className="cursor-pointer transition-all duration-150 shrink-0"
                      style={{ fontSize: '18px', background: 'rgba(255,107,44,0.06)', border: '1px dashed rgba(255,107,44,0.3)', padding: '2px 5px', borderRadius: '6px', lineHeight: 1 }}
                    >
                      {newIcon || '🐶'}
                    </button>
                    <input
                      style={{ ...inputStyle, width: '90px' }}
                      value={newDog}
                      onChange={(e) => setNewDog(e.target.value)}
                      placeholder="Dog name"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddDog(); }}
                    />
                  </div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <input
                    style={{ ...inputStyle, width: '110px' }}
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    placeholder="Breed"
                    list="agility-breeds"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddDog(); }}
                  />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <select
                    style={{ ...inputStyle, width: '58px' }}
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value as Size)}
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="I">I</option>
                    <option value="L">L</option>
                  </select>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <input
                    style={{ ...inputStyle, width: '130px' }}
                    value={newHuman}
                    onChange={(e) => setNewHuman(e.target.value)}
                    placeholder="Handler"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddDog(); }}
                  />
                </td>
                <td colSpan={rounds.length + 1} style={{ padding: '10px 14px' }}>
                  <button
                    onClick={handleAddDog}
                    className="cursor-pointer text-[12px] font-bold"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(45,212,160,0.3)',
                      background: 'rgba(45,212,160,0.1)',
                      color: '#2dd4a0',
                    }}
                  >
                    ➕ Add Dog
                  </button>
                </td>
              </tr>

              {allDogRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="text-center text-[13px]"
                    style={{ padding: '36px', color: '#555b73' }}
                  >
                    No competitors yet. Fill in the form above to add a dog.
                  </td>
                </tr>
              ) : (
                allDogRows.map((dog) => (
                  <tr key={dog.key} style={{ borderBottom: '1px solid rgba(42,47,64,0.4)' }}>
                    <td
                      className="text-[13px] font-bold"
                      style={{ padding: '10px 14px', color: '#f0f2f8', whiteSpace: 'nowrap' }}
                    >
                      <button
                        onClick={(e) => openEmojiPicker(dog, e)}
                        title="Click to set emoji"
                        className="cursor-pointer transition-all duration-150 mr-1.5"
                        style={{ fontSize: '16px', background: 'none', border: 'none', padding: '0 2px', borderRadius: '4px', lineHeight: 1 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,107,44,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        {dog.icon || dogEmoji(dog.dog)}
                      </button>
                      {dog.dog}
                    </td>
                    <td className="text-[12px]" style={{ padding: '10px 14px', color: '#8b90a5' }}>
                      {dog.breed || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <SizeTag size={dog.size} />
                    </td>
                    <td className="text-[12px]" style={{ padding: '10px 14px', color: '#8b90a5', whiteSpace: 'nowrap' }}>
                      {dog.human}
                    </td>
                    {rounds.map((r) => {
                      const entered = isEntered(dog, r);
                      const scored = isScored(dog, r);
                      return (
                        <td key={r} style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            title={
                              entered
                                ? scored
                                  ? `${dog.dog} has results in ${r}`
                                  : `Remove from ${r}`
                                : `Enter ${dog.dog} in ${r}`
                            }
                            onClick={() => toggleRound(dog, r)}
                            className="cursor-pointer transition-all duration-150"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              border: entered
                                ? scored
                                  ? '2px solid rgba(85,91,115,0.4)'
                                  : '2px solid rgba(45,212,160,0.5)'
                                : '2px dashed rgba(85,91,115,0.25)',
                              background: entered
                                ? scored
                                  ? 'rgba(85,91,115,0.15)'
                                  : 'rgba(45,212,160,0.12)'
                                : 'transparent',
                              color: entered ? (scored ? '#555b73' : '#2dd4a0') : '#2a2f40',
                              fontSize: entered ? '14px' : '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              cursor: scored ? 'default' : 'pointer',
                            }}
                          >
                            {entered ? (scored ? '🔒' : '✓') : '+'}
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => removeDogFromAll(dog)}
                        title="Remove from all rounds"
                        className="cursor-pointer transition-all duration-150"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239,68,68,0.2)',
                          background: 'rgba(239,68,68,0.07)',
                          color: '#ef4444',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3" style={{ color: '#555b73', fontSize: '11px' }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(45,212,160,0.5)', background: 'rgba(45,212,160,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#2dd4a0' }}>✓</span>
          Entered
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(85,91,115,0.4)', background: 'rgba(85,91,115,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>🔒</span>
          Has results
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px dashed rgba(85,91,115,0.25)', display: 'inline-block' }} />
          Not entered
        </span>
        <span style={{ marginLeft: 'auto' }}>
          Click emoji to change · Hover column headers for full round name
        </span>
      </div>

      {/* Remove All modal */}
      {showClearModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearModal(false); }}
        >
          <div
            style={{
              background: '#14171e',
              border: '1px solid #2a2f40',
              borderRadius: '12px',
              padding: '32px',
              width: '360px',
              maxWidth: '90vw',
              textAlign: 'center',
            }}
          >
            <h3 className="font-display text-[18px] mb-2" style={{ color: '#f0f2f8' }}>
              ⚠️ Remove All Competitors
            </h3>
            <p className="text-[13px] mb-5" style={{ color: '#8b90a5' }}>
              This will permanently remove every competitor from every round, including all scores. Enter the host PIN to confirm.
            </p>
            <input
              type="password"
              maxLength={4}
              placeholder="····"
              value={clearPin}
              autoFocus
              onChange={(e) => { setClearPin(e.target.value); setClearPinError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClearAll(); }}
              className="w-full mb-3 outline-none"
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${clearPinError ? '#ef4444' : '#2a2f40'}`,
                background: '#1c2030',
                color: '#f0f2f8',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
              }}
            />
            {clearPinError && (
              <div className="text-[12px] font-semibold mb-3" style={{ color: '#ef4444' }}>
                Incorrect PIN. Try again.
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 cursor-pointer text-[13px] font-bold"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #2a2f40',
                  background: 'transparent',
                  color: '#8b90a5',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 cursor-pointer text-[13px] font-bold"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                }}
              >
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker overlay */}
      {emojiPickerKey && (
        <div
          id="emoji-picker-overlay"
          style={{
            position: 'fixed',
            left: Math.min(emojiPickerPos.x, window.innerWidth - 228),
            top: Math.min(emojiPickerPos.y, window.innerHeight - 160),
            zIndex: 1000,
            background: '#14171e',
            border: '1px solid #2a2f40',
            borderRadius: '10px',
            padding: '10px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            width: '220px',
          }}
        >
          <div
            className="grid gap-1 mb-2"
            style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
          >
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (emojiPickerKey === '__new__') {
                    setNewIcon(emoji);
                    setEmojiPickerKey(null);
                  } else {
                    applyEmoji(emojiPickerKey, emoji);
                  }
                }}
                style={{
                  fontSize: '18px',
                  borderRadius: '6px',
                  padding: '4px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1c2030')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              value={customEmojiInput}
              onChange={(e) => setCustomEmojiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customEmojiInput.trim()) {
                  const icon = customEmojiInput.trim();
                  if (emojiPickerKey === '__new__') {
                    setNewIcon(icon);
                    setEmojiPickerKey(null);
                  } else {
                    applyEmoji(emojiPickerKey, icon);
                  }
                }
              }}
              placeholder="Custom…"
              maxLength={8}
              className="flex-1 outline-none text-[14px]"
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '2px solid #2a2f40',
                background: '#1c2030',
                color: '#f0f2f8',
                textAlign: 'center',
              }}
            />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                if (!customEmojiInput.trim()) return;
                const icon = customEmojiInput.trim();
                if (emojiPickerKey === '__new__') {
                  setNewIcon(icon);
                  setEmojiPickerKey(null);
                } else {
                  applyEmoji(emojiPickerKey, icon);
                }
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: '#ff6b2c',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
