import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Competitor, CourseTimeConfig, Page, Size } from '../types/index.ts';
import { ROUNDS, generateMockData, DEFAULT_COURSE_TIMES, DEFAULT_ROUND_ABBREVIATIONS } from '../constants/index.ts';
import { calcTimeFault, isOverMCT } from '../utils/scoring.ts';

interface ToastState {
  message: string;
  visible: boolean;
}

interface AppStore {
  // Navigation
  currentPage: Page;
  currentRound: string;
  liveRound: string;      // The round currently being actively competed
  hostUnlocked: boolean;

  // Rounds (dynamic)
  rounds: string[];
  roundAbbreviations: Record<string, string>;

  // Filters
  runningSizeFilter: Size[];
  scoringSizeFilter: Size;
  rankingSizeFilter: Size;

  // Data (persisted)
  competitors: Competitor[];
  courseTimeConfig: CourseTimeConfig;

  // Scoring selection
  selectedCompetitorId: string | null;

  // Sync (not persisted — runtime only)
  sessionId: string | null;
  syncStatus: 'off' | 'connecting' | 'connected' | 'error';

  // Toast
  toast: ToastState;

  // Actions
  setPage: (page: Page) => void;
  setRound: (round: string) => void;
  setLiveRound: (round: string) => void;
  setHostUnlocked: (unlocked: boolean) => void;

  // Round management
  addRound: (name: string, abbr?: string) => void;
  renameRound: (oldName: string, newName: string, newAbbr?: string) => void;
  deleteRound: (name: string) => void;
  setRoundAbbr: (name: string, abbr: string) => void;
  reorderCompetitorsInGroup: (round: string, size: Size, orderedIds: string[]) => void;
  toggleRunningSize: (size: Size) => void;
  setScoringSizeFilter: (size: Size) => void;
  setRankingSizeFilter: (size: Size) => void;
  setSelectedCompetitorId: (id: string | null) => void;

  // Competitor actions
  addCompetitor: (data: { dog: string; human: string; breed: string; size: Size; icon?: string }) => void;
  addCompetitorToRound: (data: { dog: string; human: string; breed: string; size: Size; round: string; icon?: string }) => void;
  removeCompetitor: (id: string) => void;
  clearAllCompetitors: () => void;
  saveScore: (id: string, fault: number, refusal: number, time: number) => void;
  eliminateCompetitor: (id: string) => void;
  updateCompetitorIcon: (dog: string, human: string, icon: string) => void;

  // Course time
  updateCourseTime: (round: string, sct: number, mct: number) => void;

  // Import
  importData: (data: { competitors: Competitor[]; courseTimeConfig: CourseTimeConfig }) => void;

  // Sync actions
  setSessionId: (id: string | null) => void;
  setSyncStatus: (status: 'off' | 'connecting' | 'connected' | 'error') => void;

  // Toast
  showToast: (message: string) => void;
  hideToast: () => void;
}

