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

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export async function redeemHostInvite(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('redeem_host_invite', { invite_code: code });
  if (error) return false;
  return data === true;
}
