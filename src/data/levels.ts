import { BossKind, CrateTier } from '../types/game';

export const LEVELS_PER_CHAPTER = 5;

export interface ChapterInfo {
  chapter: number;
  stageInChapter: number;
  totalStagesInChapter: number;
  isChapterEnd: boolean;
  title: string;
  shieldUnlocked: boolean;
}

export interface LevelConfig {
  level: number;
  chapter: number;
  stageInChapter: number;
  isChapterEnd: boolean;
  chapterTitle: string;
  shieldUnlocked: boolean;
  title: string;
  targetPipes: number;
  speedMultiplier: number;
  gapReduction: number;
  movingPipeChance: number;
  movingPipeAmplitude: number;
  movingPipeSpeed: number;
  isBoss: boolean;
  bossKind: BossKind;
  difficultyLabel: string;
  difficultyColor: string;
  rewardPeanuts: number;
  replayPeanuts: number;
  rewardCrateTier: CrateTier | null;
  biomeIndex: number;
  biomeScoreHint: number;
}

const CHAPTER_TITLES = [
  'Savan Uyanışı',
  'Altın & Kiraz Vadisi',
  'Buzul & Kristal Dağları',
  'Volkanik Çöl & Fırtına',
  'Siber Neon Metropolü',
  'Kozmik Galaksi & Sonsuzluk',
];

const LEVEL_STAGE_TITLES = [
  'Savan Başlangıcı',
  'Zümrüt Orman',
  'Altın Günbatımı',
  'Kızıl Çöl Geçidi',
  'Bambu Koridoru',
  'Sakura Tepeleri',
  'Mercan Ufukları',
  'Sonbahar Korusu',
  'Lavanta Bozkırı',
  'Altın Tapınak',
  'Buzul Sırtları',
  'Karlı Çamlık',
  'Kutup Gecesi',
  'Kristal Mağara',
  'Sisli Bataklık',
  'Fırtına Tepesi',
  'Volkan Ağzı',
  'Kül Çölü',
  'Zehirli Kanyon',
  'Kanlı Ay Kalesi',
  'Siber Neon Şehri',
  'Hologram Bulvarı',
  'Elektro Şebeke',
  'Lazer Hisarı',
  'Gölge Krallığı',
  'Ametist Bulutsusu',
  'Güneş Patlaması',
  'Süpernova Limanı',
  'Galaksi Kapısı',
  'Ebedi Sonsuzluk',
];

export function getChapterInfo(rawLevel: number): ChapterInfo {
  const level = Math.max(1, Math.min(9999, Math.floor(rawLevel || 1)));
  const chapter = Math.floor((level - 1) / LEVELS_PER_CHAPTER) + 1;
  const stageInChapter = ((level - 1) % LEVELS_PER_CHAPTER) + 1;
  const isChapterEnd = stageInChapter === LEVELS_PER_CHAPTER;
  const title =
    CHAPTER_TITLES[chapter - 1] || `Sonsuz Sefer ${chapter}`;
  // Seviyeli modda kalkan 2. bölümden sonra (3. Bölüm = Sv.11+) açılır
  const shieldUnlocked = chapter > 2;

  return {
    chapter,
    stageInChapter,
    totalStagesInChapter: LEVELS_PER_CHAPTER,
    isChapterEnd,
    title,
    shieldUnlocked,
  };
}