const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'running',
      currentRound: ROUNDS[0],
      liveRound: ROUNDS[0],
      hostUnlocked: false,

      // Rounds
      rounds: [...ROUNDS],
      roundAbbreviations: { ...DEFAULT_ROUND_ABBREVIATIONS },

      // Filters
      runningSizeFilter: ['S', 'M', 'I', 'L'],
      scoringSizeFilter: 'S',
      rankingSizeFilter: 'S',

      // Data
      competitors: [],
      courseTimeConfig: { ...DEFAULT_COURSE_TIMES },

      // Scoring
      selectedCompetitorId: null,

      // Sync
      sessionId: null,
      syncStatus: 'off',

      // Toast
      toast: { message: '', visible: false },

      // Actions
      setPage: (page) => set({ currentPage: page }),
      setRound: (round) => set({ currentRound: round, selectedCompetitorId: null }),
      setLiveRound: (round) => set({ liveRound: round }),
      setHostUnlocked: (unlocked) => set({ hostUnlocked: unlocked }),

      toggleRunningSize: (size) => set((state) => {
        const current = [...state.runningSizeFilter];
        const idx = current.indexOf(size);
        if (idx >= 0) {
          if (current.length > 1) current.splice(idx, 1);
        } else {
          current.push(size);
        }
        return { runningSizeFilter: current };
      }),

      setScoringSizeFilter: (size) => set({ scoringSizeFilter: size, selectedCompetitorId: null }),
      setRankingSizeFilter: (size) => set({ rankingSizeFilter: size }),
      setSelectedCompetitorId: (id) => set({ selectedCompetitorId: id }),

      addCompetitor: (data) => set((state) => {
        const round = state.currentRound;
        const existing = state.competitors.filter(
          (c) => c.round === round && c.size === data.size
        );
        const maxOrder = existing.reduce((m, c) => Math.max(m, c.order), 0);
        const newComp: Competitor = {
          id: crypto.randomUUID(),
          round,
          size: data.size,
          order: maxOrder + 1,
          dog: data.dog,
          human: data.human,
          breed: data.breed || '—',
          icon: data.icon,
          fault: null,
          refusal: null,
          timeFault: null,
          totalFault: null,
          time: null,
          eliminated: false,
        };
        return { competitors: [...state.competitors, newComp] };
      }),

      addRound: (name, abbr?) => set((state) => {
        const trimmed = name.trim();
        if (!trimmed || state.rounds.includes(trimmed)) return state;
        const resolvedAbbr = (abbr ?? trimmed).substring(0, 4) || trimmed.substring(0, 4);
        return {
          rounds: [...state.rounds, trimmed],
          roundAbbreviations: { ...state.roundAbbreviations, [trimmed]: resolvedAbbr },
          courseTimeConfig: { ...state.courseTimeConfig, [trimmed]: { sct: 40, mct: 56 } },
        };
      }),

      renameRound: (oldName, newName, newAbbr?) => set((state) => {
        const trimmed = newName.trim();
        // Allow same name if only changing abbr; block if new name conflicts with another round
        if (!trimmed) return state;
        if (trimmed !== oldName && state.rounds.includes(trimmed)) return state;
        if (trimmed === oldName && newAbbr === undefined) return state;

        const rounds = state.rounds.map((r) => (r === oldName ? trimmed : r));
        const competitors = state.competitors.map((c) =>
          c.round === oldName ? { ...c, round: trimmed } : c
        );
        const courseTimeConfig = { ...state.courseTimeConfig };
        if (courseTimeConfig[oldName] && trimmed !== oldName) {
          courseTimeConfig[trimmed] = courseTimeConfig[oldName];
          delete courseTimeConfig[oldName];
        }
        const currentRound = state.currentRound === oldName ? trimmed : state.currentRound;
        const liveRound = state.liveRound === oldName ? trimmed : state.liveRound;

        const roundAbbreviations = { ...state.roundAbbreviations };
        if (trimmed !== oldName) {
          const existingAbbr = roundAbbreviations[oldName];
          roundAbbreviations[trimmed] = newAbbr !== undefined ? newAbbr : (existingAbbr ?? trimmed.substring(0, 4));
          delete roundAbbreviations[oldName];
        } else if (newAbbr !== undefined) {
          roundAbbreviations[oldName] = newAbbr;
        }

        return { rounds, competitors, courseTimeConfig, currentRound, liveRound, roundAbbreviations };
      }),

      deleteRound: (name) => set((state) => {
        if (state.competitors.some((c) => c.round === name)) return state;
        const rounds = state.rounds.filter((r) => r !== name);
        const courseTimeConfig = { ...state.courseTimeConfig };
        delete courseTimeConfig[name];
        const roundAbbreviations = { ...state.roundAbbreviations };
        delete roundAbbreviations[name];
        const currentRound = state.currentRound === name ? (rounds[0] ?? '') : state.currentRound;
        const liveRound = state.liveRound === name ? (rounds[0] ?? '') : state.liveRound;
        return { rounds, courseTimeConfig, currentRound, liveRound, roundAbbreviations };
      }),

      setRoundAbbr: (name, abbr) => set((state) => ({
        roundAbbreviations: { ...state.roundAbbreviations, [name]: abbr.substring(0, 4) },
      })),

      reorderCompetitorsInGroup: (round, size, orderedIds) => set((state) => ({
        competitors: state.competitors.map((c) => {
          if (c.round !== round || c.size !== size) return c;
          const newOrder = orderedIds.indexOf(c.id) + 1;
          return newOrder > 0 ? { ...c, order: newOrder } : c;
        }),
      })),

      addCompetitorToRound: (data) => set((state) => {
        const existing = state.competitors.filter(
          (c) => c.round === data.round && c.size === data.size
        );
        const maxOrder = existing.reduce((m, c) => Math.max(m, c.order), 0);
        const newComp: Competitor = {
          id: crypto.randomUUID(),
          round: data.round,
          size: data.size,
          order: maxOrder + 1,
          dog: data.dog,
          human: data.human,
          breed: data.breed || '—',
          icon: data.icon,
          fault: null,
          refusal: null,
          timeFault: null,
          totalFault: null,
          time: null,
          eliminated: false,
        };
        return { competitors: [...state.competitors, newComp] };
      }),

      removeCompetitor: (id) => set((state) => {
        const target = state.competitors.find((c) => c.id === id);
        if (!target) return state;
        const remaining = state.competitors.filter((c) => c.id !== id);
        // Reorder within round+size
        const group = remaining
          .filter((c) => c.round === target.round && c.size === target.size)
          .sort((a, b) => a.order - b.order);
        group.forEach((c, i) => { c.order = i + 1; });
        return { competitors: remaining };
      }),

      clearAllCompetitors: () => set({ competitors: [] }),

      saveScore: (id, fault, refusal, time) => set((state) => {
        const competitors = state.competitors.map((c) => {
          if (c.id !== id) return c;
          const ct = state.courseTimeConfig[c.round] ?? { sct: 0, mct: 0 };
          if (isOverMCT(time, ct.mct)) {
            return { ...c, fault, refusal, time, timeFault: null, totalFault: null, eliminated: true };
          }
          const tf = calcTimeFault(time, ct.sct);
          return { ...c, fault, refusal, time, timeFault: tf, totalFault: fault + refusal + tf, eliminated: false };
        });
        return { competitors };
      }),

      eliminateCompetitor: (id) => set((state) => ({
        competitors: state.competitors.map((c) =>
          c.id === id
            ? { ...c, eliminated: true, fault: null, refusal: null, timeFault: null, totalFault: null, time: null }
            : c
        ),
      })),

      updateCompetitorIcon: (dog, human, icon) => set((state) => ({
        competitors: state.competitors.map((c) =>
          c.dog === dog && c.human === human ? { ...c, icon } : c
        ),
      })),

      updateCourseTime: (round, sct, mct) => set((state) => {
        const courseTimeConfig = { ...state.courseTimeConfig, [round]: { sct, mct } };
        const competitors = state.competitors.map((c) => {
          if (c.round !== round || c.time === null) return c;
          if (isOverMCT(c.time, mct)) {
            return { ...c, eliminated: true, timeFault: null, totalFault: null };
          }
          const tf = calcTimeFault(c.time, sct);
          return {
            ...c,
            eliminated: false,
            timeFault: tf,
            totalFault: (c.fault ?? 0) + (c.refusal ?? 0) + tf,
          };
        });
        return { courseTimeConfig, competitors };
      }),

      importData: (data) => set({
        competitors: data.competitors,
        courseTimeConfig: { ...DEFAULT_COURSE_TIMES, ...data.courseTimeConfig },
      }),

      setSessionId: (id) => set({ sessionId: id }),
      setSyncStatus: (status) => set({ syncStatus: status }),

      showToast: (message) => set({ toast: { message, visible: true } }),
      hideToast: () => set({ toast: { message: '', visible: false } }),
    }),
    {
      name: 'paws-speed-data',
      partialize: (state) => ({
        competitors: state.competitors,
        courseTimeConfig: state.courseTimeConfig,
        rounds: state.rounds,
        roundAbbreviations: state.roundAbbreviations,
        liveRound: state.liveRound,
      }),
    }
  )
);

// Initialize mock data if store is empty
const state = useStore.getState();
if (state.competitors.length === 0) {
  const mock = generateMockData();
  useStore.setState({
    competitors: mock.competitors,
    courseTimeConfig: mock.courseTimeConfig,
    currentRound: mock.currentRound,
    liveRound: mock.currentRound,
    roundAbbreviations: mock.roundAbbreviations,
  });
}

export default useStore;
