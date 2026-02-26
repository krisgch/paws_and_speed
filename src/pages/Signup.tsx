import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.tsx';
import { signUp, redeemHostInvite } from '../lib/auth.ts';

export default function Signup() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err, data } = await signUp(email.trim(), password, displayName.trim());
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // If invite code provided and user was created, try to redeem
    if (inviteCode.trim() && data.user) {
      await redeemHostInvite(inviteCode.trim());
    }

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="font-display text-[20px] mb-2" style={{ color: '#f0f2f8' }}>
            Check your email
          </h2>
          <p className="text-[13px] mb-6" style={{ color: '#8b90a5' }}>
            We sent a confirmation link to <strong style={{ color: '#f0f2f8' }}>{email}</strong>. Click it to activate
            your account.
          </p>
          <Link
            to="/login"
            className="text-[13px] font-semibold"
            style={{ color: '#ff6b2c' }}
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-[22px] mb-1" style={{ color: '#f0f2f8' }}>
        Create account
      </h1>
      <p className="text-[13px] mb-6" style={{ color: '#8b90a5' }}>
        Join Paws&Speed to register your dog in events.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>
            Your Name
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color: '#8b90a5' }}>
            Host Invite Code
            <span className="ml-1 normal-case font-normal" style={{ color: '#555b73' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Leave blank for competitor account"
            className="w-full outline-none"
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}
          />
        </div>

        {error && (
          <div className="text-[12px] font-semibold" style={{ color: '#ef4444' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer text-[14px] font-bold disabled:opacity-50 mt-1"
          style={primaryBtnStyle}
        >
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <p className="text-[12px] text-center mt-5" style={{ color: '#8b90a5' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#ff6b2c' }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '2px solid #2a2f40',
  background: '#1c2030',
  color: '#f0f2f8',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '11px 24px',
  borderRadius: '8px',
  border: 'none',
  background: '#ff6b2c',
  color: '#fff',
};
