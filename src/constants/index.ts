import type { Size, CourseTimeConfig } from '../types/index.ts';
import type { EventCompetitor, EventRound } from '../types/supabase.ts';

export const ROUNDS = [
  'Novice 1',
  'Novice 2',
  'Jumping Open 1',
  'Jumping Open 2',
  'Agility A1',
  'Agility A2',
  'Agility A3',
] as const;

export const SIZES: Size[] = ['S', 'M', 'I', 'L'];

export const SIZE_LABELS: Record<Size, string> = {
  S: 'Small',
  M: 'Medium',
  I: 'Intermediate',
  L: 'Large',
};

export const SIZE_COLORS: Record<Size, string> = {
  S: '#f472b6',
  M: '#60a5fa',
  I: '#34d399',
  L: '#fbbf24',
};

export const HOST_PIN = '2026';

export const DEFAULT_COURSE_TIMES: CourseTimeConfig = {
  'Novice 1':       { sct: 50, mct: 70 },
  'Novice 2':       { sct: 48, mct: 67 },
  'Jumping Open 1': { sct: 40, mct: 56 },
  'Jumping Open 2': { sct: 38, mct: 53 },
  'Agility A1':     { sct: 35, mct: 49 },
  'Agility A2':     { sct: 34, mct: 48 },
  'Agility A3':     { sct: 33, mct: 46 },
};

export const DEFAULT_ROUND_ABBREVIATIONS: Record<string, string> = {
  'Novice 1':       'N1',
  'Novice 2':       'N2',
  'Jumping Open 1': 'JO1',
  'Jumping Open 2': 'JO2',
  'Agility A1':     'A1',
  'Agility A2':     'A2',
  'Agility A3':     'A3',
};

export const AGILITY_BREEDS: string[] = [
  // Small
  'Papillon', 'Jack Russell Terrier', 'Parson Russell Terrier', 'Rat Terrier',
  'Miniature Schnauzer', 'Toy Poodle', 'Miniature Poodle', 'Pomeranian',
  'Shetland Sheepdog', 'Cavalier King Charles Spaniel', 'West Highland White Terrier',
  'Scottish Terrier', 'Smooth Fox Terrier', 'Bichon Frisé', 'Norfolk Terrier',
  // Medium
  'Border Collie', 'Australian Shepherd', 'Australian Kelpie', 'Whippet', 'Standard Poodle',
  'Portuguese Water Dog', 'Pembroke Welsh Corgi', 'English Springer Spaniel', 'Cocker Spaniel',
  'Beagle', 'Nova Scotia Duck Tolling Retriever', 'Tibetan Terrier', 'Lagotto Romagnolo',
  'Brittany Spaniel', 'Border Terrier', 'Staffordshire Bull Terrier',
  // Intermediate & Large
  'Vizsla', 'Weimaraner', 'German Shorthaired Pointer', 'Dalmatian',
  'Siberian Husky', 'Doberman Pinscher', 'Belgian Malinois', 'German Shepherd',
  'Golden Retriever', 'Labrador Retriever', 'Flat-Coated Retriever', 'Greyhound',
  'Azawakh', 'Australian Cattle Dog', 'Mixed Breed',
];

const DOG_EMOJIS = ['🐕', '🐕‍🦺', '🦮', '🐩', '🐶'];

export function dogEmoji(name: string): string {
  let h = 0;
  for (const c of name) h = ((h << 5) - h) + c.charCodeAt(0);
  return DOG_EMOJIS[Math.abs(h) % DOG_EMOJIS.length];
}

interface MockDog {
  dog: string;
  human: string;
  size: Size;
  breed: string;
  icon: string;
}

