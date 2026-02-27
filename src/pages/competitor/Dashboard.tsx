import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore.ts';
import { getDogs, addDog, updateDog, deleteDog, getMyRegistrations } from '../../lib/db.ts';
import type { Dog, Registration, CompetitionLevel } from '../../types/supabase.ts';
import { AGILITY_BREEDS, SIZES } from '../../constants/index.ts';

const SIZE_LABELS: Record<string, string> = { S: 'Small', M: 'Medium', I: 'Intermediate', L: 'Large' };
const COMPETITION_LEVELS: CompetitionLevel[] = ['A0', 'A1', 'A2', 'A3'];
const DOG_EMOJIS = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🦴', '🐾', '🏆', '⭐', '🔥', '💛', '🧡', '❤️', '💙', '💚', '💜', '🤍', '🎯', '🥇', '🎽'];

const REG_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  pending_review: 'Under Review',
  approved: 'Approved ✓',
  rejected: 'Rejected',
};

const REG_STATUS_COLORS: Record<string, string> = {
  pending_payment: '#fbbf24',
  pending_review: '#60a5fa',
  approved: '#2dd4a0',
  rejected: '#ef4444',
};

// Defined outside to avoid remount-on-every-render typing bug
function DogForm({
  title,
  name, setName,
  breed, setBreed,
  size, setSize,
  icon, setIcon,
  level, setLevel,
  registeredName, setRegisteredName,
  kathNumber, setKathNumber,
  microchip, setMicrochip,
  dob, setDob,
  saving, onCancel, onSubmit,
}: {
  title: string;
  name: string; setName: (v: string) => void;
  breed: string; setBreed: (v: string) => void;
  size: 'S' | 'M' | 'I' | 'L'; setSize: (v: 'S' | 'M' | 'I' | 'L') => void;
  icon: string; setIcon: (v: string) => void;
  level: CompetitionLevel | ''; setLevel: (v: CompetitionLevel | '') => void;
  registeredName: string; setRegisteredName: (v: string) => void;
  kathNumber: string; setKathNumber: (v: string) => void;
  microchip: string; setMicrochip: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  saving: boolean; onCancel: () => void; onSubmit: (e: React.FormEvent) => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4 mb-4" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px' }}>
      <p className="text-[13px] font-semibold" style={{ color: '#f0f2f8' }}>{title}</p>

      {/* Emoji picker */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Icon</label>
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="w-10 h-10 text-[22px] flex items-center justify-center cursor-pointer"
          style={{ borderRadius: '8px', border: '2px solid #2a2f40', background: '#1c2030' }}
        >
          {icon || '🐕'}
        </button>
        {showEmoji && (
          <div className="flex flex-wrap gap-1 mt-2 p-2" style={{ background: '#1c2030', borderRadius: '8px', border: '1px solid #2a2f40' }}>
            {DOG_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { setIcon(e); setShowEmoji(false); }}
                className="w-9 h-9 text-[18px] cursor-pointer flex items-center justify-center"
                style={{ borderRadius: '6px', border: `2px solid ${icon === e ? '#ff6b2c' : 'transparent'}`, background: icon === e ? 'rgba(255,107,44,0.1)' : 'transparent' }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Name + Breed */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Dog Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Buddy" required className="w-full outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Breed</label>
          <select value={breed} onChange={(e) => setBreed(e.target.value)} className="w-full outline-none" style={inputStyle}>
            <option value="">— optional —</option>
            {AGILITY_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Size</label>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <button key={s} type="button" onClick={() => setSize(s)} className="flex-1 cursor-pointer text-[12px] font-bold"
              style={{ padding: '7px', borderRadius: '8px', border: `2px solid ${size === s ? '#ff6b2c' : '#2a2f40'}`, background: size === s ? 'rgba(255,107,44,0.1)' : 'transparent', color: size === s ? '#ff6b2c' : '#8b90a5' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Competition Level */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Competition Level</label>
        <div className="flex gap-2">
          {COMPETITION_LEVELS.map((l) => (
            <button key={l} type="button" onClick={() => setLevel(level === l ? '' : l)} className="flex-1 cursor-pointer text-[12px] font-bold"
              style={{ padding: '7px', borderRadius: '8px', border: `2px solid ${level === l ? '#2dd4a0' : '#2a2f40'}`, background: level === l ? 'rgba(45,212,160,0.1)' : 'transparent', color: level === l ? '#2dd4a0' : '#8b90a5' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Registered Name + Date of Birth */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Registered Name</label>
          <input value={registeredName} onChange={(e) => setRegisteredName(e.target.value)} placeholder="e.g. Happy Paws Buddy" className="w-full outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full outline-none" style={inputStyle} />
        </div>
      </div>

      {/* KATH Number + Microchip */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>
            KATH Number
            <span className="ml-1 normal-case font-normal" style={{ color: '#555b73' }}>(kennel club reg.)</span>
          </label>
          <input value={kathNumber} onChange={(e) => setKathNumber(e.target.value)} placeholder="e.g. KA-12345" className="w-full outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Microchip Number</label>
          <input value={microchip} onChange={(e) => setMicrochip(e.target.value)} placeholder="15-digit number" className="w-full outline-none" style={inputStyle} />
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button type="button" onClick={onCancel} className="flex-1 cursor-pointer text-[13px]" style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 cursor-pointer text-[13px] font-bold disabled:opacity-50" style={primaryBtnStyle}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function CompetitorDashboard() {
  const { user } = useAuthStore();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [addingDog, setAddingDog] = useState(false);
  // Edit form state
  const [editDogId, setEditDogId] = useState<string | null>(null);

  // Shared form fields
  const [formName, setFormName] = useState('');
  const [formBreed, setFormBreed] = useState('');
  const [formSize, setFormSize] = useState<'S' | 'M' | 'I' | 'L'>('M');
  const [formIcon, setFormIcon] = useState('');
  const [formLevel, setFormLevel] = useState<CompetitionLevel | ''>('');
  const [formRegisteredName, setFormRegisteredName] = useState('');
  const [formKath, setFormKath] = useState('');
  const [formMicrochip, setFormMicrochip] = useState('');
  const [formDob, setFormDob] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 1500);
    Promise.all([getDogs(user.id), getMyRegistrations(user.id)])
      .then(([d, r]) => { setDogs(d); setRegistrations(r); })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
    return () => clearTimeout(timeout);
  }, [user]);

  const resetForm = () => {
    setFormName(''); setFormBreed(''); setFormSize('M'); setFormIcon('');
    setFormLevel(''); setFormRegisteredName(''); setFormKath(''); setFormMicrochip(''); setFormDob('');
  };

  const startEdit = (dog: Dog) => {
    setEditDogId(dog.id);
    setFormName(dog.name);
    setFormBreed(dog.breed === '—' ? '' : dog.breed);
    setFormSize(dog.size);
    setFormIcon(dog.icon ?? '');
    setFormLevel(dog.competition_level ?? '');
    setFormRegisteredName(dog.registered_name ?? '');
    setFormKath(dog.kath_number ?? '');
    setFormMicrochip(dog.microchip_number ?? '');
    setFormDob(dog.date_of_birth ?? '');
    setAddingDog(false);
  };

  const cancelForm = () => { setAddingDog(false); setEditDogId(null); resetForm(); };

  const formProps = {
    name: formName, setName: setFormName,
    breed: formBreed, setBreed: setFormBreed,
    size: formSize, setSize: setFormSize,
    icon: formIcon, setIcon: setFormIcon,
    level: formLevel, setLevel: setFormLevel,
    registeredName: formRegisteredName, setRegisteredName: setFormRegisteredName,
    kathNumber: formKath, setKathNumber: setFormKath,
    microchip: formMicrochip, setMicrochip: setFormMicrochip,
    dob: formDob, setDob: setFormDob,
    saving, onCancel: cancelForm,
  };

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formName.trim()) return;
    setSaving(true);
    try {
      const dog = await addDog({
        owner_id: user.id,
        name: formName.trim(),
        breed: formBreed || '—',
        size: formSize,
        icon: formIcon || null,
        competition_level: formLevel || null,
        registered_name: formRegisteredName.trim() || null,
        kath_number: formKath.trim() || null,
        microchip_number: formMicrochip.trim() || null,
        date_of_birth: formDob || null,
      });
      setDogs((prev) => [...prev, dog]);
      setAddingDog(false);
      resetForm();
    } catch (err) {
      alert('Could not save: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditDog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDogId || !formName.trim()) return;
    setSaving(true);
    try {
      const dog = await updateDog(editDogId, {
        name: formName.trim(),
        breed: formBreed || '—',
        size: formSize,
        icon: formIcon || null,
        competition_level: formLevel || null,
        registered_name: formRegisteredName.trim() || null,
        kath_number: formKath.trim() || null,
        microchip_number: formMicrochip.trim() || null,
        date_of_birth: formDob || null,
      });
      setDogs((prev) => prev.map((d) => (d.id === editDogId ? dog : d)));
      setEditDogId(null);
      resetForm();
    } catch (err) {
      alert('Could not save: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDog = async (id: string) => {
    if (!confirm('Remove this dog?')) return;
    await deleteDog(id);
    setDogs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <main className="max-w-[760px] mx-auto px-5 py-8">
      <h1 className="font-display text-[26px] mb-8" style={{ color: '#f0f2f8' }}>My Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* My Dogs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[12px] font-bold uppercase tracking-[1px]" style={{ color: '#8b90a5' }}>My Dogs</h2>
              {!addingDog && !editDogId && (
                <button onClick={() => { resetForm(); setAddingDog(true); }} className="text-[12px] font-bold cursor-pointer" style={{ background: 'none', border: 'none', color: '#ff6b2c' }}>
                  + Add Dog
                </button>
              )}
            </div>

            {addingDog && (
              <DogForm {...formProps} title="New Dog" onSubmit={handleAddDog} />
            )}

            {dogs.length === 0 && !addingDog ? (
              <div className="text-center py-8" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
                <p className="text-[13px]" style={{ color: '#8b90a5' }}>No dogs yet. Add your first dog to register in events.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dogs.map((dog) =>
                  editDogId === dog.id ? (
                    <DogForm key={dog.id} {...formProps} title={`Edit ${dog.name}`} onSubmit={handleEditDog} />
                  ) : (
                    <div key={dog.id} style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '12px 16px' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>{dog.icon} {dog.name}</span>
                          <span className="text-[12px] ml-2" style={{ color: '#8b90a5' }}>{dog.breed !== '—' ? dog.breed : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {dog.competition_level && (
                            <span className="text-[11px] font-bold" style={{ color: '#2dd4a0', background: 'rgba(45,212,160,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                              {dog.competition_level}
                            </span>
                          )}
                          <span className="text-[11px] font-bold" style={{ color: '#ff6b2c', background: 'rgba(255,107,44,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                            {SIZE_LABELS[dog.size]}
                          </span>
                          <button onClick={() => startEdit(dog)} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#8b90a5' }}>Edit</button>
                          <button onClick={() => handleDeleteDog(dog.id)} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#555b73' }}>✕</button>
                        </div>
                      </div>
                      {(dog.registered_name || dog.date_of_birth || dog.kath_number || dog.microchip_number) && (
                        <div className="flex gap-4 mt-1.5 text-[11px] flex-wrap" style={{ color: '#555b73' }}>
                          {dog.registered_name && <span>🏷 {dog.registered_name}</span>}
                          {dog.date_of_birth && <span>🎂 {dog.date_of_birth}</span>}
                          {dog.kath_number && <span>📋 KATH: {dog.kath_number}</span>}
                          {dog.microchip_number && <span>🔬 {dog.microchip_number}</span>}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* My Registrations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[12px] font-bold uppercase tracking-[1px]" style={{ color: '#8b90a5' }}>My Registrations</h2>
              <Link to="/" className="text-[12px] font-bold no-underline" style={{ color: '#ff6b2c' }}>Browse Events</Link>
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-8" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
                <p className="text-[13px]" style={{ color: '#8b90a5' }}>No registrations yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {registrations.map((reg) => {
                  const color = REG_STATUS_COLORS[reg.status];
                  return (
                    <div key={reg.id} style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '12px 16px' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold" style={{ color: '#f0f2f8' }}>Event registration</span>
                        <span className="text-[10px] font-bold uppercase" style={{ padding: '2px 8px', borderRadius: '20px', background: `${color}20`, color }}>
                          {REG_STATUS_LABELS[reg.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[12px]" style={{ color: '#8b90a5' }}>
                        <span>฿{reg.price_thb.toLocaleString()}</span>
                        {reg.status === 'pending_payment' && (
                          <Link to={`/events/${reg.event_id}/register?step=receipt&regId=${reg.id}`} className="font-semibold no-underline" style={{ color: '#ff6b2c' }}>
                            Upload Receipt →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: '8px',
  border: '2px solid #2a2f40',
  background: '#1c2030',
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
