import { CrateInventoryState, CrateTier } from '../types/game';

export interface CrateTierConfig {
  id: CrateTier;
  name: string;
  unitCost: number;
  dropsPerOpen: number;
  duplicateRefundPerSlot: number;
  description: string;
  badgeText?: string;
  leveledOnly?: boolean;
}

export const CRATE_TIER_CONFIGS: Record<CrateTier, CrateTierConfig> = {
  standard: {
    id: 'standard',
    name: 'Sürpriz Kutu',
    unitCost: 5,
    dropsPerOpen: 1,
    duplicateRefundPerSlot: 5,
    description: 'Rulet çarkıyla rastgele 1 kozmetik çıkarır (%5 Mitik şansı!).',
  },
  epic: {
    id: 'epic',
    name: 'Efsanevi Kutu',
    unitCost: 12,
    dropsPerOpen: 1,
    duplicateRefundPerSlot: 5,
    description: 'Destansı, Efsanevi ve %18 Mitik şanslı özel kutu.',
  },
  outfit: {
    id: 'outfit',
    name: 'Gizli Kıyafet Kasası',
    unitCost: 50,
    dropsPerOpen: 1,
    duplicateRefundPerSlot: 20,
    badgeText: 'Aşırı Nadir (1/5.000+)',
    description:
      "14 özel kıyafet düşürebilir (1/5.000+), tutmazsa %25 Mitik veya Destansı/Efsanevi verir.",
  },
  leveled_outfit: {
    id: 'leveled_outfit',
    name: 'Seviyeli Kıyafet Kasası',
    unitCost: 35,
    dropsPerOpen: 1,
    duplicateRefundPerSlot: 20,
    leveledOnly: true,
    badgeText: 'Seviyeli Özel Kostümler',
    description:
      'Sadece Seviyeli moda özel 5 kostüm (Surypap, Bass, Swamp, Frind, Filyman) düşürebilir! Seviye & Başarım ödülü olarak da kazanılır.',
  },
  mythic: {
    id: 'mythic',
    name: 'Mitik Kasa',
    unitCost: 500,
    dropsPerOpen: 3,
    duplicateRefundPerSlot: 100,
    badgeText: "3'lü + Garantili Mitik",
    description: 'Tek açılışta 3 eşya + en az 1 garantili Mitik kozmetik çıkarır!',
  },
};

export const CRATE_TIER_ORDER: CrateTier[] = [
  'standard',
  'epic',
  'outfit',
  'leveled_outfit',
  'mythic',
];

export const DEFAULT_CRATE_INVENTORY: CrateInventoryState = {
  standard: 0,
  epic: 0,
  mythic: 0,
  outfit: 0,
  leveled_outfit: 0,
};

export function getTotalCrateCount(inventory: CrateInventoryState): number {
  return (
    (inventory.standard || 0) +
    (inventory.epic || 0) +
    (inventory.outfit || 0) +
    (inventory.leveled_outfit || 0) +
    (inventory.mythic || 0)
  );
}
