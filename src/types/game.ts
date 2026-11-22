export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_COMPLETE';

export type GameMode = 'classic' | 'leveled';

export interface GameModeConfig {
  id: GameMode;
  label: string;
  description: string;
}

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  classic: {
    id: 'classic',
    label: 'Klasik',
    description: 'Sonsuz rekor koşusu',
  },
  leveled: {
    id: 'leveled',
    label: 'Seviyeli',
    description: 'Bölümleri geç, ödül ve sıralama kas',
  },
};

export type Difficulty = 'easy' | 'classic' | 'turbo';

export type BodyType = 'slim' | 'normal' | 'chubby';

export type CosmeticCategory = 'hat' | 'glasses' | 'skin' | 'trail' | 'suit';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  rarity: Rarity;
  cost: number;
  dropOnly?: boolean;
  leveledOnly?: boolean;
  dropRateChance?: number;
  dropRateLabel?: string;
  hiddenUntilUnlocked?: boolean;
  previewColor: string;
  shape: string;
  accentColor?: string;
}

export interface EquippedCosmetics {
  hat: string;
  glasses: string;
  skin: string;
  trail: string;
  suit: string;
}

export interface SavedCharacterPreset {
  id: string;
  name: string;
  bodyType: BodyType;
  equipped: EquippedCosmetics;
  nameColorId: string;
  savedAtMs: number;
}

export interface BodyTypeConfig {
  id: BodyType;
  label: string;
  subtitle: string;
  scaleX: number;
  scaleY: number;
  gravityMult: number;
  flapMult: number;
  hitboxRadius: number;
}

export const BODY_TYPE_CONFIGS: Record<BodyType, BodyTypeConfig> = {
  slim: {
    id: 'slim',
    label: 'Zayıf',
    subtitle: 'Hafif ve çevik',
    scaleX: 0.86,
    scaleY: 0.78,
    gravityMult: 0.88,
    flapMult: 0.94,
    hitboxRadius: 12,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    subtitle: 'Dengeli uçuş',
    scaleX: 1,
    scaleY: 1,
    gravityMult: 1,
    flapMult: 1,
    hitboxRadius: 15,
  },
  chubby: {
    id: 'chubby',
    label: 'Obez',
    subtitle: 'Tosun ve ağır',
    scaleX: 1.24,
    scaleY: 1.28,
    gravityMult: 1.14,
    flapMult: 1.07,
    hitboxRadius: 19,
  },
};

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  speed: number;
  gravity: number;
  flapVelocity: number;
  gap: number;
  spawnInterval: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Rahat',
    description: 'Bol boşluk, süzülen hafif yerçekimi',
    speed: 175,
    gravity: 780,
    flapVelocity: -315,
    gap: 215,
    spawnInterval: 1.95,
  },
  classic: {
    id: 'classic',
    label: 'Klasik',
    description: 'Akıcı ve dengeli arcade temposu',
    speed: 225,
    gravity: 960,
    flapVelocity: -355,
    gap: 185,
    spawnInterval: 1.65,
  },
  turbo: {
    id: 'turbo',
    label: 'Turbo',
    description: 'Hızlı savan rüzgarı · +2x Skor Bonusu!',
    speed: 285,
    gravity: 1220,
    flapVelocity: -405,
    gap: 160,
    spawnInterval: 1.35,
  },
};

export interface UpgradesState {
  magnetLevel: number; // 0..5
  doublePeanutLevel: number; // 0..5
  shieldCount: number; // 0..99
}

export type CrateTier = 'standard' | 'epic' | 'mythic' | 'outfit' | 'leveled_outfit';

export interface CrateInventoryState {
  standard: number;
  epic: number;
  mythic: number;
  outfit: number;
  leveled_outfit: number;
}

export type AchievementCategory = 'score' | 'flight' | 'level';
export type MedalTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'mythic';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  medalTier: MedalTier;
  title: string;
  description: string;
  target: number;
  unitLabel: string;
  rewardPeanuts: number;
  rewardCrateTier?: CrateTier;
}

export interface GameUser {
  uid: string;
  accountId: string;
  displayName: string;
  isGuest: boolean;
  isCreator: boolean;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  bestScore: number;
  difficulty: Difficulty;
  bodyType: BodyType;
  skinId?: string;
  hatId?: string;
  glassesId?: string;
  suitId?: string;
  nameColorId?: string;
  isCreator: boolean;
  hasCustomName?: boolean;
  lastNameChangeMs?: number;
  updatedAt?: unknown;
}

export interface LeveledLeaderboardEntry {
  uid: string;
  displayName: string;
  maxLevel: number;
  bestLevelScore: number;
  completedLevels: number;
  difficulty: Difficulty;
  bodyType: BodyType;
  skinId?: string;
  hatId?: string;
  glassesId?: string;
  suitId?: string;
  nameColorId?: string;
  isCreator: boolean;
  hasCustomName?: boolean;
  lastNameChangeMs?: number;
  updatedAt?: unknown;
}

export interface BannedIpRecord {
  ipKey: string;
  ipRaw: string;
  reason: string;
  bannedDisplayName?: string;
}

export interface BannedUidRecord {
  uid: string;
  displayName?: string;
  reason: string;
}

export interface ElephantState {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  earPhase: number;
  earFlapTimer: number;
  trunkPhase: number;
  scarfWave: number;
  blinkTimer: number;
  isHurt: boolean;
  invincibleTimer: number;
}

export interface PipePair {
  id: number;
  x: number;
  gapTop: number;
  gapHeight: number;
  width: number;
  passed: boolean;
  baseGapTop?: number;
  moveAmp?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export type BossKind = 'none' | 'miniboss' | 'boss';

export type BossArchetype = 'iron_golem' | 'cyber_drone' | 'lava_wyrm' | 'cosmic_titan';

export interface BossState {
  active: boolean;
  defeated: boolean;
  kind: 'miniboss' | 'boss';
  level: number;
  name: string;
  archetype: BossArchetype;
  x: number;
  y: number;
  targetX: number;
  radius: number;
  hp: number;
  maxHp: number;
  phase: number;
  attackTimer: number;
  beamCooldown: number;
  beamState: 'none' | 'charging' | 'firing';
  beamTimer: number;
  beamY: number;
  beamHeight: number;
  hitFlash: number;
  enraged: boolean;
}

export interface BossProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  coreColor: string;
  style: 'orb' | 'spike' | 'flame';
}

export interface PlayerBolt {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
}

export interface FinishGate {
  x: number;
  level: number;
  isBoss: boolean;
  crossed: boolean;
}

export interface PeanutBonus {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  bobPhase: number;
}

export interface CosmeticCrate {
  id: number;
  x: number;
  y: number;
  size: number;
  collected: boolean;
  bobPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'puff' | 'spark' | 'dust' | 'ring';
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
}

export const WORLD_WIDTH = 860;
export const WORLD_HEIGHT = 540;
export const GROUND_HEIGHT = 76;
export const ELEPHANT_RADIUS = 22;
