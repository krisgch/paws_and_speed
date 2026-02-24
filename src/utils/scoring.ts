import type { Competitor, CourseTime } from '../types/index.ts';

export function calcTimeFault(time: number | null, sct: number): number {
  if (time === null || time <= sct) return 0;
  return Math.floor(time - sct);
}

export function isOverMCT(time: number | null, mct: number): boolean {
  return time !== null && mct > 0 && time > mct;
}

export function computeScoring(
  competitor: Competitor,
  ct: CourseTime
): Pick<Competitor, 'timeFault' | 'totalFault' | 'eliminated'> {
  if (competitor.time === null) {
    return { timeFault: null, totalFault: null, eliminated: competitor.eliminated };
  }
  if (isOverMCT(competitor.time, ct.mct)) {
    return { timeFault: null, totalFault: null, eliminated: true };
  }
  const tf = calcTimeFault(competitor.time, ct.sct);
  const total = (competitor.fault ?? 0) + (competitor.refusal ?? 0) + tf;
  return { timeFault: tf, totalFault: total, eliminated: false };
}

export interface RankedCompetitor extends Competitor {
  rank: number | null;
}

export function rankCompetitors(competitors: Competitor[]): RankedCompetitor[] {
  const scored = competitors.filter((c) => c.totalFault !== null && !c.eliminated);
  const clear = scored
    .filter((c) => c.totalFault === 0)
    .sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  const faulted = scored
    .filter((c) => (c.totalFault ?? 0) > 0)
    .sort((a, b) => {
      if (a.totalFault !== b.totalFault) return (a.totalFault ?? 0) - (b.totalFault ?? 0);
      return (a.time ?? 0) - (b.time ?? 0);
    });
  const ranked = [...clear, ...faulted];
  const eliminated = competitors.filter((c) => c.eliminated);
  const pending = competitors.filter((c) => c.totalFault === null && !c.eliminated);

  const result: RankedCompetitor[] = [];
  ranked.forEach((c, i) => result.push({ ...c, rank: i + 1 }));
  eliminated.forEach((c) => result.push({ ...c, rank: null }));
  pending.forEach((c) => result.push({ ...c, rank: null }));

  return result;
}