const MOCK_DOGS: MockDog[] = [
  { dog: 'Pixel',   human: 'Anna Schmidt',   size: 'S', breed: 'Papillon',               icon: '🎮' },
  { dog: 'Mochi',   human: 'Yuki Tanaka',    size: 'S', breed: 'Shetland Sheepdog',       icon: '🍡' },
  { dog: 'Bean',    human: 'Laura Chen',     size: 'S', breed: 'Jack Russell Terrier',    icon: '🫘' },
  { dog: 'Nori',    human: 'Kim Soo-jin',    size: 'S', breed: 'Pomeranian',              icon: '🌿' },
  { dog: 'Toffee',  human: 'Emma Wilson',    size: 'S', breed: 'Miniature Poodle',        icon: '🍬' },
  { dog: 'Zara',    human: 'Marcus López',   size: 'M', breed: 'Cocker Spaniel',          icon: '✨' },
  { dog: 'Flash',   human: 'Sophie Martin',  size: 'M', breed: 'Whippet',                icon: '💨' },
  { dog: 'Kiki',    human: 'Jörg Weber',     size: 'M', breed: 'Miniature Schnauzer',     icon: '🌸' },
  { dog: 'Biscuit', human: 'Chloe Davis',    size: 'M', breed: 'Beagle',                 icon: '🍪' },
  { dog: 'Storm',   human: 'Lena Müller',    size: 'I', breed: 'Australian Shepherd',     icon: '🌪️' },
  { dog: 'Blaze',   human: 'Oliver Park',    size: 'I', breed: 'English Springer Spaniel',icon: '🔥' },
  { dog: 'Dash',    human: 'Nina Petrova',   size: 'I', breed: 'Vizsla',                 icon: '💫' },
  { dog: 'Ace',     human: 'Smile K.',       size: 'I', breed: 'Border Collie',           icon: '♠️' },
  { dog: 'Willow',  human: 'Raj Patel',      size: 'I', breed: 'Brittany Spaniel',        icon: '🌱' },
  { dog: 'Thunder', human: 'Jake Thompson',  size: 'L', breed: 'Belgian Malinois',        icon: '⚡' },
  { dog: 'Rex',     human: 'Maria Santos',   size: 'L', breed: 'German Shepherd',         icon: '👑' },
  { dog: 'Atlas',   human: "Finn O'Brien",   size: 'L', breed: 'Golden Retriever',        icon: '🗺️' },
  { dog: 'Nova',    human: 'Elena Rossi',    size: 'L', breed: 'Labrador Retriever',      icon: '🌟' },
  { dog: 'Chief',   human: 'Daniel Kim',     size: 'L', breed: 'Border Collie',           icon: '🎖️' },
  { dog: 'Rocket',  human: 'Smile K.',       size: 'L', breed: 'Border Collie',           icon: '🚀' },
];

function calcTF(time: number, sct: number): number {
  if (!time || !sct || time <= sct) return 0;
  return Math.floor(time - sct);
}

// Scores: [faults, refusals, time]
type Score = [number, number, number];

