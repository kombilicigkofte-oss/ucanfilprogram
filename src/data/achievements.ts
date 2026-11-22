import { AchievementDefinition, MedalTier } from '../types/game';

export const MEDAL_TIER_STYLES: Record<
  MedalTier,
  {
    label: string;
    badgeBg: string;
    border: string;
    text: string;
    ring: string;
  }
> = {
  bronze: {
    label: 'Bronz Madalya',
    badgeBg: 'from-amber-700/80 to-orange-900/90',
    border: 'border-amber-600/60',
    text: 'text-amber-300',
    ring: 'ring-amber-500/30',
  },
  silver: {
    label: 'Gümüş Madalya',
    badgeBg: 'from-slate-300/30 to-slate-600/60',
    border: 'border-slate-300/60',
    text: 'text-slate-200',
    ring: 'ring-slate-300/30',
  },
  gold: {
    label: 'Altın Madalya',
    badgeBg: 'from-yellow-500/40 to-amber-700/60',
    border: 'border-yellow-400/70',
    text: 'text-yellow-300',
    ring: 'ring-yellow-400/35',
  },
  diamond: {
    label: 'Elmas Rozet',
    badgeBg: 'from-cyan-400/35 to-sky-700/60',
    border: 'border-cyan-400/70',
    text: 'text-cyan-200',
    ring: 'ring-cyan-400/35',
  },
  mythic: {
    label: 'Mitik Nişan',
    badgeBg: 'from-rose-500/40 via-purple-600/45 to-emerald-500/40',
    border: 'border-emerald-400/75',
    text: 'text-emerald-300',
    ring: 'ring-emerald-400/40',
  },
};

// Seviyeli Moduna Özel Başarımlar (Skor, Hasarsız Uçuş Süresi ve Bölüm İlerlemesi)
export const LEVELED_ACHIEVEMENTS: AchievementDefinition[] = [
  // ================= SKOR MADALYALARI =================
  {
    id: 'ach_score_20',
    category: 'score',
    medalTier: 'bronze',
    title: 'İlk Sıçrama',
    description: 'Seviyeli modda tek seferde 20 puana ulaş.',
    target: 20,
    unitLabel: 'puan',
    rewardPeanuts: 10,
  },
  {
    id: 'ach_score_50',
    category: 'score',
    medalTier: 'silver',
    title: 'Bölüm Avcısı',
    description: 'Seviyeli modda tek seferde 50 puana ulaş.',
    target: 50,
    unitLabel: 'puan',
    rewardPeanuts: 20,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_score_100',
    category: 'score',
    medalTier: 'gold',
    title: 'Yüzlük Fil',
    description: 'Seviyeli modda tek seferde 100 puana ulaş.',
    target: 100,
    unitLabel: 'puan',
    rewardPeanuts: 35,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_score_175',
    category: 'score',
    medalTier: 'diamond',
    title: 'Göklerin Hakimi',
    description: 'Seviyeli modda tek seferde 175 puana ulaş.',
    target: 175,
    unitLabel: 'puan',
    rewardPeanuts: 60,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_score_300',
    category: 'score',
    medalTier: 'mythic',
    title: 'Efsanevi Uçuş',
    description: 'Seviyeli modda tek seferde 300 puana ulaş.',
    target: 300,
    unitLabel: 'puan',
    rewardPeanuts: 120,
    rewardCrateTier: 'mythic',
  },

  // ================= HASARSIZ / ENGELSİZ UÇUŞ ROZETLERİ =================
  {
    id: 'ach_flight_15',
    category: 'flight',
    medalTier: 'bronze',
    title: 'Temiz Kanat',
    description: 'Seviyeli modda engellere çarpmadan 15 saniye aralıksız uç.',
    target: 15,
    unitLabel: 'sn',
    rewardPeanuts: 10,
  },
  {
    id: 'ach_flight_30',
    category: 'flight',
    medalTier: 'silver',
    title: 'Süzülen Gölge',
    description: 'Seviyeli modda engellere çarpmadan 30 saniye aralıksız uç.',
    target: 30,
    unitLabel: 'sn',
    rewardPeanuts: 20,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_flight_50',
    category: 'flight',
    medalTier: 'gold',
    title: 'Çelik Sinir',
    description: 'Seviyeli modda engellere çarpmadan 50 saniye aralıksız uç.',
    target: 50,
    unitLabel: 'sn',
    rewardPeanuts: 35,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_flight_80',
    category: 'flight',
    medalTier: 'diamond',
    title: 'Rüzgarın Ruhu',
    description: 'Seviyeli modda engellere çarpmadan 80 saniye aralıksız uç.',
    target: 80,
    unitLabel: 'sn',
    rewardPeanuts: 65,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_flight_120',
    category: 'flight',
    medalTier: 'mythic',
    title: 'Dokunulmaz Fil',
    description: 'Seviyeli modda engellere çarpmadan 120 saniye aralıksız uç.',
    target: 120,
    unitLabel: 'sn',
    rewardPeanuts: 125,
    rewardCrateTier: 'mythic',
  },

  // ================= BÖLÜM TAMAMLAMA NİŞANLARI =================
  {
    id: 'ach_lvl_2',
    category: 'level',
    medalTier: 'bronze',
    title: 'Yolculuk Başladı',
    description: 'Seviyeli modda 2 bölümü başarıyla tamamla.',
    target: 2,
    unitLabel: 'bölüm',
    rewardPeanuts: 15,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_lvl_5',
    category: 'level',
    medalTier: 'silver',
    title: 'İlk Patron Fatihi',
    description: 'Seviyeli modda 5 bölümü (ilk Patron dahil) tamamla.',
    target: 5,
    unitLabel: 'bölüm',
    rewardPeanuts: 30,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_lvl_10',
    category: 'level',
    medalTier: 'gold',
    title: 'Onluk Filo',
    description: 'Seviyeli modda 10 bölümü başarıyla tamamla.',
    target: 10,
    unitLabel: 'bölüm',
    rewardPeanuts: 55,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_lvl_15',
    category: 'level',
    medalTier: 'diamond',
    title: 'Kanyon Efendisi',
    description: 'Seviyeli modda 15 bölümü başarıyla tamamla.',
    target: 15,
    unitLabel: 'bölüm',
    rewardPeanuts: 90,
    rewardCrateTier: 'leveled_outfit',
  },
  {
    id: 'ach_lvl_25',
    category: 'level',
    medalTier: 'mythic',
    title: 'Galaksi Şampiyonu',
    description: 'Seviyeli modda 25 bölümü başarıyla tamamla.',
    target: 25,
    unitLabel: 'bölüm',
    rewardPeanuts: 160,
    rewardCrateTier: 'mythic',
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDefinition> = Object.fromEntries(
  LEVELED_ACHIEVEMENTS.map((a) => [a.id, a])
);
