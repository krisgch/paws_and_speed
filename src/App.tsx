import { useEffect } from 'react';
import useStore from './store/useStore.ts';
import { HOST_PIN } from './constants/index.ts';
import Header from './components/Header.tsx';
import Toast from './components/Toast.tsx';
import RunningOrder from './pages/RunningOrder.tsx';
import Scoring from './pages/Scoring/index.tsx';
import Ranking from './pages/Ranking.tsx';
import Competitors from './pages/Competitors.tsx';
import type { Page } from './types/index.ts';

function parseHash(): { page: Page; pin?: string } {
  const hash = window.location.hash || '';
  // Parse /#/page?pin=xxxx
  const match = hash.match(/^#\/(\w+)(?:\?(.*))?$/);
  if (!match) return { page: 'running' };

  const page = match[1] as string;
  const validPages: Page[] = ['running', 'scoring', 'ranking', 'competitors'];
  const resolvedPage = validPages.includes(page as Page) ? (page as Page) : 'running';

  let pin: string | undefined;
  if (match[2]) {
    const params = new URLSearchParams(match[2]);
    pin = params.get('pin') ?? undefined;
  }

  return { page: resolvedPage, pin };
}

export default function App() {
  const { currentPage, setPage, setHostUnlocked, hostUnlocked } = useStore();

  useEffect(() => {
    const handleHash = () => {
      const { page, pin } = parseHash();

      if (pin === HOST_PIN) {
        setHostUnlocked(true);
      }

      const isUnlocked = useStore.getState().hostUnlocked;
      if ((page === 'scoring' || page === 'competitors') && !isUnlocked && pin !== HOST_PIN) {
        setPage('running');
        window.location.hash = '#/running';
      } else {
        setPage(page);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If host locks while on scoring, redirect
  useEffect(() => {
    if ((currentPage === 'scoring' || currentPage === 'competitors') && !hostUnlocked) {
      setPage('running');
      window.location.hash = '#/running';
    }
  }, [hostUnlocked, currentPage, setPage]);

  return (
    <div className="min-h-screen" style={{ background: '#0c0e12', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <main className="max-w-[1440px] mx-auto px-3 py-4 sm:px-5 sm:py-6">
        <div className="animate-fadeIn">
          {currentPage === 'running' && <RunningOrder />}
          {currentPage === 'scoring' && <Scoring />}
          {currentPage === 'ranking' && <Ranking />}
          {currentPage === 'competitors' && <Competitors />}
        </div>
      </main>
      <Toast />
    </div>
  );
}
