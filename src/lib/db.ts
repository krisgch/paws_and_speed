import { supabase } from './supabase.ts';
import type {
  Dog, Event, EventRound, Registration, EventCompetitor, EventLiveState,
} from '../types/supabase.ts';

// ─── Dogs ────────────────────────────────────────────────────────────────────

export async function getDogs(ownerId: string): Promise<Dog[]> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addDog(dog: Omit<Dog, 'id' | 'created_at'>): Promise<Dog> {
  const { data, error } = await supabase.from('dogs').insert(dog).select().single();
  if (error) throw error;
  return data;
}

export async function updateDog(id: string, updates: Partial<Omit<Dog, 'id' | 'owner_id' | 'created_at'>>): Promise<Dog> {
  const { data, error } = await supabase.from('dogs').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDog(id: string): Promise<void> {
  const { error } = await supabase.from('dogs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getPublicEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .not('status', 'eq', 'draft')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getHostEvents(hostId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
  return data ?? null;
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
  const { data, error } = await supabase.from('events').insert(event).select().single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'host_id' | 'created_at'>>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Event Rounds ─────────────────────────────────────────────────────────────

export async function getEventRounds(eventId: string): Promise<EventRound[]> {
  const { data, error } = await supabase
    .from('event_rounds')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addEventRound(round: Omit<EventRound, 'id'>): Promise<EventRound> {
  const { data, error } = await supabase.from('event_rounds').insert(round).select().single();
  if (error) throw error;
  return data;
}

export async function updateEventRound(id: string, updates: Partial<Omit<EventRound, 'id' | 'event_id'>>): Promise<EventRound> {
  const { data, error } = await supabase.from('event_rounds').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEventRound(id: string): Promise<void> {
  const { error } = await supabase.from('event_rounds').delete().eq('id', id);
  if (error) throw error;
}

// ─── Registrations ────────────────────────────────────────────────────────────

export async function getRegistrations(eventId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMyRegistrations(competitorId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRegistration(reg: Omit<Registration, 'id' | 'created_at'>): Promise<Registration> {
  const { data, error } = await supabase.from('registrations').insert(reg).select().single();
  if (error) throw error;
  return data;
}

export async function updateRegistration(id: string, updates: Partial<Omit<Registration, 'id' | 'event_id' | 'competitor_id' | 'created_at'>>): Promise<Registration> {
  const { data, error } = await supabase.from('registrations').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ─── Event Competitors ────────────────────────────────────────────────────────

export async function getEventCompetitors(eventId: string): Promise<EventCompetitor[]> {
  const { data, error } = await supabase
    .from('event_competitors')
    .select('*')
    .eq('event_id', eventId)
    .order('run_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveCompetitorScore(
  id: string,
  score: { fault: number; refusal: number; time_sec: number; time_fault: number; total_fault: number; eliminated: boolean }
): Promise<EventCompetitor> {
  const { data, error } = await supabase
    .from('event_competitors')
    .update(score)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminateCompetitor(id: string): Promise<void> {
  const { error } = await supabase
    .from('event_competitors')
    .update({ eliminated: true, fault: null, refusal: null, time_sec: null, time_fault: null, total_fault: null })
    .eq('id', id);
  if (error) throw error;
}

export async function reorderCompetitors(updates: { id: string; run_order: number }[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_competitors', { updates: JSON.stringify(updates) });
  if (error) throw error;
}

export async function addEventCompetitor(data: Omit<EventCompetitor, 'id' | 'created_at'>): Promise<EventCompetitor> {
  const { data: row, error } = await supabase.from('event_competitors').insert(data).select().single();
  if (error) throw error;
  return row;
}

export async function deleteEventCompetitor(id: string): Promise<void> {
  const { error } = await supabase.from('event_competitors').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllEventCompetitors(eventId: string): Promise<void> {
  const { error } = await supabase.from('event_competitors').delete().eq('event_id', eventId);
  if (error) throw error;
}

export async function updateEventCompetitorIcons(eventId: string, dogId: string, icon: string | null): Promise<void> {
  const { error } = await supabase
    .from('event_competitors')
    .update({ icon })
    .eq('event_id', eventId)
    .eq('dog_id', dogId);
  if (error) throw error;
}

// ─── Event Live State ─────────────────────────────────────────────────────────

export async function getEventLiveState(eventId: string): Promise<EventLiveState | null> {
  const { data } = await supabase.from('event_live_state').select('*').eq('event_id', eventId).single();
  return data ?? null;
}

export async function setEventLiveRound(eventId: string, roundId: string | null): Promise<void> {
  const { error } = await supabase
    .from('event_live_state')
    .upsert({ event_id: eventId, live_round_id: roundId, updated_at: new Date().toISOString() });
  if (error) throw error;
}
