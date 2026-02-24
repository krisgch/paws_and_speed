import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import useStore from '../store/useStore.ts';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null;

// ---------------------------------------------------------------------------
// Stable per-device identity (so we can ignore our own real-time echoes)
// ---------------------------------------------------------------------------

let deviceId = localStorage.getItem('paws-device-id');
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem('paws-device-id', deviceId);
}
const DEVICE_ID = deviceId;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let activeChannel: RealtimeChannel | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

// Guard: true while we're applying a remote update so the store watcher
// doesn't re-push the change back to Supabase.
let syncingFromRemote = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPayload(sessionId: string) {
  const { competitors, courseTimeConfig, rounds } = useStore.getState();
  return {
    session_id: sessionId,
    competitors,
    course_time_config: courseTimeConfig,
    rounds,
    last_updated_by: DEVICE_ID,
    updated_at: new Date().toISOString(),
  };
}

async function pushState(sessionId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('competitions')
    .upsert(buildPayload(sessionId));
  if (error) {
    console.error('[sync] push error:', error.message);
    useStore.getState().setSyncStatus('error');
    return false;
  }
  return true;
}

function schedulePush(sessionId: string) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushState(sessionId), 400);
}

function applyRemoteRecord(record: Record<string, unknown>) {
  syncingFromRemote = true;
  useStore.setState({
    competitors: (record.competitors as never) ?? [],
    courseTimeConfig: (record.course_time_config as never) ?? {},
    rounds: (record.rounds as never) ?? useStore.getState().rounds,
  });
  syncingFromRemote = false;
}

function subscribe(sessionId: string) {
  if (!supabase) return;
  if (activeChannel) {
    activeChannel.unsubscribe();
    activeChannel = null;
  }

  activeChannel = supabase
    .channel(`competition:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'competitions',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const record = payload.new as Record<string, unknown>;
        // Ignore writes that originated from this device
        if (record.last_updated_by === DEVICE_ID) return;
        applyRemoteRecord(record);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        useStore.getState().setSyncStatus('connected');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        useStore.getState().setSyncStatus('error');
      }
    });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Host creates a new session and uploads the current local state. */
export async function createSession(): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');

  const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
  useStore.getState().setSyncStatus('connecting');

  const ok = await pushState(sessionId);
  if (!ok) throw new Error('Failed to create session — check Supabase credentials');

  subscribe(sessionId);
  useStore.getState().setSessionId(sessionId);
  return sessionId;
}

/** Any device joins an existing session by code and loads its remote state. */
export async function joinSession(rawCode: string): Promise<boolean> {
  if (!supabase) return false;

  const sessionId = rawCode.toUpperCase().trim();
  useStore.getState().setSyncStatus('connecting');

  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    useStore.getState().setSyncStatus('error');
    return false;
  }

  applyRemoteRecord(data as Record<string, unknown>);
  subscribe(sessionId);
  useStore.getState().setSessionId(sessionId);
  return true;
}

/** Stop syncing and disconnect from the current session. */
export function leaveSession() {
  if (activeChannel) {
    activeChannel.unsubscribe();
    activeChannel = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  useStore.getState().setSessionId(null);
  useStore.getState().setSyncStatus('off');
}

// ---------------------------------------------------------------------------
// Store watcher — push changes to Supabase whenever data mutates (host only)
// ---------------------------------------------------------------------------

useStore.subscribe((state, prev) => {
  if (!state.sessionId || !state.hostUnlocked || syncingFromRemote) return;
  if (
    state.competitors !== prev.competitors ||
    state.courseTimeConfig !== prev.courseTimeConfig ||
    state.rounds !== prev.rounds
  ) {
    schedulePush(state.sessionId);
  }
});
