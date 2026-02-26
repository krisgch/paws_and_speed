import type { EventCompetitor } from '../types/supabase.ts';
import type { CourseTime } from '../types/index.ts';

export function calcTimeFault(time: number | null, sct: number): number {
  if (time === null || time <= sct) return 0;
  return Math.floor(time - sct);
}

export function isOverMCT(time: number | null, mct: number): boolean {
  return time !== null && mct > 0 && time > mct;
}

export function computeScoring(
  competitor: EventCompetitor,
  ct: CourseTime
): Pick<EventCompetitor, 'time_fault' | 'total_fault' | 'eliminated'> {
  if (competitor.time_sec === null) {
    return { time_fault: null, total_fault: null, eliminated: competitor.eliminated };
  }
  if (isOverMCT(competitor.time_sec, ct.mct)) {
    return { time_fault: null, total_fault: null, eliminated: true };
  }
  const tf = calcTimeFault(competitor.time_sec, ct.sct);
  const total = (competitor.fault ?? 0) + (competitor.refusal ?? 0) + tf;
  return { time_fault: tf, total_fault: total, eliminated: false };
}

export interface RankedCompetitor extends EventCompetitor {
  rank: number | null;
}

export function rankCompetitors(competitors: EventCompetitor[]): RankedCompetitor[] {
  const scored = competitors.filter((c) => c.total_fault !== null && !c.eliminated);
  const clear = scored
    .filter((c) => c.total_fault === 0)
    .sort((a, b) => (a.time_sec ?? 0) - (b.time_sec ?? 0));
  const faulted = scored
    .filter((c) => (c.total_fault ?? 0) > 0)
    .sort((a, b) => {
      if (a.total_fault !== b.total_fault) return (a.total_fault ?? 0) - (b.total_fault ?? 0);
      return (a.time_sec ?? 0) - (b.time_sec ?? 0);
    });
  const ranked = [...clear, ...faulted];
  const eliminated = competitors.filter((c) => c.eliminated);
  const pending = competitors.filter((c) => c.total_fault === null && !c.eliminated);

  const result: RankedCompetitor[] = [];
  ranked.forEach((c, i) => result.push({ ...c, rank: i + 1 }));
  eliminated.forEach((c) => result.push({ ...c, rank: null }));
  pending.forEach((c) => result.push({ ...c, rank: null }));

  return result;
}
