import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.tsx';
import { signIn, getProfile } from '../lib/auth.ts';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err, data } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      const profile = await getProfile(data.user!.id);
      navigate(profile?.role === 'host' ? '/host' : '/dashboard');
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-[22px] mb-1" style={{ color: '#f0f2f8' }}>
        Sign in
      </h1>
      <p className="text-[13px] mb-6" style={{ color: '#8b90a5' }}>
        Welcome back — let's get running.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full outline-none"
            style={inputStyle}
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
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>

      <p className="text-[12px] text-center mt-5" style={{ color: '#8b90a5' }}>
        No account?{' '}
        <Link to="/signup" style={{ color: '#ff6b2c' }}>
          Create one
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
