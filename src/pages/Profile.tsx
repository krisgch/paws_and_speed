import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore.ts';
import { updateProfile, getProfile } from '../lib/auth.ts';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  host: 'Host',
  competitor: 'Competitor',
};

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  super_admin: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  host:        { color: '#2dd4a0', bg: 'rgba(45,212,160,0.1)' },
  competitor:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
};

const ROLE_AVATAR: Record<string, string> = {
  super_admin: '#a78bfa',
  host:        '#2dd4a0',
  competitor:  '#60a5fa',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { user, profile, setProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync displayName when profile loads asynchronously
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  const role = profile?.role ?? 'competitor';
  const roleStyle = ROLE_COLORS[role] ?? ROLE_COLORS.competitor;
  const avatarColor = ROLE_AVATAR[role] ?? ROLE_AVATAR.competitor;
  const initials = (profile?.display_name ?? user?.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile(user.id, { display_name: displayName.trim() });
      const fresh = await getProfile(user.id);
      setProfile(fresh);
      setEditing(false);
    } catch (err) {
      setError((err as any)?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-[600px] mx-auto px-5 py-10">
        <h1 className="font-display text-[26px] mb-8" style={{ color: '#f0f2f8' }}>My Profile</h1>

        <div style={{ background: '#14171e', border: '1px solid #2a2f40', borderRadius: '16px', padding: '28px' }}>
          {/* Avatar + name */}
          <div className="flex items-center gap-5 mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold flex-shrink-0"
              style={{ background: `${avatarColor}20`, color: avatarColor, border: `2px solid ${avatarColor}40` }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-[20px] truncate" style={{ color: '#f0f2f8' }}>
                  {profile?.display_name || '—'}
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.5px]"
                  style={{ padding: '2px 8px', borderRadius: '4px', ...roleStyle }}
                >
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <p className="text-[13px] mt-0.5" style={{ color: '#8b90a5' }}>{user?.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-5">
            {/* Display name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: '#555b73' }}>
                Display Name
              </label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 outline-none"
                    style={inputStyle}
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-[13px] font-bold cursor-pointer disabled:opacity-50"
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ff6b2c', color: '#fff' }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setDisplayName(profile?.display_name ?? ''); }}
                    className="text-[13px] cursor-pointer"
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #2a2f40', background: 'transparent', color: '#8b90a5' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: '#f0f2f8' }}>{profile?.display_name || '—'}</span>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[12px] cursor-pointer"
                    style={{ background: 'none', border: 'none', color: '#ff6b2c' }}
                  >
                    Edit
                  </button>
                </div>
              )}
              {error && <p className="text-[12px] mt-1" style={{ color: '#ef4444' }}>{error}</p>}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e2330' }} />

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: '#555b73' }}>
                Email
              </label>
              <span className="text-[14px]" style={{ color: '#f0f2f8' }}>{user?.email}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e2330' }} />

            {/* Role */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: '#555b73' }}>
                Role
              </label>
              <span
                className="text-[12px] font-bold uppercase tracking-[0.5px]"
                style={{ padding: '3px 10px', borderRadius: '6px', ...roleStyle }}
              >
                {ROLE_LABELS[role]}
              </span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e2330' }} />

            {/* Member since */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: '#555b73' }}>
                Member Since
              </label>
              <span className="text-[14px]" style={{ color: '#f0f2f8' }}>
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e2330' }} />

            {/* Account ID */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: '#555b73' }}>
                Account ID
              </label>
              <span className="text-[12px] font-mono" style={{ color: '#555b73' }}>{user?.id}</span>
            </div>
          </div>
        </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: '8px',
  border: '2px solid #2a2f40',
  background: '#1c2030',
  color: '#f0f2f8',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
};
