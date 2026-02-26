import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventCompetitor, EventRound } from '../types/supabase.ts';
import type { CourseTimeConfig, Page, Size } from '../types/index.ts';
import { ROUNDS, generateMockData, DEFAULT_COURSE_TIMES, DEFAULT_ROUND_ABBREVIATIONS } from '../constants/index.ts';
import { calcTimeFault, isOverMCT } from '../utils/scoring.ts';
import {
  saveCompetitorScore as dbSaveScore,
  eliminateCompetitor as dbEliminate,
  reorderCompetitors as dbReorder,
} from '../lib/db.ts';

// Migrate from v1 (Competitor) to v2 (EventCompetitor) format
(function migrateStorage() {
  const raw = localStorage.getItem('paws-speed-data');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const first = parsed?.state?.competitors?.[0];
    // v1 had 'dog' field; v2 has 'dog_name'
    if (first && 'dog' in first && !('dog_name' in first)) {
      localStorage.removeItem('paws-speed-data');
    }
  } catch {
    localStorage.removeItem('paws-speed-data');
  }
})();

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
  eventRounds: EventRound[];

  // Filters
  runningSizeFilter: Size[];
  scoringSizeFilter: Size;
  rankingSizeFilter: Size;

  // Data (persisted)
  competitors: EventCompetitor[];
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
  importData: (data: { competitors: EventCompetitor[]; courseTimeConfig: CourseTimeConfig }) => void;

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
      eventRounds: [],

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
          (c) => c.round_id === round && c.size === data.size
        );
        const maxOrder = existing.reduce((m, c) => Math.max(m, c.run_order), 0);
        const newComp: EventCompetitor = {
          id: crypto.randomUUID(),
          event_id: 'mock-event',
          round_id: round,
          registration_id: null,
          dog_id: `mock-dog-${data.dog.toLowerCase().replace(/\s+/g, '-')}`,
          dog_name: data.dog,
          breed: data.breed || '—',
          human_name: data.human,
          icon: data.icon ?? null,
          size: data.size,
          run_order: maxOrder + 1,
          fault: null,
          refusal: null,
          time_sec: null,
          time_fault: null,
          total_fault: null,
          eliminated: false,
          created_at: new Date().toISOString(),
        };
        return { competitors: [...state.competitors, newComp] };
      }),

      addRound: (name, abbr?) => set((state) => {
        const trimmed = name.trim();
        if (!trimmed || state.rounds.includes(trimmed)) return state;
        const resolvedAbbr = (abbr ?? trimmed).substring(0, 4) || trimmed.substring(0, 4);
        const newRound: EventRound = {
          id: trimmed,
          event_id: 'mock-event',
          name: trimmed,
          abbreviation: resolvedAbbr,
          sort_order: state.eventRounds.length,
          sct: 40,
          mct: 56,
        };
        return {
          rounds: [...state.rounds, trimmed],
          roundAbbreviations: { ...state.roundAbbreviations, [trimmed]: resolvedAbbr },
          courseTimeConfig: { ...state.courseTimeConfig, [trimmed]: { sct: 40, mct: 56 } },
          eventRounds: [...state.eventRounds, newRound],
        };
      }),

      renameRound: (oldName, newName, newAbbr?) => set((state) => {
        const trimmed = newName.trim();
        if (!trimmed) return state;
        if (trimmed !== oldName && state.rounds.includes(trimmed)) return state;
        if (trimmed === oldName && newAbbr === undefined) return state;

        const rounds = state.rounds.map((r) => (r === oldName ? trimmed : r));
        const competitors = state.competitors.map((c) =>
          c.round_id === oldName ? { ...c, round_id: trimmed } : c
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

        const resolvedAbbr = roundAbbreviations[trimmed] ?? trimmed.substring(0, 4);
        const eventRounds = state.eventRounds.map((r) =>
          r.id === oldName
            ? { ...r, id: trimmed, name: trimmed, abbreviation: resolvedAbbr }
            : r
        );

        return { rounds, competitors, courseTimeConfig, currentRound, liveRound, roundAbbreviations, eventRounds };
      }),

      deleteRound: (name) => set((state) => {
        if (state.competitors.some((c) => c.round_id === name)) return state;
        const rounds = state.rounds.filter((r) => r !== name);
        const courseTimeConfig = { ...state.courseTimeConfig };
        delete courseTimeConfig[name];
        const roundAbbreviations = { ...state.roundAbbreviations };
        delete roundAbbreviations[name];
        const eventRounds = state.eventRounds.filter((r) => r.id !== name);
        const currentRound = state.currentRound === name ? (rounds[0] ?? '') : state.currentRound;
        const liveRound = state.liveRound === name ? (rounds[0] ?? '') : state.liveRound;
        return { rounds, courseTimeConfig, currentRound, liveRound, roundAbbreviations, eventRounds };
      }),

      setRoundAbbr: (name, abbr) => set((state) => {
        const resolvedAbbr = abbr.substring(0, 4);
        return {
          roundAbbreviations: { ...state.roundAbbreviations, [name]: resolvedAbbr },
          eventRounds: state.eventRounds.map((r) =>
            r.id === name ? { ...r, abbreviation: resolvedAbbr } : r
          ),
        };
      }),

      reorderCompetitorsInGroup: (round, size, orderedIds) => {
        set((state) => ({
          competitors: state.competitors.map((c) => {
            if (c.round_id !== round || c.size !== size) return c;
            const newOrder = orderedIds.indexOf(c.id) + 1;
            return newOrder > 0 ? { ...c, run_order: newOrder } : c;
          }),
        }));
        const group = get().competitors.filter((c) => c.round_id === round && c.size === size);
        if (group.length > 0 && group[0].event_id !== 'mock-event') {
          const updates = group
            .filter((c) => orderedIds.includes(c.id))
            .map((c) => ({ id: c.id, run_order: c.run_order }));
          dbReorder(updates).catch(console.error);
        }
      },

      addCompetitorToRound: (data) => set((state) => {
        const existing = state.competitors.filter(
          (c) => c.round_id === data.round && c.size === data.size
        );
        const maxOrder = existing.reduce((m, c) => Math.max(m, c.run_order), 0);
        const newComp: EventCompetitor = {
          id: crypto.randomUUID(),
          event_id: 'mock-event',
          round_id: data.round,
          registration_id: null,
          dog_id: `mock-dog-${data.dog.toLowerCase().replace(/\s+/g, '-')}`,
          dog_name: data.dog,
          breed: data.breed || '—',
          human_name: data.human,
          icon: data.icon ?? null,
          size: data.size,
          run_order: maxOrder + 1,
          fault: null,
          refusal: null,
          time_sec: null,
          time_fault: null,
          total_fault: null,
          eliminated: false,
          created_at: new Date().toISOString(),
        };
        return { competitors: [...state.competitors, newComp] };
      }),

      removeCompetitor: (id) => set((state) => {
        const target = state.competitors.find((c) => c.id === id);
        if (!target) return state;
        const remaining = state.competitors.filter((c) => c.id !== id);
        // Reorder within round+size
        const group = remaining
          .filter((c) => c.round_id === target.round_id && c.size === target.size)
          .sort((a, b) => a.run_order - b.run_order);
        group.forEach((c, i) => { c.run_order = i + 1; });
        return { competitors: remaining };
      }),

      clearAllCompetitors: () => set({ competitors: [] }),

      saveScore: (id, fault, refusal, time) => {
        set((state) => {
          const competitors = state.competitors.map((c) => {
            if (c.id !== id) return c;
            const ct = state.courseTimeConfig[c.round_id] ?? { sct: 0, mct: 0 };
            if (isOverMCT(time, ct.mct)) {
              return { ...c, fault, refusal, time_sec: time, time_fault: null, total_fault: null, eliminated: true };
            }
            const tf = calcTimeFault(time, ct.sct);
            return { ...c, fault, refusal, time_sec: time, time_fault: tf, total_fault: fault + refusal + tf, eliminated: false };
          });
          return { competitors };
        });
        const updated = get().competitors.find((c) => c.id === id);
        if (
          updated &&
          updated.event_id !== 'mock-event' &&
          updated.fault !== null &&
          updated.refusal !== null &&
          updated.time_sec !== null &&
          updated.time_fault !== null &&
          updated.total_fault !== null
        ) {
          dbSaveScore(id, {
            fault: updated.fault,
            refusal: updated.refusal,
            time_sec: updated.time_sec,
            time_fault: updated.time_fault,
            total_fault: updated.total_fault,
            eliminated: updated.eliminated,
          }).catch(console.error);
        }
      },

      eliminateCompetitor: (id) => {
        set((state) => ({
          competitors: state.competitors.map((c) =>
            c.id === id
              ? { ...c, eliminated: true, fault: null, refusal: null, time_fault: null, total_fault: null, time_sec: null }
              : c
          ),
        }));
        const target = get().competitors.find((c) => c.id === id);
        if (target && target.event_id !== 'mock-event') {
          dbEliminate(id).catch(console.error);
        }
      },

      updateCompetitorIcon: (dog, human, icon) => set((state) => ({
        competitors: state.competitors.map((c) =>
          c.dog_name === dog && c.human_name === human ? { ...c, icon } : c
        ),
      })),

      updateCourseTime: (round, sct, mct) => set((state) => {
        const courseTimeConfig = { ...state.courseTimeConfig, [round]: { sct, mct } };
        const eventRounds = state.eventRounds.map((r) =>
          r.id === round ? { ...r, sct, mct } : r
        );
        const competitors = state.competitors.map((c) => {
          if (c.round_id !== round || c.time_sec === null) return c;
          if (isOverMCT(c.time_sec, mct)) {
            return { ...c, eliminated: true, time_fault: null, total_fault: null };
          }
          const tf = calcTimeFault(c.time_sec, sct);
          return {
            ...c,
            eliminated: false,
            time_fault: tf,
            total_fault: (c.fault ?? 0) + (c.refusal ?? 0) + tf,
          };
        });
        return { courseTimeConfig, eventRounds, competitors };
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
        eventRounds: state.eventRounds,
      }),
    }
  )
);

