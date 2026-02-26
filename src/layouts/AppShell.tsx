import { Outlet } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Toast from '../components/Toast.tsx';

export default function AppShell() {
  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <main className="max-w-[1440px] mx-auto px-3 py-4 sm:px-5 sm:py-6">
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  );
}
