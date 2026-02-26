import { useState, useEffect } from 'react';
import { getEvent, getEventRounds, getEventLiveState } from '../lib/db.ts';
import { subscribeToEvent } from '../lib/realtime.ts';
import type { Event, EventRound, EventLiveState } from '../types/supabase.ts';

interface UseEventResult {
  event: Event | null;
  rounds: EventRound[];
  liveState: EventLiveState | null;
  loading: boolean;
  error: string | null;
}

export function useEvent(eventId: string | undefined): UseEventResult {
  const [event, setEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [liveState, setLiveState] = useState<EventLiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    Promise.all([
      getEvent(eventId),
      getEventRounds(eventId),
      getEventLiveState(eventId),
    ])
      .then(([ev, rds, ls]) => {
        setEvent(ev);
        setRounds(rds);
        setLiveState(ls);
        setError(null);
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load event');
      })
      .finally(() => setLoading(false));

    const unsubscribe = subscribeToEvent(
      eventId,
      () => {}, // competitor changes handled by useEventCompetitors
      (newState) => setLiveState(newState)
    );

    return unsubscribe;
  }, [eventId]);

  return { event, rounds, liveState, loading, error };
}
