export type NameColorTier = 'default' | 'epic' | 'legendary' | 'mythic' | 'emperor';

export interface NameColorDefinition {
  id: string;
  name: string;
  tier: NameColorTier;
  cost: number;
  colorsLabel: string;
  fastAnimation?: boolean;
  swatchGradient: string;
}

export const NAME_COLOR_TIER_LABELS: Record<
  NameColorTier,
  { label: string; textClass: string; borderClass: string }
> = {
  default: { label: 'Standart', textClass: 'text-slate-300', borderClass: 'border-slate-600' },
  epic: { label: 'Destansı', textClass: 'text-purple-300', borderClass: 'border-purple-500/60' },
  legendary: { label: 'Efsanevi', textClass: 'text-amber-300', borderClass: 'border-amber-400/70' },
  mythic: { label: 'Mitik', textClass: 'text-cyan-300', borderClass: 'border-cyan-400/70' },
  emperor: { label: 'İmparator', textClass: 'text-rose-300', borderClass: 'border-rose-400/80' },
};

export const NAME_COLOR_CATALOG: NameColorDefinition[] = [
  {
    id: 'name_default',
    name: 'Klasik Beyaz',
    tier: 'default',
    cost: 0,
    colorsLabel: 'Sabit Beyaz',
    swatchGradient: 'linear-gradient(90deg, #f8fafc, #e2e8f0)',
  },
  // TIER 1 — Destansı (120F - 180F)
  {
    id: 'nc_savanna_sun',
    name: 'Savan Güneşi',
    tier: 'epic',
    cost: 120,
    colorsLabel: 'Altın · Turuncu · Yakut',
    swatchGradient: 'linear-gradient(90deg, #facc15, #f97316, #ef4444)',
  },
  {
    id: 'nc_ice_crystal',
    name: 'Buz Kristali',
    tier: 'epic',
    cost: 130,
    colorsLabel: 'Buz Mavisi · Çivit · İnci',
    swatchGradient: 'linear-gradient(90deg, #e0f2fe, #38bdf8, #818cf8)',
  },
  {
    id: 'nc_crimson_flame',
    name: 'Kızıl Alev',
    tier: 'epic',
    cost: 140,
    colorsLabel: 'Kızıl · Kor · Alev Sarısı',
    swatchGradient: 'linear-gradient(90deg, #dc2626, #f97316, #fde047)',
  },
  {
    id: 'nc_emerald_bolt',
    name: 'Zümrüt Şimşeği',
    tier: 'epic',
    cost: 140,
    colorsLabel: 'Zümrüt · Neon Yeşil · Nane',
    swatchGradient: 'linear-gradient(90deg, #10b981, #4ade80, #a7f3d0)',
  },
  {
    id: 'nc_amethyst_wave',
    name: 'Ametist Dalga',
    tier: 'epic',
    cost: 150,
    colorsLabel: 'Eflatun · Mor · Lavanta',
    swatchGradient: 'linear-gradient(90deg, #a855f7, #e879f9, #c084fc)',
  },
  {
    id: 'nc_coral_sunset',
    name: 'Mercan Batımı',
    tier: 'epic',
    cost: 160,
    colorsLabel: 'Mercan · Pembe · Şeftali',
    swatchGradient: 'linear-gradient(90deg, #fb7185, #fdba74, #f472b6)',
  },
  {
    id: 'nc_toxic_lime',
    name: 'Radyoaktif Limon',
    tier: 'epic',
    cost: 170,
    colorsLabel: 'Lime · Zümrüt · Neon Sarı',
    swatchGradient: 'linear-gradient(90deg, #a3e635, #22c55e, #fde047)',
  },
  {
    id: 'nc_midnight_dawn',
    name: 'Gece Şafağı',
    tier: 'epic',
    cost: 180,
    colorsLabel: 'Çivit · Gümüş · Gök Mavisi',
    swatchGradient: 'linear-gradient(90deg, #6366f1, #cbd5e1, #38bdf8)',
  },

  // TIER 2 — Efsanevi (220F - 340F)
  {
    id: 'nc_cyber_neon',
    name: 'Siberpunk Neon',
    tier: 'legendary',
    cost: 220,
    colorsLabel: 'Siber Cyan · Neon Pembe · Mor',
    swatchGradient: 'linear-gradient(90deg, #22d3ee, #ec4899, #a855f7)',
  },
  {
    id: 'nc_magma_burst',
    name: 'Magma Patlaması',
    tier: 'legendary',
    cost: 240,
    colorsLabel: 'Lav Kırmızısı · Altın · Kor',
    swatchGradient: 'linear-gradient(90deg, #ef4444, #facc15, #fb923c)',
  },
  {
    id: 'nc_aurora_lights',
    name: 'Kuzey Işıkları',
    tier: 'legendary',
    cost: 250,
    colorsLabel: 'Turkuaz · Zümrüt · Çivit',
    swatchGradient: 'linear-gradient(90deg, #2dd4bf, #4ade80, #818cf8)',
  },
  {
    id: 'nc_plasma_storm',
    name: 'Plazma Fırtınası',
    tier: 'legendary',
    cost: 260,
    colorsLabel: 'Elektrik Mavi · Beyaz · Fuşya',
    swatchGradient: 'linear-gradient(90deg, #38bdf8, #ffffff, #d946ef)',
  },
  {
    id: 'nc_mystic_ocean',
    name: 'Mistik Okyanus',
    tier: 'legendary',
    cost: 270,
    colorsLabel: 'Derin Mavi · Akua · İnci',
    swatchGradient: 'linear-gradient(90deg, #0ea5e9, #2dd4bf, #e0f2fe)',
  },
  {
    id: 'nc_sakura_dream',
    name: 'Sakura Rüyası',
    tier: 'legendary',
    cost: 280,
    colorsLabel: 'Kiraz Pembe · İnci · Altın',
    swatchGradient: 'linear-gradient(90deg, #f9a8d4, #fff1f2, #fde68a)',
  },
  {
    id: 'nc_ruby_gold',
    name: 'Altın & Yakut',
    tier: 'legendary',
    cost: 300,
    colorsLabel: 'Saf Altın · Kan Kırmızısı',
    swatchGradient: 'linear-gradient(90deg, #facc15, #e11d48, #fef08a)',
  },
  {
    id: 'nc_royal_velvet',
    name: 'Kraliyet Kadifesi',
    tier: 'legendary',
    cost: 310,
    colorsLabel: 'Kraliyet Moru · Altın · Gül',
    swatchGradient: 'linear-gradient(90deg, #9333ea, #facc15, #fb7185)',
  },
  {
    id: 'nc_silver_thunder',
    name: 'Gümüş Yıldırım',
    tier: 'legendary',
    cost: 320,
    colorsLabel: 'Krom Beyaz · Çelik · Elektrik Mavi',
    swatchGradient: 'linear-gradient(90deg, #f8fafc, #94a3b8, #38bdf8)',
  },
  {
    id: 'nc_mint_berry',
    name: 'Nane & Böğürtlen',
    tier: 'legendary',
    cost: 340,
    colorsLabel: 'Nane · Turkuaz · Mor · Pembe',
    swatchGradient: 'linear-gradient(90deg, #34d399, #2dd4bf, #a855f7, #ec4899)',
  },

  // TIER 3 — Mitik (400F - 600F)
  {
    id: 'nc_liquid_gold',
    name: '24 Ayar Sıvı Altın',
    tier: 'mythic',
    cost: 400,
    colorsLabel: 'Parlak Altın · Şampanya · Bronz',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #b45309, #fde047, #ffffff, #f59e0b)',
  },
  {
    id: 'nc_diamond_prism',
    name: 'Elmas Prizma',
    tier: 'mythic',
    cost: 440,
    colorsLabel: 'Elmas Beyaz · Cyan · Eflatun',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #ffffff, #67e8f9, #e879f9)',
  },
  {
    id: 'nc_galaxy_nebula',
    name: 'Galaksi Bulutsusu',
    tier: 'mythic',
    cost: 480,
    colorsLabel: 'Kozmik Mor · Yıldız Sarısı · Pembe',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #4f46e5, #c084fc, #fde047, #ec4899)',
  },
  {
    id: 'nc_rainbow_wave',
    name: 'Gökkuşağı Dalgası',
    tier: 'mythic',
    cost: 500,
    colorsLabel: '6 Renkli Akıcı Spektrum',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #ef4444, #facc15, #22c55e, #38bdf8, #a855f7)',
  },
  {
    id: 'nc_hologram_flow',
    name: 'Hologram Akışı',
    tier: 'mythic',
    cost: 520,
    colorsLabel: 'Pastel Cyan · Pembe · Limon · Nane',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #a5f3fc, #f9a8d4, #fef08a, #6ee7b7)',
  },
  {
    id: 'nc_solar_eclipse',
    name: 'Güneş Tutulması',
    tier: 'mythic',
    cost: 550,
    colorsLabel: 'Alev Turuncu · Mor · Altın',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #f97316, #581c87, #fde047, #dc2626)',
  },
  {
    id: 'nc_cotton_candy_pro',
    name: 'Şeker Prizma',
    tier: 'mythic',
    cost: 580,
    colorsLabel: 'Pembe · Gökyüzü · Altın · Lavanta',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #f472b6, #7dd3fc, #fde047, #c084fc)',
  },
  {
    id: 'nc_obsidian_fire',
    name: 'Obsidyen Ateşi',
    tier: 'mythic',
    cost: 600,
    colorsLabel: 'Çelik · Kızıl · Beyaz Kıvılcım · Turuncu',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #94a3b8, #ef4444, #ffffff, #f97316)',
  },

  // TIER 4 — İmparator (750F - 1.200F)
  {
    id: 'nc_emperor_chroma',
    name: 'İmparator Chroması',
    tier: 'emperor',
    cost: 750,
    colorsLabel: 'Hızlı Lüks Neon Spektrum',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #facc15, #22d3ee, #ec4899, #4ade80, #a855f7)',
  },
  {
    id: 'nc_savanna_god',
    name: 'Savan Tanrısı',
    tier: 'emperor',
    cost: 850,
    colorsLabel: 'Altın · Zümrüt · Güneş Işığı · Beyaz',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #fef08a, #22c55e, #f59e0b, #ffffff)',
  },
  {
    id: 'nc_cosmic_supernova',
    name: 'Kozmik Süpernova',
    tier: 'emperor',
    cost: 900,
    colorsLabel: 'Elmas · Siber Mavi · Mor · Gül · Altın',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #ffffff, #38bdf8, #a855f7, #f43f5e, #fde047)',
  },
  {
    id: 'nc_eternal_rainbow',
    name: 'Ebedi Gökkuşağı',
    tier: 'emperor',
    cost: 1000,
    colorsLabel: 'Ultra Hızlı 7 Renkli Prizma',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #ff4d4d, #ffa64d, #ffff4d, #4dff88, #4dd2ff, #b84dff, #ff4da6)',
  },
  {
    id: 'nc_diamond_inferno',
    name: 'Sonsuz Elmas Ateşi',
    tier: 'emperor',
    cost: 1100,
    colorsLabel: 'Buz Elmas · Kızıl Alev · Saf Altın',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #e0f2fe, #38bdf8, #ef4444, #facc15)',
  },
  {
    id: 'nc_golden_empire',
    name: 'Altın İmparatorluk',
    tier: 'emperor',
    cost: 1200,
    colorsLabel: 'Kraliyet Altını · Elmas · Yakut Parıltısı',
    fastAnimation: true,
    swatchGradient: 'linear-gradient(90deg, #fde047, #ffffff, #f59e0b, #e11d48)',
  },
];

export const NAME_COLOR_BY_ID: Record<string, NameColorDefinition> = Object.fromEntries(
  NAME_COLOR_CATALOG.map((item) => [item.id, item])
);