export function getLevelConfig(rawLevel: number): LevelConfig {
  const level = Math.max(1, Math.min(9999, Math.floor(rawLevel || 1)));
  const chapterInfo = getChapterInfo(level);
  const bossKind: BossKind = level % 10 === 0 ? 'boss' : level % 5 === 0 ? 'miniboss' : 'none';
  const isBoss = bossKind !== 'none';

  // Boss stages have a crisp approach run before entering the Boss Arena
  const targetPipes =
    bossKind === 'boss'
      ? Math.min(24, 6 + level)
      : bossKind === 'miniboss'
        ? Math.min(26, 6 + level)
        : Math.min(44, 5 + level * 2);

  // Noticeable non-linear difficulty curve: gentle start, steady climb, tense boss peaks
  const progression = Math.pow(level - 1, 0.92);
  const speedMultiplier = Math.min(
    1.9,
    1 + progression * 0.036 + (bossKind === 'boss' ? 0.08 : bossKind === 'miniboss' ? 0.05 : 0)
  );
  const gapReduction = Math.min(
    46,
    Math.round(progression * 2.4 + (bossKind === 'boss' ? 5 : bossKind === 'miniboss' ? 3 : 0))
  );

  // Moving pipes introduce at level 2 lightly, ramp aggressively afterward
  const movingPipeChance =
    level === 1 ? 0 : Math.min(0.85, 0.14 + (level - 2) * 0.075 + (isBoss ? 0.1 : 0));
  const movingPipeAmplitude =
    level === 1 ? 0 : Math.min(54, 14 + (level - 2) * 3.4 + (isBoss ? 6 : 0));
  const movingPipeSpeed =
    level === 1 ? 0 : Math.min(3.4, 1.55 + (level - 2) * 0.11 + (isBoss ? 0.25 : 0));

  const rewardPeanuts =
    12 + level * 4 + (bossKind === 'boss' ? 60 : bossKind === 'miniboss' ? 28 : 0);
  const replayPeanuts =
    5 + Math.min(30, Math.floor(level * 0.9) + (bossKind === 'boss' ? 12 : bossKind === 'miniboss' ? 6 : 0));

  let rewardCrateTier: CrateTier | null = null;
  if (level % 20 === 0) {
    rewardCrateTier = 'mythic';
  } else if (level % 10 === 0) {
    rewardCrateTier = 'epic';
  } else if (level === 2 || level % 5 === 0 || level % 8 === 0) {
    // Players earn Seviyeli Kıyafet Kasası regularly on milestones & chapter bosses
    rewardCrateTier = 'leveled_outfit';
  } else if (level % 4 === 0) {
    rewardCrateTier = 'standard';
  }

  let difficultyLabel = 'Başlangıç';
  let difficultyColor = '#34D399';
  if (bossKind === 'boss') {
    difficultyLabel = 'Büyük Patron';
    difficultyColor = '#F43F5E';
  } else if (bossKind === 'miniboss') {
    difficultyLabel = 'Mini Patron';
    difficultyColor = '#FB923C';
  } else if (level >= 16) {
    difficultyLabel = 'Kabus';
    difficultyColor = '#FB7185';
  } else if (level >= 10) {
    difficultyLabel = 'Uzman';
    difficultyColor = '#A855F7';
  } else if (level >= 5) {
    difficultyLabel = 'Zor';
    difficultyColor = '#F59E0B';
  } else if (level >= 2) {
    difficultyLabel = 'Orta';
    difficultyColor = '#38BDF8';
  }

  const biomeIndex = (level - 1) % 30;
  const baseTitle = LEVEL_STAGE_TITLES[biomeIndex];
  const title =
    bossKind === 'boss'
      ? `${baseTitle} (Patron)`
      : bossKind === 'miniboss'
        ? `${baseTitle} (Mini Patron)`
        : baseTitle;
  const biomeScoreHint = biomeIndex * 6;

  return {
    level,
    chapter: chapterInfo.chapter,
    stageInChapter: chapterInfo.stageInChapter,
    isChapterEnd: chapterInfo.isChapterEnd,
    chapterTitle: chapterInfo.title,
    shieldUnlocked: chapterInfo.shieldUnlocked,
    title,
    targetPipes,
    speedMultiplier,
    gapReduction,
    movingPipeChance,
    movingPipeAmplitude,
    movingPipeSpeed,
    isBoss,
    bossKind,
    difficultyLabel,
    difficultyColor,
    rewardPeanuts,
    replayPeanuts,
    rewardCrateTier,
    biomeIndex,
    biomeScoreHint,
  };
}
