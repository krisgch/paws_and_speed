import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}
    >
      <Link to="/" className="flex items-center gap-3 mb-8 no-underline">
        <div
          className="w-9 h-9 flex items-center justify-center text-[18px] -rotate-6"
          style={{ background: '#ff6b2c', borderRadius: '10px' }}
        >
          🐾
        </div>
        <div className="font-display text-[20px] tracking-[-0.5px]" style={{ color: '#f0f2f8' }}>
          Paws<span style={{ color: '#ff6b2c' }}>&</span>Speed
        </div>
      </Link>

      <div
        className="w-full max-w-[420px]"
        style={{
          background: '#14171e',
          border: '1px solid #2a2f40',
          borderRadius: '16px',
          padding: '32px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
