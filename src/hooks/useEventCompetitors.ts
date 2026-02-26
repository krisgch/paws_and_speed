import { useState, useEffect, useCallback } from 'react';
import { getEventCompetitors } from '../lib/db.ts';
import { subscribeToEvent } from '../lib/realtime.ts';
import type { EventCompetitor } from '../types/supabase.ts';

interface UseEventCompetitorsResult {
  competitors: EventCompetitor[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useEventCompetitors(eventId: string | undefined): UseEventCompetitorsResult {
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    getEventCompetitors(eventId)
      .then((data) => {
        setCompetitors(data);
        setError(null);
      })
      .catch((err) => setError(err.message ?? 'Failed to load competitors'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    load();
    if (!eventId) return;

    const unsubscribe = subscribeToEvent(
      eventId,
      (updated) => {
        setCompetitors((prev) => {
          const idx = prev.findIndex((c) => c.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      },
      () => {}
    );

    return unsubscribe;
  }, [eventId, load]);

  return { competitors, loading, error, refresh: load };
}
