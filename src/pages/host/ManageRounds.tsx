import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventRounds, addEventRound, updateEventRound, deleteEventRound } from '../../lib/db.ts';
import type { EventRound } from '../../types/supabase.ts';

export default function ManageRounds() {
  const { eventId } = useParams<{ eventId: string }>();
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAbbr, setFormAbbr] = useState('');
  const [formSct, setFormSct] = useState(40);
  const [formMct, setFormMct] = useState(56);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getEventRounds(eventId).then(setRounds).finally(() => setLoading(false));
  }, [eventId]);

  const resetForm = () => { setFormName(''); setFormAbbr(''); setFormSct(40); setFormMct(56); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !formName.trim()) return;
    setSaving(true);
    try {
      const r = await addEventRound({
        event_id: eventId,
        name: formName.trim(),
        abbreviation: formAbbr.trim() || formName.trim().substring(0, 4),
        sort_order: rounds.length,
        sct: formSct,
        mct: formMct,
      });
      setRounds((prev) => [...prev, r]);
      setAdding(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    try {
      const r = await updateEventRound(editId, { name: formName.trim(), abbreviation: formAbbr.trim(), sct: formSct, mct: formMct });
      setRounds((prev) => prev.map((x) => (x.id === editId ? r : x)));
      setEditId(null);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this round?')) return;
    await deleteEventRound(id);
    setRounds((prev) => prev.filter((r) => r.id !== id));
  };

  const startEdit = (r: EventRound) => {
    setEditId(r.id);
    setFormName(r.name);
    setFormAbbr(r.abbreviation);
    setFormSct(r.sct);
    setFormMct(r.mct);
    setAdding(false);
  };

  const RoundForm = ({ onSubmit, label }: { onSubmit: (e: React.FormEvent) => void; label: string }) => (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4" style={{ background: '#1c2030', border: '1px solid #2a2f40', borderRadius: '10px' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Name</label>
          <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Agility A1" className="w-full outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Abbr</label>
          <input value={formAbbr} onChange={(e) => setFormAbbr(e.target.value)} placeholder="A1" maxLength={4} className="w-full outline-none" style={inputStyle} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>SCT (sec)</label>
          <input type="number" min={1} value={formSct} onChange={(e) => setFormSct(Number(e.target.value))} className="w-full outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>MCT (sec)</label>
          <input type="number" min={1} value={formMct} onChange={(e) => setFormMct(Number(e.target.value))} className="w-full outline-none" style={inputStyle} />
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={() => { setAdding(false); setEditId(null); resetForm(); }} className="flex-1 cursor-pointer text-[13px]" style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 cursor-pointer text-[13px] font-bold disabled:opacity-50" style={primaryBtnStyle}>{saving ? '…' : label}</button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <Link to={`/host/events/${eventId}`} className="text-[13px] no-underline" style={{ color: '#8b90a5' }}>← Event Hub</Link>
          <span className="text-[14px] font-semibold" style={{ color: '#f0f2f8' }}>Rounds</span>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-[22px]" style={{ color: '#f0f2f8' }}>Manage Rounds</h1>
          {!adding && !editId && (
            <button onClick={() => setAdding(true)} className="text-[12px] font-bold cursor-pointer" style={{ background: 'none', border: 'none', color: '#ff6b2c' }}>
              + Add Round
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {adding && <RoundForm onSubmit={handleAdd} label="Add Round" />}

            {rounds.map((r) => (
              editId === r.id ? (
                <RoundForm key={r.id} onSubmit={handleEdit} label="Save Changes" />
              ) : (
                <div key={r.id} className="flex items-center justify-between" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '12px 16px' }}>
                  <div>
                    <span className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>{r.name}</span>
                    <span className="text-[11px] ml-2 font-mono" style={{ color: '#8b90a5' }}>{r.abbreviation}</span>
                    <span className="text-[12px] ml-3" style={{ color: '#555b73' }}>SCT {r.sct}s · MCT {r.mct}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(r)} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#8b90a5' }}>Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#555b73' }}>✕</button>
                  </div>
                </div>
              )
            ))}

            {rounds.length === 0 && !adding && (
              <div className="text-center py-8" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '12px' }}>
                <p className="text-[13px]" style={{ color: '#8b90a5' }}>No rounds yet. Add the first round to get started.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
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
