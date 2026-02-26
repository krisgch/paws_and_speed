import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore.ts';
import { getDogs, addDog, deleteDog, getMyRegistrations } from '../../lib/db.ts';
import { signOut } from '../../lib/auth.ts';
import type { Dog, Registration } from '../../types/supabase.ts';
import { AGILITY_BREEDS, SIZES } from '../../constants/index.ts';

const SIZE_LABELS: Record<string, string> = { S: 'Small', M: 'Medium', I: 'Intermediate', L: 'Large' };

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

export default function CompetitorDashboard() {
  const { user, profile, setUser, setProfile } = useAuthStore();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDog, setAddingDog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newSize, setNewSize] = useState<'S' | 'M' | 'I' | 'L'>('M');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getDogs(user.id), getMyRegistrations(user.id)])
      .then(([d, r]) => { setDogs(d); setRegistrations(r); })
      .finally(() => setLoading(false));
  }, [user]);

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setSaving(true);
    try {
      const dog = await addDog({ owner_id: user.id, name: newName.trim(), breed: newBreed || '—', size: newSize, icon: null });
      setDogs((prev) => [...prev, dog]);
      setAddingDog(false);
      setNewName('');
      setNewBreed('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDog = async (id: string) => {
    if (!confirm('Remove this dog?')) return;
    await deleteDog(id);
    setDogs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 flex items-center justify-center text-[14px] -rotate-6" style={{ background: '#ff6b2c', borderRadius: '8px' }}>🐾</div>
            <span className="font-display text-[16px]" style={{ color: '#f0f2f8' }}>Paws<span style={{ color: '#ff6b2c' }}>&</span>Speed</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[12px]" style={{ color: '#8b90a5' }}>{profile?.display_name}</span>
            <button onClick={handleSignOut} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#555b73' }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

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
                {!addingDog && (
                  <button onClick={() => setAddingDog(true)} className="text-[12px] font-bold cursor-pointer" style={{ background: 'none', border: 'none', color: '#ff6b2c' }}>
                    + Add Dog
                  </button>
                )}
              </div>

              {addingDog && (
                <form onSubmit={handleAddDog} className="flex flex-col gap-3 p-4 mb-4" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px' }}>
                  <p className="text-[13px] font-semibold" style={{ color: '#f0f2f8' }}>New Dog</p>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dog name" required className="w-full outline-none" style={inputStyle} />
                  <select value={newBreed} onChange={(e) => setNewBreed(e.target.value)} className="w-full outline-none" style={inputStyle}>
                    <option value="">— Breed (optional) —</option>
                    {AGILITY_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <div className="flex gap-2">
                    {SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => setNewSize(s)} className="flex-1 cursor-pointer text-[12px] font-bold" style={{ padding: '7px', borderRadius: '8px', border: `2px solid ${newSize === s ? '#ff6b2c' : '#2a2f40'}`, background: newSize === s ? 'rgba(255,107,44,0.1)' : 'transparent', color: newSize === s ? '#ff6b2c' : '#8b90a5' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAddingDog(false)} className="flex-1 cursor-pointer text-[13px]" style={cancelBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 cursor-pointer text-[13px] font-bold disabled:opacity-50" style={primaryBtnStyle}>{saving ? 'Saving…' : 'Save'}</button>
                  </div>
                </form>
              )}

              {dogs.length === 0 && !addingDog ? (
                <div className="text-center py-8" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
                  <p className="text-[13px]" style={{ color: '#8b90a5' }}>No dogs yet. Add your first dog to register in events.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dogs.map((dog) => (
                    <div key={dog.id} className="flex items-center justify-between" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '12px 16px' }}>
                      <div>
                        <span className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>{dog.icon} {dog.name}</span>
                        <span className="text-[12px] ml-2" style={{ color: '#8b90a5' }}>{dog.breed}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold" style={{ color: '#ff6b2c', background: 'rgba(255,107,44,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                          {SIZE_LABELS[dog.size]}
                        </span>
                        <button onClick={() => handleDeleteDog(dog.id)} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#555b73' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
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
                          <span className="text-[13px] font-semibold" style={{ color: '#f0f2f8' }}>
                            Event registration
                          </span>
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
    </div>
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