const ROUND_SCORES: Record<string, Record<string, Score>> = {
  'Novice 1': {
    Pixel: [0, 0, 38.5], Mochi: [0, 0, 41.2], Bean: [5, 0, 43.7], Nori: [0, 5, 45.8], Toffee: [5, 5, 44.2],
    Zara: [0, 0, 29.4], Flash: [5, 0, 31.8], Kiki: [0, 5, 33.2], Biscuit: [10, 0, 35.6],
    Storm: [0, 0, 26.8], Blaze: [5, 5, 28.9], Dash: [0, 0, 31.4], Ace: [5, 0, 34.1], Willow: [0, 0, 27.2],
    Thunder: [0, 0, 23.4], Rex: [5, 0, 25.8], Atlas: [0, 0, 24.7], Nova: [10, 5, 29.3], Chief: [0, 0, 26.1], Rocket: [0, 0, 23.9],
  },
  'Novice 2': {
    Pixel: [0, 0, 36.9], Mochi: [5, 0, 38.4], Bean: [0, 0, 41.1], Nori: [5, 5, 43.2], Toffee: [0, 5, 46.7],
    Zara: [5, 0, 28.7], Flash: [0, 0, 30.1], Kiki: [0, 0, 31.5], Biscuit: [5, 5, 37.2],
    Storm: [0, 0, 25.4], Blaze: [0, 5, 27.7], Dash: [5, 0, 29.8], Ace: [0, 0, 32.6], Willow: [0, 0, 26.3],
    Thunder: [5, 0, 22.8], Rex: [0, 0, 24.2], Atlas: [0, 0, 23.5], Nova: [5, 5, 27.6], Chief: [0, 0, 25.4], Rocket: [5, 0, 22.1],
  },
  'Jumping Open 1': {
    Pixel: [0, 0, 33.2], Mochi: [0, 0, 35.8], Bean: [5, 0, 38.9], Nori: [0, 5, 39.6], Toffee: [5, 5, 41.3],
    Zara: [0, 0, 25.7], Flash: [0, 0, 26.4], Kiki: [5, 0, 29.8], Biscuit: [0, 5, 31.5],
    Storm: [0, 0, 22.3], Blaze: [5, 0, 24.6], Dash: [0, 0, 26.7], Ace: [10, 0, 27.4], Willow: [0, 0, 23.8],
    Thunder: [0, 0, 19.8], Rex: [5, 0, 21.3], Atlas: [0, 0, 20.7], Nova: [5, 5, 25.4], Chief: [0, 0, 22.1], Rocket: [0, 0, 19.5],
  },
  'Jumping Open 2': {
    Pixel: [5, 0, 35.2], Mochi: [0, 0, 33.7], Bean: [0, 0, 37.4], Nori: [0, 5, 39.1], Toffee: [5, 0, 40.2],
    Zara: [0, 0, 24.8], Flash: [5, 0, 25.9], Kiki: [0, 0, 28.3], Biscuit: [5, 5, 32.7],
    Storm: [0, 0, 21.5], Blaze: [0, 5, 23.8], Dash: [5, 0, 25.4], Ace: [0, 0, 29.6], Willow: [0, 0, 22.3],
    Thunder: [0, 0, 18.6], Rex: [0, 0, 20.4], Atlas: [5, 0, 19.8], Nova: [0, 5, 24.7], Chief: [5, 0, 21.3], Rocket: [0, 0, 18.9],
  },
  'Agility A1': {
    // Small — all done
    Pixel: [0, 0, 29.8], Mochi: [0, 0, 31.4], Bean: [5, 0, 36.2], Nori: [0, 5, 32.5], Toffee: [5, 5, 37.8],
    // Medium — all done
    Zara: [0, 0, 23.4], Flash: [0, 0, 24.8], Kiki: [5, 0, 27.2], Biscuit: [0, 5, 29.6],
    // Intermediate — Storm + Blaze done, Dash/Ace/Willow waiting; Large — all waiting
    Storm: [0, 0, 20.7], Blaze: [5, 0, 22.8],
  },
  // Agility A2, A3 — all registered, no scores (entries present but no score data here)
};

const MOCK_EVENT_ID = 'mock-event';

export function generateMockData(): {
  competitors: EventCompetitor[];
  eventRounds: EventRound[];
  currentRoundId: string;
} {
  const eventRounds: EventRound[] = [...ROUNDS].map((name, i) => ({
    id: name, // mock mode: round name serves as the round ID
    event_id: MOCK_EVENT_ID,
    name,
    abbreviation: DEFAULT_ROUND_ABBREVIATIONS[name] ?? name.substring(0, 4),
    sort_order: i,
    sct: DEFAULT_COURSE_TIMES[name]?.sct ?? 40,
    mct: DEFAULT_COURSE_TIMES[name]?.mct ?? 56,
  }));

  const competitors: EventCompetitor[] = [];
  const now = new Date().toISOString();

  for (const round of eventRounds) {
    const orderBySize: Record<Size, number> = { S: 0, M: 0, I: 0, L: 0 };
    for (const d of MOCK_DOGS) {
      orderBySize[d.size]++;
      const scoreEntry = ROUND_SCORES[round.name]?.[d.dog];

      let fault: number | null = null;
      let refusal: number | null = null;
      let time_sec: number | null = null;
      let time_fault: number | null = null;
      let total_fault: number | null = null;
      let eliminated = false;

      if (scoreEntry) {
        const [f, ref, t] = scoreEntry;
        fault = f;
        refusal = ref;
        time_sec = t;
        if (t > round.mct) {
          eliminated = true;
        } else {
          time_fault = calcTF(t, round.sct);
          total_fault = f + ref + time_fault;
        }
      }

      competitors.push({
        id: crypto.randomUUID(),
        event_id: MOCK_EVENT_ID,
        round_id: round.id,
        registration_id: null,
        dog_id: `mock-dog-${d.dog.toLowerCase().replace(/\s+/g, '-')}`,
        dog_name: d.dog,
        breed: d.breed,
        human_name: d.human,
        icon: d.icon ?? null,
        size: d.size,
        run_order: orderBySize[d.size],
        fault,
        refusal,
        time_sec,
        time_fault,
        total_fault,
        eliminated,
        created_at: now,
      });
    }
  }

  return { competitors, eventRounds, currentRoundId: 'Agility A1' };
}
