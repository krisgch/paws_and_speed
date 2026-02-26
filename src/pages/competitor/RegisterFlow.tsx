import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore.ts';
import { getEvent, getEventRounds, createRegistration, updateRegistration } from '../../lib/db.ts';
import DogSelector from '../../components/DogSelector.tsx';
import PricingCalculator from '../../components/PricingCalculator.tsx';
import ReceiptUploader from '../../components/ReceiptUploader.tsx';
import { calculatePrice } from '../../utils/pricing.ts';
import type { Event, EventRound, Dog, Registration } from '../../types/supabase.ts';

type Step = 'dog' | 'rounds' | 'price' | 'receipt';
const STEPS: Step[] = ['dog', 'rounds', 'price', 'receipt'];
const STEP_LABELS: Record<Step, string> = {
  dog: 'Select Dog',
  rounds: 'Choose Rounds',
  price: 'Review Price',
  receipt: 'Upload Receipt',
};

export default function RegisterFlow() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('dog');
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [selectedRoundIds, setSelectedRoundIds] = useState<string[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    Promise.all([getEvent(eventId), getEventRounds(eventId)])
      .then(([ev, rds]) => { setEvent(ev); setRounds(rds); })
      .finally(() => setLoading(false));
  }, [eventId]);

  const price = event ? calculatePrice(selectedRoundIds.length, event.pricing_tiers) : 0;

  const goNext = async () => {
    const idx = STEPS.indexOf(step);
    if (step === 'price' && !registration) {
      // Create the registration
      if (!user || !selectedDog || !eventId) return;
      setSaving(true);
      setError('');
      try {
        const reg = await createRegistration({
          event_id: eventId,
          competitor_id: user.id,
          dog_id: selectedDog.id,
          selected_round_ids: selectedRoundIds,
          status: 'pending_payment',
          price_thb: price,
          receipt_image_path: null,
          receipt_uploaded_at: null,
          review_note: null,
          reviewed_by: null,
          reviewed_at: null,
        });
        setRegistration(reg);
        setStep(STEPS[idx + 1]);
      } catch (e) {
        setError((e as Error).message ?? 'Registration failed');
      } finally {
        setSaving(false);
      }
    } else {
      setStep(STEPS[idx + 1]);
    }
  };

  const handleReceiptUploaded = async (path: string) => {
    if (!registration) return;
    setSaving(true);
    try {
      await updateRegistration(registration.id, {
        receipt_image_path: path,
        receipt_uploaded_at: new Date().toISOString(),
        status: 'pending_review',
      });
      navigate('/dashboard');
    } catch (e) {
      setError((e as Error).message ?? 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0e12' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2f40', borderTopColor: '#ff6b2c' }} />
      </div>
    );
  }

  if (!event) return null;

  const stepIdx = STEPS.indexOf(step);
  const canGoNext =
    (step === 'dog' && selectedDog !== null) ||
    (step === 'rounds' && selectedRoundIds.length > 0) ||
    (step === 'price') ||
    step === 'receipt';

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f40' }}>
        <div className="max-w-[560px] mx-auto flex items-center justify-between">
          <div>
            <p className="text-[12px]" style={{ color: '#8b90a5' }}>Register for</p>
            <p className="font-semibold text-[15px]" style={{ color: '#f0f2f8' }}>{event.name}</p>
          </div>
          <button onClick={() => navigate(`/events/${eventId}`)} className="text-[12px] cursor-pointer" style={{ background: 'none', border: 'none', color: '#8b90a5' }}>
            ✕
          </button>
        </div>
      </header>

      <main className="max-w-[560px] mx-auto px-5 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: i < stepIdx ? '#2dd4a0' : i === stepIdx ? '#ff6b2c' : '#1c2030',
                  color: i <= stepIdx ? '#fff' : '#555b73',
                }}
              >
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className="text-[11px] hidden sm:inline" style={{ color: i === stepIdx ? '#f0f2f8' : '#555b73' }}>
                {STEP_LABELS[s]}
              </span>
              {i < STEPS.length - 1 && <div className="w-6 h-px" style={{ background: '#2a2f40' }} />}
            </div>
          ))}
        </div>

        <h2 className="font-display text-[20px] mb-6" style={{ color: '#f0f2f8' }}>
          {STEP_LABELS[step]}
        </h2>

        {/* Step content */}
        {step === 'dog' && (
          <DogSelector selected={selectedDog} onSelect={setSelectedDog} />
        )}

        {step === 'rounds' && (
          <div className="flex flex-col gap-3">
            {rounds.map((r) => {
              const selected = selectedRoundIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoundIds((prev) =>
                      selected ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                    );
                  }}
                  className="w-full text-left cursor-pointer"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${selected ? '#ff6b2c' : '#2a2f40'}`,
                    background: selected ? 'rgba(255,107,44,0.08)' : '#1c2030',
                    color: '#f0f2f8',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[14px]">{r.name}</p>
                      <p className="text-[12px]" style={{ color: '#8b90a5' }}>SCT {r.sct}s · MCT {r.mct}s</p>
                    </div>
                    <span style={{ color: selected ? '#ff6b2c' : '#2a2f40', fontSize: '18px' }}>
                      {selected ? '☑' : '☐'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 'price' && (
          <div className="flex flex-col gap-4">
            <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '16px' }}>
              <p className="text-[12px] font-bold uppercase tracking-[0.5px] mb-3" style={{ color: '#8b90a5' }}>Summary</p>
              <p className="text-[14px] mb-1" style={{ color: '#f0f2f8' }}>
                <strong>{selectedDog?.name}</strong> · {selectedRoundIds.length} round{selectedRoundIds.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[12px]" style={{ color: '#8b90a5' }}>
                {rounds.filter((r) => selectedRoundIds.includes(r.id)).map((r) => r.name).join(', ')}
              </p>
            </div>
            <PricingCalculator runCount={selectedRoundIds.length} tiers={event.pricing_tiers} />
            {event.bank_account && (
              <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '10px', padding: '14px 16px' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: '#8b90a5' }}>Payment to</p>
                <p className="font-mono text-[15px] font-bold" style={{ color: '#f0f2f8' }}>{event.bank_account}</p>
              </div>
            )}
          </div>
        )}

        {step === 'receipt' && registration && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px]" style={{ color: '#8b90a5' }}>
              Transfer <strong style={{ color: '#ff6b2c' }}>฿{price.toLocaleString()}</strong> to the account above, then upload your receipt photo.
            </p>
            <ReceiptUploader registrationId={registration.id} onUploaded={handleReceiptUploaded} />
          </div>
        )}

        {error && (
          <p className="text-[12px] mt-3" style={{ color: '#ef4444' }}>{error}</p>
        )}

        {step !== 'receipt' && (
          <div className="flex gap-3 mt-8">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={() => setStep(STEPS[stepIdx - 1])}
                className="flex-1 cursor-pointer text-[13px]"
                style={{ padding: '11px', borderRadius: '8px', border: '1px solid #2a2f40', background: 'transparent', color: '#8b90a5' }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              disabled={!canGoNext || saving}
              onClick={goNext}
              className="flex-1 cursor-pointer text-[14px] font-bold disabled:opacity-40"
              style={{ padding: '11px', borderRadius: '8px', border: 'none', background: '#ff6b2c', color: '#fff' }}
            >
              {saving ? 'Processing…' : step === 'price' ? 'Confirm & Register →' : 'Continue →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
