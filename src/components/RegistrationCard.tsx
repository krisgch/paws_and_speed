import { useState } from 'react';
import { updateRegistration } from '../lib/db.ts';
import { getReceiptUrl } from '../lib/storage.ts';
import type { Registration } from '../types/supabase.ts';

interface RegistrationCardProps {
  registration: Registration;
  dogName: string;
  competitorName: string;
  roundNames: string[];
  onUpdate: (updated: Registration) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#fbbf24',
  pending_review: '#60a5fa',
  approved: '#2dd4a0',
  rejected: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  pending_review: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function RegistrationCard({
  registration,
  dogName,
  competitorName,
  roundNames,
  onUpdate,
}: RegistrationCardProps) {
  const [reviewNote, setReviewNote] = useState(registration.review_note ?? '');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(registration.status === 'pending_review');

  const act = async (newStatus: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      const updated = await updateRegistration(registration.id, {
        status: newStatus,
        review_note: reviewNote.trim() || null,
        reviewed_at: new Date().toISOString(),
      });
      onUpdate(updated);
    } finally {
      setBusy(false);
    }
  };

  const color = STATUS_COLORS[registration.status];

  return (
    <div
      style={{
        background: '#14171e',
        border: `1px solid ${registration.status === 'pending_review' ? 'rgba(96,165,250,0.3)' : '#2a2f40'}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left cursor-pointer"
        style={{ padding: '14px 18px', background: 'none', border: 'none' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-[14px]" style={{ color: '#f0f2f8' }}>
              {dogName}
            </span>
            <span className="text-[12px] ml-2" style={{ color: '#8b90a5' }}>
              by {competitorName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.5px]"
              style={{ padding: '2px 8px', borderRadius: '20px', background: `${color}20`, color }}
            >
              {STATUS_LABELS[registration.status]}
            </span>
            <span style={{ color: '#555b73' }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid #2a2f40' }}>
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[12px]" style={{ color: '#8b90a5' }}>
              <strong style={{ color: '#f0f2f8' }}>Rounds:</strong>{' '}
              {roundNames.length ? roundNames.join(', ') : '—'}
            </p>
            <p className="text-[12px]" style={{ color: '#8b90a5' }}>
              <strong style={{ color: '#f0f2f8' }}>Fee:</strong> ฿{registration.price_thb.toLocaleString()}
            </p>
            {registration.receipt_image_path && (
              <a
                href={getReceiptUrl(registration.receipt_image_path)}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold"
                style={{ color: '#ff6b2c' }}
              >
                📷 View Receipt
              </a>
            )}
          </div>

          {registration.status === 'pending_review' && (
            <div className="mt-4 flex flex-col gap-2">
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional note to competitor…"
                className="w-full outline-none resize-none"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #2a2f40',
                  background: '#1c2030',
                  color: '#f0f2f8',
                  fontSize: '13px',
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act('rejected')}
                  className="flex-1 cursor-pointer text-[13px] font-bold disabled:opacity-50"
                  style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act('approved')}
                  className="flex-1 cursor-pointer text-[13px] font-bold disabled:opacity-50"
                  style={{ padding: '9px', borderRadius: '8px', border: 'none', background: '#2dd4a0', color: '#0c0e12' }}
                >
                  {busy ? '…' : 'Approve ✓'}
                </button>
              </div>
            </div>
          )}

          {registration.review_note && registration.status !== 'pending_review' && (
            <p className="mt-3 text-[12px]" style={{ color: '#8b90a5' }}>
              <strong style={{ color: '#f0f2f8' }}>Note:</strong> {registration.review_note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
