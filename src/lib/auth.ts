import { supabase } from './supabase.ts';
import type { UserProfile } from '../types/supabase.ts';

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, displayName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

function getAccessToken(): string | null {
  // Scan localStorage for any Supabase auth token regardless of key format
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? '');
        if (parsed?.access_token) return parsed.access_token;
      } catch {}
    }
  }
  return null;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const accessToken = getAccessToken();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*&limit=1`,
    {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${accessToken ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

export async function updateProfile(userId: string, updates: { display_name: string }): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updates),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
}

export async function redeemHostInvite(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('redeem_host_invite', { invite_code: code });
  if (error) return false;
  return data === true;
}
