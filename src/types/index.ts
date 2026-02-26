export type Size = 'S' | 'M' | 'I' | 'L';

export interface CourseTime {
  sct: number;
  mct: number;
}

export type CourseTimeConfig = Record<string, CourseTime>;

export type Page = 'running' | 'scoring' | 'ranking' | 'competitors';
