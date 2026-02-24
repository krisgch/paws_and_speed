export type Size = 'S' | 'M' | 'I' | 'L';

export interface Competitor {
  id: string;
  round: string;
  size: Size;
  order: number;
  dog: string;
  breed: string;
  human: string;
  icon?: string;
  fault: number | null;
  refusal: number | null;
  timeFault: number | null;
  totalFault: number | null;
  time: number | null;
  eliminated: boolean;
}

export interface CourseTime {
  sct: number;
  mct: number;
}

export type CourseTimeConfig = Record<string, CourseTime>;

export type Page = 'running' | 'scoring' | 'ranking' | 'competitors';
