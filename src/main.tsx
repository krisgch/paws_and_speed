import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { router } from './router/index.tsx';
import { supabase } from './lib/supabase.ts';
import useAuthStore from './store/useAuthStore.ts';
import { getProfile } from './lib/auth.ts';

const { setUser, setProfile, setLoading } = useAuthStore.getState();

// Safety net: never leave the app stuck in loading state
setTimeout(() => setLoading(false), 1500);

// Initialise auth state before first render
supabase.auth.getSession()
  .then(async ({ data: { session } }) => {
    if (session?.user) {
      setUser(session.user);
      const profile = await getProfile(session.user.id);
      setProfile(profile);
    }
  })
  .catch(() => {/* network error — fall through to setLoading(false) */})
  .finally(() => setLoading(false));

// Keep auth state in sync across tabs / token refreshes
supabase.auth.onAuthStateChange(async (_event, session) => {
  try {
    if (session?.user) {
      setUser(session.user);
      const profile = await getProfile(session.user.id);
      setProfile(profile);
    } else {
      setUser(null);
      setProfile(null);
    }
  } catch {
    setUser(null);
    setProfile(null);
  } finally {
    setLoading(false);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
