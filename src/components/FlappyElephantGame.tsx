import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Ban,
  Bookmark,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flag,
  Image as ImageIcon,
  Lock,
  LogIn,
  LogOut,
  Maximize2,
  Minimize2,
  Package,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShoppingBag,
  Smartphone,
  Tag,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  COSMETIC_BY_ID,
  COSMETIC_CATALOG,
  DEFAULT_COSMETIC_BY_CATEGORY,
  getCosmeticSellPrice,
} from '../data/cosmetics';
import {
  CRATE_TIER_CONFIGS,
  DEFAULT_CRATE_INVENTORY,
  getTotalCrateCount,
} from '../data/crates';
import { getChapterInfo, getLevelConfig } from '../data/levels';
import { NAME_COLOR_CATALOG, NameColorDefinition } from '../data/nameColors';
import {
  RENAME_PEANUT_COST,
  banIpManually,
  banPlayerByUidAndIp,
  checkIfBanned,
  cleanupDuplicateCreatorLeaderboardEntries,
  deleteLeaderboardEntry,
  deleteLeveledLeaderboardEntry,
  fetchClientIp,
  fetchSelfLeaderboardEntry,
  fetchSelfLeveledLeaderboardEntry,
  fetchCloudUserProgress,
  isUserCreator,
  saveCloudUserProgress,
  saveUserPrivateIp,
  signOutUser,
  submitLeaderboardScore,
  submitLeveledLeaderboardScore,
  subscribeAuthState,
  subscribeBannedLists,
  subscribeLeaderboard,
  subscribeLeveledLeaderboard,
  unbanIp,
  unbanUid,
} from '../firebase';
import AuthModal from './AuthModal';
import CreatorPanelModal from './CreatorPanelModal';
import { LEVELED_ACHIEVEMENTS, MEDAL_TIER_STYLES } from '../data/achievements';
import {
  AchievementDefinition,
  BODY_TYPE_CONFIGS,
  BannedIpRecord,
  BannedUidRecord,
  BodyType,
  BossArchetype,
  BossProjectile,
  BossState,
  Cloud,
  CosmeticCrate,
  CosmeticItem,
  CrateInventoryState,
  CrateTier,
  DIFFICULTY_CONFIGS,
  Difficulty,
  ELEPHANT_RADIUS,
  ElephantState,
  EquippedCosmetics,
  FinishGate,
  FloatingText,
  GAME_MODE_CONFIGS,
  GROUND_HEIGHT,
  GameMode,
  GameState,
  GameUser,
  LeaderboardEntry,
  LeveledLeaderboardEntry,
  Particle,
  PeanutBonus,
  PipePair,
  PlayerBolt,
  SavedCharacterPreset,
  UpgradesState,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../types/game';
import {
  DailyQuestDefinition,
  DailyQuestsState,
  createEmptyDailyQuestsState,
  getDailyQuestsForDate,
  getTodayDateKey,
} from '../data/dailyQuests';
import { getBiomeTheme, renderGameScene } from '../utils/renderer';
import { soundEngine } from '../utils/sound';
import AchievementsModal from './AchievementsModal';
import AvatarExportModal from './AvatarExportModal';
import DailyQuestsModal from './DailyQuestsModal';
import CosmeticSellModal from './CosmeticSellModal';
import LeaderboardModal from './LeaderboardModal';
import RareDropExplosionModal from './RareDropExplosionModal';
import SavedCharactersModal from './SavedCharactersModal';
import ShopModal, { CrateSpinPayload, ShopTab } from './ShopModal';
import StyledPlayerName from './StyledPlayerName';

const HIGH_SCORE_STORAGE_KEY = 'ucan_fil_high_scores_v1';
const PROFILE_STORAGE_KEY = 'ucan_fil_profile_v2';
const PROFILE_OWNER_UID_KEY = 'ucan_fil_profile_owner_uid_v1';
const DAILY_QUESTS_STORAGE_KEY = 'ucan_fil_daily_quests_v1';
const SAVED_CHARACTERS_STORAGE_KEY = 'ucan_fil_saved_characters_v1';
const MOBILE_MODE_STORAGE_KEY = 'ucan_fil_mobile_mode_v1';

type HighScoreMap = Record<Difficulty, number>;

const DEFAULT_UNLOCKED_IDS = ['hat_none', 'glasses_none', 'skin_classic', 'trail_none'];
const DEFAULT_NAME_COLORS = ['name_default'];
const DEFAULT_EQUIPPED: EquippedCosmetics = {
  hat: 'hat_none',
  glasses: 'glasses_none',
  skin: 'skin_classic',
  trail: 'trail_none',
  suit: 'suit_none',
};
const DEFAULT_UPGRADES: UpgradesState = {
  magnetLevel: 0,
  doublePeanutLevel: 0,
  shieldCount: 0,
};

interface SavedProfile {
  gameMode: GameMode;
  difficulty: Difficulty;
  bodyType: BodyType;
  peanutBank: number;
  unlockedIds: string[];
  equipped: EquippedCosmetics;
  unlockedNameColors: string[];
  equippedNameColor: string;
  leveledBodyType: BodyType;
  leveledEquipped: EquippedCosmetics;
  leveledEquippedNameColor: string;
  unlockedAchievements: string[];
  bestLeveledCleanFlightSec: number;
  upgrades: UpgradesState;
  crateInventory: CrateInventoryState;
  unlockedLevel: number;
  completedLevels: number;
  bestLevelScore: number;
  updatedAtMs: number;
}

function computeIntegritySig(payload: string): string {
  let h = 2166136261;
  const salted = `ucan_fil_savanna_guard_v1:${payload}`;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function canonicalizeHighScores(raw: Partial<Record<Difficulty, unknown>>): HighScoreMap {
  return {
    easy: Math.max(0, Math.min(999999, Math.floor(Number(raw.easy) || 0))),
    classic: Math.max(0, Math.min(999999, Math.floor(Number(raw.classic) || 0))),
    turbo: Math.max(0, Math.min(999999, Math.floor(Number(raw.turbo) || 0))),
  };
}

function loadHighScores(): HighScoreMap {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const scores = canonicalizeHighScores(parsed);
      const expected = computeIntegritySig(JSON.stringify(scores));
      if (parsed.sig && parsed.sig !== expected) {
        return { easy: 0, classic: 0, turbo: 0 };
      }
      return scores;
    }
  } catch {
    // Ignore storage errors
  }
  return { easy: 0, classic: 0, turbo: 0 };
}

function saveHighScores(scores: HighScoreMap) {
  try {
    const canonical = canonicalizeHighScores(scores);
    const sig = computeIntegritySig(JSON.stringify(canonical));
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify({ ...canonical, sig }));
  } catch {
    // Ignore storage errors
  }
}

function canonicalizeProfile(raw: Partial<SavedProfile>): SavedProfile {
  const rawUnlocked = Array.isArray(raw.unlockedIds) ? raw.unlockedIds.map(String) : [];
  const normalizedUnlocked = rawUnlocked.map((id) => (id === 'skin_tuxedo' ? 'suit_tuxedo' : id));
  const unlockedSet = new Set<string>([...DEFAULT_UNLOCKED_IDS, ...normalizedUnlocked]);
  const sortedUnlocked = Array.from(unlockedSet).sort();
  const unlockedNameColorSet = new Set<string>([
    ...DEFAULT_NAME_COLORS,
    ...(Array.isArray(raw.unlockedNameColors) ? raw.unlockedNameColors.map(String) : []),
  ]);
  const sortedNameColors = Array.from(unlockedNameColorSet).sort();
  const rawSkin = String(raw.equipped?.skin || 'skin_classic');
  const rawSuit = rawSkin === 'skin_tuxedo' ? 'suit_tuxedo' : String(raw.equipped?.suit || 'suit_none');
  // Never allow Seviyeli-only costumes to carry onto the Klasik character
  const migratedSuit = COSMETIC_BY_ID[rawSuit]?.leveledOnly ? 'suit_none' : rawSuit;
  const migratedSkin = rawSkin === 'skin_tuxedo' ? 'skin_classic' : rawSkin;
  const baseBodyType: BodyType =
    raw.bodyType === 'slim' || raw.bodyType === 'chubby' ? raw.bodyType : 'normal';
  const baseEquipped: EquippedCosmetics = {
    hat: String(raw.equipped?.hat || 'hat_none'),
    glasses: String(raw.equipped?.glasses || 'glasses_none'),
    skin: migratedSkin,
    trail: String(raw.equipped?.trail || 'trail_none'),
    suit: migratedSuit,
  };
  const baseNameColor = String(raw.equippedNameColor || 'name_default');
  const leveledBodyType: BodyType =
    raw.leveledBodyType === 'slim' || raw.leveledBodyType === 'chubby'
      ? raw.leveledBodyType
      : raw.leveledBodyType === 'normal'
        ? 'normal'
        : baseBodyType;
  const leveledEquipped: EquippedCosmetics = raw.leveledEquipped
    ? {
        hat: String(raw.leveledEquipped.hat || baseEquipped.hat),
        glasses: String(raw.leveledEquipped.glasses || baseEquipped.glasses),
        skin: String(raw.leveledEquipped.skin || baseEquipped.skin),
        trail: String(raw.leveledEquipped.trail || baseEquipped.trail),
        suit: String(raw.leveledEquipped.suit || 'suit_none'),
      }
    : { ...baseEquipped, suit: 'suit_none' };
  const leveledEquippedNameColor = String(raw.leveledEquippedNameColor || baseNameColor);
  const unlockedAchievements = Array.from(
    new Set(Array.isArray(raw.unlockedAchievements) ? raw.unlockedAchievements.map(String) : [])
  )
    .slice(0, 60)
    .sort();

  return {
    gameMode: raw.gameMode === 'leveled' ? 'leveled' : 'classic',
    difficulty:
      raw.difficulty === 'easy' || raw.difficulty === 'turbo' ? raw.difficulty : 'classic',
    bodyType: baseBodyType,
    peanutBank: Math.max(0, Math.min(9999999, Math.floor(Number(raw.peanutBank) || 0))),
    unlockedIds: sortedUnlocked,
    equipped: baseEquipped,
    unlockedNameColors: sortedNameColors,
    equippedNameColor: baseNameColor,
    leveledBodyType,
    leveledEquipped,
    leveledEquippedNameColor,
    unlockedAchievements,
    bestLeveledCleanFlightSec: Math.max(
      0,
      Math.min(999999, Math.floor(Number(raw.bestLeveledCleanFlightSec) || 0))
    ),
    upgrades: {
      magnetLevel: Math.min(5, Math.max(0, Math.floor(Number(raw.upgrades?.magnetLevel) || 0))),
      doublePeanutLevel: Math.min(
        5,
        Math.max(0, Math.floor(Number(raw.upgrades?.doublePeanutLevel) || 0))
      ),
      shieldCount: Math.min(99, Math.max(0, Math.floor(Number(raw.upgrades?.shieldCount) || 0))),
    },
    crateInventory: {
      standard: Math.min(
        9999,
        Math.max(0, Math.floor(Number(raw.crateInventory?.standard) || 0))
      ),
      epic: Math.min(9999, Math.max(0, Math.floor(Number(raw.crateInventory?.epic) || 0))),
      mythic: Math.min(9999, Math.max(0, Math.floor(Number(raw.crateInventory?.mythic) || 0))),
      outfit: Math.min(9999, Math.max(0, Math.floor(Number(raw.crateInventory?.outfit) || 0))),
      leveled_outfit: Math.min(
        9999,
        Math.max(0, Math.floor(Number(raw.crateInventory?.leveled_outfit) || 0))
      ),
    },
    unlockedLevel: Math.max(1, Math.min(9999, Math.floor(Number(raw.unlockedLevel) || 1))),
    completedLevels: Math.max(0, Math.min(9999, Math.floor(Number(raw.completedLevels) || 0))),
    bestLevelScore: Math.max(0, Math.min(999999, Math.floor(Number(raw.bestLevelScore) || 0))),
    updatedAtMs: Math.max(0, Math.floor(Number(raw.updatedAtMs) || 0)),
  };
}

function createDefaultProfile(): SavedProfile {
  return canonicalizeProfile({
    gameMode: 'classic',
    difficulty: 'classic',
    bodyType: 'normal',
    peanutBank: 0,
    unlockedIds: DEFAULT_UNLOCKED_IDS,
    equipped: DEFAULT_EQUIPPED,
    unlockedNameColors: DEFAULT_NAME_COLORS,
    equippedNameColor: 'name_default',
    leveledBodyType: 'normal',
    leveledEquipped: DEFAULT_EQUIPPED,
    leveledEquippedNameColor: 'name_default',
    unlockedAchievements: [],
    bestLeveledCleanFlightSec: 0,
    upgrades: DEFAULT_UPGRADES,
    crateInventory: DEFAULT_CRATE_INVENTORY,
    unlockedLevel: 1,
    completedLevels: 0,
    bestLevelScore: 0,
    updatedAtMs: 0,
  });
}

function loadProfile(): SavedProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleanProfile = canonicalizeProfile(parsed);
      const expected = computeIntegritySig(JSON.stringify(cleanProfile));
      if (!parsed.sig || parsed.sig === expected) {
        return cleanProfile;
      }
      // Preserve saves created before dual characters, achievements, and leveled_outfit crate were added
      const legacyPreDualCharAndAchievements = {
        gameMode: cleanProfile.gameMode,
        difficulty: cleanProfile.difficulty,
        bodyType: cleanProfile.bodyType,
        peanutBank: cleanProfile.peanutBank,
        unlockedIds: cleanProfile.unlockedIds,
        equipped: {
          ...cleanProfile.equipped,
          suit: String(parsed?.equipped?.suit || cleanProfile.equipped.suit),
        },
        unlockedNameColors: cleanProfile.unlockedNameColors,
        equippedNameColor: cleanProfile.equippedNameColor,
        upgrades: cleanProfile.upgrades,
        crateInventory: {
          standard: cleanProfile.crateInventory.standard,
          epic: cleanProfile.crateInventory.epic,
          mythic: cleanProfile.crateInventory.mythic,
          outfit: cleanProfile.crateInventory.outfit,
        },
        unlockedLevel: cleanProfile.unlockedLevel,
        completedLevels: cleanProfile.completedLevels,
        bestLevelScore: cleanProfile.bestLevelScore,
        updatedAtMs: cleanProfile.updatedAtMs,
      };
      if (parsed.sig === computeIntegritySig(JSON.stringify(legacyPreDualCharAndAchievements))) {
        return cleanProfile;
      }
      // Preserve saves created before Seviyeli mode fields were added
      const legacyPreLeveledMode = {
        difficulty: cleanProfile.difficulty,
        bodyType: cleanProfile.bodyType,
        peanutBank: cleanProfile.peanutBank,
        unlockedIds: cleanProfile.unlockedIds,
        equipped: legacyPreDualCharAndAchievements.equipped,
        unlockedNameColors: cleanProfile.unlockedNameColors,
        equippedNameColor: cleanProfile.equippedNameColor,
        upgrades: cleanProfile.upgrades,
        crateInventory: legacyPreDualCharAndAchievements.crateInventory,
        updatedAtMs: cleanProfile.updatedAtMs,
      };
      if (parsed.sig === computeIntegritySig(JSON.stringify(legacyPreLeveledMode))) {
        return cleanProfile;
      }
      // Preserve saves created before crateInventory.outfit was added
      const legacyPreOutfitCrate = {
        ...legacyPreLeveledMode,
        crateInventory: {
          standard: cleanProfile.crateInventory.standard,
          epic: cleanProfile.crateInventory.epic,
          mythic: cleanProfile.crateInventory.mythic,
        },
      };
      if (parsed.sig === computeIntegritySig(JSON.stringify(legacyPreOutfitCrate))) {
        return cleanProfile;
      }
      // Preserve saves created before crateInventory was added
      const legacyPreCrateInventory = {
        difficulty: cleanProfile.difficulty,
        bodyType: cleanProfile.bodyType,
        peanutBank: cleanProfile.peanutBank,
        unlockedIds: cleanProfile.unlockedIds,
        equipped: cleanProfile.equipped,
        unlockedNameColors: cleanProfile.unlockedNameColors,
        equippedNameColor: cleanProfile.equippedNameColor,
        upgrades: cleanProfile.upgrades,
        updatedAtMs: cleanProfile.updatedAtMs,
      };
      if (parsed.sig === computeIntegritySig(JSON.stringify(legacyPreCrateInventory))) {
        return cleanProfile;
      }
      const legacyEquipped = {
        hat: cleanProfile.equipped.hat,
        glasses: cleanProfile.equipped.glasses,
        skin: cleanProfile.equipped.skin,
        trail: cleanProfile.equipped.trail,
      };
      // Preserve saves created before equipped.suit was added
      const legacyPreSuit = {
        ...legacyPreCrateInventory,
        equipped: legacyEquipped,
      };
      if (parsed.sig === computeIntegritySig(JSON.stringify(legacyPreSuit))) {
        return cleanProfile;
      }
      // Preserve saves created before unlockedNameColors/equippedNameColor fields were added
      const legacyV2 = {
        difficulty: cleanProfile.difficulty,
        bodyType: cleanProfile.bodyType,
        peanutBank: cleanProfile.peanutBank,
        unlockedIds: cleanProfile.unlockedIds,
        equipped: legacyEquipped,
        upgrades: cleanProfile.upgrades,
        updatedAtMs: cleanProfile.updatedAtMs,
      };
      if (parsed.sig === computeIntegritySig(JSON.stringify(legacyV2))) {
        return cleanProfile;
      }
      return createDefaultProfile();
    }
  } catch {
    // Ignore storage errors
  }
  return createDefaultProfile();
}

function saveProfile(profile: SavedProfile) {
  try {
    const canonical = canonicalizeProfile(profile);
    const sig = computeIntegritySig(JSON.stringify(canonical));
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...canonical, sig }));
  } catch {
    // Ignore storage errors
  }
}

function canonicalizeDailyQuests(state: DailyQuestsState): DailyQuestsState {
  const sortedProgress: Record<string, number> = {};
  Object.keys(state.progress || {})
    .sort()
    .slice(0, 10)
    .forEach((k) => {
      sortedProgress[k] = Math.max(0, Math.min(99999, Math.floor(Number(state.progress[k]) || 0)));
    });
  const sortedClaimed = Array.from(new Set((state.claimedIds || []).map(String)))
    .sort()
    .slice(0, 3);
  return {
    dateKey: String(state.dateKey || getTodayDateKey()),
    progress: sortedProgress,
    claimedIds: sortedClaimed,
  };
}

