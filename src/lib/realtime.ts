import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase.ts';
import type { EventCompetitor, EventLiveState } from '../types/supabase.ts';

type CompetitorChangeHandler = (competitor: EventCompetitor) => void;
type LiveStateChangeHandler = (state: EventLiveState) => void;

let activeChannel: RealtimeChannel | null = null;

export function subscribeToEvent(
  eventId: string,
  onCompetitorChange: CompetitorChangeHandler,
  onLiveStateChange: LiveStateChangeHandler
): () => void {
  if (activeChannel) {
    activeChannel.unsubscribe();
    activeChannel = null;
  }

  activeChannel = supabase
    .channel(`event:${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'event_competitors', filter: `event_id=eq.${eventId}` },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onCompetitorChange(payload.new as EventCompetitor);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'event_live_state', filter: `event_id=eq.${eventId}` },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onLiveStateChange(payload.new as EventLiveState);
        }
      }
    )
    .subscribe();

  return () => {
    activeChannel?.unsubscribe();
    activeChannel = null;
  };
}
