import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore.ts';
import { isSupabaseConfigured, createSession, joinSession, leaveSession } from '../lib/sync.ts';

export default function SyncPanel() {
  const { sessionId, syncStatus, hostUnlocked } = useStore();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCreate = async () => {
    setBusy(true);
    try {
      await createSession();
    } catch {
      // syncStatus is already set to 'error' by sync.ts
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setBusy(true);
    setJoinError(false);
    const ok = await joinSession(joinCode.trim());
    setBusy(false);
    if (ok) {
      setJoinCode('');
      setOpen(false);
    } else {
      setJoinError(true);
    }
  };

  const handleLeave = () => {
    leaveSession();
    setOpen(false);
  };

  const handleCopy = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ---- Trigger button appearance ----
  const triggerContent = () => {
    if (syncStatus === 'connecting' || busy) {
      return (
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-[7px] h-[7px] rounded-full animate-pulse" style={{ background: '#fbbf24' }} />
          <span style={{ color: '#fbbf24' }}>Connecting</span>
        </span>
      );
    }
    if (syncStatus === 'connected' && sessionId) {
      return (
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: '#2dd4a0' }} />
          <span style={{ color: '#2dd4a0', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>
            {sessionId}
          </span>
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: '#ef4444' }} />
          <span style={{ color: '#ef4444' }}>Sync error</span>
        </span>
      );
    }
    return <span style={{ color: '#555b73' }}>🔗 Sync</span>;
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer transition-all duration-200 text-[12px] font-bold"
        style={{
          padding: '5px 12px',
          borderRadius: '20px',
          border: 'none',
          background:
            syncStatus === 'connected'
              ? 'rgba(45,212,160,0.12)'
              : syncStatus === 'error'
              ? 'rgba(239,68,68,0.12)'
              : syncStatus === 'connecting'
              ? 'rgba(251,191,36,0.12)'
              : 'rgba(85,91,115,0.15)',
        }}
      >
        {triggerContent()}
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-[300]"
          style={{
            background: '#14171e',
            border: '1px solid #2a2f40',
            borderRadius: '12px',
            padding: '16px',
            width: '260px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          {!isSupabaseConfigured ? (
            // Not configured
            <div>
              <p className="text-[13px] font-bold mb-1" style={{ color: '#f0f2f8' }}>Supabase not configured</p>
              <p className="text-[12px]" style={{ color: '#555b73' }}>
                Create a <code style={{ color: '#ff6b2c' }}>.env.local</code> file with{' '}
                <code style={{ color: '#8b90a5' }}>VITE_SUPABASE_URL</code> and{' '}
                <code style={{ color: '#8b90a5' }}>VITE_SUPABASE_ANON_KEY</code>.
                See <code style={{ color: '#ff6b2c' }}>.env.example</code>.
              </p>
            </div>
          ) : syncStatus === 'connected' && sessionId ? (
            // Connected — show code + leave
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: '#555b73' }}>
                Active Session
              </p>
              <div
                className="flex items-center justify-between mb-3 cursor-pointer select-none"
                style={{
                  background: '#1c2030',
                  border: '1px solid rgba(45,212,160,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
                onClick={handleCopy}
                title="Click to copy"
              >
                <span
                  className="text-[22px] font-bold tracking-[4px]"
                  style={{ color: '#2dd4a0', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {sessionId}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: copied ? '#2dd4a0' : '#555b73' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </span>
              </div>
              <p className="text-[11px] mb-4" style={{ color: '#555b73' }}>
                Share this code with judges and viewers so they can join the live session.
              </p>
              <button
                onClick={handleLeave}
                className="w-full cursor-pointer text-[12px] font-bold"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                }}
              >
                Leave Session
              </button>
            </div>
          ) : (
            // Off / error — show create + join options
            <div>
              {syncStatus === 'error' && (
                <div
                  className="text-[12px] font-semibold mb-3"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#ef4444',
                  }}
                >
                  Connection failed. Check your session code or Supabase setup.
                </div>
              )}

              {hostUnlocked && (
                <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #2a2f40' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: '#555b73' }}>
                    Host — Start a Session
                  </p>
                  <p className="text-[11px] mb-3" style={{ color: '#8b90a5' }}>
                    Creates a new session and uploads your current competition data. A code will be generated to share.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={busy}
                    className="w-full cursor-pointer text-[13px] font-bold disabled:opacity-50"
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,107,44,0.3)',
                      background: 'rgba(255,107,44,0.12)',
                      color: '#ff6b2c',
                    }}
                  >
                    {busy ? 'Creating…' : '🚀 Create Session'}
                  </button>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: '#555b73' }}>
                  Join a Session
                </p>
                <input
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                  placeholder="Enter session code"
                  maxLength={6}
                  className="w-full outline-none mb-2"
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `2px solid ${joinError ? '#ef4444' : '#2a2f40'}`,
                    background: '#1c2030',
                    color: '#f0f2f8',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '16px',
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: '4px',
                  }}
                />
                {joinError && (
                  <p className="text-[11px] mb-2" style={{ color: '#ef4444' }}>
                    Session not found. Check the code and try again.
                  </p>
                )}
                <button
                  onClick={handleJoin}
                  disabled={busy || !joinCode.trim()}
                  className="w-full cursor-pointer text-[13px] font-bold disabled:opacity-40"
                  style={{
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ff6b2c',
                    color: '#fff',
                  }}
                >
                  {busy ? 'Joining…' : 'Join →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