// Initialize mock data if store is empty (dev mode only)
const state = useStore.getState();
if (state.competitors.length === 0 && import.meta.env.DEV) {
  const mock = generateMockData();
  const rounds = mock.eventRounds.map((r) => r.name);
  const roundAbbreviations = Object.fromEntries(mock.eventRounds.map((r) => [r.name, r.abbreviation]));
  const courseTimeConfig: CourseTimeConfig = Object.fromEntries(
    mock.eventRounds.map((r) => [r.name, { sct: r.sct, mct: r.mct }])
  );
  useStore.setState({
    competitors: mock.competitors,
    eventRounds: mock.eventRounds,
    rounds,
    roundAbbreviations,
    courseTimeConfig,
    currentRound: mock.currentRoundId,
    liveRound: mock.currentRoundId,
  });
} else {
  // currentRound is not persisted — pick the best default from real data.
  // If eventRounds is empty (old persisted data), rebuild it from rounds + courseTimeConfig
  const { competitors, rounds, liveRound, eventRounds, courseTimeConfig, roundAbbreviations } = state;
  if (eventRounds.length === 0 && rounds.length > 0) {
    const rebuilt: EventRound[] = rounds.map((name, i) => ({
      id: name,
      event_id: 'mock-event',
      name,
      abbreviation: roundAbbreviations[name] ?? name.substring(0, 4),
      sort_order: i,
      sct: courseTimeConfig[name]?.sct ?? 40,
      mct: courseTimeConfig[name]?.mct ?? 56,
    }));
    useStore.setState({ eventRounds: rebuilt });
  }

  // Priority 1: liveRound if it still has unscored competitors (someone is running).
  // Priority 2: first round (in rounds order) that has any competitor.
  const liveHasRunners = competitors.some(
    (c) => c.round_id === liveRound && c.total_fault === null && !c.eliminated
  );
  if (liveHasRunners) {
    useStore.setState({ currentRound: liveRound });
  } else {
    const firstPopulated = rounds.find((r) => competitors.some((c) => c.round_id === r));
    if (firstPopulated) useStore.setState({ currentRound: firstPopulated });
  }
}

export default useStore;