function loadDailyQuests(): DailyQuestsState {
  const todayKey = getTodayDateKey();
  try {
    const raw = localStorage.getItem(DAILY_QUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.dateKey === todayKey) {
        const cleanState = canonicalizeDailyQuests({
          dateKey: todayKey,
          progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
          claimedIds: Array.isArray(parsed.claimedIds) ? parsed.claimedIds : [],
        });
        const expected = computeIntegritySig(JSON.stringify(cleanState));
        if (parsed.sig && parsed.sig !== expected) {
          return createEmptyDailyQuestsState(todayKey);
        }
        return cleanState;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return createEmptyDailyQuestsState(todayKey);
}

function saveDailyQuests(state: DailyQuestsState) {
  try {
    const canonical = canonicalizeDailyQuests(state);
    const sig = computeIntegritySig(JSON.stringify(canonical));
    localStorage.setItem(DAILY_QUESTS_STORAGE_KEY, JSON.stringify({ ...canonical, sig }));
  } catch {
    // Ignore storage errors
  }
}

function loadSavedCharacters(): SavedCharacterPreset[] {
  try {
    const raw = localStorage.getItem(SAVED_CHARACTERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 12).map((item, idx) => ({
      id: String(item?.id || `preset_${idx}`).slice(0, 48),
      name: String(item?.name || `Kombin #${idx + 1}`).slice(0, 24),
      bodyType: item?.bodyType === 'slim' || item?.bodyType === 'chubby' ? item.bodyType : 'normal',
      equipped: {
        hat: String(item?.equipped?.hat || 'hat_none').slice(0, 40),
        glasses: String(item?.equipped?.glasses || 'glasses_none').slice(0, 40),
        skin: String(item?.equipped?.skin || 'skin_classic').slice(0, 40),
        trail: String(item?.equipped?.trail || 'trail_none').slice(0, 40),
        suit: String(item?.equipped?.suit || 'suit_none').slice(0, 40),
      },
      nameColorId: String(item?.nameColorId || 'name_default').slice(0, 40),
      savedAtMs: Math.max(0, Math.floor(Number(item?.savedAtMs) || Date.now())),
    }));
  } catch {
    return [];
  }
}

function persistSavedCharacters(presets: SavedCharacterPreset[]) {
  try {
    localStorage.setItem(SAVED_CHARACTERS_STORAGE_KEY, JSON.stringify(presets.slice(0, 12)));
  } catch {
    // Ignore storage errors
  }
}

function createInitialClouds(): Cloud[] {
  return [
    { x: 110, y: 78, scale: 0.9, speed: 18, opacity: 0.85 },
    { x: 340, y: 122, scale: 0.7, speed: 12, opacity: 0.7 },
    { x: 580, y: 66, scale: 1.05, speed: 22, opacity: 0.85 },
    { x: 780, y: 138, scale: 0.75, speed: 14, opacity: 0.65 },
  ];
}

function createInitialElephant(): ElephantState {
  return {
    x: 175,
    y: (WORLD_HEIGHT - GROUND_HEIGHT) * 0.45,
    vy: 0,
    rotation: 0,
    earPhase: 0,
    earFlapTimer: 0,
    trunkPhase: 0,
    scarfWave: 0,
    blinkTimer: 2.5,
    isHurt: false,
    invincibleTimer: 0,
  };
}

function createBossForLevel(level: number, kind: 'miniboss' | 'boss'): BossState {
  const archetypes: BossArchetype[] = ['iron_golem', 'cyber_drone', 'lava_wyrm', 'cosmic_titan'];
  const archIndex = Math.floor(Math.max(0, level / 5 - 1)) % archetypes.length;
  const archetype = archetypes[archIndex];
  const miniNames: Record<BossArchetype, string> = {
    iron_golem: 'Demir Muhafız',
    cyber_drone: 'Siber Gözcü',
    lava_wyrm: 'Kor Ejderi',
    cosmic_titan: 'Yıldız Nöbetçisi',
  };
  const bossNames: Record<BossArchetype, string> = {
    iron_golem: 'Titan Savan Golemi',
    cyber_drone: 'Aşırı Yük Mecha',
    lava_wyrm: 'Cehennem Ejderhası',
    cosmic_titan: 'Galaksi İmparatoru',
  };
  const maxHp =
    kind === 'boss'
      ? Math.round(24 + level * 2.2)
      : Math.round(13 + level * 1.45);
  return {
    active: true,
    defeated: false,
    kind,
    level,
    name: kind === 'boss' ? bossNames[archetype] : miniNames[archetype],
    archetype,
    x: WORLD_WIDTH + 95,
    y: (WORLD_HEIGHT - GROUND_HEIGHT) * 0.46,
    targetX: WORLD_WIDTH - (kind === 'boss' ? 140 : 132),
    radius: kind === 'boss' ? 42 : 33,
    hp: maxHp,
    maxHp,
    phase: 0,
    attackTimer: 1.15,
    beamCooldown: kind === 'boss' ? 4.2 : 999,
    beamState: 'none',
    beamTimer: 0,
    beamY: (WORLD_HEIGHT - GROUND_HEIGHT) * 0.46,
    beamHeight: kind === 'boss' ? 46 : 34,
    hitFlash: 0,
    enraged: false,
  };
}

function getMedalInfo(score: number): { label: string; colorClass: string; ringClass: string } | null {
  if (score >= 100) {
    return { label: 'Savan Efsanesi', colorClass: 'text-cyan-300', ringClass: 'border-cyan-400/50 bg-cyan-500/10' };
  }
  if (score >= 50) {
    return { label: 'Altın Madalya', colorClass: 'text-amber-300', ringClass: 'border-amber-400/50 bg-amber-500/10' };
  }
  if (score >= 25) {
    return { label: 'Gümüş Madalya', colorClass: 'text-slate-200', ringClass: 'border-slate-300/50 bg-slate-300/10' };
  }
  if (score >= 10) {
    return { label: 'Bronz Madalya', colorClass: 'text-orange-300', ringClass: 'border-orange-400/50 bg-orange-500/10' };
  }
  return null;
}

export default function FlappyElephantGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initialProfile = useRef<SavedProfile>(loadProfile()).current;

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>(initialProfile.gameMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialProfile.difficulty);
  const [leveledDifficulty, setLeveledDifficulty] = useState<'classic' | 'turbo'>('classic');
  const [bodyType, setBodyType] = useState<BodyType>(initialProfile.bodyType);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(initialProfile.unlockedLevel);
  const [selectedLevel, setSelectedLevel] = useState<number>(initialProfile.unlockedLevel);
  const [completedLevels, setCompletedLevels] = useState<number>(initialProfile.completedLevels);
  const [bestLevelScore, setBestLevelScore] = useState<number>(initialProfile.bestLevelScore);
  const [peanutBank, setPeanutBank] = useState<number>(initialProfile.peanutBank);
  const [unlockedIds, setUnlockedIds] = useState<string[]>(initialProfile.unlockedIds);
  const [equipped, setEquipped] = useState<EquippedCosmetics>(initialProfile.equipped);
  const [unlockedNameColors, setUnlockedNameColors] = useState<string[]>(
    initialProfile.unlockedNameColors
  );
  const [equippedNameColor, setEquippedNameColor] = useState<string>(
    initialProfile.equippedNameColor
  );
  const [leveledBodyType, setLeveledBodyType] = useState<BodyType>(initialProfile.leveledBodyType);
  const [leveledEquipped, setLeveledEquipped] = useState<EquippedCosmetics>(
    initialProfile.leveledEquipped
  );
  const [leveledNameColor, setLeveledNameColor] = useState<string>(
    initialProfile.leveledEquippedNameColor
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    initialProfile.unlockedAchievements
  );
  const [bestLeveledCleanFlightSec, setBestLeveledCleanFlightSec] = useState<number>(
    initialProfile.bestLeveledCleanFlightSec
  );
  const [upgrades, setUpgrades] = useState<UpgradesState>(initialProfile.upgrades);
  const [crateInventory, setCrateInventory] = useState<CrateInventoryState>(
    initialProfile.crateInventory
  );
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacterPreset[]>(() =>
    loadSavedCharacters()
  );

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const arenaWrapperRef = useRef<HTMLDivElement | null>(null);
  const [fittedStageSize, setFittedStageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState<boolean>(false);
  const isFullscreen = isNativeFullscreen || isTheaterFullscreen;
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(MOBILE_MODE_STORAGE_KEY);
      if (stored === '1') return true;
      if (stored === '0') return false;
      if (typeof window !== 'undefined') {
        const isSmallViewport = window.innerWidth < 768;
        const isCoarse =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(pointer: coarse)').matches;
        return isSmallViewport && isCoarse;
      }
    } catch {
      // Ignore storage errors
    }
    return false;
  });

  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [shopInitialTab, setShopInitialTab] = useState<ShopTab>('market');
  const [isSellOpen, setIsSellOpen] = useState<boolean>(false);
  const [isDailyQuestsOpen, setIsDailyQuestsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState<boolean>(false);
  const [isSavedCharsOpen, setIsSavedCharsOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [isCreatorPanelOpen, setIsCreatorPanelOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'guest'>('login');
  const [dailyQuestsState, setDailyQuestsState] = useState<DailyQuestsState>(() =>
    loadDailyQuests()
  );
  const [cloudHydratedUid, setCloudHydratedUid] = useState<string | null>(null);

  // Creator-only gameplay overrides
  const [godMode, setGodMode] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [creatorBiomeOverride, setCreatorBiomeOverride] = useState<string | null>(null);
  const [customDisplayName, setCustomDisplayName] = useState<string>('');
  const [selfLeaderboardMeta, setSelfLeaderboardMeta] = useState<{
    displayName: string;
    hasCustomName: boolean;
    lastNameChangeMs?: number;
  } | null>(null);

  // Firestore Custom Auth, IP Ban & Leaderboard State
  const [user, setUser] = useState<GameUser | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leveledEntries, setLeveledEntries] = useState<LeveledLeaderboardEntry[]>([]);
  const [leveledLoading, setLeveledLoading] = useState<boolean>(true);
  const [leveledError, setLeveledError] = useState<string | null>(null);
  const [banStatus, setBanStatus] = useState<{ banned: boolean; reason?: string }>({
    banned: false,
  });
  const [bannedIps, setBannedIps] = useState<BannedIpRecord[]>([]);
  const [bannedUids, setBannedUids] = useState<BannedUidRecord[]>([]);
  const [hasActiveShield, setHasActiveShield] = useState<boolean>(false);

  const [score, setScore] = useState<number>(0);
  const [levelPipesCleared, setLevelPipesCleared] = useState<number>(0);
  const [bossHud, setBossHud] = useState<{
    name: string;
    kind: 'miniboss' | 'boss';
    hp: number;
    maxHp: number;
    enraged: boolean;
  } | null>(null);
  const [levelRewardSummary, setLevelRewardSummary] = useState<{
    level: number;
    chapter: number;
    stageInChapter: number;
    isChapterEnd: boolean;
    chapterTitle: string;
    peanuts: number;
    crateTier: CrateTier | null;
    isFirstClear: boolean;
    difficultyLabel: string;
    difficultyColor: string;
  } | null>(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<
    AchievementDefinition[]
  >([]);
  const [peanutsCollected, setPeanutsCollected] = useState<number>(0);
  const [runDrops, setRunDrops] = useState<CosmeticItem[]>([]);
  const [dropBanner, setDropBanner] = useState<string | null>(null);
  const [rareExplosionItem, setRareExplosionItem] = useState<CosmeticItem | null>(null);
  const [rareExplosionIsTest, setRareExplosionIsTest] = useState<boolean>(false);

  const [highScores, setHighScores] = useState<HighScoreMap>(() => loadHighScores());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Mutable refs for 60fps loop
  const gameStateRef = useRef<GameState>('TITLE_MENU');
  const isShopOpenRef = useRef<boolean>(false);
  const isSellOpenRef = useRef<boolean>(false);
  const gameModeRef = useRef<GameMode>(initialProfile.gameMode);
  const difficultyRef = useRef<Difficulty>(initialProfile.difficulty);
  const leveledDifficultyRef = useRef<'classic' | 'turbo'>('classic');
  const activeDifficultyRef = useRef<Difficulty>(
    initialProfile.gameMode === 'leveled' ? 'classic' : initialProfile.difficulty
  );
  const bodyTypeRef = useRef<BodyType>(initialProfile.bodyType);
  const unlockedLevelRef = useRef<number>(initialProfile.unlockedLevel);
  const selectedLevelRef = useRef<number>(initialProfile.unlockedLevel);
  const completedLevelsRef = useRef<number>(initialProfile.completedLevels);
  const bestLevelScoreRef = useRef<number>(initialProfile.bestLevelScore);
  const equippedRef = useRef<EquippedCosmetics>(initialProfile.equipped);
  const unlockedIdsRef = useRef<string[]>(initialProfile.unlockedIds);
  const unlockedNameColorsRef = useRef<string[]>(initialProfile.unlockedNameColors);
  const equippedNameColorRef = useRef<string>(initialProfile.equippedNameColor);
  const leveledBodyTypeRef = useRef<BodyType>('normal');
  const leveledEquippedRef = useRef<EquippedCosmetics>(initialProfile.leveledEquipped);
  const leveledNameColorRef = useRef<string>(initialProfile.leveledEquippedNameColor);
  const activeBodyTypeRef = useRef<BodyType>(
    initialProfile.gameMode === 'leveled' ? 'normal' : initialProfile.bodyType
  );
  const activeEquippedRef = useRef<EquippedCosmetics>(
    initialProfile.gameMode === 'leveled' ? initialProfile.leveledEquipped : initialProfile.equipped
  );
  const activeNameColorRef = useRef<string>(
    initialProfile.gameMode === 'leveled'
      ? initialProfile.leveledEquippedNameColor
      : initialProfile.equippedNameColor
  );
  const unlockedAchievementsRef = useRef<string[]>(initialProfile.unlockedAchievements);
  const bestLeveledCleanFlightSecRef = useRef<number>(initialProfile.bestLeveledCleanFlightSec);
  const leveledCleanFlightSecRef = useRef<number>(0);
  const leveledCleanFlightWholeSecRef = useRef<number>(0);
  const upgradesRef = useRef<UpgradesState>(initialProfile.upgrades);
  const crateInventoryRef = useRef<CrateInventoryState>(initialProfile.crateInventory);
  const peanutBankRef = useRef<number>(initialProfile.peanutBank);
  const profileUpdatedAtMsRef = useRef<number>(initialProfile.updatedAtMs);
  const prevDataSignatureRef = useRef<string | null>(null);
  const isMobileModeRef = useRef<boolean>(isMobileMode);
  const cloudHydratedUidRef = useRef<string | null>(null);
  const userRef = useRef<GameUser | null>(null);
  const clientIpRef = useRef<{ ipRaw: string; ipKey: string } | null>(null);
  const hasActiveShieldRef = useRef<boolean>(false);
  const godModeRef = useRef<boolean>(false);
  const speedMultiplierRef = useRef<number>(1);
  const creatorBiomeOverrideRef = useRef<string | null>(null);
  const customDisplayNameRef = useRef<string>('');

  const scoreRef = useRef<number>(0);
  const runStartMsRef = useRef<number>(0);
  const runPipesPassedRef = useRef<number>(0);
  const runPeanutPickupsRef = useRef<number>(0);
  const highScoresRef = useRef<HighScoreMap>(highScores);
  const gameOverTimestampRef = useRef<number>(0);
  const dropBannerTimerRef = useRef<number>(0);
  const trailTickRef = useRef<number>(0);

  const elephantRef = useRef<ElephantState>(createInitialElephant());
  const pipesRef = useRef<PipePair[]>([]);
  const peanutsRef = useRef<PeanutBonus[]>([]);
  const cratesRef = useRef<CosmeticCrate[]>([]);
  const finishGateRef = useRef<FinishGate | null>(null);
  const bossRef = useRef<BossState | null>(null);
  const bossProjectilesRef = useRef<BossProjectile[]>([]);
  const playerBoltsRef = useRef<PlayerBolt[]>([]);
  const autoFireTimerRef = useRef<number>(0.42);
  const lastFlapShotMsRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cloudsRef = useRef<Cloud[]>(createInitialClouds());

  const groundOffsetRef = useRef<number>(0);
  const bgOffsetRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const pipeSpawnCountRef = useRef<number>(0);
  const nextEntityIdRef = useRef<number>(1);
  const flashAlphaRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    isShopOpenRef.current = isShopOpen;
  }, [isShopOpen]);
  useEffect(() => {
    isSellOpenRef.current = isSellOpen;
  }, [isSellOpen]);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);
  useEffect(() => {
    leveledDifficultyRef.current = leveledDifficulty;
  }, [leveledDifficulty]);
  useEffect(() => {
    activeDifficultyRef.current =
      gameMode === 'leveled'
        ? unlockedLevel > 10 && leveledDifficulty === 'turbo'
          ? 'turbo'
          : 'classic'
        : difficulty;
  }, [gameMode, difficulty, leveledDifficulty, unlockedLevel]);
  useEffect(() => {
    bodyTypeRef.current = bodyType;
  }, [bodyType]);
  useEffect(() => {
    unlockedLevelRef.current = unlockedLevel;
  }, [unlockedLevel]);
  useEffect(() => {
    selectedLevelRef.current = selectedLevel;
  }, [selectedLevel]);
  useEffect(() => {
    completedLevelsRef.current = completedLevels;
  }, [completedLevels]);
  useEffect(() => {
    bestLevelScoreRef.current = bestLevelScore;
  }, [bestLevelScore]);
  useEffect(() => {
    equippedRef.current = equipped;
  }, [equipped]);
  useEffect(() => {
    unlockedIdsRef.current = unlockedIds;
  }, [unlockedIds]);
  useEffect(() => {
    unlockedNameColorsRef.current = unlockedNameColors;
  }, [unlockedNameColors]);
  useEffect(() => {
    equippedNameColorRef.current = equippedNameColor;
  }, [equippedNameColor]);
  useEffect(() => {
    leveledBodyTypeRef.current = 'normal';
  }, [leveledBodyType]);
  useEffect(() => {
    leveledEquippedRef.current = leveledEquipped;
  }, [leveledEquipped]);
  useEffect(() => {
    leveledNameColorRef.current = leveledNameColor;
  }, [leveledNameColor]);
  useEffect(() => {
    activeBodyTypeRef.current = gameMode === 'leveled' ? 'normal' : bodyType;
    activeEquippedRef.current = gameMode === 'leveled' ? leveledEquipped : equipped;
    activeNameColorRef.current = gameMode === 'leveled' ? leveledNameColor : equippedNameColor;
  }, [gameMode, bodyType, equipped, leveledEquipped, equippedNameColor, leveledNameColor]);
  useEffect(() => {
    unlockedAchievementsRef.current = unlockedAchievements;
  }, [unlockedAchievements]);
  useEffect(() => {
    bestLeveledCleanFlightSecRef.current = bestLeveledCleanFlightSec;
  }, [bestLeveledCleanFlightSec]);
  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);
  useEffect(() => {
    crateInventoryRef.current = crateInventory;
  }, [crateInventory]);
  useEffect(() => {
    peanutBankRef.current = peanutBank;
  }, [peanutBank]);
  useEffect(() => {
    highScoresRef.current = highScores;
  }, [highScores]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    godModeRef.current = godMode;
  }, [godMode]);
  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);
  useEffect(() => {
    customDisplayNameRef.current = customDisplayName;
  }, [customDisplayName]);

  useEffect(() => {
    isMobileModeRef.current = isMobileMode;
    try {
      localStorage.setItem(MOBILE_MODE_STORAGE_KEY, isMobileMode ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }, [isMobileMode]);

  // Persist locally & to Firestore only after cloud hydration completes
  useEffect(() => {
    const dataSig = JSON.stringify({
      gameMode,
      difficulty,
      bodyType,
      unlockedLevel,
      completedLevels,
      bestLevelScore,
      peanutBank,
      unlockedIds,
      equipped,
      unlockedNameColors,
      equippedNameColor,
      leveledBodyType,
      leveledEquipped,
      leveledNameColor,
      unlockedAchievements,
      bestLeveledCleanFlightSec,
      upgrades,
      crateInventory,
      savedCharacters,
      highScores,
      dailyQuestsState,
    });
    if (prevDataSignatureRef.current === null) {
      prevDataSignatureRef.current = dataSig;
    } else if (prevDataSignatureRef.current !== dataSig) {
      prevDataSignatureRef.current = dataSig;
      profileUpdatedAtMsRef.current = Date.now();
    }

    saveProfile({
      gameMode,
      difficulty,
      bodyType,
      peanutBank,
      unlockedIds,
      equipped,
      unlockedNameColors,
      equippedNameColor,
      leveledBodyType,
      leveledEquipped,
      leveledEquippedNameColor: leveledNameColor,
      unlockedAchievements,
      bestLeveledCleanFlightSec,
      upgrades,
      crateInventory,
      unlockedLevel,
      completedLevels,
      bestLevelScore,
      updatedAtMs: profileUpdatedAtMsRef.current,
    });
    saveHighScores(highScores);
    saveDailyQuests(dailyQuestsState);
    persistSavedCharacters(savedCharacters);
    if (user && !user.isGuest && cloudHydratedUid === user.uid) {
      saveCloudUserProgress(user.uid, {
        peanutBank,
        bodyType,
        unlockedIds,
        equipped,
        unlockedNameColors,
        equippedNameColor,
        leveledBodyType,
        leveledEquipped,
        leveledEquippedNameColor: leveledNameColor,
        unlockedAchievements,
        bestLeveledCleanFlightSec,
        upgrades,
        crateInventory,
        savedCharacters,
        dailyQuestsDate: dailyQuestsState.dateKey,
        dailyQuestsProgress: dailyQuestsState.progress,
        dailyQuestsClaimed: dailyQuestsState.claimedIds,
        preferredDifficulty: difficulty,
        preferredGameMode: gameMode,
        unlockedLevel,
        completedLevels,
        bestLevelScore,
        bestEasy: highScores.easy,
        bestClassic: highScores.classic,
        bestTurbo: highScores.turbo,
      }).catch(() => {});
    }
  }, [
    gameMode,
    difficulty,
    bodyType,
    unlockedLevel,
    completedLevels,
    bestLevelScore,
    peanutBank,
    unlockedIds,
    equipped,
    unlockedNameColors,
    equippedNameColor,
    leveledBodyType,
    leveledEquipped,
    leveledNameColor,
    unlockedAchievements,
    bestLeveledCleanFlightSec,
    upgrades,
    crateInventory,
    savedCharacters,
    highScores,
    dailyQuestsState,
    user,
    cloudHydratedUid,
  ]);

  // Keep public leaderboard character previews & animated name colors synced per mode
  useEffect(() => {
    if (!user || user.isGuest || cloudHydratedUid !== user.uid) return;
    const timer = window.setTimeout(() => {
      const bestLocal = Math.max(
        highScoresRef.current.easy,
        highScoresRef.current.classic,
        highScoresRef.current.turbo
      );
      submitLeaderboardScore({
        user,
        score: bestLocal,
        difficulty: difficultyRef.current,
        bodyType,
        equipped,
        nameColorId: equippedNameColor,
        syncOutfitOnly: true,
      }).catch(() => {});
      if (unlockedLevelRef.current > 1 || completedLevelsRef.current > 0) {
        submitLeveledLeaderboardScore({
          user,
          maxLevel: unlockedLevelRef.current,
          bestLevelScore: bestLevelScoreRef.current,
          completedLevels: completedLevelsRef.current,
          difficulty:
            unlockedLevelRef.current > 10 && leveledDifficultyRef.current === 'turbo'
              ? 'turbo'
              : 'classic',
          bodyType: 'normal',
          equipped: leveledEquipped,
          nameColorId: leveledNameColor,
          syncOutfitOnly: true,
        }).catch(() => {});
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [
    bodyType,
    equipped,
    equippedNameColor,
    leveledBodyType,
    leveledEquipped,
    leveledNameColor,
    user,
    cloudHydratedUid,
  ]);

  const switchGameMode = useCallback((nextMode: GameMode) => {
    gameModeRef.current = nextMode;
    if (nextMode === 'leveled') {
      activeBodyTypeRef.current = 'normal';
      activeDifficultyRef.current =
        unlockedLevelRef.current > 10 && leveledDifficultyRef.current === 'turbo'
          ? 'turbo'
          : 'classic';
      activeEquippedRef.current = leveledEquippedRef.current;
      activeNameColorRef.current = leveledNameColorRef.current;
    } else {
      activeBodyTypeRef.current = bodyTypeRef.current;
      activeDifficultyRef.current = difficultyRef.current;
      activeEquippedRef.current = equippedRef.current;
      activeNameColorRef.current = equippedNameColorRef.current;
    }
    setGameMode(nextMode);
  }, []);

  const setActiveBodyType = useCallback((bt: BodyType) => {
    if (gameModeRef.current === 'leveled') {
      leveledBodyTypeRef.current = 'normal';
      setLeveledBodyType('normal');
      activeBodyTypeRef.current = 'normal';
      return;
    }
    bodyTypeRef.current = bt;
    setBodyType(bt);
    activeBodyTypeRef.current = bt;
  }, []);

  const setActiveEquipped = useCallback(
    (updater: (prev: EquippedCosmetics) => EquippedCosmetics) => {
      if (gameModeRef.current === 'leveled') {
        setLeveledEquipped((prev) => {
          const next = updater(prev);
          leveledEquippedRef.current = next;
          activeEquippedRef.current = next;
          return next;
        });
      } else {
        setEquipped((prev) => {
          const rawNext = updater(prev);
          // Never allow Seviyeli-only costumes on Classic character
          const safeSuit = COSMETIC_BY_ID[rawNext.suit]?.leveledOnly
            ? 'suit_none'
            : rawNext.suit;
          const next = { ...rawNext, suit: safeSuit };
          equippedRef.current = next;
          activeEquippedRef.current = next;
          return next;
        });
      }
    },
    []
  );

  const setActiveNameColor = useCallback((colorId: string) => {
    if (gameModeRef.current === 'leveled') {
      leveledNameColorRef.current = colorId;
      setLeveledNameColor(colorId);
    } else {
      equippedNameColorRef.current = colorId;
      setEquippedNameColor(colorId);
    }
    activeNameColorRef.current = colorId;
  }, []);

  const grantCreatorEverything = useCallback(() => {
    const allIds = COSMETIC_CATALOG.filter((c) => !c.dropOnly).map((c) => c.id);
    const allNameColorIds = NAME_COLOR_CATALOG.map((n) => n.id);
    unlockedIdsRef.current = allIds;
    unlockedNameColorsRef.current = allNameColorIds;
    setUnlockedIds(allIds);
    setUnlockedNameColors(allNameColorIds);
    setPeanutBank((prev) => Math.max(prev, 9999));
    setUpgrades({
      magnetLevel: 5,
      doublePeanutLevel: 5,
      shieldCount: 99,
    });
  }, []);

  const grantSecretTuxedo = useCallback(() => {
    setUnlockedIds((prev) => {
      const next = prev.includes('suit_tuxedo') ? prev : [...prev, 'suit_tuxedo'];
      unlockedIdsRef.current = next;
      return next;
    });
    setActiveEquipped((prev) => ({ ...prev, suit: 'suit_tuxedo' }));
    soundEngine.playCrateUnlock();
  }, [setActiveEquipped]);

  const grantAllSuits = useCallback(() => {
    const suitIds = COSMETIC_CATALOG.filter(
      (c) => c.category === 'suit' && !c.leveledOnly
    ).map((c) => c.id);
    setUnlockedIds((prev) => {
      const next = Array.from(new Set([...prev, ...suitIds]));
      unlockedIdsRef.current = next;
      return next;
    });
    soundEngine.playCrateUnlock();
  }, []);

  const grantAllLeveledSuits = useCallback(() => {
    const suitIds = COSMETIC_CATALOG.filter((c) => c.leveledOnly).map((c) => c.id);
    setUnlockedIds((prev) => {
      const next = Array.from(new Set([...prev, ...suitIds]));
      unlockedIdsRef.current = next;
      return next;
    });
    soundEngine.playCrateUnlock();
  }, []);

  const grantOutfitCrates = useCallback((amount: number) => {
    setCrateInventory((prev) => ({
      ...prev,
      outfit: Math.min(9999, (prev.outfit || 0) + amount),
    }));
    soundEngine.playCrateUnlock();
  }, []);

  const grantLeveledSuitCrates = useCallback((amount: number) => {
    setCrateInventory((prev) => ({
      ...prev,
      leveled_outfit: Math.min(9999, (prev.leveled_outfit || 0) + amount),
    }));
    soundEngine.playCrateUnlock();
  }, []);

  // Check IP ban immediately on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ip = await fetchClientIp();
      if (cancelled) return;
      clientIpRef.current = ip;
      const result = await checkIfBanned(ip.ipKey, userRef.current?.uid);
      if (!cancelled && result.banned && !isUserCreator(userRef.current)) {
        setBanStatus(result);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to Firebase Auth
  useEffect(() => {
    let unsubBanned: (() => void) | null = null;
    const unsub = subscribeAuthState(async (nextUser) => {
      cloudHydratedUidRef.current = null;
      setCloudHydratedUid(null);
      setUser(nextUser);
      userRef.current = nextUser;
      if (unsubBanned) {
        unsubBanned();
        unsubBanned = null;
      }

      const ip = clientIpRef.current || (await fetchClientIp());
      clientIpRef.current = ip;

      if (nextUser && !nextUser.isGuest) {
        const creator = isUserCreator(nextUser);
        if (!creator) {
          const banResult = await checkIfBanned(ip.ipKey, nextUser.uid);
          if (banResult.banned) {
            setBanStatus(banResult);
            return;
          }
        } else {
          setBanStatus({ banned: false });
          unsubBanned = subscribeBannedLists(setBannedIps, setBannedUids);
        }

        // Record player IP privately for creator moderation
        saveUserPrivateIp(nextUser.uid, ip.ipKey, ip.ipRaw).catch(() => {});

        if (!creator) {
          setIsCreatorPanelOpen(false);
          setGodMode(false);
          setSpeedMultiplier(1);
        }

        try {
          const [existingSelf, existingSelfLeveled, cloud] = await Promise.all([
            fetchSelfLeaderboardEntry(nextUser.uid),
            fetchSelfLeveledLeaderboardEntry(nextUser.uid),
            fetchCloudUserProgress(nextUser.uid),
          ]);

          let prevLocalOwner = '';
          try {
            prevLocalOwner = localStorage.getItem(PROFILE_OWNER_UID_KEY) || '';
          } catch {
            prevLocalOwner = '';
          }
          const isSwitchingRegisteredAccount =
            prevLocalOwner !== '' && prevLocalOwner !== nextUser.uid;
          const isNewDeviceForAccount = prevLocalOwner !== nextUser.uid;

          if (existingSelf) {
            setCustomDisplayName(existingSelf.displayName);
            customDisplayNameRef.current = existingSelf.displayName;
            setSelfLeaderboardMeta({
              displayName: existingSelf.displayName,
              hasCustomName: Boolean(existingSelf.hasCustomName),
              lastNameChangeMs: existingSelf.lastNameChangeMs,
            });
          }

          // Merge high scores across local (unless switching accounts), cloud progress, and leaderboard entry
          const baseScores = isSwitchingRegisteredAccount
            ? { easy: 0, classic: 0, turbo: 0 }
            : highScoresRef.current;
          const mergedScores: HighScoreMap = {
            easy: Math.max(baseScores.easy, cloud?.bestEasy ?? 0),
            classic: Math.max(baseScores.classic, cloud?.bestClassic ?? 0),
            turbo: Math.max(baseScores.turbo, cloud?.bestTurbo ?? 0),
          };
          if (existingSelf && existingSelf.bestScore > mergedScores[existingSelf.difficulty]) {
            mergedScores[existingSelf.difficulty] = existingSelf.bestScore;
          }
          highScoresRef.current = mergedScores;
          setHighScores(mergedScores);
          saveHighScores(mergedScores);

          // Merge Seviyeli level progression
          const baseUnlockedLvl = isSwitchingRegisteredAccount ? 1 : unlockedLevelRef.current;
          const baseCompletedLvls = isSwitchingRegisteredAccount ? 0 : completedLevelsRef.current;
          const baseBestLvlScore = isSwitchingRegisteredAccount ? 0 : bestLevelScoreRef.current;

          const nextUnlockedLvl = Math.max(
            baseUnlockedLvl,
            cloud?.unlockedLevel ?? 1,
            existingSelfLeveled?.maxLevel ?? 1
          );
          const nextCompletedLvls = Math.max(
            baseCompletedLvls,
            cloud?.completedLevels ?? 0,
            existingSelfLeveled?.completedLevels ?? 0
          );
          const nextBestLvlScore = Math.max(
            baseBestLvlScore,
            cloud?.bestLevelScore ?? 0,
            existingSelfLeveled?.bestLevelScore ?? 0
          );
          unlockedLevelRef.current = nextUnlockedLvl;
          selectedLevelRef.current = nextUnlockedLvl;
          completedLevelsRef.current = nextCompletedLvls;
          bestLevelScoreRef.current = nextBestLvlScore;
          setUnlockedLevel(nextUnlockedLvl);
          setSelectedLevel(nextUnlockedLvl);
          setCompletedLevels(nextCompletedLvls);
          setBestLevelScore(nextBestLvlScore);

          if (cloud) {
            const localUpdated = profileUpdatedAtMsRef.current;
            const localIsEmpty =
              localUpdated === 0 &&
              peanutBankRef.current === 0 &&
              unlockedIdsRef.current.length <= DEFAULT_UNLOCKED_IDS.length;
            const cloudIsNewer =
              cloud.updatedAtMs !== undefined && cloud.updatedAtMs > localUpdated + 1500;

            if (isNewDeviceForAccount || localIsEmpty || cloudIsNewer) {
              const localUnlockedForMerge = isSwitchingRegisteredAccount
                ? []
                : unlockedIdsRef.current;
              const localNameColorsForMerge = isSwitchingRegisteredAccount
                ? []
                : unlockedNameColorsRef.current;

              const mergedUnlocked = Array.from(
                new Set([...DEFAULT_UNLOCKED_IDS, ...localUnlockedForMerge, ...cloud.unlockedIds])
              ).sort();
              const mergedNameColors = Array.from(
                new Set([
                  ...DEFAULT_NAME_COLORS,
                  ...localNameColorsForMerge,
                  ...(cloud.unlockedNameColors || []),
                ])
              ).sort();

              const nextBank = isSwitchingRegisteredAccount
                ? cloud.peanutBank
                : Math.max(peanutBankRef.current, cloud.peanutBank);
              const nextUpgrades: UpgradesState = isSwitchingRegisteredAccount
                ? cloud.upgrades
                : {
                    magnetLevel: Math.max(
                      upgradesRef.current.magnetLevel,
                      cloud.upgrades.magnetLevel
                    ),
                    doublePeanutLevel: Math.max(
                      upgradesRef.current.doublePeanutLevel,
                      cloud.upgrades.doublePeanutLevel
                    ),
                    shieldCount: Math.max(
                      upgradesRef.current.shieldCount,
                      cloud.upgrades.shieldCount
                    ),
                  };
              const nextCrates: CrateInventoryState = cloud.crateInventory
                ? isSwitchingRegisteredAccount
                  ? cloud.crateInventory
                  : {
                      standard: Math.max(
                        crateInventoryRef.current.standard,
                        cloud.crateInventory.standard
                      ),
                      epic: Math.max(crateInventoryRef.current.epic, cloud.crateInventory.epic),
                      mythic: Math.max(
                        crateInventoryRef.current.mythic,
                        cloud.crateInventory.mythic
                      ),
                      outfit: Math.max(
                        crateInventoryRef.current.outfit || 0,
                        cloud.crateInventory.outfit || 0
                      ),
                      leveled_outfit: Math.max(
                        crateInventoryRef.current.leveled_outfit || 0,
                        cloud.crateInventory.leveled_outfit || 0
                      ),
                    }
                : isSwitchingRegisteredAccount
                  ? { ...DEFAULT_CRATE_INVENTORY }
                  : crateInventoryRef.current;

              const safeClassicEquipped: EquippedCosmetics = COSMETIC_BY_ID[cloud.equipped.suit]?.leveledOnly
                ? { ...cloud.equipped, suit: 'suit_none' }
                : cloud.equipped;
              const nextLeveledBodyType = cloud.leveledBodyType || cloud.bodyType;
              const nextLeveledEquipped = cloud.leveledEquipped || { ...safeClassicEquipped, suit: 'suit_none' };
              const nextLeveledNameColor =
                cloud.leveledEquippedNameColor || cloud.equippedNameColor || 'name_default';
              const localAchForMerge = isSwitchingRegisteredAccount
                ? []
                : unlockedAchievementsRef.current;
              const mergedAchievements = Array.from(
                new Set([...localAchForMerge, ...(cloud.unlockedAchievements || [])])
              )
                .slice(0, 60)
                .sort();
              const nextCleanFlight = isSwitchingRegisteredAccount
                ? cloud.bestLeveledCleanFlightSec || 0
                : Math.max(bestLeveledCleanFlightSecRef.current, cloud.bestLeveledCleanFlightSec || 0);

              profileUpdatedAtMsRef.current = cloud.updatedAtMs ?? Date.now();
              peanutBankRef.current = nextBank;
              unlockedIdsRef.current = mergedUnlocked;
              unlockedNameColorsRef.current = mergedNameColors;
              unlockedAchievementsRef.current = mergedAchievements;
              bestLeveledCleanFlightSecRef.current = nextCleanFlight;
              upgradesRef.current = nextUpgrades;
              crateInventoryRef.current = nextCrates;
              bodyTypeRef.current = cloud.bodyType;
              equippedRef.current = safeClassicEquipped;
              leveledBodyTypeRef.current = nextLeveledBodyType;
              leveledEquippedRef.current = nextLeveledEquipped;
              leveledNameColorRef.current = nextLeveledNameColor;

              setPeanutBank(nextBank);
              setBodyType(cloud.bodyType);
              setLeveledBodyType(nextLeveledBodyType);
              if (cloud.preferredGameMode) {
                gameModeRef.current = cloud.preferredGameMode;
                setGameMode(cloud.preferredGameMode);
              }
              if (cloud.preferredDifficulty) {
                difficultyRef.current = cloud.preferredDifficulty;
                setDifficulty(cloud.preferredDifficulty);
              }
              setEquipped(safeClassicEquipped);
              setLeveledEquipped(nextLeveledEquipped);
              setUnlockedIds(mergedUnlocked);
              setUnlockedNameColors(mergedNameColors);
              setUnlockedAchievements(mergedAchievements);
              setBestLeveledCleanFlightSec(nextCleanFlight);
              if (cloud.equippedNameColor) {
                equippedNameColorRef.current = cloud.equippedNameColor;
                setEquippedNameColor(cloud.equippedNameColor);
              }
              setLeveledNameColor(nextLeveledNameColor);
              setUpgrades(nextUpgrades);
              setCrateInventory(nextCrates);
            } else {
              // Same device where local session is newer: keep equipped/bodyType, union unlocks & max counters
              setPeanutBank((prev) => Math.max(prev, cloud.peanutBank));
              setUnlockedIds((prev) =>
                Array.from(new Set([...DEFAULT_UNLOCKED_IDS, ...prev, ...cloud.unlockedIds])).sort()
              );
              setUnlockedNameColors((prev) =>
                Array.from(
                  new Set([
                    ...DEFAULT_NAME_COLORS,
                    ...prev,
                    ...(cloud.unlockedNameColors || []),
                  ])
                ).sort()
              );
              if (cloud.unlockedAchievements && cloud.unlockedAchievements.length > 0) {
                setUnlockedAchievements((prev) =>
                  Array.from(new Set([...prev, ...cloud.unlockedAchievements!]))
                    .slice(0, 60)
                    .sort()
                );
              }
              if (typeof cloud.bestLeveledCleanFlightSec === 'number') {
                setBestLeveledCleanFlightSec((prev) =>
                  Math.max(prev, cloud.bestLeveledCleanFlightSec || 0)
                );
              }
              setUpgrades((prev) => ({
                magnetLevel: Math.max(prev.magnetLevel, cloud.upgrades.magnetLevel),
                doublePeanutLevel: Math.max(
                  prev.doublePeanutLevel,
                  cloud.upgrades.doublePeanutLevel
                ),
                shieldCount: Math.max(prev.shieldCount, cloud.upgrades.shieldCount),
              }));
              if (cloud.crateInventory) {
                setCrateInventory((prev) => ({
                  standard: Math.max(prev.standard, cloud.crateInventory!.standard),
                  epic: Math.max(prev.epic, cloud.crateInventory!.epic),
                  mythic: Math.max(prev.mythic, cloud.crateInventory!.mythic),
                  outfit: Math.max(prev.outfit || 0, cloud.crateInventory!.outfit || 0),
                  leveled_outfit: Math.max(
                    prev.leveled_outfit || 0,
                    cloud.crateInventory!.leveled_outfit || 0
                  ),
                }));
              }
            }

            const todayKey = getTodayDateKey();
            if (cloud.dailyQuestsDate === todayKey) {
              setDailyQuestsState((prev) => {
                const base =
                  !isSwitchingRegisteredAccount && prev.dateKey === todayKey
                    ? prev
                    : createEmptyDailyQuestsState(todayKey);
                const mergedProgress: Record<string, number> = { ...base.progress };
                if (cloud.dailyQuestsProgress) {
                  Object.entries(cloud.dailyQuestsProgress).forEach(([k, v]) => {
                    mergedProgress[k] = Math.max(mergedProgress[k] || 0, v);
                  });
                }
                const mergedClaimed = Array.from(
                  new Set([...base.claimedIds, ...(cloud.dailyQuestsClaimed || [])])
                ).slice(0, 3);
                return {
                  dateKey: todayKey,
                  progress: mergedProgress,
                  claimedIds: mergedClaimed,
                };
              });
            } else if (isSwitchingRegisteredAccount) {
              setDailyQuestsState(createEmptyDailyQuestsState(todayKey));
            }

            if (Array.isArray(cloud.savedCharacters)) {
              setSavedCharacters((prev) => {
                if (isSwitchingRegisteredAccount) {
                  return cloud.savedCharacters!.slice(0, 12);
                }
                const byId = new Map<string, SavedCharacterPreset>();
                for (const cp of cloud.savedCharacters!) {
                  byId.set(cp.id, cp);
                }
                for (const p of prev) {
                  if (!byId.has(p.id)) byId.set(p.id, p);
                }
                return Array.from(byId.values()).slice(0, 12);
              });
            }
          } else if (isSwitchingRegisteredAccount) {
            const clean = createDefaultProfile();
            profileUpdatedAtMsRef.current = 0;
            peanutBankRef.current = clean.peanutBank;
            unlockedIdsRef.current = clean.unlockedIds;
            unlockedNameColorsRef.current = clean.unlockedNameColors;
            equippedNameColorRef.current = clean.equippedNameColor;
            leveledBodyTypeRef.current = clean.leveledBodyType;
            leveledEquippedRef.current = clean.leveledEquipped;
            leveledNameColorRef.current = clean.leveledEquippedNameColor;
            unlockedAchievementsRef.current = clean.unlockedAchievements;
            bestLeveledCleanFlightSecRef.current = clean.bestLeveledCleanFlightSec;
            upgradesRef.current = clean.upgrades;
            crateInventoryRef.current = clean.crateInventory;
            bodyTypeRef.current = clean.bodyType;
            equippedRef.current = clean.equipped;
            gameModeRef.current = clean.gameMode;
            unlockedLevelRef.current = clean.unlockedLevel;
            selectedLevelRef.current = clean.unlockedLevel;
            completedLevelsRef.current = clean.completedLevels;
            bestLevelScoreRef.current = clean.bestLevelScore;
            setGameMode(clean.gameMode);
            setDifficulty(clean.difficulty);
            setBodyType(clean.bodyType);
            setLeveledBodyType(clean.leveledBodyType);
            setUnlockedLevel(clean.unlockedLevel);
            setSelectedLevel(clean.unlockedLevel);
            setCompletedLevels(clean.completedLevels);
            setBestLevelScore(clean.bestLevelScore);
            setPeanutBank(clean.peanutBank);
            setUnlockedIds(clean.unlockedIds);
            setEquipped(clean.equipped);
            setLeveledEquipped(clean.leveledEquipped);
            setUnlockedNameColors(clean.unlockedNameColors);
            setEquippedNameColor(clean.equippedNameColor);
            setLeveledNameColor(clean.leveledEquippedNameColor);
            setUnlockedAchievements(clean.unlockedAchievements);
            setBestLeveledCleanFlightSec(clean.bestLeveledCleanFlightSec);
            setUpgrades(clean.upgrades);
            setCrateInventory(clean.crateInventory);
            setSavedCharacters([]);
            setDailyQuestsState(createEmptyDailyQuestsState(getTodayDateKey()));
          }

          try {
            localStorage.setItem(PROFILE_OWNER_UID_KEY, nextUser.uid);
          } catch {
            // Ignore storage errors
          }

          // Only auto-grant creator starter pack on fresh/nearly-empty inventory so custom choices & sells persist across F5
          const currentUnlockedLen = Math.max(
            unlockedIdsRef.current.length,
            cloud?.unlockedIds.length ?? 0
          );
          if (
            creator &&
            currentUnlockedLen <= DEFAULT_UNLOCKED_IDS.length + 2 &&
            peanutBankRef.current < 100 &&
            (cloud?.peanutBank ?? 0) < 100
          ) {
            grantCreatorEverything();
          } else if (
            creator &&
            Math.max(
              unlockedNameColorsRef.current.length,
              cloud?.unlockedNameColors?.length ?? 0
            ) <= 1
          ) {
            const allNameColorIds = NAME_COLOR_CATALOG.map((n) => n.id);
            unlockedNameColorsRef.current = allNameColorIds;
            setUnlockedNameColors(allNameColorIds);
          }

          cloudHydratedUidRef.current = nextUser.uid;
          setCloudHydratedUid(nextUser.uid);

          const bestLocal = Math.max(mergedScores.easy, mergedScores.classic, mergedScores.turbo);
          const syncRes = await submitLeaderboardScore({
            user: nextUser,
            score: bestLocal,
            difficulty: difficultyRef.current,
            bodyType: bodyTypeRef.current,
            equipped: equippedRef.current,
            nameColorId: equippedNameColorRef.current,
            forceWrite: creator,
          });
          setCustomDisplayName(syncRes.displayName);
          customDisplayNameRef.current = syncRes.displayName;
          setSelfLeaderboardMeta({
            displayName: syncRes.displayName,
            hasCustomName: syncRes.hasCustomName,
            lastNameChangeMs: syncRes.lastNameChangeMs,
          });

          if (nextUnlockedLvl > 1 || nextCompletedLvls > 0) {
            submitLeveledLeaderboardScore({
              user: nextUser,
              maxLevel: nextUnlockedLvl,
              bestLevelScore: nextBestLvlScore,
              completedLevels: nextCompletedLvls,
              difficulty:
                nextUnlockedLvl > 10 && leveledDifficultyRef.current === 'turbo'
                  ? 'turbo'
                  : 'classic',
              bodyType: 'normal',
              equipped: leveledEquippedRef.current,
              nameColorId: leveledNameColorRef.current,
              customDisplayName: syncRes.displayName,
              forceWrite: creator,
            }).catch(() => {});
          }

          if (creator) {
            cleanupDuplicateCreatorLeaderboardEntries(nextUser)
              .then(({ highestMergedScore }) => {
                if (highestMergedScore > bestLocal) {
                  const boosted = {
                    ...highScoresRef.current,
                    [difficultyRef.current]: Math.max(
                      highScoresRef.current[difficultyRef.current],
                      highestMergedScore
                    ),
                  };
                  highScoresRef.current = boosted;
                  setHighScores(boosted);
                  saveHighScores(boosted);
                }
              })
              .catch(() => {});
          }
        } catch {
          // Do NOT set cloudHydratedUid on network/fetch failure so cloud data is never overwritten by defaults
        }
      } else if (nextUser && nextUser.isGuest) {
        cloudHydratedUidRef.current = null;
        setCloudHydratedUid(null);
        setCustomDisplayName(nextUser.displayName);
        customDisplayNameRef.current = nextUser.displayName;
        setSelfLeaderboardMeta(null);
        setIsCreatorPanelOpen(false);
        setGodMode(false);
        setSpeedMultiplier(1);
        setBannedIps([]);
        setBannedUids([]);
        const banResult = await checkIfBanned(ip.ipKey, nextUser.uid);
        setBanStatus(banResult);
      } else {
        cloudHydratedUidRef.current = null;
        setCloudHydratedUid(null);
        setCustomDisplayName('');
        customDisplayNameRef.current = '';
        setSelfLeaderboardMeta(null);
        setIsCreatorPanelOpen(false);
        setGodMode(false);
        setSpeedMultiplier(1);
        setBannedIps([]);
        setBannedUids([]);
        const banResult = await checkIfBanned(ip.ipKey);
        setBanStatus(banResult);
      }
    });
    return () => {
      unsub();
      if (unsubBanned) unsubBanned();
    };
  }, [grantCreatorEverything]);

  // Subscribe to real-time Klasik & Seviyeli Leaderboards
  useEffect(() => {
    const unsubClassic = subscribeLeaderboard(
      (entries) => {
        setLeaderboardEntries(entries);
        setLeaderboardLoading(false);
        setLeaderboardError(null);
        const currentUid = userRef.current?.uid;
        if (currentUid) {
          const selfEntry = entries.find((e) => e.uid === currentUid);
          if (selfEntry) {
            setCustomDisplayName(selfEntry.displayName);
            customDisplayNameRef.current = selfEntry.displayName;
            setSelfLeaderboardMeta({
              displayName: selfEntry.displayName,
              hasCustomName: Boolean(selfEntry.hasCustomName),
              lastNameChangeMs: selfEntry.lastNameChangeMs,
            });
          }
        }
      },
      (err) => {
        setLeaderboardLoading(false);
        setLeaderboardError(err.message);
      }
    );

    const unsubLeveled = subscribeLeveledLeaderboard(
      (entries) => {
        setLeveledEntries(entries);
        setLeveledLoading(false);
        setLeveledError(null);
      },
      (err) => {
        setLeveledLoading(false);
        setLeveledError(err.message);
      }
    );

    return () => {
      unsubClassic();
      unsubLeveled();
    };
  }, []);

  const showBanner = useCallback((msg: string, duration = 2800) => {
    setDropBanner(msg);
    if (dropBannerTimerRef.current) window.clearTimeout(dropBannerTimerRef.current);
    dropBannerTimerRef.current = window.setTimeout(() => setDropBanner(null), duration);
  }, []);

  const advanceDailyQuests = useCallback(
    (event: 'pipe' | 'peanut' | 'crate' | 'run_end') => {
      const todayKey = getTodayDateKey();
      const todaysQuests = getDailyQuestsForDate(todayKey);
      const currentScore = scoreRef.current;
      const activeBody = activeBodyTypeRef.current;
      const activeDiff = activeDifficultyRef.current;
      const pipesThisRun = runPipesPassedRef.current;
      const peanutsThisRun = runPeanutPickupsRef.current;

      setDailyQuestsState((prev) => {
        const base = prev.dateKey === todayKey ? prev : createEmptyDailyQuestsState(todayKey);
        const nextProgress: Record<string, number> = { ...base.progress };
        let changed = base.dateKey !== prev.dateKey;
        let newlyCompletedQuest: DailyQuestDefinition | null = null;

        for (const q of todaysQuests) {
          const oldVal = nextProgress[q.id] || 0;
          let nextVal = oldVal;

          if (event === 'pipe') {
            if (q.metric === 'pipes_total') nextVal = oldVal + 1;
            if (q.metric === 'pipes_single') nextVal = Math.max(oldVal, pipesThisRun);
          } else if (event === 'peanut') {
            if (q.metric === 'peanuts_total') nextVal = oldVal + 1;
            if (q.metric === 'peanuts_single') nextVal = Math.max(oldVal, peanutsThisRun);
          } else if (event === 'crate') {
            if (q.metric === 'crates_total') nextVal = oldVal + 1;
          } else if (event === 'run_end') {
            if (q.metric === 'runs_total') nextVal = oldVal + 1;
          }

          if (q.metric === 'body_score' && q.requiredBodyType === activeBody) {
            nextVal = Math.max(oldVal, currentScore);
          }
          if (q.metric === 'diff_score' && q.requiredDifficulty === activeDiff) {
            nextVal = Math.max(oldVal, currentScore);
          }

          nextVal = Math.min(q.target, nextVal);
          if (nextVal !== oldVal) {
            nextProgress[q.id] = nextVal;
            changed = true;
            if (oldVal < q.target && nextVal >= q.target) {
              newlyCompletedQuest = q;
            }
          }
        }

        if (newlyCompletedQuest) {
          showBanner(
            `Görev Tamamlandı: ${newlyCompletedQuest.title} (+${newlyCompletedQuest.rewardPeanuts}F)`,
            3000
          );
        }

        return changed ? { ...base, progress: nextProgress } : prev;
      });
    },
    [showBanner]
  );

  const handleClaimQuestReward = useCallback(
    (quest: DailyQuestDefinition) => {
      const todayKey = getTodayDateKey();
      setDailyQuestsState((prev) => {
        const base = prev.dateKey === todayKey ? prev : createEmptyDailyQuestsState(todayKey);
        const val = base.progress[quest.id] || 0;
        if (val < quest.target || base.claimedIds.includes(quest.id)) return prev;
        setPeanutBank((p) => p + quest.rewardPeanuts);
        soundEngine.playCrateUnlock();
        return {
          ...base,
          claimedIds: [...base.claimedIds, quest.id],
        };
      });
    },
    []
  );

  const handleClaimAllQuestRewards = useCallback(() => {
    const todayKey = getTodayDateKey();
    const todaysQuests = getDailyQuestsForDate(todayKey);
    setDailyQuestsState((prev) => {
      const base = prev.dateKey === todayKey ? prev : createEmptyDailyQuestsState(todayKey);
      let totalReward = 0;
      const nextClaimed = [...base.claimedIds];
      for (const q of todaysQuests) {
        if ((base.progress[q.id] || 0) >= q.target && !nextClaimed.includes(q.id)) {
          totalReward += q.rewardPeanuts;
          nextClaimed.push(q.id);
        }
      }
      if (totalReward <= 0) return prev;
      setPeanutBank((p) => p + totalReward);
      soundEngine.playCrateUnlock();
      return {
        ...base,
        claimedIds: nextClaimed,
      };
    });
  }, []);

  const spawnTrailParticles = useCallback((x: number, y: number, count: number, isFlap: boolean) => {
    const mobile = isMobileModeRef.current;
    if (mobile && particlesRef.current.length >= 24) return;
    const emitCount = mobile ? Math.max(1, Math.ceil(count * 0.5)) : count;
    const trailItem = COSMETIC_BY_ID[activeEquippedRef.current.trail] || COSMETIC_BY_ID['trail_none'];
    const rainbowPalette = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#38BDF8', '#A855F7'];

    for (let i = 0; i < emitCount; i++) {
      let color = trailItem.previewColor;
      let type: Particle['type'] = 'puff';

      if (trailItem.shape === 'rainbow' || trailItem.shape === 'confetti') {
        color = rainbowPalette[Math.floor(Math.random() * rainbowPalette.length)];
        type = 'spark';
      } else if (trailItem.shape === 'aurora') {
        color = i % 2 === 0 ? '#2DD4BF' : '#A855F7';
        type = 'puff';
      } else if (trailItem.shape === 'royal') {
        color = i % 2 === 0 ? '#9333EA' : '#FACC15';
        type = 'spark';
      } else if (trailItem.shape === 'ring') {
        type = 'ring';
      } else if (trailItem.shape === 'spark') {
        type = 'spark';
      }

      particlesRef.current.push({
        x: x - 16 + (Math.random() - 0.5) * 10,
        y: y + 4 + (Math.random() - 0.5) * 12,
        vx: (isFlap ? -75 : -45) - Math.random() * 65,
        vy: (isFlap ? 28 : 0) + (Math.random() - 0.5) * 70,
        size: isFlap ? 4 + Math.random() * 4 : 3 + Math.random() * 2.5,
        life: 0.36 + Math.random() * 0.2,
        maxLife: 0.56,
        color,
        type,
      });
    }
  }, []);

  const spawnCrashParticles = useCallback((x: number, y: number, isShieldBreak = false) => {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const speed = 90 + Math.random() * 170;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 4.5,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color: isShieldBreak
          ? i % 2 === 0
            ? '#38BDF8'
            : '#E0F2FE'
          : i % 3 === 0
            ? '#FBBF24'
            : i % 2 === 0
              ? '#F87171'
              : '#FFFFFF',
        type: 'spark',
      });
    }
  }, []);

  const spawnPeanutParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 70 + Math.random() * 90;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        life: 0.4 + Math.random() * 0.15,
        maxLife: 0.55,
        color: i % 2 === 0 ? '#FDE047' : '#F59E0B',
        type: 'spark',
      });
    }
  }, []);

  const spawnCrateParticles = useCallback((x: number, y: number) => {
    const colors = ['#A855F7', '#FACC15', '#38BDF8', '#F472B6'];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 80 + Math.random() * 130;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 3.5,
        life: 0.55 + Math.random() * 0.2,
        maxLife: 0.75,
        color: colors[i % colors.length],
        type: 'spark',
      });
    }
  }, []);

  const spawnLevelCompleteFireworks = useCallback((cx: number, cy: number) => {
    const colors = ['#34D399', '#FACC15', '#38BDF8', '#F472B6', '#A855F7', '#FFFFFF'];
    const origins = [
      { x: cx, y: cy },
      { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.3 },
      { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.25 },
    ];
    origins.forEach((orig, oIdx) => {
      const count = oIdx === 0 ? 20 : 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = 95 + Math.random() * 185;
        particlesRef.current.push({
          x: orig.x,
          y: orig.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 35,
          size: 4 + Math.random() * 4,
          life: 0.75 + Math.random() * 0.35,
          maxLife: 1.1,
          color: colors[(i + oIdx) % colors.length],
          type: i % 3 === 0 ? 'ring' : 'spark',
        });
      }
    });
    floatingTextsRef.current.push({
      x: cx,
      y: Math.max(70, cy - 34),
      text: 'BÖLÜM TAMAM!',
      color: '#34D399',
      life: 1.4,
      maxLife: 1.4,
    });
  }, []);

  const checkAndUnlockLeveledAchievements = useCallback(() => {
    if (gameModeRef.current !== 'leveled') return;
    const currentSet = new Set(unlockedAchievementsRef.current);
    const newlyEarned: AchievementDefinition[] = [];

    for (const ach of LEVELED_ACHIEVEMENTS) {
      if (currentSet.has(ach.id)) continue;
      let satisfied = false;
      if (ach.category === 'score') {
        satisfied = scoreRef.current >= ach.target;
      } else if (ach.category === 'flight') {
        satisfied = leveledCleanFlightSecRef.current >= ach.target;
      } else if (ach.category === 'level') {
        satisfied = completedLevelsRef.current >= ach.target;
      }
      if (satisfied) {
        currentSet.add(ach.id);
        newlyEarned.push(ach);
      }
    }

    if (newlyEarned.length === 0) return;

    const nextIds = Array.from(currentSet).slice(0, 60).sort();
    unlockedAchievementsRef.current = nextIds;
    setUnlockedAchievements(nextIds);
    setNewlyUnlockedAchievements((prev) => [...prev, ...newlyEarned]);

    let bonusPeanuts = 0;
    const crateAdditions: Partial<CrateInventoryState> = {};
    for (const ach of newlyEarned) {
      bonusPeanuts += ach.rewardPeanuts;
      if (ach.rewardCrateTier) {
        crateAdditions[ach.rewardCrateTier] = (crateAdditions[ach.rewardCrateTier] || 0) + 1;
      }
    }
    if (bonusPeanuts > 0) {
      setPeanutBank((prev) => prev + bonusPeanuts);
    }
    if (Object.keys(crateAdditions).length > 0) {
      setCrateInventory((prev) => {
        const next = { ...prev };
        (Object.entries(crateAdditions) as [CrateTier, number][]).forEach(([tier, qty]) => {
          next[tier] = Math.min(9999, (next[tier] || 0) + qty);
        });
        return next;
      });
    }

    const latest = newlyEarned[newlyEarned.length - 1];
    soundEngine.playAchievementUnlock();
    showBanner(
      `Madalya Kazanıldı: ${latest.title} (+${bonusPeanuts}F${latest.rewardCrateTier ? ' + Kasa' : ''})!`,
      3400
    );
  }, [showBanner]);

  const unlockAndEquipCrateDrop = useCallback(
    (cx: number, cy: number) => {
      const unlockedSet = new Set(unlockedIdsRef.current);
      const tuxedoItem = COSMETIC_BY_ID['suit_tuxedo'];
      const hitTuxedo = Boolean(
        tuxedoItem && !unlockedSet.has(tuxedoItem.id) && Math.random() < 1 / 100000
      );
      const lockedNormalItems = COSMETIC_CATALOG.filter(
        (item) => !item.dropOnly && !unlockedSet.has(item.id)
      );

      spawnCrateParticles(cx, cy);

      const dropped = hitTuxedo
        ? tuxedoItem
        : lockedNormalItems.length > 0
          ? lockedNormalItems[Math.floor(Math.random() * lockedNormalItems.length)]
          : null;

      const crateScoreBonus = activeDifficultyRef.current === 'turbo' ? 8 : 5;
      if (dropped) {
        const nextUnlocked = [...unlockedIdsRef.current, dropped.id];
        unlockedIdsRef.current = nextUnlocked;
        setUnlockedIds(nextUnlocked);

        setActiveEquipped((prev) => ({
          ...prev,
          [dropped.category]: dropped.id,
        }));

        scoreRef.current += crateScoreBonus;
        setScore(scoreRef.current);
        if (dropped.id === 'suit_tuxedo') {
          if (gameStateRef.current === 'PLAYING') {
            gameStateRef.current = 'PAUSED';
            setGameState('PAUSED');
          }
          setRareExplosionIsTest(false);
          setRareExplosionItem(dropped);
        } else {
          soundEngine.playCrateUnlock();
        }
        setRunDrops((prev) => [...prev, dropped]);
        showBanner(
          dropped.id === 'suit_tuxedo'
            ? "İNANILMAZ ŞANS (100.000'de 1): Kraliyet Smokin Çıktı!"
            : `Kutudan Çıktı: ${dropped.name}! (+${crateScoreBonus} Skor)`,
          dropped.id === 'suit_tuxedo' ? 5000 : 3200
        );

        floatingTextsRef.current.push({
          x: cx,
          y: cy - 16,
          text: dropped.id === 'suit_tuxedo' ? 'SMOKİN!' : `${dropped.name}!`,
          color: dropped.id === 'suit_tuxedo' ? '#FB7185' : '#E879F9',
          life: 1.05,
          maxLife: 1.05,
        });
      } else {
        scoreRef.current += crateScoreBonus;
        setScore(scoreRef.current);
        setPeanutBank((prev) => prev + 5);
        setPeanutsCollected((prev) => prev + 5);
        showBanner(`Tüm kozmetikler açık · +5 Fıstık & +${crateScoreBonus} Skor!`);

        floatingTextsRef.current.push({
          x: cx,
          y: cy - 16,
          text: '+5 Fıstık!',
          color: '#FDE047',
          life: 0.9,
          maxLife: 0.9,
        });
      }
    },
    [showBanner, spawnCrateParticles]
  );

  const resetWorld = useCallback(() => {
    elephantRef.current = createInitialElephant();
    pipesRef.current = [];
    peanutsRef.current = [];
    cratesRef.current = [];
    finishGateRef.current = null;
    bossRef.current = null;
    bossProjectilesRef.current = [];
    playerBoltsRef.current = [];
    autoFireTimerRef.current = 0.42;
    lastFlapShotMsRef.current = 0;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    spawnTimerRef.current = 1.1;
    pipeSpawnCountRef.current = 0;
    runPipesPassedRef.current = 0;
    runPeanutPickupsRef.current = 0;
    leveledCleanFlightSecRef.current = 0;
    leveledCleanFlightWholeSecRef.current = 0;
    flashAlphaRef.current = 0;
    scoreRef.current = 0;
    const isLeveled = gameModeRef.current === 'leveled';
    const chapterInfo = getChapterInfo(selectedLevelRef.current);
    const shieldAllowed = !isLeveled || chapterInfo.shieldUnlocked;
    const shieldReady = shieldAllowed && upgradesRef.current.shieldCount > 0;
    hasActiveShieldRef.current = shieldReady;
    setHasActiveShield(shieldReady);
    setScore(0);
    setLevelPipesCleared(0);
    setBossHud(null);
    setLevelRewardSummary(null);
    setNewlyUnlockedAchievements([]);
    setPeanutsCollected(0);
    setRunDrops([]);
    setDropBanner(null);
    setIsNewRecord(false);
  }, []);

  const flap = useCallback(() => {
    const cfg = DIFFICULTY_CONFIGS[activeDifficultyRef.current];
    const bodyCfg = BODY_TYPE_CONFIGS[activeBodyTypeRef.current];
    const el = elephantRef.current;
    el.vy = cfg.flapVelocity * bodyCfg.flapMult;
    el.earFlapTimer = 0.28;
    spawnTrailParticles(el.x, el.y, 6, true);
    soundEngine.playFlap();

    // Shoot a golden peanut bolt when battling a Boss or Mini-Boss!
    const activeBoss = bossRef.current;
    if (activeBoss && activeBoss.active && !activeBoss.defeated) {
      const nowMs = performance.now();
      if (nowMs - lastFlapShotMsRef.current >= 165) {
        lastFlapShotMsRef.current = nowMs;
        playerBoltsRef.current.push({
          id: nextEntityIdRef.current++,
          x: el.x + 28,
          y: el.y - 4,
          vx: 660,
          vy: 0,
          radius: 7,
          damage: 1,
        });
        soundEngine.playLaserBolt();
      }
    }
  }, [spawnTrailParticles]);

  const startGame = useCallback(
    (overrideLevel?: number) => {
      if (typeof overrideLevel === 'number' && !Number.isNaN(overrideLevel)) {
        const clamped = Math.max(1, Math.min(unlockedLevelRef.current, Math.floor(overrideLevel)));
        selectedLevelRef.current = clamped;
        setSelectedLevel(clamped);
      }
      setIsShopOpen(false);
      setIsSellOpen(false);
      setIsLeaderboardOpen(false);
      setIsAchievementsOpen(false);
      resetWorld();
      runStartMsRef.current = performance.now();
      gameStateRef.current = 'PLAYING';
      setGameState('PLAYING');
      flap();
    },
    [flap, resetWorld]
  );

  const triggerLevelComplete = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    const el = elephantRef.current;
    const activeLevel = selectedLevelRef.current;
    const lvlCfg = getLevelConfig(activeLevel);
    const diff = activeDifficultyRef.current;
    const isFirstClear = activeLevel >= unlockedLevelRef.current;

    const baseReward = isFirstClear ? lvlCfg.rewardPeanuts : lvlCfg.replayPeanuts;
    const earnedPeanuts = diff === 'turbo' ? Math.round(baseReward * 1.5) : baseReward;
    const grantedCrate = isFirstClear ? lvlCfg.rewardCrateTier : null;

    spawnCrateParticles(el.x, el.y);
    spawnLevelCompleteFireworks(el.x, el.y);
    flashAlphaRef.current = 0.56;
    // Normal seviye atlayınca müzik çalmasın; sadece Bölüm tamamlandığında (her 5 seviyede) zafer müziği çalsın
    if (lvlCfg.isChapterEnd) {
      soundEngine.playLevelComplete(lvlCfg.bossKind === 'boss');
    } else {
      soundEngine.playScore();
    }

    setPeanutBank((prev) => prev + earnedPeanuts);
    setPeanutsCollected((prev) => prev + earnedPeanuts);

    if (grantedCrate) {
      setCrateInventory((prev) => ({
        ...prev,
        [grantedCrate]: Math.min(9999, (prev[grantedCrate] || 0) + 1),
      }));
    }

    const nextUnlocked = Math.max(unlockedLevelRef.current, activeLevel + 1);
    const nextCompleted = completedLevelsRef.current + 1;
    const nextBestLvlScore = Math.max(bestLevelScoreRef.current, scoreRef.current);

    unlockedLevelRef.current = nextUnlocked;
    completedLevelsRef.current = nextCompleted;
    bestLevelScoreRef.current = nextBestLvlScore;
    setUnlockedLevel(nextUnlocked);
    setCompletedLevels(nextCompleted);
    setBestLevelScore(nextBestLvlScore);

    setLevelRewardSummary({
      level: activeLevel,
      chapter: lvlCfg.chapter,
      stageInChapter: lvlCfg.stageInChapter,
      isChapterEnd: lvlCfg.isChapterEnd,
      chapterTitle: lvlCfg.chapterTitle,
      peanuts: earnedPeanuts,
      crateTier: grantedCrate,
      isFirstClear,
      difficultyLabel: lvlCfg.difficultyLabel,
      difficultyColor: lvlCfg.difficultyColor,
    });

    checkAndUnlockLeveledAchievements();

    if (userRef.current && !userRef.current.isGuest) {
      submitLeveledLeaderboardScore({
        user: userRef.current,
        maxLevel: nextUnlocked,
        bestLevelScore: nextBestLvlScore,
        completedLevels: nextCompleted,
        difficulty: diff,
        bodyType: 'normal',
        equipped: leveledEquippedRef.current,
        nameColorId: leveledNameColorRef.current,
      }).catch(() => {});
    }

    advanceDailyQuests('run_end');
    gameOverTimestampRef.current = performance.now();
    gameStateRef.current = 'LEVEL_COMPLETE';
    setGameState('LEVEL_COMPLETE');
  }, [
    advanceDailyQuests,
    checkAndUnlockLeveledAchievements,
    spawnCrateParticles,
    spawnLevelCompleteFireworks,
  ]);

  const triggerGameOver = useCallback(() => {
    if (gameStateRef.current === 'GAME_OVER' || gameStateRef.current === 'LEVEL_COMPLETE') return;

    const el = elephantRef.current;
    el.isHurt = true;
    flashAlphaRef.current = 0.72;
    spawnCrashParticles(el.x, el.y);
    soundEngine.playCrash();

    const currentScore = scoreRef.current;
    const diff = activeDifficultyRef.current;
    const runElapsedSec = Math.max(0.5, (performance.now() - runStartMsRef.current) / 1000);
    const maxPlausibleScore = Math.ceil(
      runElapsedSec * (diff === 'turbo' ? 11 : 5) + (diff === 'turbo' ? 35 : 20)
    );
    const isPlausible = isUserCreator(userRef.current) || currentScore <= maxPlausibleScore;

    if (gameModeRef.current === 'leveled') {
      checkAndUnlockLeveledAchievements();
      if (isPlausible && currentScore > bestLevelScoreRef.current) {
        bestLevelScoreRef.current = currentScore;
        setBestLevelScore(currentScore);
        setIsNewRecord(true);
      }
      if (isPlausible && userRef.current && !userRef.current.isGuest) {
        submitLeveledLeaderboardScore({
          user: userRef.current,
          maxLevel: unlockedLevelRef.current,
          bestLevelScore: Math.max(bestLevelScoreRef.current, currentScore),
          completedLevels: completedLevelsRef.current,
          difficulty: diff,
          bodyType: 'normal',
          equipped: leveledEquippedRef.current,
          nameColorId: leveledNameColorRef.current,
        }).catch(() => {});
      }
    } else {
      const prevBest = highScoresRef.current[diff];
      if (isPlausible && currentScore > prevBest) {
        const updated = { ...highScoresRef.current, [diff]: currentScore };
        highScoresRef.current = updated;
        setHighScores(updated);
        saveHighScores(updated);
        setIsNewRecord(true);
      }

      // Submit score to Klasik Firestore Leaderboard if logged into registered account
      if (isPlausible && userRef.current && !userRef.current.isGuest) {
        submitLeaderboardScore({
          user: userRef.current,
          score: currentScore,
          difficulty: diff,
          bodyType: bodyTypeRef.current,
          equipped: equippedRef.current,
          nameColorId: equippedNameColorRef.current,
        }).catch(() => {});
      }
    }

    if (runElapsedSec >= 1.2) {
      advanceDailyQuests('run_end');
    }

    gameOverTimestampRef.current = performance.now();
    gameStateRef.current = 'GAME_OVER';
    setGameState('GAME_OVER');
  }, [advanceDailyQuests, checkAndUnlockLeveledAchievements, spawnCrashParticles]);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'PLAYING') {
      gameStateRef.current = 'PAUSED';
      setGameState('PAUSED');
    } else if (gameStateRef.current === 'PAUSED') {
      gameStateRef.current = 'PLAYING';
      setGameState('PLAYING');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleCanvasAction = useCallback(() => {
    if (
      isShopOpen ||
      isSellOpen ||
      isDailyQuestsOpen ||
      isLeaderboardOpen ||
      isAvatarOpen ||
      isSavedCharsOpen ||
      isAchievementsOpen ||
      isCreatorPanelOpen ||
      isAuthModalOpen
    ) {
      return;
    }
    const state = gameStateRef.current;
    if (state === 'PLAYING') {
      flap();
    } else if (state === 'PAUSED') {
      togglePause();
    }
  }, [
    flap,
    isAchievementsOpen,
    isAuthModalOpen,
    isAvatarOpen,
    isCreatorPanelOpen,
    isDailyQuestsOpen,
    isLeaderboardOpen,
    isSavedCharsOpen,
    isSellOpen,
    isShopOpen,
    togglePause,
  ]);

  // Shop Handlers
  const handleSelectOrBuyCosmetic = (item: CosmeticItem) => {
    if (item.leveledOnly && gameModeRef.current !== 'leveled') {
      showBanner('Bu kostüm sadece Seviyeli modda kuşanılabilir!', 2400);
      return;
    }
    const isUnlocked = unlockedIds.includes(item.id);
    if (isUnlocked) {
      setActiveEquipped((prev) => {
        if (item.category === 'suit' && prev.suit === item.id) {
          return { ...prev, suit: 'suit_none' };
        }
        return { ...prev, [item.category]: item.id };
      });
      soundEngine.playScore();
      return;
    }

    if (item.dropOnly) return;

    if (peanutBank >= item.cost) {
      setPeanutBank((prev) => prev - item.cost);
      setUnlockedIds((prev) => [...prev, item.id]);
      setActiveEquipped((prev) => ({ ...prev, [item.category]: item.id }));
      soundEngine.playCrateUnlock();
    }
  };

  const handleEquipCosmetic = (item: CosmeticItem) => {
    if (item.leveledOnly && gameModeRef.current !== 'leveled') {
      showBanner('Bu kostüm sadece Seviyeli modda kuşanılabilir!', 2400);
      return;
    }
    setActiveEquipped((prev) => ({ ...prev, [item.category]: item.id }));
    soundEngine.playScore();
  };

  const handleSelectOrBuyNameColor = (item: NameColorDefinition) => {
    const isUnlocked = item.id === 'name_default' || unlockedNameColors.includes(item.id);
    if (isUnlocked) {
      setActiveNameColor(item.id);
      soundEngine.playScore();
      return;
    }

    if (peanutBank >= item.cost) {
      setPeanutBank((prev) => prev - item.cost);
      setUnlockedNameColors((prev) => {
        const next = Array.from(new Set([...prev, item.id])).sort();
        unlockedNameColorsRef.current = next;
        return next;
      });
      setActiveNameColor(item.id);
      soundEngine.playCrateUnlock();
    }
  };

  const rollCrateDrops = (tier: CrateTier, crateCount: number) => {
    const cfg = CRATE_TIER_CONFIGS[tier];
    const totalSlots = crateCount * cfg.dropsPerOpen;
    const unlockedSet = new Set(unlockedIds);
    const tuxedoItem = COSMETIC_BY_ID['suit_tuxedo'];
    // Keep normal secret suits and Seviyeli-only costumes strictly separated across crate pools
    const normalSecretSuits = COSMETIC_CATALOG.filter(
      (c) => c.category === 'suit' && !c.leveledOnly
    );
    const leveledOnlySuits = COSMETIC_CATALOG.filter((c) => c.leveledOnly);
    const pickedItems: CosmeticItem[] = [];
    const newlyUnlockedIds: string[] = [];
    let duplicateCount = 0;
    let hitOutfitCount = 0;
    let hitLeveledCount = 0;

    for (let slot = 0; slot < totalSlots; slot++) {
      if (tier === 'leveled_outfit') {
        const lockedLeveled = leveledOnlySuits.filter((s) => !unlockedSet.has(s.id));
        if (lockedLeveled.length > 0 && Math.random() < 0.45) {
          const totalWeight = lockedLeveled.reduce((sum, s) => sum + (s.dropRateChance ?? 0.2), 0);
          let cursor = Math.random() * totalWeight;
          let wonLeveled = lockedLeveled[0];
          for (const s of lockedLeveled) {
            cursor -= s.dropRateChance ?? 0.2;
            if (cursor <= 0) {
              wonLeveled = s;
              break;
            }
          }
          unlockedSet.add(wonLeveled.id);
          newlyUnlockedIds.push(wonLeveled.id);
          pickedItems.push(wonLeveled);
          hitLeveledCount++;
          continue;
        }
      } else if (tier === 'outfit') {
        // Check rarest-to-easiest or cumulative drop rates for non-leveled secret suits
        const lockedSuits = normalSecretSuits
          .filter((s) => !unlockedSet.has(s.id) && (s.dropRateChance ?? 0) > 0)
          .sort((a, b) => (a.dropRateChance ?? 0) - (b.dropRateChance ?? 0));

        const roll = Math.random();
        let cursor = 0;
        let wonSuit: CosmeticItem | null = null;
        for (const s of lockedSuits) {
          cursor += s.dropRateChance ?? 0;
          if (roll < cursor) {
            wonSuit = s;
            break;
          }
        }

        if (wonSuit) {
          unlockedSet.add(wonSuit.id);
          newlyUnlockedIds.push(wonSuit.id);
          pickedItems.push(wonSuit);
          hitOutfitCount++;
          continue;
        }
      } else {
        const hitTuxedo = Boolean(
          tuxedoItem && !unlockedSet.has(tuxedoItem.id) && Math.random() < 1 / 100000
        );

        if (hitTuxedo && tuxedoItem) {
          unlockedSet.add(tuxedoItem.id);
          newlyUnlockedIds.push(tuxedoItem.id);
          pickedItems.push(tuxedoItem);
          continue;
        }
      }

      const availableNormal = COSMETIC_CATALOG.filter(
        (c) => !c.dropOnly && !c.leveledOnly && !unlockedSet.has(c.id)
      );

      if (availableNormal.length > 0) {
        const availableMythic = availableNormal.filter((c) => c.rarity === 'mythic');
        const availableHigh = availableNormal.filter(
          (c) => c.rarity === 'legendary' || c.rarity === 'epic'
        );
        const mythicChance =
          tier === 'mythic'
            ? slot % cfg.dropsPerOpen === 0
              ? 1
              : 0.55
            : tier === 'leveled_outfit'
              ? 0.22
              : tier === 'outfit'
                ? 0.25
                : tier === 'epic'
                  ? 0.18
                  : 0.05;

        let pool = availableNormal;
        if (availableMythic.length > 0 && Math.random() < mythicChance) {
          pool = availableMythic;
        } else if (
          (tier === 'epic' || tier === 'mythic' || tier === 'outfit' || tier === 'leveled_outfit') &&
          availableHigh.length > 0
        ) {
          pool = availableHigh;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        unlockedSet.add(chosen.id);
        newlyUnlockedIds.push(chosen.id);
        pickedItems.push(chosen);
      } else {
        const mythicShowcase = COSMETIC_CATALOG.filter(
          (c) => c.cost > 0 && !c.dropOnly && !c.leveledOnly && c.rarity === 'mythic'
        );
        const highTierShowcase = COSMETIC_CATALOG.filter(
          (c) =>
            c.cost > 0 &&
            !c.dropOnly &&
            !c.leveledOnly &&
            (c.rarity === 'legendary' || c.rarity === 'epic')
        );
        const fallbackPool =
          tier === 'mythic' && mythicShowcase.length > 0
            ? mythicShowcase
            : (tier === 'epic' || tier === 'mythic' || tier === 'outfit' || tier === 'leveled_outfit') &&
                highTierShowcase.length > 0
              ? highTierShowcase
              : COSMETIC_CATALOG.filter((c) => c.cost > 0 && !c.dropOnly && !c.leveledOnly);
        const showcase = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        pickedItems.push(showcase);
        duplicateCount++;
      }
    }

    const duplicateRefund = duplicateCount * cfg.duplicateRefundPerSlot;
    const rarityRank: Record<string, number> = {
      mythic: 5,
      legendary: 4,
      epic: 3,
      rare: 2,
      common: 1,
    };
    pickedItems.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0));

    let note: string | undefined;
    if (tier === 'leveled_outfit') {
      const remainingLocked = leveledOnlySuits.filter((s) => !unlockedSet.has(s.id)).length;
      if (hitLeveledCount > 0) {
        note = `SEVİYELİ ÖZEL! ${hitLeveledCount} Seviyeli kostüm kazandın!`;
      } else if (remainingLocked === 0) {
        note = 'Tüm Seviyeli özel kostümler açık! Ekstra kozmetik/iade verildi.';
      } else {
        note = 'Bu açılışta Seviyeli özel kostüm çıkmadı (%45 şans) · Destansı/Efsanevi ödül verildi.';
      }
    } else if (tier === 'outfit') {
      note =
        hitOutfitCount > 0
          ? `EFSANE ŞANS! ${hitOutfitCount} gizli kıyafet (???) kazandın!`
          : "Gizli kıyafet şansı bu tur tutmadı (En kolay 5.000'de 1) · Teselli ödülü verildi.";
    }

    return {
      pickedItems,
      newlyUnlockedIds,
      duplicateCount,
      duplicateRefund,
      note,
    };
  };

  const handleOpenMarketCrate = (tier: CrateTier): CrateSpinPayload | null => {
    if (tier === 'leveled_outfit' && gameModeRef.current !== 'leveled') return null;
    const cost = CRATE_TIER_CONFIGS[tier].unitCost;
    if (peanutBank < cost) return null;

    const { pickedItems, newlyUnlockedIds, duplicateCount, duplicateRefund, note } = rollCrateDrops(
      tier,
      1
    );
    setPeanutBank((prev) => prev - cost + duplicateRefund);
    if (newlyUnlockedIds.length > 0) {
      setUnlockedIds((prev) => Array.from(new Set([...prev, ...newlyUnlockedIds])));
    }

    return {
      items: pickedItems,
      isDuplicateBonus: duplicateCount > 0,
      duplicateRefund,
      openedCount: 1,
      note,
    };
  };

  const handleBuyCrates = (tier: CrateTier, quantity: number): boolean => {
    if (tier === 'leveled_outfit' && gameModeRef.current !== 'leveled') return false;
    const cleanQty = Math.max(1, Math.min(100, Math.floor(quantity) || 1));
    const totalCost = CRATE_TIER_CONFIGS[tier].unitCost * cleanQty;
    if (peanutBank < totalCost) return false;
    if ((crateInventory[tier] || 0) + cleanQty > 9999) return false;

    setPeanutBank((prev) => prev - totalCost);
    setCrateInventory((prev) => ({
      ...prev,
      [tier]: Math.min(9999, (prev[tier] || 0) + cleanQty),
    }));
    soundEngine.playCrateUnlock();
    return true;
  };

  const handleOpenCratesFromInventory = (
    tier: CrateTier,
    quantity: number
  ): CrateSpinPayload | null => {
    if (tier === 'leveled_outfit' && gameModeRef.current !== 'leveled') return null;
    const owned = crateInventory[tier] || 0;
    const maxBatch = tier === 'mythic' ? 10 : 20;
    const openQty = Math.min(owned, maxBatch, Math.max(1, Math.floor(quantity) || 1));
    if (openQty <= 0) return null;

    const { pickedItems, newlyUnlockedIds, duplicateCount, duplicateRefund, note } = rollCrateDrops(
      tier,
      openQty
    );

    setCrateInventory((prev) => ({
      ...prev,
      [tier]: Math.max(0, (prev[tier] || 0) - openQty),
    }));
    if (duplicateRefund > 0) {
      setPeanutBank((prev) => prev + duplicateRefund);
    }
    if (newlyUnlockedIds.length > 0) {
      setUnlockedIds((prev) => Array.from(new Set([...prev, ...newlyUnlockedIds])));
    }

    return {
      items: pickedItems,
      isDuplicateBonus: duplicateCount > 0,
      duplicateRefund,
      openedCount: openQty,
      note,
    };
  };

  const handleUpgradeMagnet = () => {
    const cost = (upgrades.magnetLevel + 1) * 12;
    if (upgrades.magnetLevel >= 5 || peanutBank < cost) return;
    setPeanutBank((prev) => prev - cost);
    setUpgrades((prev) => ({ ...prev, magnetLevel: prev.magnetLevel + 1 }));
    soundEngine.playCrateUnlock();
  };

  const handleUpgradeDoublePeanut = () => {
    const cost = (upgrades.doublePeanutLevel + 1) * 14;
    if (upgrades.doublePeanutLevel >= 5 || peanutBank < cost) return;
    setPeanutBank((prev) => prev - cost);
    setUpgrades((prev) => ({ ...prev, doublePeanutLevel: prev.doublePeanutLevel + 1 }));
    soundEngine.playCrateUnlock();
  };

  const handleBuyShield = (amount: number, cost: number) => {
    if (peanutBank < cost || upgrades.shieldCount + amount > 99) return;
    setPeanutBank((prev) => prev - cost);
    setUpgrades((prev) => ({ ...prev, shieldCount: prev.shieldCount + amount }));
    soundEngine.playCrateUnlock();
  };

  const handleSellCosmetic = (item: CosmeticItem) => {
    if (item.cost <= 0 || item.dropOnly || !unlockedIds.includes(item.id)) return;
    const gain = getCosmeticSellPrice(item);
    if (gain <= 0) return;

    setUnlockedIds((prev) => prev.filter((id) => id !== item.id));
    setPeanutBank((prev) => prev + gain);
    const resetSlotIfMatched = (prev: EquippedCosmetics): EquippedCosmetics =>
      prev[item.category] === item.id
        ? { ...prev, [item.category]: DEFAULT_COSMETIC_BY_CATEGORY[item.category] }
        : prev;
    setEquipped(resetSlotIfMatched);
    setLeveledEquipped(resetSlotIfMatched);
    soundEngine.playPeanut();
  };

  const handleSellBulkCosmetics = (items: CosmeticItem[]) => {
    const unlockedSet = new Set(unlockedIds);
    const sellIds = new Set<string>();
    let totalGain = 0;

    for (const item of items) {
      if (item.cost > 0 && !item.dropOnly && unlockedSet.has(item.id) && !sellIds.has(item.id)) {
        sellIds.add(item.id);
        totalGain += getCosmeticSellPrice(item);
      }
    }

    if (sellIds.size === 0 || totalGain <= 0) return;

    setUnlockedIds((prev) => prev.filter((id) => !sellIds.has(id)));
    setPeanutBank((prev) => prev + totalGain);
    const stripSoldSlots = (prev: EquippedCosmetics): EquippedCosmetics => {
      const next = { ...prev };
      (['hat', 'glasses', 'skin', 'trail'] as const).forEach((cat) => {
        if (sellIds.has(next[cat])) {
          next[cat] = DEFAULT_COSMETIC_BY_CATEGORY[cat];
        }
      });
      return next;
    };
    setEquipped(stripSoldSlots);
    setLeveledEquipped(stripSoldSlots);
    soundEngine.playCrateUnlock();
  };

  const handleSaveCharacterPreset = useCallback(
    (name: string) => {
      setSavedCharacters((prev) => {
        if (prev.length >= 12) return prev;
        const newPreset: SavedCharacterPreset = {
          id: `char_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: name.trim().slice(0, 24) || `Kombin #${prev.length + 1}`,
          bodyType: activeBodyTypeRef.current,
          equipped: { ...activeEquippedRef.current },
          nameColorId: activeNameColorRef.current,
          savedAtMs: Date.now(),
        };
        return [newPreset, ...prev].slice(0, 12);
      });
      soundEngine.playCrateUnlock();
    },
    []
  );

  const handleOverwriteCharacterPreset = useCallback((presetId: string) => {
    setSavedCharacters((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? {
              ...p,
              bodyType: activeBodyTypeRef.current,
              equipped: { ...activeEquippedRef.current },
              nameColorId: activeNameColorRef.current,
              savedAtMs: Date.now(),
            }
          : p
      )
    );
    soundEngine.playCrateUnlock();
  }, []);

  const handleLoadCharacterPreset = useCallback(
    (preset: SavedCharacterPreset) => {
      const unlockedSet = new Set(unlockedIdsRef.current);
      const nameColorSet = new Set(unlockedNameColorsRef.current);
      const rawSuit =
        preset.equipped.suit && unlockedSet.has(preset.equipped.suit)
          ? preset.equipped.suit
          : DEFAULT_COSMETIC_BY_CATEGORY.suit;
      const isLeveledSuit = Boolean(COSMETIC_BY_ID[rawSuit]?.leveledOnly);
      const safeSuit =
        isLeveledSuit && gameModeRef.current !== 'leveled'
          ? DEFAULT_COSMETIC_BY_CATEGORY.suit
          : rawSuit;
      const nextEquipped: EquippedCosmetics = {
        hat: unlockedSet.has(preset.equipped.hat)
          ? preset.equipped.hat
          : DEFAULT_COSMETIC_BY_CATEGORY.hat,
        glasses: unlockedSet.has(preset.equipped.glasses)
          ? preset.equipped.glasses
          : DEFAULT_COSMETIC_BY_CATEGORY.glasses,
        skin: unlockedSet.has(preset.equipped.skin)
          ? preset.equipped.skin
          : DEFAULT_COSMETIC_BY_CATEGORY.skin,
        trail: unlockedSet.has(preset.equipped.trail)
          ? preset.equipped.trail
          : DEFAULT_COSMETIC_BY_CATEGORY.trail,
        suit: safeSuit,
      };
      setActiveBodyType(preset.bodyType);
      setActiveEquipped(() => nextEquipped);
      if (nameColorSet.has(preset.nameColorId)) {
        setActiveNameColor(preset.nameColorId);
      }
      soundEngine.playPeanut();
      showBanner(
        isLeveledSuit && gameModeRef.current !== 'leveled'
          ? `Kombin giyildi: ${preset.name} (Seviyeli kostüm Klasik modda çıkarıldı)`
          : `Kombin giyildi: ${preset.name}`,
        2400
      );
    },
    [setActiveBodyType, setActiveEquipped, setActiveNameColor, showBanner]
  );

  const handleDeleteCharacterPreset = useCallback((presetId: string) => {
    setSavedCharacters((prev) => prev.filter((p) => p.id !== presetId));
    soundEngine.playScore();
  }, []);

  // Track native browser fullscreen state (including webkit vendor prefix)
  useEffect(() => {
    const getFullscreenElement = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      return document.fullscreenElement || doc.webkitFullscreenElement || null;
    };
    const onFullscreenChange = () => {
      const active = Boolean(getFullscreenElement());
      setIsNativeFullscreen(active);
      if (active) {
        setIsTheaterFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  // Lock 860:540 aspect ratio mathematically in Fullscreen & Telefon Modu so pipes never squash or stretch
  useEffect(() => {
    if (!isFullscreen && !isMobileMode) {
      setFittedStageSize(null);
      return;
    }

    const computeSize = () => {
      const wrapper = arenaWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const availW = Math.max(240, rect.width);
      const availH = Math.max(150, rect.height - (isMobileMode && gameState === 'PLAYING' ? 44 : 0));
      const scale = Math.min(availW / WORLD_WIDTH, availH / WORLD_HEIGHT);
      const width = Math.max(240, Math.floor(WORLD_WIDTH * scale));
      const height = Math.max(150, Math.floor(WORLD_HEIGHT * scale));
      setFittedStageSize((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    computeSize();
    const rafId = requestAnimationFrame(computeSize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && arenaWrapperRef.current) {
      ro = new ResizeObserver(computeSize);
      ro.observe(arenaWrapperRef.current);
    }
    window.addEventListener('resize', computeSize);
    window.addEventListener('orientationchange', computeSize);
    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', computeSize);
      window.removeEventListener('orientationchange', computeSize);
    };
  }, [isFullscreen, isMobileMode, gameState]);

  useEffect(() => {
    const anyModalOpen =
      isShopOpen ||
      isSellOpen ||
      isDailyQuestsOpen ||
      isLeaderboardOpen ||
      isAvatarOpen ||
      isSavedCharsOpen ||
      isAchievementsOpen ||
      isCreatorPanelOpen ||
      isAuthModalOpen ||
      Boolean(rareExplosionItem);
    if (anyModalOpen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [
    isAchievementsOpen,
    isAuthModalOpen,
    isAvatarOpen,
    isCreatorPanelOpen,
    isDailyQuestsOpen,
    isLeaderboardOpen,
    isSavedCharsOpen,
    isSellOpen,
    isShopOpen,
    rareExplosionItem,
  ]);

  const handleSignOut = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_OWNER_UID_KEY);
    } catch {
      // Ignore storage errors
    }
    const clean = createDefaultProfile();
    profileUpdatedAtMsRef.current = 0;
    gameModeRef.current = clean.gameMode;
    unlockedLevelRef.current = clean.unlockedLevel;
    selectedLevelRef.current = clean.unlockedLevel;
    completedLevelsRef.current = clean.completedLevels;
    bestLevelScoreRef.current = clean.bestLevelScore;
    leveledBodyTypeRef.current = clean.leveledBodyType;
    leveledEquippedRef.current = clean.leveledEquipped;
    leveledNameColorRef.current = clean.leveledEquippedNameColor;
    unlockedAchievementsRef.current = clean.unlockedAchievements;
    bestLeveledCleanFlightSecRef.current = clean.bestLeveledCleanFlightSec;
    setGameMode(clean.gameMode);
    setDifficulty(clean.difficulty);
    setBodyType(clean.bodyType);
    setLeveledBodyType(clean.leveledBodyType);
    setUnlockedLevel(clean.unlockedLevel);
    setSelectedLevel(clean.unlockedLevel);
    setCompletedLevels(clean.completedLevels);
    setBestLevelScore(clean.bestLevelScore);
    setPeanutBank(clean.peanutBank);
    setUnlockedIds(clean.unlockedIds);
    setEquipped(clean.equipped);
    setLeveledEquipped(clean.leveledEquipped);
    setUnlockedNameColors(clean.unlockedNameColors);
    setEquippedNameColor(clean.equippedNameColor);
    setLeveledNameColor(clean.leveledEquippedNameColor);
    setUnlockedAchievements(clean.unlockedAchievements);
    setBestLeveledCleanFlightSec(clean.bestLeveledCleanFlightSec);
    setUpgrades(clean.upgrades);
    setCrateInventory(clean.crateInventory);
    setSavedCharacters([]);
    setHighScores({ easy: 0, classic: 0, turbo: 0 });
    setDailyQuestsState(createEmptyDailyQuestsState(getTodayDateKey()));
    signOutUser().catch(() => {});
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const target = stageContainerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const fsElement = document.fullscreenElement || doc.webkitFullscreenElement || null;

    if (fsElement || isNativeFullscreen || isTheaterFullscreen) {
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore exit error and reset state below
        }
      } else if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === 'function') {
        try {
          await doc.webkitExitFullscreen();
        } catch {
          // Ignore exit error and reset state below
        }
      }
      setIsNativeFullscreen(false);
      setIsTheaterFullscreen(false);
      return;
    }

    if (target) {
      if (typeof target.requestFullscreen === 'function') {
        try {
          await target.requestFullscreen();
          return;
        } catch {
          // Iframe may block native Fullscreen API; fall back seamlessly to CSS Theater Fullscreen
        }
      } else if (typeof target.webkitRequestFullscreen === 'function') {
        try {
          await target.webkitRequestFullscreen();
          setIsNativeFullscreen(true);
          return;
        } catch {
          // Fall back to CSS Theater Fullscreen
        }
      }
    }
    setIsTheaterFullscreen(true);
  }, [isNativeFullscreen, isTheaterFullscreen]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        isShopOpen ||
        isSellOpen ||
        isDailyQuestsOpen ||
        isLeaderboardOpen ||
        isAvatarOpen ||
        isSavedCharsOpen ||
        isAchievementsOpen ||
        isCreatorPanelOpen ||
        isAuthModalOpen
      ) {
        if (e.code === 'Escape') {
          setIsShopOpen(false);
          setIsSellOpen(false);
          setIsDailyQuestsOpen(false);
          setIsLeaderboardOpen(false);
          setIsAvatarOpen(false);
          setIsSavedCharsOpen(false);
          setIsAchievementsOpen(false);
          setIsCreatorPanelOpen(false);
          setIsAuthModalOpen(false);
        }
        return;
      }
      if (e.code === 'Escape' && (isTheaterFullscreen || isNativeFullscreen)) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (e.code === 'KeyF' && !e.repeat) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (e.repeat) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        const state = gameStateRef.current;
        if (state === 'PLAYING') {
          flap();
        } else if (state === 'TITLE_MENU') {
          startGame();
        } else if (state === 'GAME_OVER') {
          if (performance.now() - gameOverTimestampRef.current > 420) {
            startGame();
          }
        } else if (state === 'LEVEL_COMPLETE') {
          if (performance.now() - gameOverTimestampRef.current > 420) {
            startGame(selectedLevelRef.current + 1);
          }
        } else if (state === 'PAUSED') {
          togglePause();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    flap,
    isAchievementsOpen,
    isAuthModalOpen,
    isAvatarOpen,
    isCreatorPanelOpen,
    isDailyQuestsOpen,
    isLeaderboardOpen,
    isNativeFullscreen,
    isSavedCharsOpen,
    isSellOpen,
    isShopOpen,
    isTheaterFullscreen,
    startGame,
    toggleFullscreen,
    toggleMute,
    togglePause,
  ]);

  // Main 60fps Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const spawnPipeAndRewards = () => {
      const cfg = DIFFICULTY_CONFIGS[activeDifficultyRef.current];
      const isLeveled = gameModeRef.current === 'leveled';
      const levelCfg = isLeveled ? getLevelConfig(selectedLevelRef.current) : null;
      if (levelCfg && pipeSpawnCountRef.current >= levelCfg.targetPipes) {
        return;
      }

      const activeGap = levelCfg ? Math.max(122, cfg.gap - levelCfg.gapReduction) : cfg.gap;
      const playableHeight = WORLD_HEIGHT - GROUND_HEIGHT;
      const minGapTop = 64;
      const maxGapTop = playableHeight - activeGap - 64;

      const lastPipe = pipesRef.current[pipesRef.current.length - 1];
      let gapTop: number;
      if (lastPipe) {
        const maxDelta = activeDifficultyRef.current === 'turbo' ? 165 : 135;
        const lowBound = Math.max(minGapTop, lastPipe.gapTop - maxDelta);
        const highBound = Math.min(maxGapTop, lastPipe.gapTop + maxDelta);
        gapTop = lowBound + Math.random() * (highBound - lowBound);
      } else {
        const mid = (minGapTop + maxGapTop) * 0.5;
        gapTop = mid + (Math.random() - 0.5) * 90;
      }

      const pipeWidth = 68;
      const pipeX = WORLD_WIDTH + 40;
      pipeSpawnCountRef.current += 1;

      const isMovingPipe =
        Boolean(levelCfg) &&
        levelCfg!.movingPipeChance > 0 &&
        Math.random() < levelCfg!.movingPipeChance;
      const moveAmp = isMovingPipe ? levelCfg!.movingPipeAmplitude : 0;
      const moveSpeed = isMovingPipe ? levelCfg!.movingPipeSpeed : 0;

      pipesRef.current.push({
        id: nextEntityIdRef.current++,
        x: pipeX,
        gapTop,
        gapHeight: activeGap,
        width: pipeWidth,
        passed: false,
        baseGapTop: isMovingPipe ? gapTop : undefined,
        moveAmp: isMovingPipe ? moveAmp : undefined,
        moveSpeed: isMovingPipe ? moveSpeed : undefined,
        movePhase: isMovingPipe ? Math.random() * Math.PI * 2 : undefined,
      });

      if (levelCfg && !levelCfg.isBoss && pipeSpawnCountRef.current === levelCfg.targetPipes) {
        finishGateRef.current = {
          x: pipeX + pipeWidth + 190,
          level: levelCfg.level,
          isBoss: levelCfg.isBoss,
          crossed: false,
        };
      }

      if (pipeSpawnCountRef.current % 4 === 0) {
        const crateX = pipeX + pipeWidth / 2;
        const crateY = gapTop + activeGap * (0.35 + Math.random() * 0.3);
        cratesRef.current.push({
          id: nextEntityIdRef.current++,
          x: crateX,
          y: crateY,
          size: 26,
          collected: false,
          bobPhase: Math.random() * Math.PI * 2,
        });
      } else if (Math.random() < 0.55) {
        const insideGap = Math.random() < 0.65;
        const px = insideGap ? pipeX + pipeWidth / 2 : pipeX + pipeWidth + 95;
        const py = insideGap
          ? gapTop + activeGap * (0.3 + Math.random() * 0.4)
          : 90 + Math.random() * (playableHeight - 180);

        peanutsRef.current.push({
          id: nextEntityIdRef.current++,
          x: px,
          y: py,
          radius: 13,
          collected: false,
          bobPhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;

      const state = gameStateRef.current;
      const cfg = DIFFICULTY_CONFIGS[activeDifficultyRef.current];
      const bodyCfg = BODY_TYPE_CONFIGS[activeBodyTypeRef.current];
      const isLeveled = gameModeRef.current === 'leveled';
      const activeLevelCfg = isLeveled ? getLevelConfig(selectedLevelRef.current) : null;
      const playableHeight = WORLD_HEIGHT - GROUND_HEIGHT;

      if (state !== 'PAUSED') {
        timeRef.current += dt;
      }

      if (flashAlphaRef.current > 0) {
        flashAlphaRef.current = Math.max(0, flashAlphaRef.current - dt * 2.8);
      }

      if (state === 'TITLE_MENU' || state === 'PLAYING') {
        for (const c of cloudsRef.current) {
          c.x -= c.speed * dt;
          if (c.x < -120) {
            c.x = WORLD_WIDTH + 100;
            c.y = 55 + Math.random() * 115;
          }
        }
      }

      const el = elephantRef.current;

      el.blinkTimer -= dt;
      if (el.blinkTimer < -0.1) {
        el.blinkTimer = 2.2 + Math.random() * 2.8;
      }

      if (state === 'TITLE_MENU') {
        groundOffsetRef.current += 105 * dt;
        bgOffsetRef.current += 45 * dt;
        const targetX =
          isShopOpenRef.current || isSellOpenRef.current ? WORLD_WIDTH * 0.44 : 175;
        el.x += (targetX - el.x) * Math.min(1, dt * 8);
        el.y = playableHeight * 0.45 + Math.sin(timeRef.current * 3.2) * 11;
        el.earPhase += dt * 6;
        el.rotation = Math.sin(timeRef.current * 3.2) * 0.06;
        el.scarfWave += dt * 2;
        if (activeEquippedRef.current.trail !== 'trail_none') {
          trailTickRef.current += dt;
          const interval = isMobileModeRef.current ? 0.16 : 0.08;
          if (trailTickRef.current >= interval) {
            trailTickRef.current = 0;
            spawnTrailParticles(el.x, el.y, 1, false);
          }
        }
      } else if (state === 'PLAYING') {
        const creatorSpeedMult = isUserCreator(userRef.current) ? speedMultiplierRef.current : 1;
        const levelSpeedMult = activeLevelCfg ? activeLevelCfg.speedMultiplier : 1;
        const activeSpeed = cfg.speed * levelSpeedMult * creatorSpeedMult;

        groundOffsetRef.current += activeSpeed * dt;
        bgOffsetRef.current += activeSpeed * 0.45 * dt;

        if (isLeveled) {
          leveledCleanFlightSecRef.current += dt;
          const wholeSec = Math.floor(leveledCleanFlightSecRef.current);
          if (wholeSec > leveledCleanFlightWholeSecRef.current) {
            leveledCleanFlightWholeSecRef.current = wholeSec;
            if (wholeSec > bestLeveledCleanFlightSecRef.current) {
              bestLeveledCleanFlightSecRef.current = wholeSec;
              setBestLeveledCleanFlightSec(wholeSec);
            }
            checkAndUnlockLeveledAchievements();
          }
        }

        if (el.invincibleTimer > 0) {
          el.invincibleTimer = Math.max(0, el.invincibleTimer - dt);
        }

        // Ambient trail emission for equipped custom trails
        if (activeEquippedRef.current.trail !== 'trail_none') {
          trailTickRef.current += dt;
          const interval = isMobileModeRef.current ? 0.14 : 0.06;
          if (trailTickRef.current >= interval) {
            trailTickRef.current = 0;
            spawnTrailParticles(el.x, el.y, 1, false);
          }
        }

        el.vy = Math.min(520, el.vy + cfg.gravity * bodyCfg.gravityMult * dt);
        el.y += el.vy * dt;
        el.earPhase += dt * 7;
        el.scarfWave += dt * 2.5;
        if (el.earFlapTimer > 0) {
          el.earFlapTimer = Math.max(0, el.earFlapTimer - dt);
        }

        const targetRot =
          el.vy < 0
            ? Math.max(-0.42, (el.vy / Math.abs(cfg.flapVelocity)) * 0.42)
            : Math.min(1.15, (el.vy / 650) * 1.15);
        el.rotation += (targetRot - el.rotation) * Math.min(1, dt * 12);

        const visualRadius = ELEPHANT_RADIUS * bodyCfg.scaleY;

        if (el.y - visualRadius < 0) {
          el.y = visualRadius;
          if (el.vy < 0) el.vy = 0;
        }

        // Ground collision
        const isGodActive = isUserCreator(userRef.current) && godModeRef.current;
        if (el.y + bodyCfg.hitboxRadius >= playableHeight) {
          if (isGodActive) {
            el.y = playableHeight - bodyCfg.hitboxRadius - 4;
            el.vy = cfg.flapVelocity * 0.85;
          } else if (hasActiveShieldRef.current) {
            // Shield saves from ground bump once
            hasActiveShieldRef.current = false;
            setHasActiveShield(false);
            setUpgrades((prev) => ({ ...prev, shieldCount: Math.max(0, prev.shieldCount - 1) }));
            el.invincibleTimer = 1.4;
            el.y = playableHeight - bodyCfg.hitboxRadius - 10;
            el.vy = cfg.flapVelocity * 1.05;
            if (isLeveled) {
              leveledCleanFlightSecRef.current = 0;
              leveledCleanFlightWholeSecRef.current = 0;
            }
            flashAlphaRef.current = 0.4;
            spawnCrashParticles(el.x, el.y, true);
            showBanner('Kalkan Kurtardı!', 1800);
            soundEngine.playCrateUnlock();
          } else {
            el.y = playableHeight - bodyCfg.hitboxRadius;
            triggerGameOver();
          }
        }

        if (!activeLevelCfg || pipeSpawnCountRef.current < activeLevelCfg.targetPipes) {
          spawnTimerRef.current -= dt * levelSpeedMult * creatorSpeedMult;
          if (spawnTimerRef.current <= 0) {
            spawnPipeAndRewards();
            spawnTimerRef.current = cfg.spawnInterval;
          }
        }

        const hitboxRadius = bodyCfg.hitboxRadius;
        for (const pipe of pipesRef.current) {
          pipe.x -= activeSpeed * dt;
          if (pipe.moveAmp && pipe.baseGapTop !== undefined) {
            const osc = Math.sin(
              timeRef.current * (pipe.moveSpeed || 2) + (pipe.movePhase || 0)
            );
            pipe.gapTop = Math.max(
              52,
              Math.min(playableHeight - pipe.gapHeight - 52, pipe.baseGapTop + osc * pipe.moveAmp)
            );
          }

          if (!pipe.passed && pipe.x + pipe.width < el.x) {
            pipe.passed = true;
            runPipesPassedRef.current += 1;
            setLevelPipesCleared(runPipesPassedRef.current);
            const pipePoints = activeDifficultyRef.current === 'turbo' ? 2 : 1;
            scoreRef.current += pipePoints;
            setScore(scoreRef.current);
            if (isLeveled) {
              checkAndUnlockLeveledAchievements();
            }
            advanceDailyQuests('pipe');
            soundEngine.playScore();
          }

          if (el.invincibleTimer <= 0 && !isGodActive) {
            const closestX = Math.max(pipe.x, Math.min(el.x, pipe.x + pipe.width));
            const closestTopY = Math.max(0, Math.min(el.y, pipe.gapTop));
            const distTopSq = (el.x - closestX) ** 2 + (el.y - closestTopY) ** 2;

            const bottomY = pipe.gapTop + pipe.gapHeight;
            const closestBotY = Math.max(bottomY, Math.min(el.y, playableHeight));
            const distBotSq = (el.x - closestX) ** 2 + (el.y - closestBotY) ** 2;

            if (distTopSq < hitboxRadius ** 2 || distBotSq < hitboxRadius ** 2) {
              if (hasActiveShieldRef.current) {
                hasActiveShieldRef.current = false;
                setHasActiveShield(false);
                setUpgrades((prev) => ({
                  ...prev,
                  shieldCount: Math.max(0, prev.shieldCount - 1),
                }));
                if (isLeveled) {
                  leveledCleanFlightSecRef.current = 0;
                  leveledCleanFlightWholeSecRef.current = 0;
                }
                el.invincibleTimer = 1.5;
                flashAlphaRef.current = 0.45;
                spawnCrashParticles(el.x, el.y, true);
                showBanner('Savan Kalkanı Kırıldı!', 2000);
                soundEngine.playCrateUnlock();
              } else {
                triggerGameOver();
                break;
              }
            }
          }
        }

        pipesRef.current = pipesRef.current.filter((p) => p.x + p.width > -40);

        if (finishGateRef.current) {
          finishGateRef.current.x -= activeSpeed * dt;
          if (!finishGateRef.current.crossed && el.x >= finishGateRef.current.x) {
            finishGateRef.current.crossed = true;
            triggerLevelComplete();
          }
        }

        // Boss Arena Spawn & Combat Loop on every 5th (Mini Patron) & 10th (Büyük Patron) level
        if (
          activeLevelCfg &&
          activeLevelCfg.bossKind !== 'none' &&
          !bossRef.current &&
          !finishGateRef.current &&
          pipeSpawnCountRef.current >= activeLevelCfg.targetPipes &&
          pipesRef.current.every((p) => p.x + p.width < el.x + 90)
        ) {
          const spawnedBoss = createBossForLevel(activeLevelCfg.level, activeLevelCfg.bossKind);
          bossRef.current = spawnedBoss;
          setBossHud({
            name: spawnedBoss.name,
            kind: spawnedBoss.kind,
            hp: spawnedBoss.hp,
            maxHp: spawnedBoss.maxHp,
            enraged: false,
          });
          soundEngine.playBossWarning();
          showBanner(
            `${spawnedBoss.kind === 'boss' ? 'BÜYÜK PATRON' : 'MİNİ PATRON'}: ${spawnedBoss.name} Ortaya Çıktı!`,
            3000
          );
          floatingTextsRef.current.push({
            x: WORLD_WIDTH * 0.5,
            y: 110,
            text:
              spawnedBoss.kind === 'boss'
                ? `PATRON: ${spawnedBoss.name.toUpperCase()}!`
                : `MİNİ PATRON: ${spawnedBoss.name.toUpperCase()}!`,
            color: spawnedBoss.kind === 'boss' ? '#FB7185' : '#FBBF24',
            life: 1.4,
            maxLife: 1.4,
          });
        }

        const activeBoss = bossRef.current;
        if (activeBoss && activeBoss.active && !activeBoss.defeated) {
          if (activeBoss.hitFlash > 0) {
            activeBoss.hitFlash = Math.max(0, activeBoss.hitFlash - dt);
          }

          // Slide into arena then patrol vertically (gets faster with level & enraged phase)
          const levelDifficultyFactor = 1 + Math.min(2.2, (activeBoss.level - 5) * 0.08);
          const enrageFactor = activeBoss.enraged ? 1.32 : 1;
          if (activeBoss.x > activeBoss.targetX) {
            activeBoss.x = Math.max(activeBoss.targetX, activeBoss.x - 210 * dt);
          } else {
            activeBoss.phase += dt * (1.75 + Math.min(1.8, activeBoss.level * 0.06)) * enrageFactor;
            const minBossY = activeBoss.radius + 54;
            const maxBossY = playableHeight - activeBoss.radius - 42;
            const midY = (minBossY + maxBossY) * 0.5;
            const ampY = (maxBossY - minBossY) * 0.44;
            const targetPatrolY =
              midY +
              Math.sin(activeBoss.phase) * ampY * 0.72 +
              (el.y - midY) * 0.25;
            activeBoss.y += (Math.max(minBossY, Math.min(maxBossY, targetPatrolY)) - activeBoss.y) * Math.min(1, dt * 4.5);
          }

          // Auto-fire steady support bolts while fighting Boss (in addition to flap shots!)
          autoFireTimerRef.current -= dt;
          if (autoFireTimerRef.current <= 0) {
            autoFireTimerRef.current = 0.48;
            playerBoltsRef.current.push({
              id: nextEntityIdRef.current++,
              x: el.x + 28,
              y: el.y - 3,
              vx: 660,
              vy: 0,
              radius: 6.5,
              damage: 1,
            });
          }

          // Update Player Bolts & Check Hit against Boss
          for (const bolt of playerBoltsRef.current) {
            bolt.x += bolt.vx * dt;
            bolt.y += bolt.vy * dt;
            const distToBoss = Math.hypot(bolt.x - activeBoss.x, bolt.y - activeBoss.y);
            if (distToBoss <= activeBoss.radius + bolt.radius + 4) {
              bolt.x = WORLD_WIDTH + 999; // mark spent
              activeBoss.hp = Math.max(0, activeBoss.hp - bolt.damage);
              activeBoss.hitFlash = 0.11;
              if (!activeBoss.enraged && activeBoss.hp <= activeBoss.maxHp * 0.5) {
                activeBoss.enraged = true;
                showBanner(`${activeBoss.name} Öfkelendi! Hızı Arttı!`, 2200);
              }
              spawnPeanutParticles(activeBoss.x - activeBoss.radius * 0.6, bolt.y);
              soundEngine.playBossHit();
              setBossHud({
                name: activeBoss.name,
                kind: activeBoss.kind,
                hp: activeBoss.hp,
                maxHp: activeBoss.maxHp,
                enraged: activeBoss.enraged,
              });
            }
          }
          playerBoltsRef.current = playerBoltsRef.current.filter(
            (b) => b.x < WORLD_WIDTH + 60
          );

          // Check Boss Defeat!
          if (activeBoss.hp <= 0) {
            activeBoss.defeated = true;
            activeBoss.active = false;
            bossProjectilesRef.current = [];
            playerBoltsRef.current = [];
            setBossHud(null);
            spawnLevelCompleteFireworks(activeBoss.x, activeBoss.y);
            soundEngine.playBossDefeat();
            flashAlphaRef.current = 0.48;
            const bossBonus = activeBoss.kind === 'boss' ? 30 : 15;
            scoreRef.current += bossBonus;
            setScore(scoreRef.current);
            checkAndUnlockLeveledAchievements();
            floatingTextsRef.current.push({
              x: activeBoss.x - 20,
              y: activeBoss.y - 24,
              text: `PATRON YENİLDİ! +${bossBonus}`,
              color: '#FACC15',
              life: 1.5,
              maxLife: 1.5,
            });
            showBanner('Patron Yenildi! Bitiş Kapısından Geç!', 2400);
            finishGateRef.current = {
              x: Math.min(WORLD_WIDTH - 45, Math.max(el.x + 195, activeBoss.x - 40)),
              level: activeBoss.level,
              isBoss: true,
              crossed: false,
            };
          } else if (activeBoss.x <= activeBoss.targetX + 20) {
            // Boss Projectile Attacks (progressively tougher with level)
            activeBoss.attackTimer -= dt * enrageFactor;
            if (activeBoss.attackTimer <= 0) {
              const baseInterval = Math.max(
                0.78,
                (activeBoss.kind === 'boss' ? 1.48 : 1.72) - (activeBoss.level - 5) * 0.032
              );
              activeBoss.attackTimer = baseInterval;

              const projSpeed = Math.min(
                430,
                (235 + activeBoss.level * 5.2) * (activeBoss.enraged ? 1.14 : 1)
              );
              const aimDx = el.x - (activeBoss.x - activeBoss.radius);
              const aimDy = el.y - activeBoss.y;
              const aimAngle = Math.atan2(aimDy, aimDx);
              const spreadCount =
                activeBoss.kind === 'boss'
                  ? activeBoss.level >= 20 || activeBoss.enraged
                    ? 3
                    : 2
                  : activeBoss.level >= 15
                    ? 2
                    : 1;
              const style: BossProjectile['style'] =
                activeBoss.archetype === 'cyber_drone'
                  ? 'spike'
                  : activeBoss.archetype === 'lava_wyrm'
                    ? 'flame'
                    : 'orb';
              const color =
                activeBoss.archetype === 'cyber_drone'
                  ? '#22D3EE'
                  : activeBoss.archetype === 'cosmic_titan'
                    ? '#E879F9'
                    : '#F97316';

              for (let s = 0; s < spreadCount; s++) {
                const offsetAngle =
                  spreadCount === 1
                    ? 0
                    : (s - (spreadCount - 1) / 2) * (activeBoss.kind === 'boss' ? 0.24 : 0.2);
                const ang = aimAngle + offsetAngle;
                bossProjectilesRef.current.push({
                  id: nextEntityIdRef.current++,
                  x: activeBoss.x - activeBoss.radius - 6,
                  y: activeBoss.y + 6,
                  vx: Math.cos(ang) * projSpeed,
                  vy: Math.sin(ang) * projSpeed,
                  radius: activeBoss.kind === 'boss' ? 10 : 8.5,
                  color,
                  coreColor: '#FFFFFF',
                  style,
                });
              }
            }

            // Full Boss Telegraphed Laser Beam Attack (Level 10, 20, 30...)
            if (activeBoss.kind === 'boss') {
              if (activeBoss.beamState === 'none') {
                activeBoss.beamCooldown -= dt * enrageFactor;
                if (activeBoss.beamCooldown <= 0) {
                  activeBoss.beamState = 'charging';
                  activeBoss.beamTimer = Math.max(0.7, 1.05 - activeBoss.level * 0.01);
                  activeBoss.beamY = Math.max(
                    58,
                    Math.min(playableHeight - 58, el.y)
                  );
                }
              } else if (activeBoss.beamState === 'charging') {
                activeBoss.beamTimer -= dt;
                if (activeBoss.beamTimer <= 0) {
                  activeBoss.beamState = 'firing';
                  activeBoss.beamTimer = 0.5;
                }
              } else if (activeBoss.beamState === 'firing') {
                activeBoss.beamTimer -= dt;
                if (
                  el.invincibleTimer <= 0 &&
                  !isGodActive &&
                  Math.abs(el.y - activeBoss.beamY) <= activeBoss.beamHeight * 0.45 + hitboxRadius * 0.65 &&
                  el.x < activeBoss.x
                ) {
                  if (hasActiveShieldRef.current) {
                    hasActiveShieldRef.current = false;
                    setHasActiveShield(false);
                    setUpgrades((prev) => ({
                      ...prev,
                      shieldCount: Math.max(0, prev.shieldCount - 1),
                    }));
                    leveledCleanFlightSecRef.current = 0;
                    leveledCleanFlightWholeSecRef.current = 0;
                    el.invincibleTimer = 1.5;
                    flashAlphaRef.current = 0.45;
                    spawnCrashParticles(el.x, el.y, true);
                    showBanner('Savan Kalkanı Kırıldı!', 2000);
                    soundEngine.playCrateUnlock();
                  } else {
                    triggerGameOver();
                  }
                }
                if (activeBoss.beamTimer <= 0) {
                  activeBoss.beamState = 'none';
                  activeBoss.beamCooldown = Math.max(2.6, 4.4 - activeBoss.level * 0.04) / levelDifficultyFactor;
                }
              }
            }
          }
        }

        // Update Boss Projectiles & Check Player Collisions
        if (bossProjectilesRef.current.length > 0) {
          for (const proj of bossProjectilesRef.current) {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            if (el.invincibleTimer <= 0 && !isGodActive) {
              const dist = Math.hypot(el.x - proj.x, el.y - proj.y);
              if (dist < hitboxRadius + proj.radius - 2) {
                proj.x = -999; // consume projectile
                if (hasActiveShieldRef.current) {
                  hasActiveShieldRef.current = false;
                  setHasActiveShield(false);
                  setUpgrades((prev) => ({
                    ...prev,
                    shieldCount: Math.max(0, prev.shieldCount - 1),
                  }));
                  if (isLeveled) {
                    leveledCleanFlightSecRef.current = 0;
                    leveledCleanFlightWholeSecRef.current = 0;
                  }
                  el.invincibleTimer = 1.5;
                  flashAlphaRef.current = 0.45;
                  spawnCrashParticles(el.x, el.y, true);
                  showBanner('Savan Kalkanı Kırıldı!', 2000);
                  soundEngine.playCrateUnlock();
                } else {
                  triggerGameOver();
                  break;
                }
              }
            }
          }
          bossProjectilesRef.current = bossProjectilesRef.current.filter(
            (p) => p.x > -40 && p.x < WORLD_WIDTH + 60 && p.y > -40 && p.y < playableHeight + 40
          );
        }

        // Magnet pull range
        const magnetLvl = upgradesRef.current.magnetLevel;
        const magnetRange = magnetLvl > 0 ? 65 + magnetLvl * 45 : 0;

        // Peanuts pickup
        for (const peanut of peanutsRef.current) {
          peanut.x -= activeSpeed * dt;
          if (!peanut.collected) {
            const dx = el.x - peanut.x;
            const dy = el.y - peanut.y;
            const dist = Math.hypot(dx, dy);

            if (magnetRange > 0 && dist < magnetRange && dist > 1) {
              const pullSpeed = 290 + magnetLvl * 50;
              peanut.x += (dx / dist) * pullSpeed * dt;
              peanut.y += (dy / dist) * pullSpeed * dt;
            }

            const collectDist = hitboxRadius + peanut.radius + 8;
            if (dist <= collectDist) {
              peanut.collected = true;
              const dblChance = upgradesRef.current.doublePeanutLevel * 0.2;
              const isDouble = Math.random() < dblChance;
              const peanutGain = isDouble ? 3 : 1;

              const peanutScoreBonus = activeDifficultyRef.current === 'turbo' ? 5 : 3;
              runPeanutPickupsRef.current += 1;
              scoreRef.current += peanutScoreBonus;
              setScore(scoreRef.current);
              if (isLeveled) {
                checkAndUnlockLeveledAchievements();
              }
              setPeanutsCollected((prev) => prev + peanutGain);
              setPeanutBank((prev) => prev + peanutGain);
              advanceDailyQuests('peanut');
              spawnPeanutParticles(peanut.x, peanut.y);
              floatingTextsRef.current.push({
                x: peanut.x,
                y: peanut.y - 12,
                text: isDouble
                  ? `+${peanutScoreBonus} Skor · +${peanutGain} Fıstık!`
                  : `+${peanutScoreBonus} Skor · +1 Fıstık`,
                color: '#FDE047',
                life: 0.78,
                maxLife: 0.78,
              });
              soundEngine.playPeanut();
            }
          }
        }
        peanutsRef.current = peanutsRef.current.filter((p) => !p.collected && p.x > -40);

        // Mystery Cosmetic Crates pickup
        for (const crate of cratesRef.current) {
          crate.x -= activeSpeed * dt;
          if (!crate.collected) {
            const dx = el.x - crate.x;
            const dy = el.y - crate.y;
            const dist = Math.hypot(dx, dy);

            if (magnetRange > 0 && dist < magnetRange && dist > 1) {
              const pullSpeed = 260 + magnetLvl * 45;
              crate.x += (dx / dist) * pullSpeed * dt;
              crate.y += (dy / dist) * pullSpeed * dt;
            }

            const collectDist = hitboxRadius + crate.size * 0.7 + 6;
            if (dist <= collectDist) {
              crate.collected = true;
              unlockAndEquipCrateDrop(crate.x, crate.y);
              if (isLeveled) {
                checkAndUnlockLeveledAchievements();
              }
              advanceDailyQuests('crate');
            }
          }
        }
        cratesRef.current = cratesRef.current.filter((c) => !c.collected && c.x > -40);
      } else if (state === 'GAME_OVER') {
        if (el.y + bodyCfg.hitboxRadius < playableHeight) {
          el.vy += 1550 * dt;
          el.y = Math.min(playableHeight - bodyCfg.hitboxRadius, el.y + el.vy * dt);
          el.rotation = Math.min(1.4, el.rotation + dt * 5);
        }
      } else if (state === 'LEVEL_COMPLETE') {
        groundOffsetRef.current += 90 * dt;
        bgOffsetRef.current += 40 * dt;
        el.earPhase += dt * 8;
        el.rotation += (0 - el.rotation) * Math.min(1, dt * 8);
      }

      if (state !== 'PAUSED') {
        for (const p of particlesRef.current) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
        }
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

        for (const ft of floatingTextsRef.current) {
          ft.y -= 42 * dt;
          ft.life -= dt;
        }
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.life > 0);
      }

      const rawDpr = window.devicePixelRatio || 1;
      const mobilePerf = isMobileModeRef.current;
      const displayW = canvas.clientWidth || WORLD_WIDTH;
      const rasterScale = mobilePerf
        ? Math.min(1.45, Math.max(1, (displayW * Math.min(rawDpr, 1.5)) / WORLD_WIDTH))
        : Math.min(2.25, Math.max(Math.min(rawDpr, 2), (displayW * Math.min(rawDpr, 2)) / WORLD_WIDTH));
      const targetW = Math.round(WORLD_WIDTH * rasterScale);
      const targetH = Math.round(WORLD_HEIGHT * rasterScale);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
      ctx.imageSmoothingEnabled = true;
      renderGameScene({
        ctx,
        elephant: el,
        bodyType: activeBodyTypeRef.current,
        equipped: activeEquippedRef.current,
        hasShield: hasActiveShieldRef.current && state === 'PLAYING',
        pipes: pipesRef.current,
        peanuts: peanutsRef.current,
        crates: cratesRef.current,
        finishGate: finishGateRef.current,
        boss: bossRef.current,
        bossProjectiles: bossProjectilesRef.current,
        playerBolts: playerBoltsRef.current,
        particles: particlesRef.current,
        floatingTexts: floatingTextsRef.current,
        clouds: cloudsRef.current,
        groundOffset: groundOffsetRef.current,
        bgOffset: bgOffsetRef.current,
        score: scoreRef.current,
        biomeIndexOverride: activeLevelCfg ? activeLevelCfg.biomeIndex : null,
        biomeIdOverride: isUserCreator(userRef.current) ? creatorBiomeOverrideRef.current : null,
        time: timeRef.current,
        flashAlpha: flashAlphaRef.current,
        mobilePerf,
      });
      ctx.restore();

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    advanceDailyQuests,
    checkAndUnlockLeveledAchievements,
    showBanner,
    spawnCrashParticles,
    spawnLevelCompleteFireworks,
    spawnPeanutParticles,
    spawnTrailParticles,
    triggerGameOver,
    triggerLevelComplete,
    unlockAndEquipCrateDrop,
  ]);

  const currentBest = highScores[difficulty];
  const medal = getMedalInfo(score);
  const creatorActive = isUserCreator(user);
  const selfLeaderboardEntry = leaderboardEntries.find((e) => e.uid === user?.uid);
  const todaysQuests = useMemo(
    () => getDailyQuestsForDate(dailyQuestsState.dateKey),
    [dailyQuestsState.dateKey]
  );
  const questsDoneCount = todaysQuests.filter(
    (q) => (dailyQuestsState.progress[q.id] || 0) >= q.target
  ).length;
  const questsUnclaimedCount = todaysQuests.filter(
    (q) =>
      (dailyQuestsState.progress[q.id] || 0) >= q.target &&
      !dailyQuestsState.claimedIds.includes(q.id)
  ).length;

  if (banStatus.banned && !creatorActive) {
    return (
      <div className="w-full max-w-lg mx-auto my-12 bg-slate-900 border border-rose-500/60 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400">
          <Ban className="w-7 h-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">Erişimin Yasaklandı</h1>
        <p className="mt-2 text-sm text-rose-200">
          {banStatus.reason || 'Hesabın veya IP adresin oyunun yapımcısı tarafından engellendi.'}
        </p>
        {user && (
          <button
            type="button"
            onClick={() => signOutUser().catch(() => {})}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Hesaptan Çıkış Yap</span>
          </button>
        )}
      </div>
    );
  }

  const isSidePanelOpen = isShopOpen || isSellOpen;
  const totalCrates = getTotalCrateCount(crateInventory);
  const currentLevelConfig = getLevelConfig(selectedLevel);
  const activeBodyType: BodyType = gameMode === 'leveled' ? 'normal' : bodyType;
  const activeDifficulty: Difficulty =
    gameMode === 'leveled'
      ? unlockedLevel > 10 && leveledDifficulty === 'turbo'
        ? 'turbo'
        : 'classic'
      : difficulty;
  const isLeveledTurboUnlocked = unlockedLevel > 10;
  const activeEquipped = gameMode === 'leveled' ? leveledEquipped : equipped;
  const activeNameColor = gameMode === 'leveled' ? leveledNameColor : equippedNameColor;
  const currentBiome = getBiomeTheme(
    score,
    creatorActive ? creatorBiomeOverride : null,
    gameMode === 'leveled' ? currentLevelConfig.biomeIndex : null
  );

  return (
    <div
      className={`w-full mx-auto flex flex-col gap-4 transition-all duration-300 ${
        isSidePanelOpen ? 'max-w-[1440px] sm:pr-[450px] lg:pr-[500px]' : 'max-w-[980px]'
      }`}
    >
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Uçan Fil
          </h1>
          <span className="text-xs sm:text-sm text-slate-400">
            {BODY_TYPE_CONFIGS[activeBodyType].label} ·{' '}
            {gameMode === 'leveled' ? (
              <>
                Seviye <span className="font-mono-num font-bold text-emerald-400">Sv.{unlockedLevel}</span>
              </>
            ) : (
              <>
                Rekor <span className="font-mono-num font-bold text-amber-400">{currentBest}</span>
              </>
            )}{' '}
            · Kasa{' '}
            <span className="font-mono-num font-bold text-yellow-300">{peanutBank} Fıstık</span>
          </span>
          {user && (
            <StyledPlayerName
              name={customDisplayName || user.displayName || 'Oyuncu'}
              colorId={activeNameColor}
              className="text-xs sm:text-sm font-extrabold"
            />
          )}
          {user && creatorActive && (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 bg-amber-500/15 border border-amber-400/50 px-2 py-0.5 rounded">
              <Crown className="w-3.5 h-3.5" />
              Oyunun Yapımcısı
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {creatorActive && (
            <button
              type="button"
              onClick={() => setIsCreatorPanelOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Yapımcı Menüsü</span>
            </button>
          )}

          {gameMode === 'leveled' && (
            <button
              type="button"
              onClick={() => setIsAchievementsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4 text-emerald-300" />
              <span>Başarımlar ({unlockedAchievements.length}/{LEVELED_ACHIEVEMENTS.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (gameStateRef.current === 'GAME_OVER' || gameStateRef.current === 'LEVEL_COMPLETE') {
                resetWorld();
                gameStateRef.current = 'TITLE_MENU';
                setGameState('TITLE_MENU');
              }
              setIsSellOpen(false);
              setShopInitialTab('crateInventory');
              setIsShopOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              totalCrates > 0
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Kutu Çantası ({totalCrates})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (gameStateRef.current === 'GAME_OVER' || gameStateRef.current === 'LEVEL_COMPLETE') {
                resetWorld();
                gameStateRef.current = 'TITLE_MENU';
                setGameState('TITLE_MENU');
              }
              setIsShopOpen(false);
              setIsSellOpen((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Tag className="w-4 h-4" />
            <span>Satış Tezgahı</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const todayKey = getTodayDateKey();
              if (dailyQuestsState.dateKey !== todayKey) {
                setDailyQuestsState(createEmptyDailyQuestsState(todayKey));
              }
              setIsDailyQuestsOpen(true);
            }}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              questsUnclaimedCount > 0
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Görevler ({questsDoneCount}/3)</span>
            {questsUnclaimedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAvatarOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4" />
            <span>PP PNG</span>
          </button>

          {(!user || user.isGuest) && (
            <button
              type="button"
              onClick={() => {
                setAuthModalMode(user?.isGuest ? 'register' : 'login');
                setIsAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">
                {user?.isGuest ? 'Hesap Bağla' : 'Giriş Yap'}
              </span>
            </button>
          )}
          {user && !user.isGuest && (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              title="Hesaptan çıkış yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <button
              type="button"
              onClick={togglePause}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              aria-label={gameState === 'PAUSED' ? 'Oyuna devam et' : 'Oyunu duraklat'}
            >
              {gameState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              isMobileMode
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
            }`}
            title="Telefon Modu (Yüksek FPS ve Dokunmatik Düzen)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">{isMobileMode ? 'Tel. Modu Açık' : 'Telefon Modu'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              isFullscreen
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
            }`}
            title="Tam Ekran (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Küçült' : 'Tam Ekran'}</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            aria-label={isMuted ? 'Sesi aç' : 'Sesi kapat'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <div
        ref={stageContainerRef}
        className={
          isTheaterFullscreen
            ? 'fixed inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 select-none'
            : isNativeFullscreen
              ? 'w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 select-none'
              : isMobileMode
                ? 'fixed inset-0 z-30 bg-slate-950 flex flex-col select-none touch-manipulation'
                : 'w-full select-none'
        }
      >
        {/* Telefon Modu Compact Top Action Strip */}
        {isMobileMode && !isFullscreen && (
          <div className="shrink-0 w-full px-2.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display font-extrabold text-sm text-white truncate">
                Uçan Fil
              </span>
              <span className="font-mono-num text-xs font-bold text-amber-400 shrink-0">
                R:{currentBest}
              </span>
              <span className="font-mono-num text-xs font-bold text-yellow-300 shrink-0">
                {peanutBank}F
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {creatorActive && (
                <button
                  type="button"
                  onClick={() => setIsCreatorPanelOpen(true)}
                  className="p-2 rounded-lg bg-amber-500/20 text-amber-300 cursor-pointer"
                  aria-label="Yapımcı Menüsü"
                >
                  <Crown className="w-4 h-4" />
                </button>
              )}
              {gameMode === 'leveled' && (
                <button
                  type="button"
                  onClick={() => setIsAchievementsOpen(true)}
                  className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 cursor-pointer"
                  aria-label="Başarımlar"
                >
                  <Award className="w-4 h-4" />
                </button>
              )}
              {(!user || user.isGuest) && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode(user?.isGuest ? 'register' : 'login');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Giriş
                </button>
              )}
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-lg bg-slate-800 text-slate-100 cursor-pointer"
                aria-label="Ses"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMode(false)}
                className="px-2 py-1.5 rounded-lg bg-emerald-400 text-slate-950 text-[11px] font-extrabold cursor-pointer"
                title="Telefon Modundan Çık"
              >
                PC
              </button>
            </div>
          </div>
        )}

        {/* Arena Wrapper: catches thumb taps outside canvas in Telefon Modu & houses unclipped overlays */}
        <div
          ref={arenaWrapperRef}
          onPointerDown={() => {
            if (isMobileMode && gameStateRef.current === 'PLAYING') {
              handleCanvasAction();
            }
          }}
          className={
            isFullscreen || isMobileMode
              ? 'relative flex-1 min-h-0 w-full h-full flex flex-col items-center justify-center bg-slate-950 touch-none overflow-hidden'
              : 'relative w-full flex items-center justify-center'
          }
        >
          <div
            style={
              (isFullscreen || isMobileMode) && fittedStageSize
                ? { width: `${fittedStageSize.width}px`, height: `${fittedStageSize.height}px` }
                : undefined
            }
            className={`relative aspect-[860/540] overflow-hidden shadow-2xl border border-slate-700/70 bg-slate-900 ${
              isFullscreen
                ? 'rounded-xl max-w-full max-h-full'
                : isMobileMode
                  ? 'rounded-lg max-w-full max-h-full'
                  : 'w-full rounded-2xl'
            }`}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={(e) => {
                if (isMobileMode && gameStateRef.current === 'PLAYING') {
                  e.stopPropagation();
                }
                handleCanvasAction();
              }}
              className="w-full h-full block cursor-pointer touch-none"
            />

            {/* Active Shield Indicator during Play */}
            {gameState === 'PLAYING' && hasActiveShield && (
              <div className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/85 border border-sky-400/50 text-xs font-bold text-sky-300">
                <Shield className="w-3.5 h-3.5" />
                <span>Kalkan</span>
              </div>
            )}
            {gameState === 'PLAYING' &&
              gameMode === 'leveled' &&
              !currentLevelConfig.shieldUnlocked &&
              upgrades.shieldCount > 0 && (
                <div className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-slate-400">
                  <Lock className="w-3 h-3" />
                  <span>Kalkan: 3. Bölümde Açılır</span>
                </div>
              )}

            {/* Live Score HUD */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <div className="pointer-events-none absolute top-3 left-0 right-0 flex flex-col items-center">
                {gameMode === 'leveled' && (
                  <div className="mb-1 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 border border-emerald-400/50 text-xs font-extrabold text-emerald-300 shadow">
                    <Flag className="w-3.5 h-3.5" />
                    <span>
                      Bölüm {currentLevelConfig.chapter} ({currentLevelConfig.stageInChapter}/5) · Sv.{selectedLevel} ·{' '}
                      {Math.min(levelPipesCleared, currentLevelConfig.targetPipes)}/{currentLevelConfig.targetPipes} Boru
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-slate-900/90"
                      style={{
                        color: currentLevelConfig.difficultyColor,
                        borderColor: `${currentLevelConfig.difficultyColor}55`,
                      }}
                    >
                      {currentLevelConfig.difficultyLabel}
                    </span>
                  </div>
                )}
                <div
                  className="font-mono-num text-4xl sm:text-6xl font-extrabold text-white tracking-tight"
                  style={{
                    textShadow: '0 4px 0 #0F172A',
                  }}
                >
                  {score}
                </div>
                {gameMode === 'leveled' && bossHud ? (
                  <div className="mt-1.5 w-56 sm:w-72 rounded-xl bg-slate-950/90 border border-rose-500/60 px-3 py-1.5 shadow-lg">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold">
                      <span className={bossHud.kind === 'boss' ? 'text-rose-300' : 'text-amber-300'}>
                        {bossHud.kind === 'boss' ? 'BÜYÜK PATRON' : 'MİNİ PATRON'} · {bossHud.name}
                      </span>
                      <span className="font-mono-num text-white">
                        {bossHud.hp}/{bossHud.maxHp}
                      </span>
                    </div>
                    <div className="mt-1 w-full h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-100 ${
                          bossHud.enraged ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                        style={{
                          width: `${Math.max(0, Math.round((bossHud.hp / Math.max(1, bossHud.maxHp)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="mt-0.5 text-[9px] text-center font-semibold text-slate-300">
                      Kulak çırp = Fıstık Atışı!
                    </div>
                  </div>
                ) : (
                  gameMode === 'leveled' && (
                    <div className="mt-1 w-36 sm:w-44 h-2 rounded-full bg-slate-950/80 border border-slate-700/80 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-200"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((levelPipesCleared / Math.max(1, currentLevelConfig.targetPipes)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  )
                )}
                {dropBanner && (
                  <div className="mt-2 px-3 py-1 rounded-lg bg-purple-950/95 border border-purple-400/60 text-xs sm:text-sm font-bold text-purple-100 shadow-lg">
                    {dropBanner}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top-right Stage Controls (Always above overlays so fullscreen exit works everywhere!) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-2.5 right-2.5 z-40 flex items-center gap-1.5"
          >
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <div className="pointer-events-none inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/85 border border-slate-700/80 text-[10px] sm:text-[11px] font-bold text-slate-100">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: currentBiome.badgeColor }}
                />
                <span>{currentBiome.name}</span>
              </div>
            )}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && isMobileMode && (
              <button
                type="button"
                onClick={togglePause}
                className="p-2 rounded-lg bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-100 transition-colors cursor-pointer touch-manipulation"
                aria-label="Duraklat"
              >
                {gameState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileMode((prev) => !prev)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                isMobileMode
                  ? 'bg-emerald-400 border-emerald-300 text-slate-950'
                  : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700/80 text-emerald-300'
              }`}
              title="Telefon Modu"
              aria-label="Telefon Modu"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`inline-flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                isFullscreen
                  ? 'px-2.5 py-2 bg-sky-400 hover:bg-sky-300 border-sky-300 text-slate-950 font-bold text-xs shadow-lg'
                  : 'p-2 bg-slate-900/85 hover:bg-slate-800 border-slate-700/80 text-slate-100'
              }`}
              title={isFullscreen ? 'Tam ekrandan çık (F / ESC)' : 'Tam ekran (F)'}
              aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 shrink-0" /> : <Maximize2 className="w-4 h-4 shrink-0" />}
              {isFullscreen && <span>Çık</span>}
            </button>
          </div>

          {/* Portrait Thumb Tap Helper Strip in Telefon Modu */}
          {isMobileMode && gameState === 'PLAYING' && (
            <div className="sm:hidden mt-4 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 pointer-events-none">
              Zıplamak için ekranın herhangi bir yerine dokun 👆
            </div>
          )}

          {/* TITLE MENU OVERLAY (Covers full mobile arena so never clipped!) */}
          {gameState === 'TITLE_MENU' && !isShopOpen && !isSellOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 z-30 bg-slate-950/40 overflow-y-auto flex items-center justify-center sm:justify-end pt-12 pb-3 px-2.5 sm:pt-12 sm:pb-6 sm:px-6"
            >
              <div className="my-auto w-full max-w-[420px] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Uçuşa Hazırlan
                  </h2>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">
                    Filin yapısını, zorluğu ve kozmetiklerini seç.
                  </p>
                </div>

                {/* Game Mode Selector (Directly above Fil Yapısı) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
                    <span>Oyun Modu</span>
                    <span className="text-slate-200 font-medium">
                      {GAME_MODE_CONFIGS[gameMode].description}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800 rounded-xl">
                    {(['classic', 'leveled'] as GameMode[]).map((modeKey) => {
                      const cfg = GAME_MODE_CONFIGS[modeKey];
                      const active = gameMode === modeKey;
                      return (
                        <button
                          key={modeKey}
                          type="button"
                          onClick={() => switchGameMode(modeKey)}
                          className={`py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                            active
                              ? modeKey === 'leveled'
                                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                                : 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{cfg.label}</span>
                          {modeKey === 'leveled' && (
                            <span
                              className={`text-[10px] font-mono-num font-extrabold px-1.5 py-0.5 rounded ${
                                active
                                  ? 'bg-emerald-950/20 text-emerald-950'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              Sv.{unlockedLevel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chapter & Level Picker when Seviyeli mode is active */}
                {gameMode === 'leveled' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40">
                      <button
                        type="button"
                        disabled={selectedLevel <= 1}
                        onClick={() => setSelectedLevel((prev) => Math.max(1, prev - 1))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Önceki Seviye"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-center min-w-0">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300">
                          <span>
                            Bölüm {currentLevelConfig.chapter}: {currentLevelConfig.chapterTitle}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-emerald-300">
                            Aşama {currentLevelConfig.stageInChapter}/5
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold text-emerald-300 truncate">
                          <span>Sv.{selectedLevel} · {currentLevelConfig.title}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-slate-950/70 shrink-0"
                            style={{
                              color: currentLevelConfig.difficultyColor,
                              borderColor: `${currentLevelConfig.difficultyColor}66`,
                            }}
                          >
                            {currentLevelConfig.difficultyLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {currentLevelConfig.targetPipes} Boru · Ödül{' '}
                          <span className="font-mono-num font-bold text-yellow-300">
                            +{selectedLevel >= unlockedLevel ? currentLevelConfig.rewardPeanuts : currentLevelConfig.replayPeanuts}F
                          </span>
                          {selectedLevel >= unlockedLevel && currentLevelConfig.rewardCrateTier && (
                            <span className="ml-1 text-cyan-300 font-bold">
                              + {CRATE_TIER_CONFIGS[currentLevelConfig.rewardCrateTier].name}
                            </span>
                          )}
                          <span
                            className={`ml-1.5 text-[10px] font-semibold ${
                              currentLevelConfig.shieldUnlocked ? 'text-sky-300' : 'text-slate-400'
                            }`}
                          >
                            · {currentLevelConfig.shieldUnlocked ? 'Kalkan Açık' : 'Kalkan 3. Bölüm+'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={selectedLevel >= unlockedLevel}
                        onClick={() => setSelectedLevel((prev) => Math.min(unlockedLevel, prev + 1))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Sonraki Seviye"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAchievementsOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-300" />
                      <span>
                        Seviyeli Başarımlar ({unlockedAchievements.length}/{LEVELED_ACHIEVEMENTS.length})
                      </span>
                    </button>
                  </div>
                )}

                {/* Body Type Selector */}
                <div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
                    <span>
                      Fil Yapısı{' '}
                      <span className="text-[10px] font-semibold text-slate-500">
                        ({gameMode === 'leveled' ? 'Seviyelide Otomatik Normal' : 'Klasik Karakteri'})
                      </span>
                    </span>
                    <span className="text-slate-200 font-medium">
                      {BODY_TYPE_CONFIGS[activeBodyType].subtitle}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-xl">
                    {(['slim', 'normal', 'chubby'] as BodyType[]).map((bt) => {
                      const cfg = BODY_TYPE_CONFIGS[bt];
                      const active = activeBodyType === bt;
                      const lockedInLeveled = gameMode === 'leveled' && bt !== 'normal';
                      return (
                        <button
                          key={bt}
                          type="button"
                          disabled={lockedInLeveled}
                          onClick={() => setActiveBodyType(bt)}
                          className={`py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                            lockedInLeveled
                              ? 'text-slate-600 opacity-45 cursor-not-allowed'
                              : active
                                ? gameMode === 'leveled'
                                  ? 'bg-emerald-400 text-slate-950 shadow-sm cursor-pointer'
                                  : 'bg-sky-400 text-slate-950 shadow-sm cursor-pointer'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/60 cursor-pointer'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
                    <span>Zorluk</span>
                    <span className="text-slate-200 font-medium">
                      {gameMode === 'leveled' && !isLeveledTurboUnlocked
                        ? '10. Sv sonrası Turbo açılır'
                        : DIFFICULTY_CONFIGS[activeDifficulty].description}
                    </span>
                  </div>
                  {gameMode === 'leveled' ? (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800 rounded-xl">
                      {(['classic', 'turbo'] as const).map((diffKey) => {
                        const cfg = DIFFICULTY_CONFIGS[diffKey];
                        const isLocked = diffKey === 'turbo' && !isLeveledTurboUnlocked;
                        const active = activeDifficulty === diffKey;
                        return (
                          <button
                            key={diffKey}
                            type="button"
                            disabled={isLocked}
                            onClick={() => {
                              if (isLocked) return;
                              leveledDifficultyRef.current = diffKey;
                              activeDifficultyRef.current = diffKey;
                              setLeveledDifficulty(diffKey);
                            }}
                            className={`py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1 ${
                              isLocked
                                ? 'text-slate-500 opacity-60 cursor-not-allowed'
                                : active
                                  ? 'bg-emerald-400 text-slate-950 shadow-sm cursor-pointer'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60 cursor-pointer'
                            }`}
                          >
                            {isLocked && <Lock className="w-3 h-3 shrink-0" />}
                            <span>{cfg.label}</span>
                            {diffKey === 'turbo' && (
                              <span
                                className={`text-[10px] font-extrabold ${
                                  isLocked
                                    ? 'text-slate-400'
                                    : active
                                      ? 'text-rose-700'
                                      : 'text-amber-300'
                                }`}
                              >
                                {isLocked ? '10. Sv+' : '2x'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-xl">
                      {(['easy', 'classic', 'turbo'] as Difficulty[]).map((diffKey) => {
                        const cfg = DIFFICULTY_CONFIGS[diffKey];
                        const active = difficulty === diffKey;
                        return (
                          <button
                            key={diffKey}
                            type="button"
                            onClick={() => {
                              difficultyRef.current = diffKey;
                              activeDifficultyRef.current = diffKey;
                              setDifficulty(diffKey);
                            }}
                            className={`py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                              active
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                            }`}
                          >
                            {cfg.label}
                            {diffKey === 'turbo' && (
                              <span
                                className={`ml-1 text-[10px] font-extrabold ${
                                  active ? 'text-rose-700' : 'text-amber-300'
                                }`}
                              >
                                2x
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => startGame()}
                    className={`w-full py-3 sm:py-3.5 px-6 rounded-xl active:scale-[0.99] text-slate-950 font-display font-extrabold text-base sm:text-lg transition-all cursor-pointer shadow-lg touch-manipulation ${
                      gameMode === 'leveled'
                        ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
                        : 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/20'
                    }`}
                  >
                    {gameMode === 'leveled' ? `Seviye ${selectedLevel}'e Başla` : 'Uçuşa Başla'}
                  </button>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShopInitialTab('market');
                        setIsShopOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1 py-2 sm:py-2.5 px-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span>Market</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSavedCharsOpen(true)}
                      className="inline-flex items-center justify-center gap-1 py-2 sm:py-2.5 px-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 shrink-0" />
                      <span>Karakterler</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLeaderboardOpen(true)}
                      className="inline-flex items-center justify-center gap-1 py-2 sm:py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span>Sıralama</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === 'PAUSED' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className={`absolute inset-0 z-30 bg-slate-950/75 overflow-y-auto flex items-center justify-center p-3 sm:p-4 ${
                isMobileMode ? '' : 'backdrop-blur-[2px]'
              }`}
            >
              <div className="my-auto w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 text-center shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">Oyun Duraklatıldı</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Fil havada nefes alıyor.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors cursor-pointer touch-manipulation"
                  >
                    Devam Et
                  </button>
                  <button
                    type="button"
                    onClick={() => startGame()}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer touch-manipulation"
                  >
                    Baştan Başla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetWorld();
                      gameStateRef.current = 'TITLE_MENU';
                      setGameState('TITLE_MENU');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer touch-manipulation"
                  >
                    Ana Menü
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY (Scrollable & responsive so never clipped/softlocked on phones!) */}
          {gameState === 'GAME_OVER' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className={`absolute inset-0 z-30 bg-slate-950/75 overflow-y-auto flex items-center justify-center p-3 sm:p-4 ${
                isMobileMode ? '' : 'backdrop-blur-[2px]'
              }`}
            >
              <div className="my-auto w-full max-w-sm bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center">
                <div className="text-xs font-semibold tracking-wide text-rose-400">
                  Uçuş Bitti
                </div>
                <h2 className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white">
                  {isNewRecord ? 'Yeni Rekor!' : 'İyi Deneme!'}
                </h2>

                {medal && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${medal.colorClass} ${medal.ringClass}`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{medal.label}</span>
                  </div>
                )}

                {runDrops.length > 0 && (
                  <div className="mt-2 text-xs text-purple-300 font-semibold">
                    Kutudan Çıkan: {runDrops.map((d) => d.name).join(', ')}
                  </div>
                )}

                {gameMode === 'leveled' && newlyUnlockedAchievements.length > 0 && (
                  <div className="mt-2.5 flex flex-col gap-1">
                    <div className="text-[11px] font-bold text-emerald-300">
                      Kazanılan Rozetler
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {newlyUnlockedAchievements.map((ach) => {
                        const tierStyle = MEDAL_TIER_STYLES[ach.medalTier];
                        return (
                          <span
                            key={ach.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold bg-gradient-to-r ${tierStyle.badgeBg} ${tierStyle.border} ${tierStyle.text}`}
                          >
                            <Award className="w-3 h-3" />
                            <span>{ach.title}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2 py-2.5 sm:py-3.5 border-y border-slate-800">
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-400">
                      {gameMode === 'leveled' ? 'Seviye' : 'Skor'}
                    </div>
                    <div className="mt-0.5 font-mono-num text-xl sm:text-2xl font-bold text-white">
                      {gameMode === 'leveled' ? `Sv.${selectedLevel}` : score}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-400">
                      {gameMode === 'leveled' ? 'En Yüksek' : 'En İyi'}
                    </div>
                    <div className="mt-0.5 font-mono-num text-xl sm:text-2xl font-bold text-amber-400">
                      {gameMode === 'leveled' ? `Sv.${unlockedLevel}` : currentBest}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-400">Fıstık</div>
                    <div className="mt-0.5 font-mono-num text-xl sm:text-2xl font-bold text-yellow-300">
                      +{peanutsCollected}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 sm:mt-5 flex flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => startGame()}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-display font-extrabold text-sm sm:text-base transition-all cursor-pointer touch-manipulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Tekrar Oyna</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetWorld();
                      gameStateRef.current = 'TITLE_MENU';
                      setGameState('TITLE_MENU');
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer touch-manipulation"
                  >
                    Menü
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL COMPLETE OVERLAY (Seviyeli Mode) */}
          {gameState === 'LEVEL_COMPLETE' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className={`absolute inset-0 z-30 bg-slate-950/75 overflow-y-auto flex items-center justify-center p-3 sm:p-4 ${
                isMobileMode ? '' : 'backdrop-blur-[2px]'
              }`}
            >
              <div className="my-auto w-full max-w-sm bg-slate-900/95 border border-emerald-400/70 rounded-2xl p-4 sm:p-6 shadow-2xl text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-extrabold tracking-wide text-emerald-400">
                  <span>
                    Bölüm {levelRewardSummary?.chapter ?? currentLevelConfig.chapter} · Sv.
                    {levelRewardSummary?.level ?? selectedLevel} ({levelRewardSummary?.stageInChapter ?? currentLevelConfig.stageInChapter}/5)
                  </span>
                  {levelRewardSummary?.difficultyLabel && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-slate-950/80"
                      style={{
                        color: levelRewardSummary.difficultyColor,
                        borderColor: `${levelRewardSummary.difficultyColor}66`,
                      }}
                    >
                      {levelRewardSummary.difficultyLabel}
                    </span>
                  )}
                </div>
                <h2 className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white">
                  {levelRewardSummary?.isChapterEnd
                    ? `${levelRewardSummary.chapter}. Bölüm Geçildi! 🏆`
                    : 'Seviye Tamamlandı!'}
                </h2>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  {levelRewardSummary && levelRewardSummary.peanuts > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-yellow-400/50 bg-yellow-500/15 text-xs font-bold text-yellow-200">
                      +{levelRewardSummary.peanuts} Ödül Fıstık
                    </span>
                  )}
                  {levelRewardSummary?.crateTier && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-400/60 bg-cyan-500/15 text-xs font-bold text-cyan-200">
                      <Package className="w-3.5 h-3.5" />
                      <span>+1 {CRATE_TIER_CONFIGS[levelRewardSummary.crateTier].name}!</span>
                    </span>
                  )}
                </div>

                {newlyUnlockedAchievements.length > 0 && (
                  <div className="mt-2.5 flex flex-col gap-1">
                    <div className="text-[11px] font-bold text-emerald-300">
                      Yeni Kazanılan Rozetler
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {newlyUnlockedAchievements.map((ach) => {
                        const tierStyle = MEDAL_TIER_STYLES[ach.medalTier];
                        return (
                          <span
                            key={ach.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold bg-gradient-to-r ${tierStyle.badgeBg} ${tierStyle.border} ${tierStyle.text}`}
                          >
                            <Award className="w-3 h-3" />
                            <span>{ach.title}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2 py-2.5 sm:py-3.5 border-y border-slate-800">
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-400">Puan</div>
                    <div className="mt-0.5 font-mono-num text-xl sm:text-2xl font-bold text-white">
                      {score}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-400">Açık Seviye</div>
                    <div className="mt-0.5 font-mono-num text-xl sm:text-2xl font-bold text-emerald-400">
                      Sv.{unlockedLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-400">Fıstık</div>
                    <div className="mt-0.5 font-mono-num text-xl sm:text-2xl font-bold text-yellow-300">
                      +{peanutsCollected}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 sm:mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startGame(selectedLevel + 1)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-slate-950 font-display font-extrabold text-sm sm:text-base transition-all cursor-pointer touch-manipulation"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Sonraki Seviye (Sv.{selectedLevel + 1})</span>
                  </button>
                  <div className="flex flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => startGame(selectedLevel)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer touch-manipulation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Tekrar Oyna</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLevel(unlockedLevel);
                        resetWorld();
                        gameStateRef.current = 'TITLE_MENU';
                        setGameState('TITLE_MENU');
                      }}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer touch-manipulation"
                    >
                      Menü
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Legend */}
      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
        <div>
          Space / Yukarı Ok / Tıkla ile kulak çırp · F tam ekran · P duraklat · M ses
        </div>
        <div>
          {upgrades.shieldCount > 0 && `Kalkan: ${upgrades.shieldCount} · `}
          {upgrades.magnetLevel > 0 && `Mıknatıs Sv.${upgrades.magnetLevel} · `}
          Skor arttıkça 30 farklı biyom açılır
        </div>
      </footer>

      {/* Modals */}
      <ShopModal
        isOpen={isShopOpen}
        initialTab={shopInitialTab}
        gameMode={gameMode}
        onSwitchToLeveled={() => switchGameMode('leveled')}
        onClose={() => setIsShopOpen(false)}
        peanutBank={peanutBank}
        bodyType={activeBodyType}
        onChangeBodyType={setActiveBodyType}
        unlockedIds={unlockedIds}
        equipped={activeEquipped}
        unlockedNameColors={unlockedNameColors}
        equippedNameColor={activeNameColor}
        previewPlayerName={customDisplayName || user?.displayName || 'Uçan Fil'}
        upgrades={upgrades}
        crateInventory={crateInventory}
        onSelectOrBuyCosmetic={handleSelectOrBuyCosmetic}
        onEquipCosmetic={handleEquipCosmetic}
        onSelectOrBuyNameColor={handleSelectOrBuyNameColor}
        onOpenCrate={handleOpenMarketCrate}
        onBuyCrates={handleBuyCrates}
        onOpenCratesFromInventory={handleOpenCratesFromInventory}
        onUpgradeMagnet={handleUpgradeMagnet}
        onUpgradeDoublePeanut={handleUpgradeDoublePeanut}
        onBuyShield={handleBuyShield}
        onUltraRareDrop={(item) => {
          setRareExplosionIsTest(false);
          setRareExplosionItem(item);
        }}
      />

      <CosmeticSellModal
        isOpen={isSellOpen}
        onClose={() => setIsSellOpen(false)}
        peanutBank={peanutBank}
        unlockedIds={unlockedIds}
        equipped={activeEquipped}
        onSellCosmetic={handleSellCosmetic}
        onSellBulkCosmetics={handleSellBulkCosmetics}
      />

      <DailyQuestsModal
        isOpen={isDailyQuestsOpen}
        onClose={() => setIsDailyQuestsOpen(false)}
        quests={todaysQuests}
        questState={dailyQuestsState}
        onClaimReward={handleClaimQuestReward}
        onClaimAllRewards={handleClaimAllQuestRewards}
      />

      <AvatarExportModal
        isOpen={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        bodyType={activeBodyType}
        equipped={activeEquipped}
      />

      <SavedCharactersModal
        isOpen={isSavedCharsOpen}
        onClose={() => setIsSavedCharsOpen(false)}
        presets={savedCharacters}
        currentBodyType={activeBodyType}
        currentEquipped={activeEquipped}
        currentNameColorId={activeNameColor}
        previewPlayerName={customDisplayName || user?.displayName || 'Uçan Fil'}
        onSavePreset={handleSaveCharacterPreset}
        onLoadPreset={handleLoadCharacterPreset}
        onOverwritePreset={handleOverwriteCharacterPreset}
        onDeletePreset={handleDeleteCharacterPreset}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboardEntries}
        loading={leaderboardLoading}
        errorMsg={leaderboardError}
        leveledEntries={leveledEntries}
        leveledLoading={leveledLoading}
        leveledErrorMsg={leveledError}
        initialModeTab={gameMode}
        user={user}
        isCreator={creatorActive}
        peanutBank={peanutBank}
        customDisplayName={customDisplayName}
        equippedNameColor={activeNameColor}
        hasCustomName={
          selfLeaderboardEntry?.hasCustomName ?? selfLeaderboardMeta?.hasCustomName ?? false
        }
        lastNameChangeMs={
          selfLeaderboardEntry?.lastNameChangeMs ?? selfLeaderboardMeta?.lastNameChangeMs
        }
        onOpenNameColorShop={() => {
          setIsLeaderboardOpen(false);
          setIsSellOpen(false);
          setShopInitialTab('nameColors');
          setIsShopOpen(true);
        }}
        onSaveDisplayName={async (newName) => {
          if (!user || user.isGuest) {
            throw new Error('İsim değiştirmek için kayıtlı hesabına giriş yapmalısın.');
          }
          if (peanutBankRef.current < RENAME_PEANUT_COST) {
            throw new Error(`İsim değiştirmek için ${RENAME_PEANUT_COST} Fıstık gerekiyor.`);
          }
          const bestLocal = Math.max(
            highScoresRef.current.easy,
            highScoresRef.current.classic,
            highScoresRef.current.turbo
          );
          const res = await submitLeaderboardScore({
            user,
            score: bestLocal,
            difficulty: difficultyRef.current,
            bodyType: bodyTypeRef.current,
            equipped: equippedRef.current,
            nameColorId: equippedNameColorRef.current,
            customDisplayName: newName,
            forceWrite: true,
          });
          if (res.renamed) {
            setPeanutBank((prev) => Math.max(0, prev - RENAME_PEANUT_COST));
            soundEngine.playCrateUnlock();
          }
          setCustomDisplayName(res.displayName);
          customDisplayNameRef.current = res.displayName;
          setSelfLeaderboardMeta({
            displayName: res.displayName,
            hasCustomName: res.hasCustomName,
            lastNameChangeMs: res.lastNameChangeMs,
          });
        }}
        onSignIn={() => {
          setIsLeaderboardOpen(false);
          setAuthModalMode(user?.isGuest ? 'register' : 'login');
          setIsAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {creatorActive && (
        <CreatorPanelModal
          isOpen={isCreatorPanelOpen}
          onClose={() => setIsCreatorPanelOpen(false)}
          godMode={godMode}
          onToggleGodMode={() => setGodMode((prev) => !prev)}
          speedMultiplier={speedMultiplier}
          onChangeSpeedMultiplier={(val) => setSpeedMultiplier(val)}
          onGrantAllItems={grantCreatorEverything}
          onGrantSecretTuxedo={grantSecretTuxedo}
          onGrantAllSuits={grantAllSuits}
          onGrantAllLeveledSuits={grantAllLeveledSuits}
          onGrantOutfitCrates={grantOutfitCrates}
          onGrantLeveledSuitCrates={grantLeveledSuitCrates}
          onTestRareDropAnimation={(suitId) => {
            const secretSuits = COSMETIC_CATALOG.filter((c) => c.category === 'suit');
            const picked =
              (suitId && COSMETIC_BY_ID[suitId]) ||
              secretSuits[Math.floor(Math.random() * secretSuits.length)] ||
              COSMETIC_BY_ID['suit_tuxedo'];
            if (picked) {
              setRareExplosionIsTest(true);
              setRareExplosionItem(picked);
            }
          }}
          onAddPeanuts={(amount) => setPeanutBank((prev) => prev + amount)}
          onSetCreatorLeaderboardScore={async (newScore) => {
            const cleanScore = Math.max(0, Math.min(999999, Math.floor(newScore)));
            const updatedScores = {
              ...highScoresRef.current,
              [difficultyRef.current]: cleanScore,
            };
            highScoresRef.current = updatedScores;
            setHighScores(updatedScores);
            saveHighScores(updatedScores);
            if (user && !user.isGuest) {
              await submitLeaderboardScore({
                user,
                score: cleanScore,
                difficulty: difficultyRef.current,
                bodyType: bodyTypeRef.current,
                equipped: equippedRef.current,
                nameColorId: equippedNameColorRef.current,
                forceWrite: true,
              });
            }
          }}
          onSetCreatorLevel={async (newLevel) => {
            const cleanLvl = Math.max(1, Math.min(9999, Math.floor(newLevel)));
            unlockedLevelRef.current = cleanLvl;
            selectedLevelRef.current = cleanLvl;
            setUnlockedLevel(cleanLvl);
            setSelectedLevel(cleanLvl);
            if (user && !user.isGuest) {
              await submitLeveledLeaderboardScore({
                user,
                maxLevel: cleanLvl,
                bestLevelScore: bestLevelScoreRef.current,
                completedLevels: Math.max(completedLevelsRef.current, cleanLvl - 1),
                difficulty:
                  cleanLvl > 10 && leveledDifficultyRef.current === 'turbo' ? 'turbo' : 'classic',
                bodyType: 'normal',
                equipped: leveledEquippedRef.current,
                nameColorId: leveledNameColorRef.current,
                forceWrite: true,
              });
            }
          }}
          leaderboardEntries={leaderboardEntries}
          leveledEntries={leveledEntries}
          onDeleteLeaderboardEntry={deleteLeaderboardEntry}
          onDeleteLeveledLeaderboardEntry={deleteLeveledLeaderboardEntry}
          bannedIps={bannedIps}
          bannedUids={bannedUids}
          onBanPlayer={(entry, reason) =>
            banPlayerByUidAndIp({
              targetUid: entry.uid,
              displayName: entry.displayName,
              reason,
            })
          }
          onBanIpManually={banIpManually}
          onUnbanIp={unbanIp}
          onUnbanUid={unbanUid}
          biomeOverrideId={creatorBiomeOverride}
          onChangeBiomeOverride={(id) => {
            creatorBiomeOverrideRef.current = id;
            setCreatorBiomeOverride(id);
          }}
        />
      )}

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        unlockedAchievementIds={unlockedAchievements}
        unlockedLevel={unlockedLevel}
        bestLeveledScore={bestLevelScore}
        bestLeveledCleanFlightSec={bestLeveledCleanFlightSec}
      />

      <RareDropExplosionModal
        item={rareExplosionItem}
        bodyType={activeBodyType}
        equipped={activeEquipped}
        isTestPreview={rareExplosionIsTest}
        onClose={() => {
          setRareExplosionItem(null);
          setRareExplosionIsTest(false);
        }}
        onEquipAndClose={(item) => {
          handleEquipCosmetic(item);
          setRareExplosionItem(null);
          setRareExplosionIsTest(false);
        }}
      />
    </div>
  );
}
