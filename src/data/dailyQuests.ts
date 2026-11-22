import { BodyType, Difficulty } from '../types/game';

export type DailyQuestMetric =
  | 'pipes_single'
  | 'pipes_total'
  | 'peanuts_total'
  | 'peanuts_single'
  | 'crates_total'
  | 'runs_total'
  | 'body_score'
  | 'diff_score';

export interface DailyQuestDefinition {
  id: string;
  slot: 1 | 2 | 3;
  title: string;
  description: string;
  metric: DailyQuestMetric;
  target: number;
  rewardPeanuts: number;
  requiredBodyType?: BodyType;
  requiredDifficulty?: Difficulty;
}

export interface DailyQuestsState {
  dateKey: string;
  progress: Record<string, number>;
  claimedIds: string[];
}

const SLOT_1_POOL: DailyQuestDefinition[] = [
  {
    id: 'q_pipes_single_10',
    slot: 1,
    title: 'Boru Ustası',
    description: 'Tek uçuşta 10 boru geç',
    metric: 'pipes_single',
    target: 10,
    rewardPeanuts: 5,
  },
  {
    id: 'q_pipes_total_25',
    slot: 1,
    title: 'Savan Maratonu',
    description: 'Bugün toplam 25 boru geç',
    metric: 'pipes_total',
    target: 25,
    rewardPeanuts: 6,
  },
  {
    id: 'q_pipes_single_18',
    slot: 1,
    title: 'Yüksek İrtifa',
    description: 'Tek uçuşta 18 boru geç',
    metric: 'pipes_single',
    target: 18,
    rewardPeanuts: 8,
  },
  {
    id: 'q_pipes_total_40',
    slot: 1,
    title: 'Durmak Yok',
    description: 'Bugün toplam 40 boru geç',
    metric: 'pipes_total',
    target: 40,
    rewardPeanuts: 9,
  },
];

const SLOT_2_POOL: DailyQuestDefinition[] = [
  {
    id: 'q_peanuts_total_6',
    slot: 2,
    title: 'Fıstık Avcısı',
    description: 'Uçuşlarda 6 Altın Fıstık topla',
    metric: 'peanuts_total',
    target: 6,
    rewardPeanuts: 5,
  },
  {
    id: 'q_crates_total_2',
    slot: 2,
    title: 'Kutu Toplayıcı',
    description: 'Havada 2 Kozmetik Kutusu yakala',
    metric: 'crates_total',
    target: 2,
    rewardPeanuts: 7,
  },
  {
    id: 'q_peanuts_single_4',
    slot: 2,
    title: 'Altın Tur',
    description: 'Tek uçuşta 4 Altın Fıstık topla',
    metric: 'peanuts_single',
    target: 4,
    rewardPeanuts: 7,
  },
  {
    id: 'q_peanuts_total_12',
    slot: 2,
    title: 'Kasa Doldurucu',
    description: 'Uçuşlarda 12 Altın Fıstık topla',
    metric: 'peanuts_total',
    target: 12,
    rewardPeanuts: 8,
  },
];

const SLOT_3_POOL: DailyQuestDefinition[] = [
  {
    id: 'q_runs_3',
    slot: 3,
    title: 'Isınma Turları',
    description: 'Bugün 3 uçuş tamamla',
    metric: 'runs_total',
    target: 3,
    rewardPeanuts: 5,
  },
  {
    id: 'q_slim_score_8',
    slot: 3,
    title: 'Çevik Zayıf Fil',
    description: 'Zayıf Fil ile tek uçuşta 8 skor yap',
    metric: 'body_score',
    target: 8,
    rewardPeanuts: 6,
    requiredBodyType: 'slim',
  },
  {
    id: 'q_chubby_score_6',
    slot: 3,
    title: 'Tosun Uçuşu',
    description: 'Obez Fil ile tek uçuşta 6 skor yap',
    metric: 'body_score',
    target: 6,
    rewardPeanuts: 7,
    requiredBodyType: 'chubby',
  },
  {
    id: 'q_turbo_score_5',
    slot: 3,
    title: 'Turbo Rüzgarı',
    description: 'Turbo modda tek uçuşta 5 skor yap',
    metric: 'diff_score',
    target: 5,
    rewardPeanuts: 8,
    requiredDifficulty: 'turbo',
  },
  {
    id: 'q_runs_5',
    slot: 3,
    title: 'Savan Müdavimi',
    description: 'Bugün 5 uçuş tamamla',
    metric: 'runs_total',
    target: 5,
    rewardPeanuts: 7,
  },
];

export function getTodayDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashDateKey(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDailyQuestsForDate(dateKey: string): DailyQuestDefinition[] {
  const seed = hashDateKey(dateKey);
  const q1 = SLOT_1_POOL[seed % SLOT_1_POOL.length];
  const q2 = SLOT_2_POOL[Math.floor(seed / 7) % SLOT_2_POOL.length];
  const q3 = SLOT_3_POOL[Math.floor(seed / 31) % SLOT_3_POOL.length];
  return [q1, q2, q3];
}

export function createEmptyDailyQuestsState(dateKey = getTodayDateKey()): DailyQuestsState {
  return {
    dateKey,
    progress: {},
    claimedIds: [],
  };
}
