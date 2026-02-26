import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, updateEvent } from '../../lib/db.ts';
import type { PricingTier } from '../../types/supabase.ts';

export default function ManagePricing() {
  const { eventId } = useParams<{ eventId: string }>();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [bankAccount, setBankAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New tier form
  const [newRuns, setNewRuns] = useState(1);
  const [newPrice, setNewPrice] = useState(500);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then((ev) => {
      if (ev) {
        setTiers(ev.pricing_tiers);
        setBankAccount(ev.bank_account);
      }
    }).finally(() => setLoading(false));
  }, [eventId]);

  const addTier = () => {
    if (!newLabel.trim()) return;
    setTiers((prev) => [...prev.filter((t) => t.runs !== newRuns), { runs: newRuns, price: newPrice, label: newLabel.trim() }].sort((a, b) => a.runs - b.runs));
    setNewLabel('');
  };

  const removeTier = (runs: number) => setTiers((prev) => prev.filter((t) => t.runs !== runs));

  const handleSave = async () => {
    if (!eventId) return;
    setSaving(true);
    await updateEvent(eventId, { pricing_tiers: tiers, bank_account: bankAccount.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0e12' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <Link to={`/host/events/${eventId}`} className="text-[13px] no-underline" style={{ color: '#8b90a5' }}>← Event Hub</Link>
          <span className="text-[14px] font-semibold" style={{ color: '#f0f2f8' }}>Pricing</span>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-5 py-8">
        <h1 className="font-display text-[22px] mb-6" style={{ color: '#f0f2f8' }}>Pricing & Payment</h1>

        {/* Bank account */}
        <div className="mb-8">
          <label className="block text-[12px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: '#8b90a5' }}>
            Bank Account Number
          </label>
          <input
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="e.g. 123-456-7890 (Kasikorn)"
            className="w-full outline-none"
            style={inputStyle}
          />
        </div>

        {/* Pricing tiers */}
        <div className="mb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.5px] mb-3" style={{ color: '#8b90a5' }}>Pricing Tiers</p>

          {tiers.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {tiers.map((t) => (
                <div key={t.runs} className="flex items-center justify-between" style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '8px', padding: '10px 14px' }}>
                  <div>
                    <span className="font-semibold text-[13px]" style={{ color: '#f0f2f8' }}>{t.label}</span>
                    <span className="text-[12px] ml-2" style={{ color: '#8b90a5' }}>{t.runs} run{t.runs !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[14px]" style={{ color: '#ff6b2c' }}>฿{t.price.toLocaleString()}</span>
                    <button onClick={() => removeTier(t.runs)} className="cursor-pointer text-[12px]" style={{ background: 'none', border: 'none', color: '#555b73' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add tier */}
          <div className="flex flex-col gap-3 p-4" style={{ background: '#1c2030', border: '1px solid #2a2f40', borderRadius: '10px' }}>
            <p className="text-[12px] font-semibold" style={{ color: '#8b90a5' }}>Add Tier</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] mb-1" style={{ color: '#555b73' }}>Runs</label>
                <input type="number" min={1} value={newRuns} onChange={(e) => setNewRuns(Number(e.target.value))} className="w-full outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[11px] mb-1" style={{ color: '#555b73' }}>Price (฿)</label>
                <input type="number" min={0} value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} className="w-full outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[11px] mb-1" style={{ color: '#555b73' }}>Label</label>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Single" className="w-full outline-none" style={inputStyle} />
              </div>
            </div>
            <button
              onClick={addTier}
              disabled={!newLabel.trim()}
              className="cursor-pointer text-[13px] font-bold disabled:opacity-40"
              style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,107,44,0.15)', color: '#ff6b2c' }}
            >
              + Add
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full cursor-pointer text-[14px] font-bold disabled:opacity-50"
          style={{ padding: '12px', borderRadius: '10px', border: 'none', background: saved ? '#2dd4a0' : '#ff6b2c', color: saved ? '#0c0e12' : '#fff' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Pricing'}
        </button>
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
