import { COSMETIC_BY_ID } from '../data/cosmetics';
import {
  BODY_TYPE_CONFIGS,
  BodyType,
  BossProjectile,
  BossState,
  Cloud,
  CosmeticCrate,
  CosmeticItem,
  ELEPHANT_RADIUS,
  ElephantState,
  EquippedCosmetics,
  FinishGate,
  FloatingText,
  GROUND_HEIGHT,
  Particle,
  PeanutBonus,
  PipePair,
  PlayerBolt,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../types/game';

interface RenderSceneParams {
  ctx: CanvasRenderingContext2D;
  elephant: ElephantState;
  bodyType: BodyType;
  equipped: EquippedCosmetics;
  hasShield: boolean;
  pipes: PipePair[];
  peanuts: PeanutBonus[];
  crates: CosmeticCrate[];
  finishGate?: FinishGate | null;
  boss?: BossState | null;
  bossProjectiles?: BossProjectile[];
  playerBolts?: PlayerBolt[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  clouds: Cloud[];
  groundOffset: number;
  bgOffset: number;
  score: number;
  biomeScoreOverride?: number;
  biomeIndexOverride?: number | null;
  biomeIdOverride?: string | null;
  time: number;
  flashAlpha: number;
  mobilePerf?: boolean;
}

function adjustHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export interface BiomeTheme {
  id: string;
  name: string;
  badgeColor: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  celestialStyle: 'sun' | 'sunset' | 'crescent' | 'arctic' | 'volcanic' | 'cyber' | 'cosmic';
  sunColor: string;
  sunGlow: string;
  cloudTint: string;
  cloudOpacityMult: number;
  hillFar: string;
  hillNear: string;
  sceneryStyle: 'acacia' | 'sakura' | 'pine' | 'volcano' | 'cyber' | 'crystal';
  sceneryPrimary: string;
  sceneryAccent: string;
  ambientStyle: 'none' | 'dust' | 'sakura' | 'snow' | 'embers' | 'sparks' | 'cosmic';
  isNight: boolean;
  hasAurora: boolean;
  auroraColors: [string, string];
  pipeDark: string;
  pipeMid: string;
  pipeLight: string;
  pipeCapHighlight: string;
  pipeTrim: string | null;
  groundTop: string;
  groundStripe: string;
  groundStripeStyle: 'slanted' | 'grid' | 'cracks' | 'crystal';
  earthTop: string;
  earthMid: string;
  earthBottom: string;
  pebbleColor: string;
}

export const BIOME_THEMES: BiomeTheme[] = [
  {
    id: 'savanna_day',
    name: 'Savan Sabahı',
    badgeColor: '#38BDF8',
    skyTop: '#0284C7',
    skyMid: '#7DD3FC',
    skyBottom: '#FEF3C7',
    celestialStyle: 'sun',
    sunColor: '#FEF08A',
    sunGlow: 'rgba(254, 240, 138, 0.34)',
    cloudTint: '255, 255, 255',
    cloudOpacityMult: 1,
    hillFar: '#60A5FA',
    hillNear: '#2E7D32',
    sceneryStyle: 'acacia',
    sceneryPrimary: '#1B5E20',
    sceneryAccent: '#4ADE80',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#2DD4BF', '#A855F7'],
    pipeDark: '#14532D',
    pipeMid: '#22C55E',
    pipeLight: '#4ADE80',
    pipeCapHighlight: '#86EFAC',
    pipeTrim: null,
    groundTop: '#4ADE80',
    groundStripe: '#16A34A',
    groundStripeStyle: 'slanted',
    earthTop: '#D97706',
    earthMid: '#B45309',
    earthBottom: '#78350F',
    pebbleColor: 'rgba(254, 243, 199, 0.16)',
  },
  {
    id: 'emerald_rainforest',
    name: 'Zümrüt Orman',
    badgeColor: '#10B981',
    skyTop: '#064E3B',
    skyMid: '#059669',
    skyBottom: '#A7F3D0',
    celestialStyle: 'sun',
    sunColor: '#ECFDF5',
    sunGlow: 'rgba(52, 211, 153, 0.35)',
    cloudTint: '209, 250, 229',
    cloudOpacityMult: 0.9,
    hillFar: '#047857',
    hillNear: '#065F46',
    sceneryStyle: 'acacia',
    sceneryPrimary: '#022C22',
    sceneryAccent: '#34D399',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#34D399', '#2DD4BF'],
    pipeDark: '#064E3B',
    pipeMid: '#10B981',
    pipeLight: '#34D399',
    pipeCapHighlight: '#A7F3D0',
    pipeTrim: '#6EE7B7',
    groundTop: '#10B981',
    groundStripe: '#047857',
    groundStripeStyle: 'slanted',
    earthTop: '#78350F',
    earthMid: '#57280B',
    earthBottom: '#3B1A06',
    pebbleColor: 'rgba(167, 243, 208, 0.18)',
  },
  {
    id: 'golden_sunset',
    name: 'Altın Günbatımı',
    badgeColor: '#FB923C',
    skyTop: '#9A3412',
    skyMid: '#FB923C',
    skyBottom: '#FEF08A',
    celestialStyle: 'sunset',
    sunColor: '#FEF9C3',
    sunGlow: 'rgba(251, 146, 60, 0.42)',
    cloudTint: '254, 215, 170',
    cloudOpacityMult: 0.9,
    hillFar: '#B45309',
    hillNear: '#7C2D12',
    sceneryStyle: 'acacia',
    sceneryPrimary: '#431407',
    sceneryAccent: '#F59E0B',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#F59E0B', '#EF4444'],
    pipeDark: '#78350F',
    pipeMid: '#D97706',
    pipeLight: '#FBBF24',
    pipeCapHighlight: '#FDE68A',
    pipeTrim: '#FEF08A',
    groundTop: '#FBBF24',
    groundStripe: '#D97706',
    groundStripeStyle: 'slanted',
    earthTop: '#B45309',
    earthMid: '#92400E',
    earthBottom: '#451A03',
    pebbleColor: 'rgba(254, 215, 170, 0.20)',
  },
  {
    id: 'crimson_desert',
    name: 'Kızıl Çöl',
    badgeColor: '#F87171',
    skyTop: '#7F1D1D',
    skyMid: '#EA580C',
    skyBottom: '#FDBA74',
    celestialStyle: 'sunset',
    sunColor: '#FFEDD5',
    sunGlow: 'rgba(251, 146, 60, 0.45)',
    cloudTint: '254, 215, 170',
    cloudOpacityMult: 0.65,
    hillFar: '#C2410C',
    hillNear: '#9A3412',
    sceneryStyle: 'volcano',
    sceneryPrimary: '#7C2D12',
    sceneryAccent: '#FB923C',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#FB923C', '#F87171'],
    pipeDark: '#7C2D12',
    pipeMid: '#EA580C',
    pipeLight: '#FB923C',
    pipeCapHighlight: '#FED7AA',
    pipeTrim: '#FDE047',
    groundTop: '#FDBA74',
    groundStripe: '#C2410C',
    groundStripeStyle: 'cracks',
    earthTop: '#9A3412',
    earthMid: '#7C2D12',
    earthBottom: '#431407',
    pebbleColor: 'rgba(255, 237, 213, 0.20)',
  },
  {
    id: 'bamboo_valley',
    name: 'Bambu Vadisi',
    badgeColor: '#4ADE80',
    skyTop: '#0F766E',
    skyMid: '#2DD4BF',
    skyBottom: '#ECFCCB',
    celestialStyle: 'sun',
    sunColor: '#FEF9C3',
    sunGlow: 'rgba(163, 230, 53, 0.34)',
    cloudTint: '236, 253, 245',
    cloudOpacityMult: 0.88,
    hillFar: '#0D9488',
    hillNear: '#15803D',
    sceneryStyle: 'pine',
    sceneryPrimary: '#14532D',
    sceneryAccent: '#A3E635',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#4ADE80', '#2DD4BF'],
    pipeDark: '#365314',
    pipeMid: '#65A30D',
    pipeLight: '#A3E635',
    pipeCapHighlight: '#ECFCCB',
    pipeTrim: '#BEF264',
    groundTop: '#84CC16',
    groundStripe: '#4D7C0F',
    groundStripeStyle: 'slanted',
    earthTop: '#854D0E',
    earthMid: '#713F12',
    earthBottom: '#422006',
    pebbleColor: 'rgba(236, 252, 203, 0.20)',
  },
  {
    id: 'sakura_valley',
    name: 'Kiraz Çiçeği Vadisi',
    badgeColor: '#F472B6',
    skyTop: '#4C1D95',
    skyMid: '#DB2777',
    skyBottom: '#FBCFE8',
    celestialStyle: 'crescent',
    sunColor: '#FFF1F2',
    sunGlow: 'rgba(244, 114, 182, 0.35)',
    cloudTint: '253, 224, 239',
    cloudOpacityMult: 0.72,
    hillFar: '#7E22CE',
    hillNear: '#581C87',
    sceneryStyle: 'sakura',
    sceneryPrimary: '#3B0764',
    sceneryAccent: '#F9A8D4',
    ambientStyle: 'sakura',
    isNight: true,
    hasAurora: false,
    auroraColors: ['#F472B6', '#C084FC'],
    pipeDark: '#831843',
    pipeMid: '#DB2777',
    pipeLight: '#F472B6',
    pipeCapHighlight: '#FBCFE8',
    pipeTrim: '#FDF2F8',
    groundTop: '#F472B6',
    groundStripe: '#BE185D',
    groundStripeStyle: 'slanted',
    earthTop: '#6B21A8',
    earthMid: '#581C87',
    earthBottom: '#3B0764',
    pebbleColor: 'rgba(251, 207, 232, 0.20)',
  },
  {
    id: 'coral_reef',
    name: 'Mercan Ufukları',
    badgeColor: '#2DD4BF',
    skyTop: '#0369A1',
    skyMid: '#06B6D4',
    skyBottom: '#FECDD3',
    celestialStyle: 'sun',
    sunColor: '#FFF1F2',
    sunGlow: 'rgba(45, 212, 191, 0.38)',
    cloudTint: '224, 242, 254',
    cloudOpacityMult: 0.9,
    hillFar: '#0891B2',
    hillNear: '#0E7490',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#164E63',
    sceneryAccent: '#FB7185',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#2DD4BF', '#FB7185'],
    pipeDark: '#9F1239',
    pipeMid: '#FB7185',
    pipeLight: '#FDA4AF',
    pipeCapHighlight: '#FFE4E6',
    pipeTrim: '#2DD4BF',
    groundTop: '#2DD4BF',
    groundStripe: '#0F766E',
    groundStripeStyle: 'crystal',
    earthTop: '#0E7490',
    earthMid: '#155E75',
    earthBottom: '#083344',
    pebbleColor: 'rgba(254, 205, 211, 0.22)',
  },
  {
    id: 'autumn_woods',
    name: 'Sonbahar Korusu',
    badgeColor: '#F59E0B',
    skyTop: '#78350F',
    skyMid: '#D97706',
    skyBottom: '#FDE68A',
    celestialStyle: 'sunset',
    sunColor: '#FEF3C7',
    sunGlow: 'rgba(245, 158, 11, 0.38)',
    cloudTint: '254, 243, 199',
    cloudOpacityMult: 0.85,
    hillFar: '#92400E',
    hillNear: '#991B1B',
    sceneryStyle: 'sakura',
    sceneryPrimary: '#451A03',
    sceneryAccent: '#F97316',
    ambientStyle: 'sakura',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#F59E0B', '#DC2626'],
    pipeDark: '#7F1D1D',
    pipeMid: '#DC2626',
    pipeLight: '#F97316',
    pipeCapHighlight: '#FED7AA',
    pipeTrim: '#FACC15',
    groundTop: '#F59E0B',
    groundStripe: '#B45309',
    groundStripeStyle: 'slanted',
    earthTop: '#78350F',
    earthMid: '#451A03',
    earthBottom: '#291002',
    pebbleColor: 'rgba(253, 224, 71, 0.2)',
  },
  {
    id: 'lavender_steppe',
    name: 'Lavanta Bozkırı',
    badgeColor: '#A78BFA',
    skyTop: '#312E81',
    skyMid: '#7C3AED',
    skyBottom: '#DDD6FE',
    celestialStyle: 'crescent',
    sunColor: '#F5F3FF',
    sunGlow: 'rgba(167, 139, 250, 0.36)',
    cloudTint: '237, 233, 254',
    cloudOpacityMult: 0.85,
    hillFar: '#5B21B6',
    hillNear: '#4C1D95',
    sceneryStyle: 'acacia',
    sceneryPrimary: '#2E1065',
    sceneryAccent: '#C4B5FD',
    ambientStyle: 'cosmic',
    isNight: false,
    hasAurora: true,
    auroraColors: ['#A78BFA', '#F472B6'],
    pipeDark: '#4C1D95',
    pipeMid: '#8B5CF6',
    pipeLight: '#C4B5FD',
    pipeCapHighlight: '#EDE9FE',
    pipeTrim: '#FDE047',
    groundTop: '#A78BFA',
    groundStripe: '#6D28D9',
    groundStripeStyle: 'slanted',
    earthTop: '#5B21B6',
    earthMid: '#4C1D95',
    earthBottom: '#2E1065',
    pebbleColor: 'rgba(221, 214, 254, 0.2)',
  },
  {
    id: 'golden_temple',
    name: 'Altın Tapınak',
    badgeColor: '#FACC15',
    skyTop: '#1E293B',
    skyMid: '#854D0E',
    skyBottom: '#FEF08A',
    celestialStyle: 'sun',
    sunColor: '#FEF9C3',
    sunGlow: 'rgba(250, 204, 21, 0.42)',
    cloudTint: '254, 240, 138',
    cloudOpacityMult: 0.65,
    hillFar: '#713F12',
    hillNear: '#422006',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#292524',
    sceneryAccent: '#FACC15',
    ambientStyle: 'dust',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#FACC15', '#F59E0B'],
    pipeDark: '#713F12',
    pipeMid: '#CA8A04',
    pipeLight: '#FACC15',
    pipeCapHighlight: '#FEF9C3',
    pipeTrim: '#FFFFFF',
    groundTop: '#EAB308',
    groundStripe: '#854D0E',
    groundStripeStyle: 'grid',
    earthTop: '#713F12',
    earthMid: '#422006',
    earthBottom: '#1C1917',
    pebbleColor: 'rgba(254, 240, 138, 0.25)',
  },
  {
    id: 'frozen_glacier',
    name: 'Buzul Diyarı',
    badgeColor: '#67E8F9',
    skyTop: '#0F172A',
    skyMid: '#0284C7',
    skyBottom: '#E0F2FE',
    celestialStyle: 'arctic',
    sunColor: '#E0F2FE',
    sunGlow: 'rgba(103, 232, 249, 0.36)',
    cloudTint: '224, 242, 254',
    cloudOpacityMult: 0.85,
    hillFar: '#38BDF8',
    hillNear: '#0369A1',
    sceneryStyle: 'pine',
    sceneryPrimary: '#0C4A6E',
    sceneryAccent: '#F0F9FF',
    ambientStyle: 'snow',
    isNight: false,
    hasAurora: true,
    auroraColors: ['#22D3EE', '#A5F3FC'],
    pipeDark: '#0369A1',
    pipeMid: '#06B6D4',
    pipeLight: '#67E8F9',
    pipeCapHighlight: '#ECFEFF',
    pipeTrim: '#E0F2FE',
    groundTop: '#F0F9FF',
    groundStripe: '#7DD3FC',
    groundStripeStyle: 'slanted',
    earthTop: '#0284C7',
    earthMid: '#0369A1',
    earthBottom: '#082F49',
    pebbleColor: 'rgba(224, 242, 254, 0.25)',
  },
  {
    id: 'snowy_pine_forest',
    name: 'Karlı Çamlık',
    badgeColor: '#93C5FD',
    skyTop: '#1E3A8A',
    skyMid: '#3B82F6',
    skyBottom: '#DBEAFE',
    celestialStyle: 'arctic',
    sunColor: '#EFF6FF',
    sunGlow: 'rgba(147, 197, 253, 0.35)',
    cloudTint: '239, 246, 255',
    cloudOpacityMult: 0.9,
    hillFar: '#1D4ED8',
    hillNear: '#1E40AF',
    sceneryStyle: 'pine',
    sceneryPrimary: '#172554',
    sceneryAccent: '#FFFFFF',
    ambientStyle: 'snow',
    isNight: false,
    hasAurora: false,
    auroraColors: ['#60A5FA', '#E0F2FE'],
    pipeDark: '#1E3A8A',
    pipeMid: '#2563EB',
    pipeLight: '#60A5FA',
    pipeCapHighlight: '#DBEAFE',
    pipeTrim: '#FFFFFF',
    groundTop: '#EFF6FF',
    groundStripe: '#93C5FD',
    groundStripeStyle: 'slanted',
    earthTop: '#1D4ED8',
    earthMid: '#1E3A8A',
    earthBottom: '#0F172A',
    pebbleColor: 'rgba(219, 234, 254, 0.24)',
  },
  {
    id: 'polar_night',
    name: 'Kutup Gecesi',
    badgeColor: '#34D399',
    skyTop: '#020617',
    skyMid: '#0F172A',
    skyBottom: '#134E4A',
    celestialStyle: 'crescent',
    sunColor: '#ECFDF5',
    sunGlow: 'rgba(52, 211, 153, 0.42)',
    cloudTint: '153, 246, 228',
    cloudOpacityMult: 0.35,
    hillFar: '#115E59',
    hillNear: '#0F172A',
    sceneryStyle: 'pine',
    sceneryPrimary: '#042F2E',
    sceneryAccent: '#5EEAD4',
    ambientStyle: 'snow',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#34D399', '#22D3EE'],
    pipeDark: '#0F172A',
    pipeMid: '#0D9488',
    pipeLight: '#2DD4BF',
    pipeCapHighlight: '#99F6E4',
    pipeTrim: '#34D399',
    groundTop: '#2DD4BF',
    groundStripe: '#0F766E',
    groundStripeStyle: 'crystal',
    earthTop: '#134E4A',
    earthMid: '#0F172A',
    earthBottom: '#020617',
    pebbleColor: 'rgba(94, 234, 212, 0.22)',
  },
  {
    id: 'crystal_cavern',
    name: 'Kristal Mağara',
    badgeColor: '#38BDF8',
    skyTop: '#090D24',
    skyMid: '#1E3A8A',
    skyBottom: '#0E7490',
    celestialStyle: 'cosmic',
    sunColor: '#BAE6FD',
    sunGlow: 'rgba(56, 189, 248, 0.38)',
    cloudTint: '125, 211, 252',
    cloudOpacityMult: 0.25,
    hillFar: '#1E293B',
    hillNear: '#0F172A',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#020617',
    sceneryAccent: '#38BDF8',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#38BDF8', '#818CF8'],
    pipeDark: '#1E3A8A',
    pipeMid: '#0284C7',
    pipeLight: '#38BDF8',
    pipeCapHighlight: '#E0F2FE',
    pipeTrim: '#7DD3FC',
    groundTop: '#38BDF8',
    groundStripe: '#0369A1',
    groundStripeStyle: 'crystal',
    earthTop: '#1E293B',
    earthMid: '#0F172A',
    earthBottom: '#020617',
    pebbleColor: 'rgba(125, 211, 252, 0.25)',
  },
  {
    id: 'misty_swamp',
    name: 'Sisli Bataklık',
    badgeColor: '#A3E635',
    skyTop: '#14532D',
    skyMid: '#365314',
    skyBottom: '#A3E635',
    celestialStyle: 'crescent',
    sunColor: '#ECFCCB',
    sunGlow: 'rgba(163, 230, 53, 0.35)',
    cloudTint: '217, 249, 157',
    cloudOpacityMult: 0.72,
    hillFar: '#3F6212',
    hillNear: '#1A2E05',
    sceneryStyle: 'acacia',
    sceneryPrimary: '#052E16',
    sceneryAccent: '#84CC16',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: false,
    auroraColors: ['#84CC16', '#10B981'],
    pipeDark: '#1A2E05',
    pipeMid: '#4D7C0F',
    pipeLight: '#84CC16',
    pipeCapHighlight: '#D9F99D',
    pipeTrim: '#BEF264',
    groundTop: '#65A30D',
    groundStripe: '#365314',
    groundStripeStyle: 'slanted',
    earthTop: '#365314',
    earthMid: '#1A2E05',
    earthBottom: '#090E02',
    pebbleColor: 'rgba(190, 242, 100, 0.22)',
  },
  {
    id: 'thunder_peak',
    name: 'Fırtına Tepesi',
    badgeColor: '#60A5FA',
    skyTop: '#0F172A',
    skyMid: '#334155',
    skyBottom: '#475569',
    celestialStyle: 'cyber',
    sunColor: '#93C5FD',
    sunGlow: 'rgba(56, 189, 248, 0.36)',
    cloudTint: '148, 163, 184',
    cloudOpacityMult: 0.8,
    hillFar: '#1E293B',
    hillNear: '#0F172A',
    sceneryStyle: 'volcano',
    sceneryPrimary: '#020617',
    sceneryAccent: '#38BDF8',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#38BDF8', '#FDE047'],
    pipeDark: '#1E293B',
    pipeMid: '#475569',
    pipeLight: '#94A3B8',
    pipeCapHighlight: '#E2E8F0',
    pipeTrim: '#38BDF8',
    groundTop: '#64748B',
    groundStripe: '#334155',
    groundStripeStyle: 'cracks',
    earthTop: '#334155',
    earthMid: '#1E293B',
    earthBottom: '#020617',
    pebbleColor: 'rgba(56, 189, 248, 0.22)',
  },
  {
    id: 'volcanic_inferno',
    name: 'Volkanik Cehennem',
    badgeColor: '#F97316',
    skyTop: '#180505',
    skyMid: '#7F1D1D',
    skyBottom: '#EA580C',
    celestialStyle: 'volcanic',
    sunColor: '#FDBA74',
    sunGlow: 'rgba(239, 68, 68, 0.45)',
    cloudTint: '127, 29, 29',
    cloudOpacityMult: 0.55,
    hillFar: '#450A0A',
    hillNear: '#1C1917',
    sceneryStyle: 'volcano',
    sceneryPrimary: '#0C0A09',
    sceneryAccent: '#F97316',
    ambientStyle: 'embers',
    isNight: true,
    hasAurora: false,
    auroraColors: ['#EF4444', '#F97316'],
    pipeDark: '#1C1917',
    pipeMid: '#44403C',
    pipeLight: '#78716C',
    pipeCapHighlight: '#F97316',
    pipeTrim: '#EF4444',
    groundTop: '#EA580C',
    groundStripe: '#7C2D12',
    groundStripeStyle: 'cracks',
    earthTop: '#292524',
    earthMid: '#1C1917',
    earthBottom: '#09090B',
    pebbleColor: 'rgba(249, 115, 22, 0.30)',
  },
  {
    id: 'ash_wasteland',
    name: 'Kül Çölü',
    badgeColor: '#FB7185',
    skyTop: '#18181B',
    skyMid: '#3F3F46',
    skyBottom: '#71717A',
    celestialStyle: 'volcanic',
    sunColor: '#FCA5A5',
    sunGlow: 'rgba(244, 63, 94, 0.35)',
    cloudTint: '161, 161, 170',
    cloudOpacityMult: 0.6,
    hillFar: '#27272A',
    hillNear: '#18181B',
    sceneryStyle: 'volcano',
    sceneryPrimary: '#09090B',
    sceneryAccent: '#FB7185',
    ambientStyle: 'embers',
    isNight: true,
    hasAurora: false,
    auroraColors: ['#F43F5E', '#A1A1AA'],
    pipeDark: '#18181B',
    pipeMid: '#52525B',
    pipeLight: '#A1A1AA',
    pipeCapHighlight: '#FDA4AF',
    pipeTrim: '#FB7185',
    groundTop: '#52525B',
    groundStripe: '#27272A',
    groundStripeStyle: 'cracks',
    earthTop: '#27272A',
    earthMid: '#18181B',
    earthBottom: '#09090B',
    pebbleColor: 'rgba(251, 113, 133, 0.22)',
  },
  {
    id: 'toxic_canyon',
    name: 'Zehirli Kanyon',
    badgeColor: '#BEF264',
    skyTop: '#052E16',
    skyMid: '#166534',
    skyBottom: '#84CC16',
    celestialStyle: 'volcanic',
    sunColor: '#D9F99D',
    sunGlow: 'rgba(132, 204, 22, 0.44)',
    cloudTint: '190, 242, 100',
    cloudOpacityMult: 0.45,
    hillFar: '#14532D',
    hillNear: '#090E08',
    sceneryStyle: 'volcano',
    sceneryPrimary: '#090D08',
    sceneryAccent: '#BEF264',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#84CC16', '#22D3EE'],
    pipeDark: '#14532D',
    pipeMid: '#22C55E',
    pipeLight: '#A3E635',
    pipeCapHighlight: '#ECFCCB',
    pipeTrim: '#BEF264',
    groundTop: '#A3E635',
    groundStripe: '#3F6212',
    groundStripeStyle: 'cracks',
    earthTop: '#1A2E05',
    earthMid: '#142204',
    earthBottom: '#070B01',
    pebbleColor: 'rgba(190, 242, 100, 0.30)',
  },
  {
    id: 'blood_moon',
    name: 'Kanlı Ay',
    badgeColor: '#F43F5E',
    skyTop: '#090206',
    skyMid: '#4C0519',
    skyBottom: '#BE123C',
    celestialStyle: 'sunset',
    sunColor: '#FB7185',
    sunGlow: 'rgba(244, 63, 94, 0.5)',
    cloudTint: '190, 18, 60',
    cloudOpacityMult: 0.4,
    hillFar: '#4C0519',
    hillNear: '#1F040C',
    sceneryStyle: 'pine',
    sceneryPrimary: '#0F0206',
    sceneryAccent: '#F43F5E',
    ambientStyle: 'embers',
    isNight: true,
    hasAurora: false,
    auroraColors: ['#F43F5E', '#9F1239'],
    pipeDark: '#4C0519',
    pipeMid: '#9F1239',
    pipeLight: '#E11D48',
    pipeCapHighlight: '#FDA4AF',
    pipeTrim: '#FECDD3',
    groundTop: '#E11D48',
    groundStripe: '#881337',
    groundStripeStyle: 'cracks',
    earthTop: '#4C0519',
    earthMid: '#2A030E',
    earthBottom: '#090205',
    pebbleColor: 'rgba(253, 164, 175, 0.24)',
  },
  {
    id: 'cyber_neon',
    name: 'Siber Neon Şehri',
    badgeColor: '#22D3EE',
    skyTop: '#090D16',
    skyMid: '#311042',
    skyBottom: '#0E7490',
    celestialStyle: 'cyber',
    sunColor: '#22D3EE',
    sunGlow: 'rgba(232, 121, 249, 0.38)',
    cloudTint: '192, 132, 252',
    cloudOpacityMult: 0.3,
    hillFar: '#1E1B4B',
    hillNear: '#0F172A',
    sceneryStyle: 'cyber',
    sceneryPrimary: '#020617',
    sceneryAccent: '#22D3EE',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#22D3EE', '#E879F9'],
    pipeDark: '#0F172A',
    pipeMid: '#1E293B',
    pipeLight: '#334155',
    pipeCapHighlight: '#22D3EE',
    pipeTrim: '#E879F9',
    groundTop: '#06B6D4',
    groundStripe: '#0F172A',
    groundStripeStyle: 'grid',
    earthTop: '#1E1B4B',
    earthMid: '#0F172A',
    earthBottom: '#020617',
    pebbleColor: 'rgba(34, 211, 238, 0.25)',
  },
  {
    id: 'hologram_boulevard',
    name: 'Hologram Bulvarı',
    badgeColor: '#E879F9',
    skyTop: '#1E1B4B',
    skyMid: '#701A75',
    skyBottom: '#22D3EE',
    celestialStyle: 'cyber',
    sunColor: '#E879F9',
    sunGlow: 'rgba(34, 211, 238, 0.42)',
    cloudTint: '240, 171, 252',
    cloudOpacityMult: 0.32,
    hillFar: '#4A044E',
    hillNear: '#1E1B4B',
    sceneryStyle: 'cyber',
    sceneryPrimary: '#09061E',
    sceneryAccent: '#F0ABFC',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#F0ABFC', '#67E8F9'],
    pipeDark: '#4A044E',
    pipeMid: '#A21CAF',
    pipeLight: '#E879F9',
    pipeCapHighlight: '#FAE8FF',
    pipeTrim: '#22D3EE',
    groundTop: '#E879F9',
    groundStripe: '#4A044E',
    groundStripeStyle: 'grid',
    earthTop: '#312E81',
    earthMid: '#1E1B4B',
    earthBottom: '#090420',
    pebbleColor: 'rgba(240, 171, 252, 0.28)',
  },
  {
    id: 'electro_grid',
    name: 'Elektro Şebeke',
    badgeColor: '#FDE047',
    skyTop: '#020617',
    skyMid: '#1E3A8A',
    skyBottom: '#0F766E',
    celestialStyle: 'cyber',
    sunColor: '#FDE047',
    sunGlow: 'rgba(253, 224, 71, 0.36)',
    cloudTint: '103, 232, 249',
    cloudOpacityMult: 0.25,
    hillFar: '#172554',
    hillNear: '#0F172A',
    sceneryStyle: 'cyber',
    sceneryPrimary: '#020617',
    sceneryAccent: '#FDE047',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#FDE047', '#22D3EE'],
    pipeDark: '#0F172A',
    pipeMid: '#0369A1',
    pipeLight: '#38BDF8',
    pipeCapHighlight: '#FEF08A',
    pipeTrim: '#FACC15',
    groundTop: '#FACC15',
    groundStripe: '#0F172A',
    groundStripeStyle: 'grid',
    earthTop: '#0F172A',
    earthMid: '#020617',
    earthBottom: '#00030A',
    pebbleColor: 'rgba(250, 204, 21, 0.26)',
  },
  {
    id: 'laser_fortress',
    name: 'Lazer Hisarı',
    badgeColor: '#FB7185',
    skyTop: '#09090B',
    skyMid: '#31102F',
    skyBottom: '#881337',
    celestialStyle: 'cyber',
    sunColor: '#FB7185',
    sunGlow: 'rgba(244, 63, 94, 0.44)',
    cloudTint: '251, 113, 133',
    cloudOpacityMult: 0.26,
    hillFar: '#27272A',
    hillNear: '#18181B',
    sceneryStyle: 'cyber',
    sceneryPrimary: '#09090B',
    sceneryAccent: '#F43F5E',
    ambientStyle: 'sparks',
    isNight: true,
    hasAurora: false,
    auroraColors: ['#F43F5E', '#38BDF8'],
    pipeDark: '#18181B',
    pipeMid: '#3F3F46',
    pipeLight: '#71717A',
    pipeCapHighlight: '#FDA4AF',
    pipeTrim: '#F43F5E',
    groundTop: '#F43F5E',
    groundStripe: '#18181B',
    groundStripeStyle: 'grid',
    earthTop: '#27272A',
    earthMid: '#18181B',
    earthBottom: '#09090B',
    pebbleColor: 'rgba(244, 63, 94, 0.28)',
  },
  {
    id: 'shadow_kingdom',
    name: 'Gölge Krallığı',
    badgeColor: '#818CF8',
    skyTop: '#02040D',
    skyMid: '#1E1B4B',
    skyBottom: '#312E81',
    celestialStyle: 'crescent',
    sunColor: '#C7D2FE',
    sunGlow: 'rgba(129, 140, 248, 0.36)',
    cloudTint: '129, 140, 248',
    cloudOpacityMult: 0.28,
    hillFar: '#1E1B4B',
    hillNear: '#0B0A1F',
    sceneryStyle: 'pine',
    sceneryPrimary: '#050412',
    sceneryAccent: '#818CF8',
    ambientStyle: 'cosmic',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#6366F1', '#38BDF8'],
    pipeDark: '#0F172A',
    pipeMid: '#312E81',
    pipeLight: '#6366F1',
    pipeCapHighlight: '#C7D2FE',
    pipeTrim: '#A5B4FC',
    groundTop: '#6366F1',
    groundStripe: '#1E1B4B',
    groundStripeStyle: 'crystal',
    earthTop: '#1E1B4B',
    earthMid: '#0F172A',
    earthBottom: '#02040D',
    pebbleColor: 'rgba(165, 180, 252, 0.22)',
  },
  {
    id: 'amethyst_nebula',
    name: 'Ametist Bulutsusu',
    badgeColor: '#D8B4FE',
    skyTop: '#1E0836',
    skyMid: '#581C87',
    skyBottom: '#A855F7',
    celestialStyle: 'cosmic',
    sunColor: '#F3E8FF',
    sunGlow: 'rgba(192, 132, 252, 0.45)',
    cloudTint: '216, 180, 254',
    cloudOpacityMult: 0.34,
    hillFar: '#4C1D95',
    hillNear: '#2E1065',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#1E0836',
    sceneryAccent: '#E879F9',
    ambientStyle: 'cosmic',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#E879F9', '#A855F7'],
    pipeDark: '#3B0764',
    pipeMid: '#9333EA',
    pipeLight: '#C084FC',
    pipeCapHighlight: '#F3E8FF',
    pipeTrim: '#E879F9',
    groundTop: '#C084FC',
    groundStripe: '#581C87',
    groundStripeStyle: 'crystal',
    earthTop: '#4C1D95',
    earthMid: '#2E1065',
    earthBottom: '#14062E',
    pebbleColor: 'rgba(243, 232, 255, 0.25)',
  },
  {
    id: 'solar_flare',
    name: 'Güneş Patlaması',
    badgeColor: '#FBBF24',
    skyTop: '#0B0614',
    skyMid: '#7C2D12',
    skyBottom: '#F59E0B',
    celestialStyle: 'sun',
    sunColor: '#FEF08A',
    sunGlow: 'rgba(251, 191, 36, 0.55)',
    cloudTint: '253, 224, 71',
    cloudOpacityMult: 0.32,
    hillFar: '#451A03',
    hillNear: '#1C0A02',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#1C0A02',
    sceneryAccent: '#FBBF24',
    ambientStyle: 'embers',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#FBBF24', '#F97316'],
    pipeDark: '#451A03',
    pipeMid: '#D97706',
    pipeLight: '#FBBF24',
    pipeCapHighlight: '#FEF9C3',
    pipeTrim: '#FDE047',
    groundTop: '#FBBF24',
    groundStripe: '#92400E',
    groundStripeStyle: 'crystal',
    earthTop: '#78350F',
    earthMid: '#451A03',
    earthBottom: '#1A0801',
    pebbleColor: 'rgba(254, 240, 138, 0.28)',
  },
  {
    id: 'supernova_harbor',
    name: 'Süpernova Limanı',
    badgeColor: '#F472B6',
    skyTop: '#030712',
    skyMid: '#1D4ED8',
    skyBottom: '#DB2777',
    celestialStyle: 'cosmic',
    sunColor: '#FBCFE8',
    sunGlow: 'rgba(236, 72, 153, 0.45)',
    cloudTint: '244, 114, 182',
    cloudOpacityMult: 0.28,
    hillFar: '#1E3A8A',
    hillNear: '#172554',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#0F172A',
    sceneryAccent: '#F472B6',
    ambientStyle: 'cosmic',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#38BDF8', '#F472B6'],
    pipeDark: '#1E3A8A',
    pipeMid: '#3B82F6',
    pipeLight: '#F472B6',
    pipeCapHighlight: '#FCE7F3',
    pipeTrim: '#38BDF8',
    groundTop: '#EC4899',
    groundStripe: '#1D4ED8',
    groundStripeStyle: 'crystal',
    earthTop: '#1E3A8A',
    earthMid: '#172554',
    earthBottom: '#030712',
    pebbleColor: 'rgba(251, 207, 232, 0.26)',
  },
  {
    id: 'cosmic_galaxy',
    name: 'Kozmik Galaksi',
    badgeColor: '#C084FC',
    skyTop: '#020617',
    skyMid: '#1E1B4B',
    skyBottom: '#581C87',
    celestialStyle: 'cosmic',
    sunColor: '#FDE68A',
    sunGlow: 'rgba(168, 85, 247, 0.45)',
    cloudTint: '167, 139, 250',
    cloudOpacityMult: 0.25,
    hillFar: '#2E1065',
    hillNear: '#170B3B',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#0F0728',
    sceneryAccent: '#C084FC',
    ambientStyle: 'cosmic',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#34D399', '#A855F7'],
    pipeDark: '#3B0764',
    pipeMid: '#7E22CE',
    pipeLight: '#A855F7',
    pipeCapHighlight: '#FDE047',
    pipeTrim: '#FACC15',
    groundTop: '#A855F7',
    groundStripe: '#6B21A8',
    groundStripeStyle: 'crystal',
    earthTop: '#312E81',
    earthMid: '#1E1B4B',
    earthBottom: '#090420',
    pebbleColor: 'rgba(250, 204, 21, 0.28)',
  },
  {
    id: 'eternal_zenith',
    name: 'Ebedi Sonsuzluk',
    badgeColor: '#FDE047',
    skyTop: '#020617',
    skyMid: '#0F172A',
    skyBottom: '#065F46',
    celestialStyle: 'cosmic',
    sunColor: '#FEF08A',
    sunGlow: 'rgba(52, 211, 153, 0.48)',
    cloudTint: '167, 243, 208',
    cloudOpacityMult: 0.26,
    hillFar: '#064E3B',
    hillNear: '#022C22',
    sceneryStyle: 'crystal',
    sceneryPrimary: '#020617',
    sceneryAccent: '#FDE047',
    ambientStyle: 'cosmic',
    isNight: true,
    hasAurora: true,
    auroraColors: ['#FDE047', '#34D399'],
    pipeDark: '#064E3B',
    pipeMid: '#059669',
    pipeLight: '#34D399',
    pipeCapHighlight: '#FEF08A',
    pipeTrim: '#FACC15',
    groundTop: '#10B981',
    groundStripe: '#064E3B',
    groundStripeStyle: 'crystal',
    earthTop: '#065F46',
    earthMid: '#064E3B',
    earthBottom: '#020617',
    pebbleColor: 'rgba(253, 224, 71, 0.30)',
  },
];

export function getBiomeTheme(
  score: number,
  overrideBiomeId?: string | null,
  biomeIndexOverride?: number | null
): BiomeTheme {
  if (overrideBiomeId) {
    const found = BIOME_THEMES.find((b) => b.id === overrideBiomeId);
    if (found) return found;
  }
  if (typeof biomeIndexOverride === 'number' && !Number.isNaN(biomeIndexOverride)) {
    const idx = ((Math.floor(biomeIndexOverride) % BIOME_THEMES.length) + BIOME_THEMES.length) % BIOME_THEMES.length;
    return BIOME_THEMES[idx];
  }
  // Klasik modda her 6 puanda bir yeni biyom acilir (0..29 -> 30 biyom)
  const index = Math.min(BIOME_THEMES.length - 1, Math.max(0, Math.floor(score / 6)));
  return BIOME_THEMES[index];
}

export function renderGameScene({
  ctx,
  elephant,
  bodyType,
  equipped,
  hasShield,
  pipes,
  peanuts,
  crates,
  finishGate,
  boss,
  bossProjectiles = [],
  playerBolts = [],
  particles,
  floatingTexts,
  clouds,
  groundOffset,
  bgOffset,
  score,
  biomeScoreOverride,
  biomeIndexOverride,
  biomeIdOverride,
  time,
  flashAlpha,
  mobilePerf = false,
}: RenderSceneParams) {
  const biome = getBiomeTheme(
    biomeScoreOverride !== undefined ? biomeScoreOverride : score,
    biomeIdOverride,
    biomeIndexOverride
  );
  const playableHeight = WORLD_HEIGHT - GROUND_HEIGHT;

  // 1. Sky
  if (mobilePerf) {
    ctx.fillStyle = biome.skyTop;
    ctx.fillRect(0, 0, WORLD_WIDTH, playableHeight * 0.45);
    ctx.fillStyle = biome.skyMid;
    ctx.fillRect(0, playableHeight * 0.45, WORLD_WIDTH, playableHeight * 0.35);
    ctx.fillStyle = biome.skyBottom;
    ctx.fillRect(0, playableHeight * 0.8, WORLD_WIDTH, playableHeight * 0.2);
  } else {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, playableHeight);
    skyGrad.addColorStop(0, biome.skyTop);
    skyGrad.addColorStop(0.6, biome.skyMid);
    skyGrad.addColorStop(1, biome.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WORLD_WIDTH, playableHeight);
  }

  // Night stars & shooting stars
  if (biome.isNight) {
    const starCount = mobilePerf ? 14 : biome.id === 'cosmic_galaxy' ? 56 : 30;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < starCount; i++) {
      const sx = (i * 137 + 29) % WORLD_WIDTH;
      const sy = ((i * 73 + 17) % (playableHeight * 0.62)) + 14;
      const twinkle = mobilePerf ? 0.7 : 0.45 + 0.55 * Math.sin(time * (2.2 + (i % 3)) + i);
      ctx.globalAlpha = twinkle * (biome.id === 'volcanic_inferno' ? 0.35 : 0.9);
      if (mobilePerf) {
        ctx.fillRect(sx, sy, 2, 2);
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, i % 4 === 0 ? 2 : 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (!mobilePerf && (biome.id === 'cosmic_galaxy' || biome.id === 'sakura_valley')) {
      const shootPhase = (time * 0.35) % 1;
      if (shootPhase < 0.25) {
        const progress = shootPhase / 0.25;
        const sx = WORLD_WIDTH * (0.85 - progress * 0.55);
        const sy = 36 + progress * 90;
        ctx.save();
        const trail = ctx.createLinearGradient(sx, sy, sx + 55, sy - 22);
        trail.addColorStop(0, 'rgba(255,255,255,0.95)');
        trail.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 55, sy - 22);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Aurora Borealis wave ribbons (desktop full detail)
  if (biome.hasAurora && !mobilePerf) {
    ctx.save();
    for (let band = 0; band < 2; band++) {
      const grad = ctx.createLinearGradient(0, 28 + band * 26, 0, 145 + band * 24);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, band === 0 ? biome.auroraColors[0] : biome.auroraColors[1]);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 95 + band * 25);
      for (let x = 0; x <= WORLD_WIDTH; x += 40) {
        const y =
          70 +
          band * 24 +
          Math.sin(x * 0.008 + time * (1.1 + band * 0.4) + band) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(WORLD_WIDTH, 160 + band * 20);
      ctx.lineTo(0, 160 + band * 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Celestial Body (Sun / Sunset / Crescent Moon / Eclipse / Cyber Sun / Ringed Planet)
  drawCelestialBody(ctx, biome, time);

  // 3. Clouds
  for (const cloud of clouds) {
    drawCloud(
      ctx,
      cloud.x,
      cloud.y,
      cloud.scale,
      cloud.opacity * biome.cloudOpacityMult,
      biome.cloudTint
    );
  }

  // 4. Parallax Hills
  drawHills(ctx, bgOffset * 0.25, playableHeight, biome.hillFar, 68, 240);
  drawHills(ctx, bgOffset * 0.5, playableHeight, biome.hillNear, 38, 170);

  // 5. Biome Scenery Silhouettes (Acacia / Sakura / Frost Pines / Volcano Spires / Cyber Skyline / Cosmic Crystals)
  drawBiomeScenery(ctx, bgOffset * 0.65, playableHeight, biome, time);

  // 5.5 Ambient Weather / Atmosphere Particles behind gameplay layer
  drawBiomeAtmosphere(ctx, biome, playableHeight, time, mobilePerf);

  // 6. Pipes
  for (const pipe of pipes) {
    drawPipePair(ctx, pipe, playableHeight, biome, mobilePerf);
  }

  // 7. Peanuts
  for (const peanut of peanuts) {
    if (!peanut.collected) {
      drawPeanut(ctx, peanut, time);
    }
  }

  // 8. Cosmetic Crates
  for (const crate of crates) {
    if (!crate.collected) {
      drawCosmeticCrate(ctx, crate, time);
    }
  }

  // 8.5 Finish Gate (Seviyeli mode)
  if (finishGate && finishGate.x > -120 && finishGate.x < WORLD_WIDTH + 120) {
    drawFinishGate(ctx, finishGate, playableHeight, time, mobilePerf);
  }

  // 8.7 Boss Arena Entities (Player Bolts, Boss, Boss Projectiles & Beam)
  if (playerBolts.length > 0) {
    drawPlayerBolts(ctx, playerBolts, mobilePerf);
  }
  if (boss && boss.active && !boss.defeated) {
    drawBossEntity(ctx, boss, playableHeight, time, mobilePerf);
  }
  if (bossProjectiles.length > 0) {
    drawBossProjectiles(ctx, bossProjectiles, time, mobilePerf);
  }

  // 9. Ground
  drawGround(ctx, groundOffset, playableHeight, biome, mobilePerf);

  // 10. Particles
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.type === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.4 - alpha * 0.4), 0, Math.PI * 2);
      ctx.stroke();
    } else if (mobilePerf) {
      ctx.fillStyle = p.color;
      const s = Math.max(2, p.size * (p.type === 'puff' ? 1.4 - alpha * 0.4 : alpha));
      ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.type === 'puff' ? 1.4 - alpha * 0.4 : alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 11. Elephant
  drawElephant(ctx, elephant, bodyType, equipped, hasShield, time, mobilePerf);

  // 12. Floating Texts
  for (const ft of floatingTexts) {
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 18px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    if (!mobilePerf) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0F172A';
      ctx.strokeText(ft.text, ft.x, ft.y);
    }
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // 13. Collision Flash
  if (flashAlpha > 0.01) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
}

function drawFinishGate(
  ctx: CanvasRenderingContext2D,
  gate: FinishGate,
  playableHeight: number,
  time: number,
  mobilePerf: boolean
) {
  ctx.save();
  const x = gate.x;
  const colW = 16;
  const sq = 16;

  // Ambient vertical celebration glow beam
  if (!mobilePerf) {
    const beamGrad = ctx.createLinearGradient(x - 42, 0, x + 42, 0);
    const beamColor = gate.isBoss ? 'rgba(244, 63, 94, 0.28)' : 'rgba(52, 211, 153, 0.28)';
    beamGrad.addColorStop(0, 'rgba(0,0,0,0)');
    beamGrad.addColorStop(0.5, beamColor);
    beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(x - 42, 0, 84, playableHeight);
  }

  // Vertical checkered finish ribbon
  for (let y = 0; y < playableHeight; y += sq) {
    const row = Math.floor(y / sq);
    ctx.fillStyle = row % 2 === 0 ? '#FFFFFF' : '#0F172A';
    ctx.fillRect(x - colW / 2, y, colW / 2, Math.min(sq, playableHeight - y));
    ctx.fillStyle = row % 2 === 0 ? '#0F172A' : '#FFFFFF';
    ctx.fillRect(x, y, colW / 2, Math.min(sq, playableHeight - y));
  }

  // Glowing side rails
  ctx.fillStyle = gate.isBoss ? '#F43F5E' : '#34D399';
  ctx.fillRect(x - colW / 2 - 4, 0, 4, playableHeight);
  ctx.fillRect(x + colW / 2, 0, 4, playableHeight);

  // Floating celebratory stars along the gate
  if (!mobilePerf) {
    for (let i = 0; i < 4; i++) {
      const sy = ((playableHeight * (0.2 + i * 0.22) + Math.sin(time * 3 + i) * 14) % playableHeight);
      const sx = x + Math.cos(time * 4 + i * 1.7) * 22;
      ctx.fillStyle = gate.isBoss ? '#FDA4AF' : '#FDE047';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.8 + Math.sin(time * 6 + i) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top pennant banner
  const bannerY = 38 + Math.sin(time * 4) * 3;
  ctx.fillStyle = gate.isBoss ? '#9F1239' : '#064E3B';
  ctx.strokeStyle = gate.isBoss ? '#FDA4AF' : '#34D399';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - 58, bannerY, 116, 30, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!mobilePerf) {
    ctx.fillStyle = '#020617';
    ctx.fillText(`SV.${gate.level} FİNİŞ`, x + 1, bannerY + 16);
  }
  ctx.fillStyle = gate.isBoss ? '#FFE4E6' : '#A7F3D0';
  ctx.fillText(`SV.${gate.level} FİNİŞ`, x, bannerY + 15);
  ctx.restore();
}

function drawPlayerBolts(
  ctx: CanvasRenderingContext2D,
  bolts: PlayerBolt[],
  mobilePerf: boolean
) {
  for (const b of bolts) {
    ctx.save();
    if (!mobilePerf) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.ellipse(b.x - 9, b.y, 12, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.radius + 3, b.radius - 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(b.x + 2, b.y - 1, b.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBossProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: BossProjectile[],
  time: number,
  mobilePerf: boolean
) {
  for (const proj of projectiles) {
    ctx.save();
    ctx.translate(proj.x, proj.y);
    if (!mobilePerf) {
      ctx.fillStyle = proj.color;
      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 1.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (proj.style === 'spike') {
      ctx.rotate(time * 9 + proj.id);
      ctx.fillStyle = proj.color;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? proj.radius * 1.2 : proj.radius * 0.55;
        const ang = (Math.PI * i) / 4;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = proj.color;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = proj.coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBossEntity(
  ctx: CanvasRenderingContext2D,
  boss: BossState,
  playableHeight: number,
  time: number,
  mobilePerf: boolean
) {
  // 1. Telegraphed Laser Beam (Charging warning OR Active Beam)
  if (boss.beamState === 'charging') {
    const pulse = 0.28 + Math.abs(Math.sin(time * 18)) * 0.35;
    ctx.save();
    ctx.fillStyle = `rgba(244, 63, 94, ${pulse})`;
    ctx.fillRect(0, boss.beamY - boss.beamHeight * 0.5, boss.x, boss.beamHeight);
    ctx.strokeStyle = '#FDA4AF';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(0, boss.beamY);
    ctx.lineTo(boss.x, boss.beamY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FFE4E6';
    ctx.textAlign = 'left';
    ctx.fillText('LAZER UYARISI!', 24, Math.max(24, boss.beamY - boss.beamHeight * 0.6));
    ctx.restore();
  } else if (boss.beamState === 'firing') {
    ctx.save();
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.fillRect(0, boss.beamY - boss.beamHeight * 0.72, boss.x, boss.beamHeight * 1.44);
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(0, boss.beamY - boss.beamHeight * 0.48, boss.x, boss.beamHeight * 0.96);
    ctx.fillStyle = '#FFF1F2';
    ctx.fillRect(0, boss.beamY - boss.beamHeight * 0.2, boss.x, boss.beamHeight * 0.4);
    ctx.restore();
  }

  const palette =
    boss.archetype === 'cyber_drone'
      ? { body: '#1E293B', trim: '#22D3EE', eye: '#EC4899', aura: 'rgba(34, 211, 238, 0.28)' }
      : boss.archetype === 'lava_wyrm'
        ? { body: '#7F1D1D', trim: '#F97316', eye: '#FDE047', aura: 'rgba(249, 115, 22, 0.3)' }
        : boss.archetype === 'cosmic_titan'
          ? { body: '#4C1D95', trim: '#E879F9', eye: '#38BDF8', aura: 'rgba(168, 85, 247, 0.34)' }
          : { body: '#475569', trim: '#F59E0B', eye: '#EF4444', aura: 'rgba(245, 158, 11, 0.26)' };

  const isFullBoss = boss.kind === 'boss';
  const r = boss.radius;

  ctx.save();
  ctx.translate(boss.x, boss.y);

  // Outer aura ring
  if (!mobilePerf) {
    ctx.fillStyle = boss.enraged ? 'rgba(244, 63, 94, 0.36)' : palette.aura;
    ctx.beginPath();
    ctx.arc(0, 0, r + 14 + Math.sin(time * 7) * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated Boss Wings / Thrusters behind main hull
  const wingBeat = Math.sin(time * (boss.enraged ? 14 : 9)) * 0.28;
  ctx.save();
  ctx.rotate(wingBeat);
  ctx.fillStyle = boss.hitFlash > 0 ? '#FFFFFF' : palette.trim;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.lineTo(r + 22, -r * 0.95);
  ctx.lineTo(r + 12, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(r + 22, r * 0.95);
  ctx.lineTo(r + 12, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Boss Body Hull
  ctx.fillStyle = boss.hitFlash > 0 ? '#FFFFFF' : palette.body;
  ctx.strokeStyle = boss.enraged ? '#F43F5E' : '#0F172A';
  ctx.lineWidth = isFullBoss ? 3.5 : 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Metallic armor bands
  ctx.strokeStyle = boss.hitFlash > 0 ? '#E2E8F0' : palette.trim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, -Math.PI * 0.75, Math.PI * 0.75);
  ctx.stroke();

  // Full Boss Crown / Horns
  if (isFullBoss) {
    ctx.fillStyle = boss.enraged ? '#F43F5E' : '#FACC15';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-14, -r + 5);
    ctx.lineTo(-20, -r - 16);
    ctx.lineTo(-4, -r - 4);
    ctx.lineTo(4, -r - 20);
    ctx.lineTo(12, -r - 4);
    ctx.lineTo(22, -r - 14);
    ctx.lineTo(16, -r + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Menacing Boss Visor / Glowing Eye facing LEFT toward player
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = palette.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-r * 0.72, -r * 0.34, r * 0.75, r * 0.44, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = boss.enraged ? '#F43F5E' : palette.eye;
  ctx.beginPath();
  ctx.arc(-r * 0.45, -r * 0.12, isFullBoss ? 6.5 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-r * 0.48, -r * 0.15, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Boss Cannon Snout / Jaw facing left
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = palette.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-r - 10, r * 0.08, 22, 14, 4);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Subtle ground danger shadow beneath boss
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 23, 0.22)';
  ctx.beginPath();
  ctx.ellipse(boss.x, playableHeight - 4, r * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCelestialBody(ctx: CanvasRenderingContext2D, biome: BiomeTheme, time: number) {
  const cx = WORLD_WIDTH * 0.78;
  const cy = biome.celestialStyle === 'sunset' ? 165 : biome.isNight ? 92 : 112;

  ctx.save();
  ctx.fillStyle = biome.sunGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 62 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
  ctx.fill();

  if (biome.celestialStyle === 'crescent') {
    ctx.fillStyle = biome.sunColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = biome.skyTop;
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 6, 23, 0, Math.PI * 2);
    ctx.fill();
  } else if (biome.celestialStyle === 'volcanic') {
    ctx.fillStyle = biome.sunColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = biome.skyTop;
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fill();
  } else if (biome.celestialStyle === 'cyber') {
    const cyberGrad = ctx.createLinearGradient(cx, cy - 36, cx, cy + 36);
    cyberGrad.addColorStop(0, '#FDE047');
    cyberGrad.addColorStop(0.55, '#EC4899');
    cyberGrad.addColorStop(1, '#22D3EE');
    ctx.fillStyle = cyberGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = biome.skyTop;
    for (let s = 0; s < 4; s++) {
      ctx.fillRect(cx - 38, cy + 6 + s * 7, 76, 2.5);
    }
  } else if (biome.celestialStyle === 'cosmic') {
    ctx.fillStyle = '#A855F7';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 12, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = biome.sunColor;
    ctx.beginPath();
    ctx.arc(cx, cy, biome.celestialStyle === 'sunset' ? 42 : 32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opacity: number,
  rgbTint: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = `rgba(${rgbTint}, ${opacity})`;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.arc(22, -6, 26, 0, Math.PI * 2);
  ctx.arc(48, 0, 20, 0, Math.PI * 2);
  ctx.arc(24, 8, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHills(
  ctx: CanvasRenderingContext2D,
  offset: number,
  groundY: number,
  color: string,
  height: number,
  wavelength: number
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  const start = -(offset % wavelength);
  for (let x = start - wavelength; x <= WORLD_WIDTH + wavelength; x += wavelength) {
    ctx.quadraticCurveTo(x + wavelength * 0.5, groundY - height, x + wavelength, groundY);
  }
  ctx.lineTo(WORLD_WIDTH, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawBiomeScenery(
  ctx: CanvasRenderingContext2D,
  offset: number,
  groundY: number,
  biome: BiomeTheme,
  time: number
) {
  const spacing = biome.sceneryStyle === 'cyber' ? 230 : 300;
  const start = -(offset % spacing);

  for (let x = start - spacing; x <= WORLD_WIDTH + spacing; x += spacing) {
    const anchorX = x + 90;
    if (biome.sceneryStyle === 'acacia' || biome.sceneryStyle === 'sakura') {
      const trunkH = 44;
      ctx.strokeStyle = biome.sceneryPrimary;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(anchorX, groundY);
      ctx.lineTo(anchorX, groundY - trunkH);
      ctx.moveTo(anchorX, groundY - trunkH + 16);
      ctx.lineTo(anchorX - 18, groundY - trunkH - 4);
      ctx.moveTo(anchorX, groundY - trunkH + 12);
      ctx.lineTo(anchorX + 20, groundY - trunkH - 2);
      ctx.stroke();

      ctx.fillStyle =
        biome.sceneryStyle === 'sakura' ? biome.sceneryAccent : biome.sceneryPrimary;
      ctx.beginPath();
      ctx.ellipse(anchorX, groundY - trunkH - 6, 38, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(anchorX - 18, groundY - trunkH - 2, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(anchorX + 20, groundY - trunkH - 1, 20, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (biome.sceneryStyle === 'pine') {
      ctx.fillStyle = biome.sceneryPrimary;
      ctx.beginPath();
      ctx.moveTo(anchorX, groundY - 78);
      ctx.lineTo(anchorX - 24, groundY - 10);
      ctx.lineTo(anchorX + 24, groundY - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(anchorX - 4, groundY - 12, 8, 12);
      // Snow cap
      ctx.fillStyle = biome.sceneryAccent;
      ctx.beginPath();
      ctx.moveTo(anchorX, groundY - 78);
      ctx.lineTo(anchorX - 11, groundY - 48);
      ctx.lineTo(anchorX + 11, groundY - 48);
      ctx.closePath();
      ctx.fill();
    } else if (biome.sceneryStyle === 'volcano') {
      ctx.fillStyle = biome.sceneryPrimary;
      ctx.beginPath();
      ctx.moveTo(anchorX - 42, groundY);
      ctx.lineTo(anchorX - 10, groundY - 76);
      ctx.lineTo(anchorX + 10, groundY - 76);
      ctx.lineTo(anchorX + 44, groundY);
      ctx.closePath();
      ctx.fill();
      // Lava glow at crater rim
      ctx.strokeStyle = biome.sceneryAccent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorX - 9, groundY - 75);
      ctx.lineTo(anchorX + 9, groundY - 75);
      ctx.stroke();
    } else if (biome.sceneryStyle === 'cyber') {
      const h1 = 76;
      const h2 = 54;
      ctx.fillStyle = biome.sceneryPrimary;
      ctx.fillRect(anchorX - 26, groundY - h1, 30, h1);
      ctx.fillRect(anchorX + 12, groundY - h2, 26, h2);
      ctx.fillStyle = biome.sceneryAccent;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 3 + x);
      for (let wy = 14; wy < h1 - 10; wy += 14) {
        ctx.fillRect(anchorX - 20, groundY - h1 + wy, 6, 4);
        ctx.fillRect(anchorX - 10, groundY - h1 + wy, 6, 4);
      }
      ctx.fillStyle = '#E879F9';
      ctx.fillRect(anchorX + 18, groundY - h2 + 10, 14, 3);
      ctx.fillRect(anchorX + 18, groundY - h2 + 22, 14, 3);
      ctx.globalAlpha = 1;
    } else if (biome.sceneryStyle === 'crystal') {
      ctx.fillStyle = biome.sceneryAccent;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(anchorX - 14, groundY);
      ctx.lineTo(anchorX - 4, groundY - 64);
      ctx.lineTo(anchorX + 8, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(anchorX + 4, groundY);
      ctx.lineTo(anchorX + 16, groundY - 44);
      ctx.lineTo(anchorX + 26, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawBiomeAtmosphere(
  ctx: CanvasRenderingContext2D,
  biome: BiomeTheme,
  playableHeight: number,
  time: number,
  mobilePerf = false
) {
  if (biome.ambientStyle === 'none') return;
  ctx.save();
  const baseCount = biome.ambientStyle === 'snow' || biome.ambientStyle === 'sakura' ? 24 : 18;
  const count = mobilePerf ? Math.ceil(baseCount * 0.4) : baseCount;

  for (let i = 0; i < count; i++) {
    const seedX = (i * 193 + 47) % WORLD_WIDTH;
    const speedY =
      biome.ambientStyle === 'embers'
        ? -(28 + (i % 4) * 10)
        : biome.ambientStyle === 'dust'
          ? 8 + (i % 3) * 4
          : 26 + (i % 4) * 11;
    const driftX = Math.sin(time * 1.6 + i * 1.3) * 24 - time * (16 + (i % 3) * 7);
    const px = (((seedX + driftX) % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
    const rawY = ((i * 89 + time * speedY) % playableHeight + playableHeight) % playableHeight;

    if (mobilePerf) {
      ctx.fillStyle =
        biome.ambientStyle === 'sakura'
          ? '#F9A8D4'
          : biome.ambientStyle === 'snow'
            ? '#F0F9FF'
            : biome.ambientStyle === 'embers'
              ? '#FB923C'
              : biome.ambientStyle === 'sparks'
                ? '#22D3EE'
                : biome.ambientStyle === 'cosmic'
                  ? '#C084FC'
                  : '#FEF3C7';
      ctx.globalAlpha = 0.65;
      ctx.fillRect(px, rawY, 4, 4);
      continue;
    }

    if (biome.ambientStyle === 'sakura') {
      ctx.fillStyle = i % 2 === 0 ? '#FBCFE8' : '#F472B6';
      ctx.globalAlpha = 0.78;
      ctx.save();
      ctx.translate(px, rawY);
      ctx.rotate(time * 2 + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.2, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (biome.ambientStyle === 'snow') {
      ctx.fillStyle = '#F0F9FF';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(px, rawY, i % 3 === 0 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (biome.ambientStyle === 'embers') {
      ctx.fillStyle = i % 2 === 0 ? '#F97316' : '#FDE047';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(px, rawY, i % 3 === 0 ? 2.8 : 1.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (biome.ambientStyle === 'sparks') {
      ctx.fillStyle = i % 2 === 0 ? '#22D3EE' : '#E879F9';
      ctx.globalAlpha = 0.65;
      ctx.fillRect(px, rawY, 4, 2);
    } else if (biome.ambientStyle === 'cosmic') {
      ctx.fillStyle = i % 2 === 0 ? '#C084FC' : '#FDE047';
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(px, rawY, 2.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#FEF3C7';
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(px, rawY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPipePair(
  ctx: CanvasRenderingContext2D,
  pipe: PipePair,
  playableHeight: number,
  biome: BiomeTheme,
  mobilePerf = false
) {
  const capHeight = 26;
  const capOverhang = 6;
  const px = Math.round(pipe.x * 2) / 2;
  const pw = Math.round(pipe.width);
  const gapTop = Math.round(pipe.gapTop * 2) / 2;
  const bottomY = Math.round((pipe.gapTop + pipe.gapHeight) * 2) / 2;

  const topHeight = Math.max(0, gapTop);
  if (topHeight > 0) {
    const segH = topHeight - capHeight;
    if (segH > 0) {
      drawPipeSegment(ctx, px, 0, pw, segH + 1, biome, mobilePerf);
    }
    drawPipeCap(
      ctx,
      px - capOverhang,
      topHeight - capHeight,
      pw + capOverhang * 2,
      capHeight,
      biome,
      mobilePerf
    );
  }

  const bottomHeight = playableHeight - bottomY;
  if (bottomHeight > 0) {
    const segH = bottomHeight - capHeight;
    if (segH > 0) {
      drawPipeSegment(
        ctx,
        px,
        bottomY + capHeight - 1,
        pw,
        segH + 1,
        biome,
        mobilePerf
      );
    }
    drawPipeCap(
      ctx,
      px - capOverhang,
      bottomY,
      pw + capOverhang * 2,
      capHeight,
      biome,
      mobilePerf
    );
  }
}

function drawPipeSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  biome: BiomeTheme,
  mobilePerf = false
) {
  if (h <= 0 || w <= 0) return;
  if (mobilePerf) {
    ctx.fillStyle = biome.pipeMid;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = biome.pipeLight;
    ctx.fillRect(x + 8, y, 10, h);
    ctx.fillStyle = biome.pipeDark;
    ctx.fillRect(x + w - 12, y, 12, h);
  } else {
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, biome.pipeDark);
    grad.addColorStop(0.22, biome.pipeLight);
    grad.addColorStop(0.45, biome.pipeMid);
    grad.addColorStop(0.85, biome.pipeDark);
    grad.addColorStop(1, adjustHex(biome.pipeDark, -15));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  if (biome.pipeTrim) {
    ctx.fillStyle = biome.pipeTrim;
    ctx.fillRect(x + 8, y, 4, h);
  }

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);
}

function drawPipeCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  biome: BiomeTheme,
  mobilePerf = false
) {
  if (h <= 0 || w <= 0) return;
  if (mobilePerf) {
    ctx.fillStyle = biome.pipeMid;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = biome.pipeCapHighlight;
    ctx.fillRect(x + 8, y + 2, 12, h - 4);
    ctx.fillStyle = biome.pipeDark;
    ctx.fillRect(x + w - 12, y, 12, h);
    if (biome.pipeTrim) {
      ctx.fillStyle = biome.pipeTrim;
      ctx.fillRect(x + 4, y + h * 0.5 - 2, w - 8, 4);
    }
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    return;
  }

  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, biome.pipeDark);
  grad.addColorStop(0.2, biome.pipeCapHighlight);
  grad.addColorStop(0.45, biome.pipeMid);
  grad.addColorStop(0.85, biome.pipeDark);
  grad.addColorStop(1, adjustHex(biome.pipeDark, -15));

  const r = Math.min(5, w / 2, h / 2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();

  if (biome.pipeTrim) {
    ctx.fillStyle = biome.pipeTrim;
    ctx.fillRect(x + 4, y + h * 0.5 - 2, w - 8, 4);
  }

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  groundOffset: number,
  groundY: number,
  biome: BiomeTheme,
  mobilePerf = false
) {
  ctx.fillStyle = biome.groundTop;
  ctx.fillRect(0, groundY, WORLD_WIDTH, 16);

  if (!mobilePerf) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundY, WORLD_WIDTH, 16);
    ctx.clip();

    ctx.fillStyle = biome.groundStripe;
    const stripeW = 28;
    const start = -(groundOffset % (stripeW * 2));
    for (let x = start - stripeW * 2; x < WORLD_WIDTH + stripeW * 2; x += stripeW * 2) {
      if (biome.groundStripeStyle === 'grid') {
        ctx.fillRect(x + 6, groundY + 3, stripeW - 4, 10);
      } else if (biome.groundStripeStyle === 'crystal') {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 16);
        ctx.lineTo(x + stripeW * 0.5, groundY);
        ctx.lineTo(x + stripeW, groundY + 16);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 16);
        ctx.lineTo(x + 12, groundY);
        ctx.lineTo(x + 12 + stripeW, groundY);
        ctx.lineTo(x + stripeW, groundY + 16);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  } else {
    ctx.fillStyle = biome.groundStripe;
    const stripeW = 28;
    const start = -(groundOffset % (stripeW * 2));
    for (let x = start; x < WORLD_WIDTH; x += stripeW * 2) {
      ctx.fillRect(x, groundY + 4, stripeW - 4, 9);
    }
  }

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(WORLD_WIDTH, groundY);
  ctx.stroke();

  if (mobilePerf) {
    ctx.fillStyle = biome.earthTop;
    ctx.fillRect(0, groundY + 16, WORLD_WIDTH, 20);
    ctx.fillStyle = biome.earthMid;
    ctx.fillRect(0, groundY + 36, WORLD_WIDTH, GROUND_HEIGHT - 36);
  } else {
    const earthGrad = ctx.createLinearGradient(0, groundY + 16, 0, WORLD_HEIGHT);
    earthGrad.addColorStop(0, biome.earthTop);
    earthGrad.addColorStop(0.25, biome.earthMid);
    earthGrad.addColorStop(1, biome.earthBottom);
    ctx.fillStyle = earthGrad;
    ctx.fillRect(0, groundY + 16, WORLD_WIDTH, GROUND_HEIGHT - 16);

    ctx.fillStyle = biome.pebbleColor;
    const pebbleSpacing = 64;
    const pStart = -(groundOffset % pebbleSpacing);
    for (let x = pStart - pebbleSpacing; x < WORLD_WIDTH + pebbleSpacing; x += pebbleSpacing) {
      ctx.beginPath();
      ctx.ellipse(x + 18, groundY + 38, 7, 3.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 48, groundY + 54, 5, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPeanut(ctx: CanvasRenderingContext2D, peanut: PeanutBonus, time: number) {
  const bob = Math.sin(time * 5 + peanut.bobPhase) * 5;
  const px = peanut.x;
  const py = peanut.y + bob;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.sin(time * 3 + peanut.bobPhase) * 0.25);

  ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
  ctx.beginPath();
  ctx.arc(0, 0, peanut.radius + 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 2.2;

  ctx.beginPath();
  ctx.ellipse(-5, 0, 8.5, 7, -0.2, 0, Math.PI * 2);
  ctx.ellipse(5, 0, 8, 6.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.ellipse(-5, -2.5, 4, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCosmeticCrate(ctx: CanvasRenderingContext2D, crate: CosmeticCrate, time: number) {
  const bob = Math.sin(time * 4.2 + crate.bobPhase) * 6;
  const cx = crate.x;
  const cy = crate.y + bob;
  const half = crate.size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(time * 2.5 + crate.bobPhase) * 0.12);

  const pulse = 1 + Math.sin(time * 6) * 0.12;
  ctx.fillStyle = 'rgba(168, 85, 247, 0.30)';
  ctx.beginPath();
  ctx.arc(0, 0, half * 1.55 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9333EA';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(-half, -half, crate.size, crate.size, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FACC15';
  ctx.fillRect(-3.5, -half + 1, 7, crate.size - 2);
  ctx.fillRect(-half + 1, -3.5, crate.size - 2, 7);

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.ellipse(-6, -half - 3, 6, 4, -0.35, 0, Math.PI * 2);
  ctx.ellipse(6, -half - 3, 6, 4, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, 1);

  ctx.restore();
}

function getSuitLegColors(suitShape: string): { fill: string; stroke: string } {
  switch (suitShape) {
    case 'police':
      return { fill: '#1E3A8A', stroke: '#0F172A' };
    case 'astronaut_suit':
      return { fill: '#CBD5E1', stroke: '#475569' };
    case 'knight':
      return { fill: '#94A3B8', stroke: '#1E293B' };
    case 'superhero':
      return { fill: '#1D4ED8', stroke: '#0F172A' };
    case 'samurai':
      return { fill: '#7F1D1D', stroke: '#0F172A' };
    case 'pharaoh':
      return { fill: '#D97706', stroke: '#451A03' };
    case 'king_robe':
      return { fill: '#4C1D95', stroke: '#0F172A' };
    case 'doctor':
    case 'chef_suit':
      return { fill: '#334155', stroke: '#0F172A' };
    case 'surypap':
      return { fill: '#EF4444', stroke: '#0F172A' };
    case 'bass':
      return { fill: '#0F172A', stroke: '#020617' };
    case 'swamp':
      return { fill: '#0F172A', stroke: '#020617' };
    case 'frind':
      return { fill: '#0B0F19', stroke: '#312E81' };
    case 'filyman':
      return { fill: '#15803D', stroke: '#052E16' };
    default:
      return { fill: '#0F172A', stroke: '#020617' };
  }
}

function drawElephantSuitOverlay(
  ctx: CanvasRenderingContext2D,
  suitShape: string,
  r: number
) {
  // 1. Clipped torso garment layered over body + lower ear
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-2, 1, r + 2, r - 2, 0, 0, Math.PI * 2);
  ctx.clip();

  const drawBaseTorsoPath = (topY = -1) => {
    ctx.beginPath();
    ctx.moveTo(-28, topY + 2);
    ctx.quadraticCurveTo(-8, topY - 4, 8, topY + 2);
    ctx.lineTo(24, topY + 6);
    ctx.lineTo(24, 24);
    ctx.lineTo(-28, 24);
    ctx.closePath();
  };

  if (suitShape === 'tuxedo') {
    const suitGrad = ctx.createLinearGradient(-16, -4, 16, 22);
    suitGrad.addColorStop(0, '#1E293B');
    suitGrad.addColorStop(0.45, '#0F172A');
    suitGrad.addColorStop(1, '#020617');
    ctx.fillStyle = suitGrad;
    drawBaseTorsoPath(0);
    ctx.fill();

    // White dress shirt V-front
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(19, 4);
    ctx.lineTo(13, 21);
    ctx.lineTo(8, 21);
    ctx.closePath();
    ctx.fill();

    // Satin lapels
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.4;
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(1, 7);
    ctx.lineTo(8, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(19, 4);
    ctx.lineTo(22, 8);
    ctx.lineTo(13, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold studs & pocket square
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(11.5, 11.5, 1.35, 0, Math.PI * 2);
    ctx.arc(11.2, 16, 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-6, 9);
    ctx.lineTo(-2, 6);
    ctx.lineTo(1, 9);
    ctx.closePath();
    ctx.fill();
  } else if (suitShape === 'police') {
    ctx.fillStyle = '#1E3A8A';
    drawBaseTorsoPath(0);
    ctx.fill();

    // Crisp sky-blue collar & dark tie
    ctx.fillStyle = '#93C5FD';
    ctx.beginPath();
    ctx.moveTo(5, 2);
    ctx.lineTo(18, 4);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(11, 4);
    ctx.lineTo(14, 4);
    ctx.lineTo(13.5, 16);
    ctx.lineTo(11, 18);
    ctx.lineTo(9.5, 16);
    ctx.closePath();
    ctx.fill();

    // Gold shoulder epaulettes & brass buttons + commissar badge
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-16, 1, 9, 3);
    ctx.beginPath();
    ctx.arc(1, 10, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(5, 14, 1.3, 0, Math.PI * 2);
    ctx.arc(5, 18.5, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (suitShape === 'pirate') {
    ctx.fillStyle = '#991B1B';
    drawBaseTorsoPath(0);
    ctx.fill();

    // Cream pirate shirt V & black leather sash with gold buckle
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.moveTo(5, 2);
    ctx.lineTo(18, 4);
    ctx.lineTo(12, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-19, 1, 9, 3);

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-26, 11);
    ctx.lineTo(24, 13);
    ctx.lineTo(24, 17);
    ctx.lineTo(-26, 15);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(2, 11.5, 5, 4);
  } else if (suitShape === 'doctor') {
    ctx.fillStyle = '#F8FAFC';
    drawBaseTorsoPath(0);
    ctx.fill();

    // Teal scrubs V-neck underneath
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(18, 4);
    ctx.lineTo(12, 17);
    ctx.closePath();
    ctx.fill();

    // Lab coat lapels
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(5, 2);
    ctx.lineTo(11, 18);
    ctx.moveTo(18, 4);
    ctx.lineTo(12, 18);
    ctx.stroke();

    // Red medical cross pocket
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-4, 9, 6, 2.2);
    ctx.fillRect(-2.1, 7.1, 2.2, 6);

    // Silver stethoscope around neck
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(9, 4, 7.5, 0.25, Math.PI * 0.95);
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(3, 9.5, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (suitShape === 'chef_suit') {
    ctx.fillStyle = '#FFFFFF';
    drawBaseTorsoPath(0);
    ctx.fill();

    // Double-breasted seam & dark buttons
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, 3);
    ctx.lineTo(5, 22);
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    for (const [bx, by] of [
      [3, 9],
      [3, 14],
      [9, 9],
      [9, 14],
    ]) {
      ctx.beginPath();
      ctx.arc(bx, by, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Red chef neckerchief
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(4, 1);
    ctx.lineTo(18, 3);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();
  } else if (suitShape === 'astronaut_suit') {
    ctx.fillStyle = '#E2E8F0';
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Orange NASA stripes & chest life-support module
    ctx.fillStyle = '#F97316';
    ctx.fillRect(-24, 6, 46, 3.2);
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.roundRect(-2, 9, 13, 9, 2);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(0.5, 11, 4, 2.5);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(6, 11, 3, 2.5);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0.5, 14.5, 8.5, 1.8);
  } else if (suitShape === 'ninja') {
    ctx.fillStyle = '#0F172A';
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Diagonal crimson katana strap & belt
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-18, 2);
    ctx.lineTo(14, 20);
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-26, 12, 50, 4);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-26, 13, 50, 2);

    // Metallic throwing star badge
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(5, 9, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (suitShape === 'knight') {
    const steelGrad = ctx.createLinearGradient(-16, -2, 16, 20);
    steelGrad.addColorStop(0, '#E2E8F0');
    steelGrad.addColorStop(0.55, '#94A3B8');
    steelGrad.addColorStop(1, '#475569');
    ctx.fillStyle = steelGrad;
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Plate seams & golden crest
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-22, 9);
    ctx.quadraticCurveTo(0, 12, 22, 9);
    ctx.moveTo(-20, 15);
    ctx.quadraticCurveTo(0, 18, 22, 15);
    ctx.stroke();

    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.lineTo(9, 8);
    ctx.lineTo(7, 13);
    ctx.lineTo(4, 15);
    ctx.lineTo(1, 13);
    ctx.lineTo(-1, 8);
    ctx.closePath();
    ctx.fill();
  } else if (suitShape === 'superhero') {
    ctx.fillStyle = '#2563EB';
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Gold belt
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-26, 13, 50, 3.5);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(2, 12.5, 5, 4.5);

    // Heroic shield crest on chest
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, 5.5);
    ctx.lineTo(10, 7.5);
    ctx.lineTo(4, 12.5);
    ctx.lineTo(-2, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'samurai') {
    ctx.fillStyle = '#7F1D1D';
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Gold-laced armor bands
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-26, 5, 50, 4);
    ctx.fillRect(-26, 12, 50, 4);
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-24, 5);
    ctx.lineTo(22, 5);
    ctx.moveTo(-24, 9);
    ctx.lineTo(22, 9);
    ctx.moveTo(-24, 12);
    ctx.lineTo(22, 12);
    ctx.moveTo(-24, 16);
    ctx.lineTo(22, 16);
    ctx.stroke();
  } else if (suitShape === 'cyber_suit') {
    ctx.fillStyle = '#111827';
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Neon cyan & magenta glowing seams
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, 3);
    ctx.lineTo(-4, 8);
    ctx.lineTo(18, 6);
    ctx.moveTo(-14, 12);
    ctx.lineTo(14, 12);
    ctx.stroke();

    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.arc(6, 12, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (suitShape === 'vampire') {
    ctx.fillStyle = '#1E1B4B';
    drawBaseTorsoPath(0);
    ctx.fill();

    // Crimson waistcoat & white cravat + ruby gem
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(18, 4);
    ctx.lineTo(14, 20);
    ctx.lineTo(6, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(7, 3);
    ctx.lineTo(15, 4);
    ctx.lineTo(11, 11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(11, 7, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (suitShape === 'pharaoh') {
    const goldGrad = ctx.createLinearGradient(-16, -2, 16, 20);
    goldGrad.addColorStop(0, '#FDE047');
    goldGrad.addColorStop(0.5, '#F59E0B');
    goldGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = goldGrad;
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Lapis & turquoise concentric Usekh broad collar
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(4, 0, 9.5, 0.2, Math.PI - 0.15);
    ctx.stroke();
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(4, 0, 14, 0.25, Math.PI - 0.2);
    ctx.stroke();

    // Scarab gem
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.ellipse(5, 11, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (suitShape === 'king_robe') {
    ctx.fillStyle = '#581C87';
    drawBaseTorsoPath(0);
    ctx.fill();

    // Heavy royal gold chain & ruby centerpiece
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(3, 3, 9, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(4, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ermine white bottom border trim
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-26, 15, 50, 7);
    ctx.fillStyle = '#0F172A';
    for (let sx = -18; sx <= 16; sx += 8) {
      ctx.beginPath();
      ctx.arc(sx, 18, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (suitShape === 'surypap') {
    // Crisp white Battle Body chestplate with golden pauldrons & red sash/briefs
    ctx.fillStyle = '#F8FAFC';
    drawBaseTorsoPath(-1);
    ctx.fill();

    // Bold crimson red belt/briefs band + golden waist trim
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-26, 13, 50, 9);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-26, 11.5, 50, 2);

    // Armored rib seam + dark arm sleeve cuff
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-24, 5, 11, 5);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(4, 3);
    ctx.lineTo(4, 11);
    ctx.stroke();

    // Red chest emblem & bold golden shoulder pauldrons
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(7, 5, 6, 3.2);
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-13, 3, 7.5, 4.4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(16, 4.5, 5.5, 3.5, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'bass') {
    // Iconic royal-blue open zip hoodie over crisp white undershirt
    const hoodGrad = ctx.createLinearGradient(-16, -2, 16, 22);
    hoodGrad.addColorStop(0, '#3B82F6');
    hoodGrad.addColorStop(0.55, '#2563EB');
    hoodGrad.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = hoodGrad;
    drawBaseTorsoPath(-1);
    ctx.fill();

    // White undershirt V-front
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(6, 1);
    ctx.lineTo(17, 4);
    ctx.lineTo(13, 22);
    ctx.lineTo(7, 22);
    ctx.closePath();
    ctx.fill();

    // Crisp black jacket zipper edges
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(6, 1);
    ctx.lineTo(7, 22);
    ctx.moveTo(17, 4);
    ctx.lineTo(13, 22);
    ctx.stroke();

    // Kangaroo pocket & side sleeve highlight
    ctx.fillStyle = '#1E40AF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-14, 11, 16, 8, 2);
    ctx.fill();
    ctx.stroke();

    // White hoodie drawstrings
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(5.5, 3);
    ctx.lineTo(4, 11);
    ctx.moveTo(15.5, 5);
    ctx.lineTo(15.5, 12);
    ctx.stroke();
  } else if (suitShape === 'swamp') {
    // Sharp black business suit over white shirt & bright red necktie
    ctx.fillStyle = '#0F172A';
    drawBaseTorsoPath(0);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(18, 4);
    ctx.lineTo(12, 19);
    ctx.lineTo(7, 19);
    ctx.closePath();
    ctx.fill();

    // Blazer lapels
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(1.5, 7);
    ctx.lineTo(7, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bold crimson necktie
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(10, 3.5);
    ctx.lineTo(14, 3.5);
    ctx.lineTo(12.6, 16);
    ctx.lineTo(11, 18.5);
    ctx.lineTo(9.4, 16);
    ctx.closePath();
    ctx.fill();
  } else if (suitShape === 'frind') {
    // Deep shadowy cloak with subtle static pink & gold specks
    ctx.fillStyle = '#0B0F19';
    drawBaseTorsoPath(-1);
    ctx.fill();

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, 7);
    ctx.quadraticCurveTo(0, 14, 20, 9);
    ctx.stroke();

    ctx.fillStyle = '#EC4899';
    ctx.fillRect(-10, 10, 3, 2);
    ctx.fillRect(6, 14, 2.5, 2);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-2, 13, 3, 2);
    ctx.fillRect(11, 8, 2.5, 2);
  } else if (suitShape === 'filyman') {
    // Vibrant stem-green leafy tunic with light-green vine trim
    ctx.fillStyle = '#15803D';
    drawBaseTorsoPath(-1);
    ctx.fill();

    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.moveTo(-24, 3);
    ctx.quadraticCurveTo(-4, 13, 22, 6);
    ctx.lineTo(22, 12);
    ctx.quadraticCurveTo(-4, 18, -24, 9);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#86EFAC';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-20, 6);
    ctx.quadraticCurveTo(0, 14, 19, 9);
    ctx.stroke();
  }

  ctx.restore();

  // 2. Tailored Collar / Neckline Seam ON TOP of body+ear seam (unclipped so collars look crisp!)
  ctx.save();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.1;

  if (suitShape === 'tuxedo') {
    // Upper collar rim over tucked ear + Crimson Bow Tie
    ctx.beginPath();
    ctx.moveTo(-21, 1);
    ctx.quadraticCurveTo(-5, -2, 8, 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(12, 5.5);
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5.5, -3.5);
    ctx.lineTo(-5.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(5.5, -3.5);
    ctx.lineTo(5.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (suitShape === 'vampire') {
    // High spiked Dracula collar framing neck & ear
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.lineTo(-17, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(13, 4);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'king_robe') {
    // Fluffy white ermine fur collar
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(-14, -2, 28, 7, 3.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    for (const sx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.arc(sx, 1.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (suitShape === 'astronaut_suit') {
    // Metallic EVA neck ring
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.roundRect(-12, -2, 27, 6, 3);
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'cyber_suit') {
    // Glowing techwear high collar
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.lineTo(-15, -6);
    ctx.lineTo(13, 3);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'surypap') {
    // Knotted crimson hero scarf collar wrapping neck & chest
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(-15, -2.5, 30, 7, 3.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(10, 2, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'bass') {
    // Fluffy light-grey winter hood fur rim collar
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(-16, -2.5, 31, 7.2, 3.6);
    ctx.fill();
    ctx.stroke();
  } else if (suitShape === 'filyman') {
    // Pointed green flower sepal calyx leaves around neck
    ctx.fillStyle = '#22C55E';
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 1.5;
    for (const sx of [-12, -4, 4, 12]) {
      ctx.beginPath();
      ctx.moveTo(sx - 4, -1);
      ctx.lineTo(sx, 6.5);
      ctx.lineTo(sx + 4, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Clean tailored shoulder/collar seam for all other suits
    ctx.beginPath();
    ctx.moveTo(-21, 1);
    ctx.quadraticCurveTo(-5, -2, 13, 3.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawElephant(
  ctx: CanvasRenderingContext2D,
  elephant: ElephantState,
  bodyType: BodyType,
  equipped: EquippedCosmetics,
  hasShield: boolean,
  time: number,
  mobilePerf = false
) {
  const bodyCfg = BODY_TYPE_CONFIGS[bodyType];
  const skinItem = COSMETIC_BY_ID[equipped.skin] || COSMETIC_BY_ID['skin_classic'];
  const suitItem = COSMETIC_BY_ID[equipped.suit];
  const hatItem = COSMETIC_BY_ID[equipped.hat];
  const glassesItem = COSMETIC_BY_ID[equipped.glasses];

  const activeSuitShape =
    suitItem && suitItem.shape !== 'none'
      ? suitItem.shape
      : skinItem.shape === 'tuxedo'
        ? 'tuxedo'
        : null;
  const isWearingSuit = Boolean(activeSuitShape);

  const isRainbow = !activeSuitShape && skinItem.shape === 'rainbow';
  const isCharacterTransformSuit =
    activeSuitShape === 'bass' ||
    activeSuitShape === 'surypap' ||
    activeSuitShape === 'swamp' ||
    activeSuitShape === 'frind' ||
    activeSuitShape === 'filyman';

  let baseColor = isRainbow
    ? `hsl(${(time * 110) % 360}, 82%, 62%)`
    : skinItem.shape === 'tuxedo'
      ? '#9CA3AF'
      : skinItem.previewColor;
  let lightColor = isRainbow
    ? `hsl(${(time * 110 + 30) % 360}, 90%, 78%)`
    : adjustHex(baseColor, 34);
  let darkColor = isRainbow
    ? `hsl(${(time * 110 - 20) % 360}, 75%, 44%)`
    : adjustHex(baseColor, -42);
  let earInnerColor =
    skinItem.id === 'skin_classic' || skinItem.shape === 'tuxedo' ? '#FDA4AF' : lightColor;

  if (activeSuitShape === 'bass' || activeSuitShape === 'surypap' || activeSuitShape === 'swamp') {
    baseColor = '#F8FAFC';
    lightColor = '#FFFFFF';
    darkColor = '#CBD5E1';
    earInnerColor = '#E2E8F0';
  } else if (activeSuitShape === 'frind') {
    baseColor = '#0B0F19';
    lightColor = '#1E293B';
    darkColor = '#020617';
    earInnerColor = '#111827';
  } else if (activeSuitShape === 'filyman') {
    baseColor = '#16A34A';
    lightColor = '#4ADE80';
    darkColor = '#15803D';
    earInnerColor = '#86EFAC';
  }

  const scarfColor =
    skinItem.accentColor || (skinItem.id === 'skin_classic' ? '#EF4444' : '#FACC15');

  ctx.save();
  ctx.translate(elephant.x, elephant.y);

  // Flicker during post-shield invincibility
  if (elephant.invincibleTimer > 0 && Math.floor(time * 18) % 2 === 0) {
    ctx.globalAlpha = 0.52;
  }

  // Shield Aura Bubble
  if (hasShield) {
    ctx.save();
    const shieldPulse = 1 + Math.sin(time * 5) * 0.04;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.88)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      (ELEPHANT_RADIUS + 13) * Math.max(bodyCfg.scaleX, bodyCfg.scaleY) * shieldPulse,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate(elephant.rotation);
  ctx.scale(bodyCfg.scaleX, bodyCfg.scaleY);

  const r = ELEPHANT_RADIUS;

  // Flowing Scarf, Coattails, Hood, Leaf Cape, or Petal Halo behind body
  const wave1 = Math.sin(time * 14 + elephant.scarfWave) * 5;
  const wave2 = Math.cos(time * 14 + elephant.scarfWave) * 7;
  if (activeSuitShape === 'tuxedo' || activeSuitShape === 'pirate') {
    ctx.fillStyle = activeSuitShape === 'pirate' ? '#7F1D1D' : '#0F172A';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.quadraticCurveTo(-24, 7 + wave1 * 0.55, -39, 11 + wave2 * 0.65);
    ctx.lineTo(-31, 14 + wave2 * 0.65);
    ctx.lineTo(-37, 19 + wave2 * 0.65);
    ctx.quadraticCurveTo(-20, 14 + wave1 * 0.55, -6, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (
    activeSuitShape === 'superhero' ||
    activeSuitShape === 'vampire' ||
    activeSuitShape === 'king_robe' ||
    activeSuitShape === 'surypap'
  ) {
    ctx.fillStyle =
      activeSuitShape === 'superhero' || activeSuitShape === 'surypap'
        ? '#EF4444'
        : activeSuitShape === 'vampire'
          ? '#7F1D1D'
          : '#581C87';
    ctx.strokeStyle = activeSuitShape === 'king_robe' ? '#FACC15' : '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, activeSuitShape === 'surypap' ? -1 : 2);
    ctx.quadraticCurveTo(-26, 2 + wave1 * 0.7, -45, 7 + wave2 * 0.85);
    ctx.lineTo(-40, 18 + wave2 * 0.8);
    ctx.quadraticCurveTo(-22, 12 + wave1 * 0.55, -6, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (activeSuitShape === 'bass') {
    // Royal-blue winter hoodie hood tucked cleanly behind skull
    ctx.fillStyle = '#2563EB';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-12, -13);
    ctx.quadraticCurveTo(-27, -14, -27, -2);
    ctx.quadraticCurveTo(-25, 8, -12, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (activeSuitShape === 'filyman') {
    // Leafy emerald cape behind stem body + radiant golden petal crown behind head
    ctx.fillStyle = '#15803D';
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, 3);
    ctx.quadraticCurveTo(-25, 4 + wave1 * 0.5, -39, 10 + wave2 * 0.65);
    ctx.lineTo(-33, 18 + wave2 * 0.65);
    ctx.quadraticCurveTo(-19, 13 + wave1 * 0.45, -6, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 7 radiating golden flower petals framing the head
    ctx.save();
    ctx.translate(4, -7);
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.9;
    const petalCount = 7;
    for (let i = 0; i < petalCount; i++) {
      const ang = (Math.PI * 2 * i) / petalCount - Math.PI / 2;
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, -18.5, 6.2, 9.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  } else if (!isWearingSuit) {
    ctx.fillStyle = scarfColor;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.quadraticCurveTo(-22, 4 + wave1, -38, 10 + wave2);
    ctx.lineTo(-34, 18 + wave2);
    ctx.quadraticCurveTo(-18, 12 + wave1, -2, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Legs (Custom character shorts/boots/slippers for Seviyeli costumes)
  const legColors = activeSuitShape
    ? getSuitLegColors(activeSuitShape)
    : { fill: darkColor, stroke: '#0F172A' };
  if (activeSuitShape === 'bass') {
    // Black athletic shorts with white side stripe + iconic PINK SLIPPERS!
    for (const lx of [-15, 2]) {
      const ly = lx < 0 ? 12.5 : 13.5;
      // Black shorts upper leg
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.roundRect(lx, ly, 9.5, 7, 2.5);
      ctx.fill();
      ctx.stroke();
      // White vertical stripe on shorts
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(lx + 1.8, ly + 1.2, 2, 4.8);
      // Pink slipper foot!
      ctx.fillStyle = '#F472B6';
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.roundRect(lx - 0.5, ly + 5.8, 11.5, 5.6, 2.8);
      ctx.fill();
      ctx.stroke();
      // Cozy light-pink slipper cuff
      ctx.fillStyle = '#FBCFE8';
      ctx.fillRect(lx + 1, ly + 6.4, 7.5, 1.8);
    }
  } else if (activeSuitShape === 'surypap') {
    // Tall bright crimson hero boots
    for (const lx of [-15, 2]) {
      const ly = lx < 0 ? 12.5 : 13.5;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(lx + 1, ly, 7.5, 3);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.roundRect(lx - 0.5, ly + 2.5, 11, 8.5, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(lx + 0.5, ly + 3.2, 9, 2);
    }
  } else {
    ctx.fillStyle = legColors.fill;
    ctx.strokeStyle = legColors.stroke;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-15, 13, 9, 10, 4);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(2, 14, 9, 10, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Tail
  ctx.strokeStyle = activeSuitShape === 'frind' ? '#312E81' : '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-r + 2, 2);
  ctx.quadraticCurveTo(-r - 10, -2 + wave1 * 0.3, -r - 12, 6);
  ctx.stroke();

  // Plump Body + Pattern Clip
  ctx.save();
  if (mobilePerf) {
    ctx.fillStyle = baseColor;
  } else {
    const bodyGrad = ctx.createRadialGradient(-4, -6, 4, 0, 0, r + 6);
    bodyGrad.addColorStop(0, lightColor);
    bodyGrad.addColorStop(0.65, baseColor);
    bodyGrad.addColorStop(1, darkColor);
    ctx.fillStyle = bodyGrad;
  }
  ctx.beginPath();
  ctx.ellipse(-2, 1, r + 2, r - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.clip();

  // Special skin patterns (stripes, spots, galaxy, metallic) — suppressed during full-character suit transformation
  if (!isCharacterTransformSuit) {
    if (skinItem.shape === 'stripes') {
      ctx.fillStyle = skinItem.accentColor || '#0F172A';
      for (let sx = -20; sx <= 18; sx += 11) {
        ctx.beginPath();
        ctx.ellipse(sx, -8, 2.6, 14, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (skinItem.shape === 'spots') {
      ctx.fillStyle = skinItem.accentColor || '#1E293B';
      const spots = [
        [-12, -8, 4.5],
        [3, -11, 3.5],
        [-6, 8, 5],
        [10, 4, 3.8],
        [-15, 3, 3.2],
      ];
      for (const [sx, sy, sr] of spots) {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (skinItem.shape === 'galaxy') {
      ctx.fillStyle = '#FDE047';
      const stars = [
        [-14, -7, 1.5],
        [2, -10, 2],
        [-7, 7, 1.6],
        [9, 6, 1.4],
        [-3, -2, 1.2],
      ];
      for (const [sx, sy, sr] of stars) {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (skinItem.shape === 'metallic') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-7, -9, 12, 5, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Filyman warm cream blossom face patch on upper head
  if (activeSuitShape === 'filyman') {
    ctx.fillStyle = '#FEF9C3';
    ctx.strokeStyle = '#CA8A04';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(7, -6, 14, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (bodyType === 'chubby' && !isWearingSuit) {
    ctx.fillStyle = lightColor;
    ctx.globalAlpha = 0.38;
    ctx.beginPath();
    ctx.ellipse(-1, 9, r * 0.72, r * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Body outline
  ctx.strokeStyle = activeSuitShape === 'frind' ? '#312E81' : '#0F172A';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(-2, 1, r + 2, r - 2, 0, 0, Math.PI * 2);
  ctx.stroke();

  const drawFlappingEar = () => {
    const flapAngle =
      elephant.earFlapTimer > 0
        ? Math.sin(elephant.earFlapTimer * 28) * 0.72 - 0.35
        : Math.sin(elephant.earPhase) * 0.14 + 0.12;

    ctx.save();
    ctx.translate(-3, -4);
    ctx.rotate(flapAngle);

    ctx.fillStyle = baseColor;
    ctx.strokeStyle = activeSuitShape === 'frind' ? '#312E81' : '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-10, 4, 15, 19, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = earInnerColor;
    ctx.beginPath();
    ctx.ellipse(-10, 5, 9, 12.5, 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  if (isWearingSuit && activeSuitShape) {
    // Draw Flapping Ear BEFORE suit overlay so bottom ear tucks cleanly INSIDE the suit/collar!
    drawFlappingEar();
    drawElephantSuitOverlay(ctx, activeSuitShape, r);

    // Re-stroke body outline cleanly over suit clip seam
    ctx.strokeStyle = activeSuitShape === 'frind' ? '#312E81' : '#0F172A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(-2, 1, r + 2, r - 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Classic Scarf Collar
    ctx.fillStyle = scarfColor;
    ctx.beginPath();
    ctx.roundRect(-6, 5, 16, 7, 3.5);
    ctx.fill();
    ctx.stroke();
  }

  // Character-specific head accessories BEFORE trunk/face details
  if (activeSuitShape === 'swamp') {
    // Slicked-back glossy black spiky puppet hair across crown
    ctx.save();
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12, -16);
    ctx.lineTo(3, -24);
    ctx.lineTo(-2, -18);
    ctx.lineTo(-10, -25);
    ctx.lineTo(-12, -17);
    ctx.lineTo(-21, -21);
    ctx.quadraticCurveTo(-15, -12, -5, -13);
    ctx.quadraticCurveTo(5, -13, 12, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (activeSuitShape === 'frind') {
    // Subtle pointed feline shadow ear silhouettes at crown
    ctx.save();
    ctx.fillStyle = '#0B0F19';
    ctx.strokeStyle = '#312E81';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-11, -15);
    ctx.lineTo(-7, -27);
    ctx.lineTo(1, -18);
    ctx.lineTo(7, -26);
    ctx.lineTo(12, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Trunk
  const trunkLift =
    elephant.earFlapTimer > 0 ? -7 : Math.min(8, Math.max(-6, elephant.vy * 0.014));
  ctx.strokeStyle = activeSuitShape === 'frind' ? '#312E81' : '#0F172A';
  ctx.lineWidth = 9.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r - 4, 0);
  ctx.bezierCurveTo(r + 12, -1 + trunkLift, r + 19, -8 + trunkLift, r + 15, -14 + trunkLift);
  ctx.stroke();

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(r - 4, 0);
  ctx.bezierCurveTo(r + 12, -1 + trunkLift, r + 19, -8 + trunkLift, r + 15, -14 + trunkLift);
  ctx.stroke();

  // Ivory Tusk (tucked lower for character masks so grins stay crisp)
  if (!isCharacterTransformSuit) {
    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r - 6, 7);
    ctx.quadraticCurveTo(r + 5, 10, r + 8, 3);
    ctx.quadraticCurveTo(r + 1, 5, r - 5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Eye & Character Face Features
  const eyeX = 11;
  const eyeY = -7;

  if (activeSuitShape === 'bass') {
    // 1:1 Skeleton Eye Socket + Glowing Electric-Cyan Eye & Flame Wisp + Nasal Cavity + Wide Tooth Grin!
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 6.4, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Small dark second socket glint further forward on skull
    ctx.beginPath();
    ctx.ellipse(eyeX + 8, eyeY + 0.5, 2.3, 3.2, 0.15, 0, Math.PI * 2);
    ctx.fill();

    if (elephant.isHurt) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(eyeX - 3.5, eyeY - 3.5);
      ctx.lineTo(eyeX + 3.5, eyeY + 3.5);
      ctx.moveTo(eyeX + 3.5, eyeY - 3.5);
      ctx.lineTo(eyeX - 3.5, eyeY + 3.5);
      ctx.stroke();
    } else {
      // Glowing cyan flame wisp rising from eye socket
      const wispWave = Math.sin(time * 16) * 1.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.beginPath();
      ctx.moveTo(eyeX - 1, eyeY - 2);
      ctx.quadraticCurveTo(eyeX - 8, eyeY - 9 + wispWave, eyeX - 12, eyeY - 12 - wispWave);
      ctx.quadraticCurveTo(eyeX - 5, eyeY - 6, eyeX + 2, eyeY - 2);
      ctx.closePath();
      ctx.fill();

      // Glowing cyan iris + white core
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(eyeX + 0.8, eyeY, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(eyeX + 1.1, eyeY, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Black inverted-heart nasal socket near snout bridge
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(16.5, -2.5);
    ctx.lineTo(14.5, 0.5);
    ctx.lineTo(18.5, 0.5);
    ctx.closePath();
    ctx.fill();

    // Wide iconic skeleton tooth grin
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(8, 5, 16.5, 2.5);
    ctx.quadraticCurveTo(15.5, 8.2, 8, 8.6);
    ctx.quadraticCurveTo(1, 8.2, 0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const tx of [3.5, 7, 10.5, 13.5]) {
      ctx.moveTo(tx, 3.2);
      ctx.lineTo(tx, 8.1);
    }
    ctx.stroke();
  } else if (activeSuitShape === 'surypap') {
    // Tall energetic skeleton: dark fierce eye socket, nasal cavity, wide confident tooth grin
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 5.2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (elephant.isHurt) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(eyeX - 3, eyeY - 3);
      ctx.lineTo(eyeX + 3, eyeY + 3);
      ctx.moveTo(eyeX + 3, eyeY - 3);
      ctx.lineTo(eyeX - 3, eyeY + 3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(eyeX + 1, eyeY, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Expressive fierce skeletal brow
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(eyeX - 6, eyeY - 6);
      ctx.lineTo(eyeX + 5, eyeY - 4);
      ctx.stroke();
    }

    // Nasal triangle
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(16.5, -2.5);
    ctx.lineTo(14.5, 0.5);
    ctx.lineTo(18.5, 0.5);
    ctx.closePath();
    ctx.fill();

    // Confident toothy grin
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(1, 2.2);
    ctx.quadraticCurveTo(9, 4.5, 16.5, 1.8);
    ctx.quadraticCurveTo(15.5, 8.2, 8.5, 8.5);
    ctx.quadraticCurveTo(2, 8, 1, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const tx of [4.5, 8.2, 12]) {
      ctx.moveTo(tx, 3.2);
      ctx.lineTo(tx, 8);
    }
    ctx.stroke();
  } else if (activeSuitShape === 'swamp') {
    // Puppet salesman: rosy red cheek, segmented jaw teeth & signature pink/yellow round glasses
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(3.5, 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Puppet jaw hinge line & toothy mouth
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(4.5, 3, 12, 4.8, 1.8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, 3);
    ctx.lineTo(5, 11);
    ctx.moveTo(8.5, 3);
    ctx.lineTo(8.5, 7.8);
    ctx.moveTo(12.5, 3);
    ctx.lineTo(12.5, 7.8);
    ctx.stroke();

    if (elephant.isHurt) {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(eyeX - 4, eyeY - 4);
      ctx.lineTo(eyeX + 4, eyeY + 4);
      ctx.moveTo(eyeX + 4, eyeY - 4);
      ctx.lineTo(eyeX - 4, eyeY + 4);
      ctx.stroke();
    } else if (!glassesItem || glassesItem.shape === 'none') {
      // Two-tone round lenses: vivid Pink (#EC4899) & Golden Yellow (#FACC15)
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.arc(eyeX - 2.8, eyeY - 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(eyeX + 4.5, eyeY + 0.3, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bridge & temple arm
      ctx.beginPath();
      ctx.moveTo(eyeX - 7.8, eyeY - 0.5);
      ctx.lineTo(eyeX - 15, eyeY - 1.5);
      ctx.stroke();
    }
  } else if (activeSuitShape === 'frind') {
    // Glowing heterochromatic pink & yellow eyes + huge jagged white grin!
    if (elephant.isHurt) {
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(eyeX - 4, eyeY - 4);
      ctx.lineTo(eyeX + 4, eyeY + 4);
      ctx.moveTo(eyeX + 4, eyeY - 4);
      ctx.lineTo(eyeX - 4, eyeY + 4);
      ctx.stroke();
    } else {
      // Back eye (Pink) + Front eye (Yellow)
      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.arc(eyeX - 4.5, eyeY - 1, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDF2F8';
      ctx.beginPath();
      ctx.arc(eyeX - 4, eyeY - 1.2, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(eyeX + 3.8, eyeY - 0.2, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF9C3';
      ctx.beginPath();
      ctx.arc(eyeX + 4.4, eyeY - 0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wide glowing white serrated grin
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-2, 1.5);
    ctx.quadraticCurveTo(8, 5, 17, 1);
    ctx.quadraticCurveTo(15, 9.5, 7.5, 10);
    ctx.quadraticCurveTo(0, 9.5, -2, 1.5);
    ctx.closePath();
    ctx.fill();

    // Jagged tooth lines across the white smile
    ctx.strokeStyle = '#0B0F19';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(1.5, 3);
    ctx.lineTo(3.5, 7.8);
    ctx.lineTo(6, 3.8);
    ctx.lineTo(8.8, 8.2);
    ctx.lineTo(11.5, 3.5);
    ctx.lineTo(14.2, 7.5);
    ctx.stroke();
  } else {
    // Classic Elephant / Filyman expressive eyes
    if (elephant.isHurt) {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(eyeX - 4, eyeY - 4);
      ctx.lineTo(eyeX + 4, eyeY + 4);
      ctx.moveTo(eyeX + 4, eyeY - 4);
      ctx.lineTo(eyeX - 4, eyeY + 4);
      ctx.stroke();
    } else {
      const isBlinking = elephant.blinkTimer > 0 && elephant.blinkTimer < 0.12;
      if (isBlinking) {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(eyeX - 4, eyeY);
        ctx.lineTo(eyeX + 4, eyeY);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(eyeX + 1.5, eyeY, 2.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(eyeX + 2.3, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (activeSuitShape === 'filyman') {
      // Rosy flower cheek + cheeky white blossom smile
      ctx.fillStyle = 'rgba(251, 113, 133, 0.7)';
      ctx.beginPath();
      ctx.arc(4, -0.5, 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(7.5, 1);
      ctx.quadraticCurveTo(12, 2.5, 16, 0.5);
      ctx.quadraticCurveTo(13, 5.5, 7.5, 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Glasses Cosmetic (optional player override on top)
  if (glassesItem && glassesItem.shape !== 'none') {
    drawElephantGlasses(ctx, glassesItem, eyeX, eyeY);
  }

  // Normal ear on top when not wearing an overlay suit
  if (!isWearingSuit) {
    drawFlappingEar();
  }

  // Hats Cosmetic
  if (hatItem && hatItem.shape !== 'none') {
    drawElephantHat(ctx, hatItem, time);
  }

  ctx.restore();
}

function drawElephantGlasses(
  ctx: CanvasRenderingContext2D,
  item: CosmeticItem,
  eyeX: number,
  eyeY: number
) {
  const main = item.previewColor;
  const accent = item.accentColor || '#FFFFFF';

  ctx.save();
  if (item.shape === 'sunglasses') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(eyeX - 7, eyeY - 5, 14, 9, 2.5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeX - 7, eyeY - 2);
    ctx.lineTo(eyeX - 15, eyeY - 1);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(eyeX - 3, eyeY - 3);
    ctx.lineTo(eyeX + 1, eyeY + 1);
    ctx.stroke();
  } else if (item.shape === 'monocle') {
    ctx.strokeStyle = main;
    ctx.lineWidth = 2.2;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.26)';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(eyeX - 4, eyeY + 5);
    ctx.quadraticCurveTo(eyeX - 7, eyeY + 14, eyeX - 3, eyeY + 20);
    ctx.stroke();
  } else if (item.shape === 'visor') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(eyeX - 10, eyeY - 4.5, 20, 7.5, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(eyeX - 6, eyeY - 2, 12, 2);
  } else if (item.shape === 'round') {
    ctx.strokeStyle = main;
    ctx.lineWidth = 2.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeX - 6.5, eyeY);
    ctx.lineTo(eyeX - 14, eyeY);
    ctx.stroke();
  } else if (item.shape === 'star') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? 8.5 : 4;
      const angle = (Math.PI * i) / 5 - Math.PI / 2;
      const sx = eyeX + Math.cos(angle) * rad;
      const sy = eyeY + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'heart') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(eyeX, eyeY + 6);
    ctx.bezierCurveTo(eyeX - 9, eyeY, eyeX - 8, eyeY - 7, eyeX, eyeY - 3);
    ctx.bezierCurveTo(eyeX + 8, eyeY - 7, eyeX + 9, eyeY, eyeX, eyeY + 6);
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'pixel') {
    ctx.fillStyle = '#020617';
    ctx.fillRect(eyeX - 8, eyeY - 4, 16, 6);
    ctx.fillRect(eyeX - 6, eyeY + 2, 12, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(eyeX - 4, eyeY - 2, 3, 2);
    ctx.fillRect(eyeX + 2, eyeY - 2, 3, 2);
  } else if (item.shape === '3d') {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(eyeX - 7, eyeY - 5, 14, 9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(eyeX - 5, eyeY - 3, 5, 5);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(eyeX + 1, eyeY - 3, 5, 5);
  } else if (item.shape === 'eyepatch') {
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eyeX - 14, eyeY - 6);
    ctx.lineTo(eyeX + 8, eyeY + 4);
    ctx.stroke();
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'phantom') {
    // Sleek angular obsidian frame + glowing cyan-to-fuchsia prism visor + swept cyber wing tip
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;

    // Swept aerodynamic side wing temple
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.moveTo(eyeX - 6, eyeY - 2);
    ctx.lineTo(eyeX - 17, eyeY - 7);
    ctx.lineTo(eyeX - 13, eyeY + 1);
    ctx.lineTo(eyeX - 6, eyeY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Angular crystal-prism shield lens
    const lensGrad = ctx.createLinearGradient(eyeX - 8, eyeY - 6, eyeX + 10, eyeY + 5);
    lensGrad.addColorStop(0, accent);
    lensGrad.addColorStop(0.55, '#8B5CF6');
    lensGrad.addColorStop(1, '#F43F5E');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.moveTo(eyeX - 8, eyeY - 4);
    ctx.lineTo(eyeX + 10, eyeY - 6);
    ctx.lineTo(eyeX + 7, eyeY + 4);
    ctx.lineTo(eyeX - 5, eyeY + 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cyan rim highlight & specular slash
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(eyeX - 3, eyeY - 3.5);
    ctx.lineTo(eyeX + 2, eyeY + 2.5);
    ctx.moveTo(eyeX + 2.5, eyeY - 4);
    ctx.lineTo(eyeX + 6, eyeY + 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawElephantHat(ctx: CanvasRenderingContext2D, item: CosmeticItem, time: number) {
  const main = item.previewColor;
  const accent = item.accentColor || '#FACC15';

  ctx.save();
  ctx.translate(2, -19);

  if (item.shape === 'crown') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-11, 3);
    ctx.lineTo(-13, -10);
    ctx.lineTo(-5, -3);
    ctx.lineTo(0, -13);
    ctx.lineTo(5, -3);
    ctx.lineTo(13, -10);
    ctx.lineTo(11, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -2, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.shape === 'aviator') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-1, 3, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(1, -5, 11, 6, 2.5);
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'party') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-9, 2);
    ctx.lineTo(0, -18);
    ctx.lineTo(9, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -19, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'propeller') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 3, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.arc(0, 3, 11, -Math.PI * 0.45, 0);
    ctx.closePath();
    ctx.fill();

    const spinWidth = Math.max(2, Math.abs(Math.cos(time * 22)) * 15);
    ctx.fillStyle = accent;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-spinWidth, -13, spinWidth * 2, 4, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.shape === 'wizard') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    // Brim
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Cone bent slightly back
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.quadraticCurveTo(-4, -14, -12, -22);
    ctx.quadraticCurveTo(2, -14, 10, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Star badge
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -6, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.shape === 'tophat') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-14, 0, 28, 4, 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(-10, -16, 20, 17, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(-9, -4, 18, 3.5);
  } else if (item.shape === 'viking') {
    // Horns
    ctx.fillStyle = accent;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.quadraticCurveTo(-20, -8, -16, -18);
    ctx.quadraticCurveTo(-12, -10, -6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.quadraticCurveTo(20, -8, 16, -18);
    ctx.quadraticCurveTo(12, -10, 6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dome
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(0, 3, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'chef') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.arc(-6, -10, 8, 0, Math.PI * 2);
    ctx.arc(6, -10, 8, 0, Math.PI * 2);
    ctx.arc(0, -14, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-10, -6, 20, 9);
    ctx.strokeRect(-10, -6, 20, 9);
  } else if (item.shape === 'halo') {
    const hover = Math.sin(time * 5) * 2;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -9 + hover, 13, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = main;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, -9 + hover, 13, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (item.shape === 'devil') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.quadraticCurveTo(-13, -10, -7, -15);
    ctx.quadraticCurveTo(-4, -8, -2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.quadraticCurveTo(10, -10, 14, -14);
    ctx.quadraticCurveTo(12, -5, 10, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'beanie') {
    ctx.fillStyle = main;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 3, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Brim cuff
    ctx.fillStyle = adjustHex(main, -25);
    ctx.beginPath();
    ctx.roundRect(-13, -1, 26, 5, 2.5);
    ctx.fill();
    ctx.stroke();
    // Pom
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (item.shape === 'astronaut') {
    ctx.restore(); // Reset top-of-head translation so helmet wraps head
    ctx.save();
    ctx.strokeStyle = main;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(2, -1, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Glass shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(2, -1, 22, -Math.PI * 0.75, -Math.PI * 0.45);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawElephantPortrait(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bodyType: BodyType,
  equipped: EquippedCosmetics,
  options?: {
    background?: 'none' | 'savanna' | 'dark';
    showShield?: boolean;
    time?: number;
    scale?: number;
  }
) {
  const bg = options?.background ?? 'none';
  const time = options?.time ?? 1.2;
  const userScale = options?.scale ?? 1;

  ctx.clearRect(0, 0, width, height);

  if (bg === 'savanna') {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#0284C7');
    sky.addColorStop(0.65, '#7DD3FC');
    sky.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.24, width * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.24, width * 0.095, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 1.03, width * 0.75, height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (bg === 'dark') {
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.42,
      width * 0.08,
      width * 0.5,
      height * 0.5,
      width * 0.6
    );
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  const unitScale = (Math.min(width, height) / 96) * userScale;
  const dummyElephant: ElephantState = {
    x: 0,
    y: 0,
    vy: -60,
    rotation: -0.05,
    earPhase: 0.5,
    earFlapTimer: 0,
    trunkPhase: 0,
    scarfWave: 0.4,
    blinkTimer: 2,
    isHurt: false,
    invincibleTimer: 0,
  };

  ctx.save();
  ctx.translate(width * 0.47, height * 0.57);
  ctx.scale(unitScale, unitScale);
  drawElephant(ctx, dummyElephant, bodyType, equipped, Boolean(options?.showShield), time);
  ctx.restore();
}

export function drawCosmeticItemIcon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  item: CosmeticItem,
  time = 1.2
) {
  ctx.clearRect(0, 0, width, height);
  const minDim = Math.min(width, height);

  if (item.category === 'skin' || item.category === 'suit') {
    drawElephantPortrait(
      ctx,
      width,
      height,
      'normal',
      {
        hat: 'hat_none',
        glasses: 'glasses_none',
        skin: item.category === 'skin' ? item.id : 'skin_classic',
        trail: 'trail_none',
        suit: item.category === 'suit' ? item.id : 'suit_none',
      },
      { background: 'none', time, scale: 1.06 }
    );
    return;
  }

  if (item.category === 'hat') {
    if (item.shape === 'none') {
      ctx.save();
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = Math.max(1.8, minDim * 0.05);
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.52, minDim * 0.28, Math.PI, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(width * 0.25, height * 0.72);
      ctx.lineTo(width * 0.75, height * 0.28);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    if (item.shape === 'astronaut') {
      const s = minDim / 64;
      ctx.translate(width * 0.5 - 2 * s, height * 0.52 + 1 * s);
      ctx.scale(s, s);
      drawElephantHat(ctx, item, time);
    } else {
      const s = minDim / 44;
      ctx.translate(width * 0.5 - 2 * s, height * 0.72 + 12 * s);
      ctx.scale(s, s);
      drawElephantHat(ctx, item, time);
    }
    ctx.restore();
    return;
  }

  if (item.category === 'glasses') {
    if (item.shape === 'none') {
      ctx.save();
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = Math.max(1.8, minDim * 0.05);
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, minDim * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(width * 0.26, height * 0.74);
      ctx.lineTo(width * 0.74, height * 0.26);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const s = minDim / 28;
    ctx.save();
    ctx.translate(width * 0.56, height * 0.5);
    ctx.scale(s, s);
    drawElephantGlasses(ctx, item, 0, 0);
    ctx.restore();
    return;
  }

  // Trail preview: diagonal burst of styled trail particles
  const rainbowPalette = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#38BDF8', '#A855F7'];
  const points = [
    { x: 0.22, y: 0.76, r: 0.085, a: 0.45 },
    { x: 0.37, y: 0.62, r: 0.105, a: 0.62 },
    { x: 0.54, y: 0.46, r: 0.125, a: 0.8 },
    { x: 0.74, y: 0.28, r: 0.15, a: 0.98 },
  ];

  points.forEach((pt, idx) => {
    let color = item.previewColor;
    let mode: 'puff' | 'ring' | 'spark' = 'puff';

    if (item.shape === 'rainbow' || item.shape === 'confetti') {
      color = rainbowPalette[(idx + 1) % rainbowPalette.length];
      mode = 'spark';
    } else if (item.shape === 'aurora') {
      color = idx % 2 === 0 ? '#2DD4BF' : '#A855F7';
      mode = 'puff';
    } else if (item.shape === 'royal') {
      color = idx % 2 === 0 ? '#9333EA' : '#FACC15';
      mode = 'spark';
    } else if (item.shape === 'ring') {
      mode = 'ring';
    } else if (item.shape === 'spark') {
      mode = 'spark';
    }

    const px = width * pt.x;
    const py = height * pt.y;
    const pr = minDim * pt.r;

    ctx.save();
    ctx.globalAlpha = pt.a;
    if (mode === 'ring') {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.8, minDim * 0.045);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.stroke();
    } else if (mode === 'spark') {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? pr * 1.25 : pr * 0.5;
        const ang = (Math.PI * i) / 4;
        const sx = px + Math.cos(ang) * rad;
        const sy = py + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

export function exportElephantAvatarDataUrl(
  bodyType: BodyType,
  equipped: EquippedCosmetics,
  background: 'none' | 'savanna' = 'none',
  size = 512
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  drawElephantPortrait(ctx, size, size, bodyType, equipped, {
    background,
    time: 1.2,
    scale: 1.08,
  });
  return canvas.toDataURL('image/png');
}

