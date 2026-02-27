import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEventRounds,
  getEventCompetitors,
  addEventCompetitor,
  deleteEventCompetitor,
  deleteAllEventCompetitors,
  updateEventCompetitorIcons,
} from '../lib/db.ts';
import { dogEmoji } from '../constants/index.ts';
import type { Size } from '../types/index.ts';
import SizeTag from '../components/SizeTag.tsx';
import type { EventRound, EventCompetitor } from '../types/supabase.ts';

const EMOJI_PRESETS = [
  '🐶','🐕','🐩','🦮','🐾','🎮','🍡','🫘','🌿','🍬',
  '✨','💨','🌸','🍪','🌪️','🔥','💫','♠️','🌱','⚡',
  '👑','🗺️','🌟','🎖️','🚀','💎','🎯','🏆','🌈','🎀',
];

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

interface DogEntry {
  dog_id: string;
  dog_name: string;
  human_name: string;
  breed: string;
  size: Size;
  icon: string | null;
}

export default function Competitors() {
  const { eventId } = useParams<{ eventId: string }>();

  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Sort
  const [sortBy, setSortBy] = useState<'dog_name' | 'breed' | 'size' | 'human_name'>('size');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Remove all modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirm, setClearConfirm] = useState('');
  const [clearError, setClearError] = useState(false);

  // Emoji picker
  const [emojiPickerDogId, setEmojiPickerDogId] = useState<string | null>(null);
  const [emojiPickerPos, setEmojiPickerPos] = useState({ x: 0, y: 0 });
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  useEffect(() => {
    if (!eventId) return;
    Promise.all([getEventRounds(eventId), getEventCompetitors(eventId)])
      .then(([rds, comps]) => { setRounds(rds); setCompetitors(comps); })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiPickerDogId) return;
    const close = (e: MouseEvent) => {
      const picker = document.getElementById('emoji-picker-overlay');
      if (picker && !picker.contains(e.target as Node)) setEmojiPickerDogId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [emojiPickerDogId]);

  // Derive unique dogs from event_competitors
  const dogMap = new Map<string, DogEntry>();
  for (const c of competitors) {
    if (!dogMap.has(c.dog_id)) {
      dogMap.set(c.dog_id, {
        dog_id: c.dog_id, dog_name: c.dog_name, human_name: c.human_name,
        breed: c.breed, size: c.size as Size, icon: c.icon,
      });
    } else if (c.icon && !dogMap.get(c.dog_id)!.icon) {
      dogMap.get(c.dog_id)!.icon = c.icon;
    }
  }

  const SIZE_ORDER: Record<string, number> = { S: 0, M: 1, I: 2, L: 3 };
  const allDogRows = [...dogMap.values()].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'dog_name') cmp = a.dog_name.localeCompare(b.dog_name);
    else if (sortBy === 'breed') cmp = (a.breed || '').localeCompare(b.breed || '');
    else if (sortBy === 'size') cmp = (SIZE_ORDER[a.size] ?? 0) - (SIZE_ORDER[b.size] ?? 0);
    else if (sortBy === 'human_name') cmp = a.human_name.localeCompare(b.human_name);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };
  const sortArrow = (col: typeof sortBy) => sortBy === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const getCompetitor = (dogId: string, roundId: string) =>
    competitors.find((c) => c.dog_id === dogId && c.round_id === roundId) ?? null;

  const isScored = (c: EventCompetitor | null) =>
    c !== null && (c.time_sec !== null || c.eliminated);

  const toggleRound = async (dog: DogEntry, roundId: string) => {
    if (!eventId) return;
    const existing = getCompetitor(dog.dog_id, roundId);
    if (existing) {
      if (isScored(existing)) return; // locked
      await deleteEventCompetitor(existing.id);
      setCompetitors((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      // Determine next run_order for this size in this round
      const sameGroup = competitors.filter((c) => c.round_id === roundId && c.size === dog.size);
      const maxOrder = sameGroup.reduce((m, c) => Math.max(m, c.run_order), 0);
      const added = await addEventCompetitor({
        event_id: eventId,
        round_id: roundId,
        registration_id: null,
        dog_id: dog.dog_id,
        dog_name: dog.dog_name,
        breed: dog.breed,
        human_name: dog.human_name,
        icon: dog.icon,
        size: dog.size,
        run_order: maxOrder + 1,
        fault: null, refusal: null, time_sec: null,
        time_fault: null, total_fault: null, eliminated: false,
      });
      setCompetitors((prev) => [...prev, added]);
    }
  };

  const removeDogFromAll = async (dog: DogEntry) => {
    const dogComps = competitors.filter((c) => c.dog_id === dog.dog_id);
    const hasResults = dogComps.some((c) => c.time_sec !== null || c.eliminated);
    const msg = hasResults
      ? `Remove ${dog.dog_name} from all rounds? Their scored results will also be deleted.`
      : `Remove ${dog.dog_name} from all rounds?`;
    if (!window.confirm(msg)) return;
    for (const c of dogComps) await deleteEventCompetitor(c.id);
    setCompetitors((prev) => prev.filter((c) => c.dog_id !== dog.dog_id));
  };

  const handleClearAll = async () => {
    if (!eventId) return;
    if (clearConfirm.toLowerCase() !== 'remove all') { setClearError(true); return; }
    await deleteAllEventCompetitors(eventId);
    setCompetitors([]);
    setShowClearModal(false);
    setClearConfirm('');
    setClearError(false);
  };

  const applyEmoji = async (dogId: string, emoji: string) => {
    if (!eventId) return;
    await updateEventCompetitorIcons(eventId, dogId, emoji);
    setCompetitors((prev) => prev.map((c) => c.dog_id === dogId ? { ...c, icon: emoji } : c));
    setEmojiPickerDogId(null);
  };

  const openEmojiPicker = (dogId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setEmojiPickerPos({ x: rect.left, y: rect.bottom + 6 });
    setEmojiPickerDogId(dogId);
    setCustomEmojiInput('');
  };

  const totalColumns = 4 + rounds.length + 1;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  return (
    <main className="max-w-[1000px] mx-auto px-5 py-8">
      <Link to={`/host/events/${eventId}`} className="text-[13px] no-underline mb-6 inline-block" style={{ color: '#8b90a5' }}>← Event Hub</Link>

      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[22px]" style={{ color: '#f0f2f8' }}>🐕 Competitors</h1>
        <button
          onClick={() => { setShowClearModal(true); setClearConfirm(''); setClearError(false); }}
          className="cursor-pointer text-[12px] font-bold"
          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          🗑 Remove All
        </button>
      </div>

      {allDogRows.length === 0 ? (
        <div className="text-center py-12" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
          <p className="text-[15px] mb-2" style={{ color: '#f0f2f8' }}>No competitors yet</p>
          <p className="text-[13px] mb-5" style={{ color: '#8b90a5' }}>Approve registrations to populate the competitor list.</p>
          <Link to={`/host/events/${eventId}/registrations`}
            className="text-[13px] font-bold no-underline"
            style={{ padding: '9px 20px', borderRadius: '20px', background: '#ff6b2c', color: '#fff' }}>
            Go to Registrations →
          </Link>
        </div>
      ) : (
        <>
          {rounds.length === 0 && (
            <div className="mb-4 p-3 text-[12px]" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', color: '#fbbf24' }}>
              No rounds configured. <Link to={`/host/events/${eventId}/rounds`} className="font-bold underline" style={{ color: '#fbbf24' }}>Add rounds →</Link>
            </div>
          )}

          <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full border-collapse" style={{ minWidth: `${460 + rounds.length * 52}px` }}>
                <thead>
                  <tr>
                    {(['dog_name', 'breed', 'size', 'human_name'] as const).map((col) => (
                      <th key={col} onClick={() => handleSort(col)}
                        style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', color: sortBy === col ? '#ff6b2c' : '#555b73' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f0f2f8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = sortBy === col ? '#ff6b2c' : '#555b73')}>
                        {col === 'dog_name' ? 'Dog' : col === 'breed' ? 'Breed' : col === 'size' ? 'Size' : 'Handler'}
                        {sortArrow(col)}
                      </th>
                    ))}
                    {rounds.map((r) => (
                      <th key={r.id} title={r.name} style={{ ...thStyle, textAlign: 'center', padding: '12px 8px', minWidth: '52px' }}>
                        {r.abbreviation || r.name.substring(0, 4)}
                      </th>
                    ))}
                    <th style={{ ...thStyle, width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {allDogRows.map((dog) => (
                    <tr key={dog.dog_id} style={{ borderBottom: '1px solid rgba(42,47,64,0.4)' }}>
                      <td className="text-[13px] font-bold" style={{ padding: '10px 14px', color: '#f0f2f8', whiteSpace: 'nowrap' }}>
                        <button onClick={(e) => openEmojiPicker(dog.dog_id, e)} title="Click to set emoji"
                          className="cursor-pointer mr-1.5"
                          style={{ fontSize: '16px', background: 'none', border: 'none', padding: '0 2px', borderRadius: '4px', lineHeight: 1 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,107,44,0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                          {dog.icon || dogEmoji(dog.dog_name)}
                        </button>
                        {dog.dog_name}
                      </td>
                      <td className="text-[12px]" style={{ padding: '10px 14px', color: '#8b90a5' }}>{dog.breed !== '—' ? dog.breed : '—'}</td>
                      <td style={{ padding: '10px 14px' }}><SizeTag size={dog.size} /></td>
                      <td className="text-[12px]" style={{ padding: '10px 14px', color: '#8b90a5', whiteSpace: 'nowrap' }}>{dog.human_name}</td>
                      {rounds.map((r) => {
                        const comp = getCompetitor(dog.dog_id, r.id);
                        const entered = comp !== null;
                        const scored = isScored(comp);
                        return (
                          <td key={r.id} style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              title={entered ? (scored ? `${dog.dog_name} has results in ${r.name}` : `Remove from ${r.name}`) : `Enter in ${r.name}`}
                              onClick={() => toggleRound(dog, r.id)}
                              className="cursor-pointer"
                              style={{
                                width: '30px', height: '30px', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: entered ? (scored ? '2px solid rgba(85,91,115,0.4)' : '2px solid rgba(45,212,160,0.5)') : '2px dashed rgba(85,91,115,0.25)',
                                background: entered ? (scored ? 'rgba(85,91,115,0.15)' : 'rgba(45,212,160,0.12)') : 'transparent',
                                color: entered ? (scored ? '#555b73' : '#2dd4a0') : '#2a2f40',
                                fontSize: entered ? '14px' : '16px',
                                cursor: scored ? 'default' : 'pointer',
                              }}>
                              {entered ? (scored ? '🔒' : '✓') : '+'}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => removeDogFromAll(dog)} title="Remove from all rounds"
                          className="cursor-pointer"
                          style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ color: '#555b73', fontSize: '11px' }}>
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
            <span className="ml-auto">Click emoji to change · Hover column header for full round name</span>
          </div>
        </>
      )}

      {/* Remove All modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearModal(false); }}>
          <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px', padding: '32px', width: '380px', maxWidth: '90vw', textAlign: 'center' }}>
            <h3 className="font-display text-[18px] mb-2" style={{ color: '#f0f2f8' }}>⚠️ Remove All Competitors</h3>
            <p className="text-[13px] mb-5" style={{ color: '#8b90a5' }}>
              This will permanently remove every competitor from every round, including all scores.
              Type <strong style={{ color: '#f0f2f8' }}>remove all</strong> to confirm.
            </p>
            <input
              type="text" placeholder="remove all" value={clearConfirm} autoFocus
              onChange={(e) => { setClearConfirm(e.target.value); setClearError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClearAll(); }}
              className="w-full mb-3 outline-none"
              style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${clearError ? '#ef4444' : '#2a2f40'}`, background: '#1c2030', color: '#f0f2f8', fontSize: '14px', textAlign: 'center' }}
            />
            {clearError && <div className="text-[12px] font-semibold mb-3" style={{ color: '#ef4444' }}>Type "remove all" exactly to confirm.</div>}
            <div className="flex gap-3">
              <button onClick={() => setShowClearModal(false)} className="flex-1 cursor-pointer text-[13px] font-bold"
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #2a2f40', background: 'transparent', color: '#8b90a5' }}>
                Cancel
              </button>
              <button onClick={handleClearAll} className="flex-1 cursor-pointer text-[13px] font-bold"
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker overlay */}
      {emojiPickerDogId && (
        <div id="emoji-picker-overlay"
          style={{ position: 'fixed', left: Math.min(emojiPickerPos.x, window.innerWidth - 228), top: Math.min(emojiPickerPos.y, window.innerHeight - 160), zIndex: 1000, background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '10px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', width: '220px' }}>
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {EMOJI_PRESETS.map((emoji) => (
              <button key={emoji} onMouseDown={(e) => { e.preventDefault(); applyEmoji(emojiPickerDogId, emoji); }}
                style={{ fontSize: '18px', borderRadius: '6px', padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'center', lineHeight: 1.3 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1c2030')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input value={customEmojiInput} onChange={(e) => setCustomEmojiInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && customEmojiInput.trim()) applyEmoji(emojiPickerDogId, customEmojiInput.trim()); }}
              placeholder="Custom…" maxLength={8} className="flex-1 outline-none text-[14px]"
              style={{ padding: '5px 8px', borderRadius: '6px', border: '2px solid #2a2f40', background: '#1c2030', color: '#f0f2f8', textAlign: 'center' }} />
            <button onMouseDown={(e) => { e.preventDefault(); if (customEmojiInput.trim()) applyEmoji(emojiPickerDogId, customEmojiInput.trim()); }}
              style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#ff6b2c', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              Set
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
