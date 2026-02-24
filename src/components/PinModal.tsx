import { useState, useRef, useEffect } from 'react';
import { HOST_PIN } from '../constants/index.ts';
import useStore from '../store/useStore.ts';

interface PinModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PinModal({ open, onClose }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setHostUnlocked = useStore((s) => s.setHostUnlocked);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const verify = () => {
    if (pin === HOST_PIN) {
      setHostUnlocked(true);
      onClose();
    } else {
      setError(true);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center transition-opacity duration-300"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="text-center"
        style={{
          background: '#14171e',
          border: '1px solid #2a2f40',
          borderRadius: '12px',
          padding: '32px',
          width: '360px',
          maxWidth: '90vw',
        }}
      >
        <h3 className="font-display text-[18px] mb-2" style={{ color: '#f0f2f8' }}>
          🔐 Host Access
        </h3>
        <p className="text-[13px] mb-5" style={{ color: '#8b90a5' }}>
          Enter the host PIN to access the Scoring page
        </p>
        <input
          ref={inputRef}
          type="password"
          maxLength={4}
          placeholder="····"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
          className="w-full mb-4 outline-none transition-colors duration-200"
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #2a2f40',
            background: '#1c2030',
            color: '#f0f2f8',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '24px',
            textAlign: 'center',
            letterSpacing: '8px',
          }}
        />
        {error && (
          <div className="text-[12px] font-semibold mb-3" style={{ color: '#ef4444' }}>
            Incorrect PIN. Try again.
          </div>
        )}
        <button
          onClick={verify}
          className="w-full flex items-center justify-center cursor-pointer text-[13px] font-bold transition-all duration-200"
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#ff6b2c',
            color: '#fff',
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
