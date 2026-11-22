import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Crown,
  Gift,
  Lock,
  Magnet,
  Minus,
  Package,
  Palette,
  Plus,
  Search,
  Shield,
  Shirt,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { COSMETIC_CATALOG, RARITY_LABELS } from '../data/cosmetics';
import {
  CRATE_TIER_CONFIGS,
  CRATE_TIER_ORDER,
  getTotalCrateCount,
} from '../data/crates';
import {
  NAME_COLOR_BY_ID,
  NAME_COLOR_CATALOG,
  NAME_COLOR_TIER_LABELS,
  NameColorDefinition,
  NameColorTier,
} from '../data/nameColors';
import {
  BODY_TYPE_CONFIGS,
  BodyType,
  CosmeticCategory,
  CosmeticItem,
  CrateInventoryState,
  CrateTier,
  EquippedCosmetics,
  GameMode,
  Rarity,
  UpgradesState,
} from '../types/game';
import CaseOpeningModal from './CaseOpeningModal';
import { CosmeticItemCanvas } from './CosmeticPreviewCanvas';
import StyledPlayerName from './StyledPlayerName';

export type ShopTab = 'market' | 'crateInventory' | 'cosmetics' | 'nameColors';

export interface CrateSpinPayload {
  items: CosmeticItem[];
  isDuplicateBonus: boolean;
  duplicateRefund?: number;
  openedCount?: number;
  note?: string;
}

interface ShopModalProps {
  isOpen: boolean;
  initialTab?: ShopTab;
  gameMode: GameMode;
  onSwitchToLeveled?: () => void;
  onClose: () => void;
  peanutBank: number;
  bodyType: BodyType;
  onChangeBodyType: (bt: BodyType) => void;
  unlockedIds: string[];
  equipped: EquippedCosmetics;
  unlockedNameColors: string[];
  equippedNameColor: string;
  previewPlayerName: string;
  upgrades: UpgradesState;
  crateInventory: CrateInventoryState;
  onSelectOrBuyCosmetic: (item: CosmeticItem) => void;
  onEquipCosmetic: (item: CosmeticItem) => void;
  onSelectOrBuyNameColor: (item: NameColorDefinition) => void;
  onOpenCrate: (tier: CrateTier) => CrateSpinPayload | null;
  onBuyCrates: (tier: CrateTier, quantity: number) => boolean;
  onOpenCratesFromInventory: (tier: CrateTier, quantity: number) => CrateSpinPayload | null;
  onUpgradeMagnet: () => void;
  onUpgradeDoublePeanut: () => void;
  onBuyShield: (amount: number, cost: number) => void;
  onUltraRareDrop?: (item: CosmeticItem) => void;
}

export default function ShopModal({
  isOpen,
  initialTab,
  gameMode,
  onSwitchToLeveled,
  onClose,
  peanutBank,
  bodyType,
  onChangeBodyType,
  unlockedIds,
  equipped,
  unlockedNameColors,
  equippedNameColor,
  previewPlayerName,
  upgrades,
  crateInventory,
  onSelectOrBuyCosmetic,
  onEquipCosmetic,
  onSelectOrBuyNameColor,
  onOpenCrate,
  onBuyCrates,
  onOpenCratesFromInventory,
  onUpgradeMagnet,
  onUpgradeDoublePeanut,
  onBuyShield,
  onUltraRareDrop,
}: ShopModalProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>(initialTab || 'market');
  const [bulkBuyQty, setBulkBuyQty] = useState<number>(5);
  const [crateBuyNotice, setCrateBuyNotice] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | CosmeticCategory | 'leveled'>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [onlyUnlocked, setOnlyUnlocked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nameTierFilter, setNameTierFilter] = useState<'all' | NameColorTier>('all');
  const [onlyUnlockedNames, setOnlyUnlockedNames] = useState<boolean>(false);
  const [nameSearchQuery, setNameSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [caseModalState, setCaseModalState] = useState<{
    open: boolean;
    tier: CrateTier;
    openedCount: number;
    winningItems: CosmeticItem[];
    isDuplicateBonus: boolean;
    duplicateRefund: number;
    note?: string;
  }>({
    open: false,
    tier: 'standard',
    openedCount: 1,
    winningItems: [],
    isDuplicateBonus: false,
    duplicateRefund: 0,
    note: undefined,
  });

  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const unlockedNameColorSet = useMemo(
    () => new Set(['name_default', ...unlockedNameColors]),
    [unlockedNameColors]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COSMETIC_CATALOG.filter((item) => {
      if (categoryFilter === 'leveled') {
        if (!item.leveledOnly) return false;
      } else if (categoryFilter === 'suit') {
        if (item.category !== 'suit' || item.leveledOnly) return false;
      } else if (categoryFilter !== 'all') {
        if (item.category !== categoryFilter) return false;
      } else {
        // In Klasik mode, keep Seviyeli-only items strictly inside the green Seviyeli tab
        if (item.leveledOnly && gameMode !== 'leveled') return false;
      }
      if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
      if (onlyUnlocked && !unlockedSet.has(item.id)) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryFilter, gameMode, onlyUnlocked, rarityFilter, searchQuery, unlockedSet]);

  const filteredNameColors = useMemo(() => {
    const q = nameSearchQuery.trim().toLowerCase();
    return NAME_COLOR_CATALOG.filter((item) => {
      if (nameTierFilter !== 'all' && item.tier !== nameTierFilter) return false;
      if (onlyUnlockedNames && !unlockedNameColorSet.has(item.id)) return false;
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.colorsLabel.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [nameSearchQuery, nameTierFilter, onlyUnlockedNames, unlockedNameColorSet]);

  const spinnerPool = useMemo(() => {
    const selectable = COSMETIC_CATALOG.filter((c) => c.cost > 0 && !c.dropOnly);
    if (caseModalState.tier === 'leveled_outfit') {
      const leveledSuits = COSMETIC_CATALOG.filter((c) => c.leveledOnly);
      const highTier = selectable.filter(
        (c) => c.rarity === 'epic' || c.rarity === 'legendary' || c.rarity === 'mythic'
      );
      return [...leveledSuits, ...highTier];
    }
    if (caseModalState.tier === 'outfit') {
      const secretSuits = COSMETIC_CATALOG.filter((c) => c.category === 'suit' && !c.leveledOnly);
      const highTier = selectable.filter(
        (c) => c.rarity === 'epic' || c.rarity === 'legendary' || c.rarity === 'mythic'
      );
      return [...secretSuits, ...highTier];
    }
    if (caseModalState.tier === 'mythic') {
      const highTier = selectable.filter(
        (c) => c.rarity === 'epic' || c.rarity === 'legendary' || c.rarity === 'mythic'
      );
      return highTier.length > 0 ? highTier : selectable;
    }
    if (caseModalState.tier === 'epic') {
      const rarePlus = selectable.filter(
        (c) =>
          c.rarity === 'rare' ||
          c.rarity === 'epic' ||
          c.rarity === 'legendary' ||
          c.rarity === 'mythic'
      );
      return rarePlus.length > 0 ? rarePlus : selectable;
    }
    return selectable;
  }, [caseModalState.tier]);

  if (!isOpen) return null;

  const magnetCost = (upgrades.magnetLevel + 1) * 12;
  const doubleCost = (upgrades.doublePeanutLevel + 1) * 14;
  const unlockedCount = unlockedSet.size;
  const totalOwnedCrates = getTotalCrateCount(crateInventory);
  const clampedBulkQty = Math.max(1, Math.min(100, Math.floor(bulkBuyQty) || 1));

  const handleCrate = (tier: CrateTier) => {
    const result = onOpenCrate(tier);
    if (result && result.items.length > 0) {
      setCaseModalState({
        open: true,
        tier,
        openedCount: result.openedCount ?? 1,
        winningItems: result.items,
        isDuplicateBonus: result.isDuplicateBonus,
        duplicateRefund: result.duplicateRefund ?? 0,
        note: result.note,
      });
    }
  };

  const handleBuyCratePack = (tier: CrateTier, qty: number) => {
    const cleanQty = Math.max(1, Math.min(100, Math.floor(qty) || 1));
    const ok = onBuyCrates(tier, cleanQty);
    if (ok) {
      setCrateBuyNotice(
        `${cleanQty}x ${CRATE_TIER_CONFIGS[tier].name} Kutu Envanterine eklendi!`
      );
    }
  };

  const handleOpenFromInventory = (tier: CrateTier, qty: number) => {
    const result = onOpenCratesFromInventory(tier, qty);
    if (result && result.items.length > 0) {
      setCaseModalState({
        open: true,
        tier,
        openedCount: result.openedCount ?? qty,
        winningItems: result.items,
        isDuplicateBonus: result.isDuplicateBonus,
        duplicateRefund: result.duplicateRefund ?? 0,
        note: result.note,
      });
    }
  };

  return (
    <>
      <aside
        aria-label="Fıstık Marketi ve Kozmetik Dolabı"
        className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] lg:w-[485px] bg-slate-900/95 backdrop-blur-md border-l border-slate-700/90 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              Market & Dolap
            </h2>
            <div className="text-xs text-slate-400">
              {unlockedCount} / {COSMETIC_CATALOG.length} Kozmetik · Sol taraftan canlı izle
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="font-mono-num text-xs sm:text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3 py-1.5 rounded-lg">
              {peanutBank} Fıstık
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Marketi kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Body Type Quick Switcher + Active Mode Character Indicator */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                gameMode === 'leveled'
                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                  : 'bg-sky-500/15 border-sky-400/50 text-sky-300'
              }`}
            >
              {gameMode === 'leveled' ? 'Aktif Karakter: Seviyeli Fil' : 'Aktif Karakter: Klasik Fil'}
            </span>
            <span className="text-slate-400">Mod karakterleri ayrı kaydedilir</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Fil Yapısı</span>
            {gameMode === 'leveled' ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-300">
                  Seviyelide otomatik
                </span>
                <span className="py-1 px-3 rounded-md text-xs font-bold bg-emerald-400/20 border border-emerald-400/50 text-emerald-200">
                  {BODY_TYPE_CONFIGS.normal.label}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-lg flex-1 max-w-[260px]">
                {(['slim', 'normal', 'chubby'] as BodyType[]).map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => onChangeBodyType(bt)}
                    className={`py-1 px-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      bodyType === bt
                        ? 'bg-sky-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {BODY_TYPE_CONFIGS[bt].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-800/70 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
              activeTab === 'market'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Kutular & Güç
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crateInventory')}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
              activeTab === 'crateInventory'
                ? 'bg-cyan-400 text-slate-950 font-bold'
                : totalOwnedCrates > 0
                  ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Kutu Çantası ({totalOwnedCrates})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cosmetics')}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
              activeTab === 'cosmetics'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Kozmetik ({COSMETIC_CATALOG.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nameColors')}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
              activeTab === 'nameColors'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span>İsim Rengi (32)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'market' ? (
            <div className="flex flex-col gap-5">
              {/* Mystery Boxes Section with Bulk Buy */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <h3 className="text-sm font-bold text-slate-200">
                    Kutular & Toplu Satın Alma
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('crateInventory')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Envanterim ({totalOwnedCrates})</span>
                  </button>
                </div>

                {/* Bulk Quantity Selector */}
                <div className="mb-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">Toplu Adet:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 5, 10, 25, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBulkBuyQty(preset)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono-num font-bold transition-colors cursor-pointer ${
                          clampedBulkQty === preset
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-700/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        {preset}x
                      </button>
                    ))}
                    <div className="inline-flex items-center bg-slate-900 border border-slate-700 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setBulkBuyQty((q) => Math.max(1, q - 1))}
                        className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        aria-label="Adet azalt"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={clampedBulkQty}
                        onChange={(e) =>
                          setBulkBuyQty(
                            Math.max(1, Math.min(100, Math.floor(Number(e.target.value) || 1)))
                          )
                        }
                        className="w-10 text-center bg-transparent text-xs font-mono-num font-bold text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setBulkBuyQty((q) => Math.min(100, q + 1))}
                        className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        aria-label="Adet artır"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {crateBuyNotice && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-cyan-200">{crateBuyNotice}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCrateBuyNotice(null);
                        setActiveTab('crateInventory');
                      }}
                      className="font-extrabold text-cyan-300 hover:text-white cursor-pointer shrink-0"
                    >
                      Envanteri Aç →
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  {CRATE_TIER_ORDER.map((tier) => {
                    const cfg = CRATE_TIER_CONFIGS[tier];
                    const isLeveledLocked = Boolean(cfg.leveledOnly) && gameMode !== 'leveled';
                    const owned = crateInventory[tier] || 0;
                    const bulkCost = cfg.unitCost * clampedBulkQty;
                    const canAffordBulk = !isLeveledLocked && peanutBank >= bulkCost;
                    const canAffordOne = !isLeveledLocked && peanutBank >= cfg.unitCost;

                    const cardClasses =
                      tier === 'mythic'
                        ? 'p-3.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-800/90 to-amber-950/45 border border-rose-400/70 flex flex-col gap-3 shadow-lg shadow-rose-950/30'
                        : tier === 'leveled_outfit'
                          ? 'p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-800/90 to-green-950/45 border border-emerald-400/70 flex flex-col gap-3'
                          : tier === 'outfit'
                            ? 'p-3.5 rounded-xl bg-gradient-to-r from-teal-950/65 via-slate-800/90 to-emerald-950/40 border border-teal-400/65 flex flex-col gap-3'
                            : tier === 'epic'
                              ? 'p-3.5 rounded-xl bg-slate-800/75 border border-amber-500/45 flex flex-col gap-3'
                              : 'p-3.5 rounded-xl bg-slate-800/75 border border-purple-500/40 flex flex-col gap-3';

                    const iconWrapClasses =
                      tier === 'mythic'
                        ? 'p-2.5 rounded-lg bg-rose-500/25 text-rose-300 shrink-0 border border-rose-400/40'
                        : tier === 'leveled_outfit'
                          ? 'p-2.5 rounded-lg bg-emerald-500/25 text-emerald-300 shrink-0 border border-emerald-400/40'
                          : tier === 'outfit'
                            ? 'p-2.5 rounded-lg bg-teal-500/20 text-teal-300 shrink-0 border border-teal-400/40'
                            : tier === 'epic'
                              ? 'p-2.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0'
                              : 'p-2.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0';

                    const primaryBtnClasses =
                      tier === 'mythic'
                        ? canAffordBulk
                          ? 'bg-gradient-to-r from-rose-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 cursor-pointer shadow-md shadow-rose-500/25'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : tier === 'leveled_outfit'
                          ? canAffordBulk
                            ? 'bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-300 hover:to-green-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : tier === 'outfit'
                            ? canAffordBulk
                              ? 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 cursor-pointer'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : tier === 'epic'
                              ? canAffordBulk
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : canAffordBulk
                                ? 'bg-purple-500 hover:bg-purple-400 text-white cursor-pointer'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed';

                    return (
                      <div key={tier} className={cardClasses}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={iconWrapClasses}>
                              {tier === 'mythic' ? (
                                <Crown className="w-5 h-5" />
                              ) : tier === 'outfit' || tier === 'leveled_outfit' ? (
                                <Shirt className="w-5 h-5" />
                              ) : tier === 'epic' ? (
                                <Sparkles className="w-5 h-5" />
                              ) : (
                                <Gift className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-extrabold text-white text-sm">
                                  {cfg.name}
                                </span>
                                {cfg.badgeText && (
                                  <span
                                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                      tier === 'leveled_outfit'
                                        ? 'text-emerald-200 bg-emerald-500/25 border-emerald-400/50'
                                        : 'text-rose-200 bg-rose-500/25 border-rose-400/50'
                                    }`}
                                  >
                                    {cfg.badgeText}
                                  </span>
                                )}
                                {owned > 0 && (
                                  <span className="text-[10px] font-mono-num font-bold text-cyan-200 bg-cyan-500/20 border border-cyan-400/40 px-1.5 py-0.5 rounded">
                                    Çantada: {owned}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
                            </div>
                          </div>

                          <span className="font-mono-num text-[11px] font-bold text-slate-300 shrink-0">
                            {cfg.unitCost}F/ad.
                          </span>
                        </div>

                        {isLeveledLocked ? (
                          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-emerald-500/40">
                            <span className="text-[11px] font-semibold text-emerald-200">
                              Bu kasa yalnızca Seviyeli modda alınabilir.
                            </span>
                            {onSwitchToLeveled && (
                              <button
                                type="button"
                                onClick={onSwitchToLeveled}
                                className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold cursor-pointer shrink-0"
                              >
                                Seviyeliye Geç
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleBuyCratePack(tier, clampedBulkQty)}
                              disabled={!canAffordBulk}
                              className={`py-2 px-2.5 rounded-lg text-xs font-extrabold font-mono-num transition-colors ${primaryBtnClasses}`}
                            >
                              Çantaya Al ({clampedBulkQty}x) · {bulkCost.toLocaleString('tr-TR')}F
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCrate(tier)}
                              disabled={!canAffordOne}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold font-mono-num transition-colors border ${
                                canAffordOne
                                  ? 'bg-slate-900/80 hover:bg-slate-700 text-slate-100 border-slate-600 cursor-pointer'
                                  : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                              }`}
                            >
                              1x Hemen Aç · {cfg.unitCost}F
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gameplay Upgrades & Powerups */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-2.5">
                  Uçuş Güçlendirmeleri
                </h3>
                <div className="flex flex-col gap-2.5">
                  {/* Magnet */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 font-bold text-white text-sm">
                        <Magnet className="w-4 h-4 text-rose-400" />
                        <span>Fıstık Mıknatısı</span>
                      </div>
                      <span className="font-mono-num text-xs text-slate-300">
                        Sv. {upgrades.magnetLevel}/5
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Havada süzülen fıstıkları ve kutuları filine çeker.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgradeMagnet}
                      disabled={upgrades.magnetLevel >= 5 || peanutBank < magnetCost}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono-num transition-colors ${
                        upgrades.magnetLevel >= 5
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                          : peanutBank >= magnetCost
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {upgrades.magnetLevel >= 5 ? 'Maksimum Seviye' : `Yükselt · ${magnetCost} Fıstık`}
                    </button>
                  </div>

                  {/* Double Peanut */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 font-bold text-white text-sm">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Çift Fıstık Şansı</span>
                      </div>
                      <span className="font-mono-num text-xs text-slate-300">
                        Sv. {upgrades.doublePeanutLevel}/5
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Fıstık toplarken %{upgrades.doublePeanutLevel * 20} ihtimalle +2 ekstra fıstık verir.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgradeDoublePeanut}
                      disabled={upgrades.doublePeanutLevel >= 5 || peanutBank < doubleCost}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono-num transition-colors ${
                        upgrades.doublePeanutLevel >= 5
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                          : peanutBank >= doubleCost
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {upgrades.doublePeanutLevel >= 5
                        ? 'Maksimum Seviye'
                        : `Yükselt · ${doubleCost} Fıstık`}
                    </button>
                  </div>

                  {/* Shield */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 font-bold text-white text-sm">
                        <Shield className="w-4 h-4 text-sky-400" />
                        <span>Savan Kalkanı</span>
                      </div>
                      <span className="font-mono-num text-xs text-sky-300 font-bold">
                        Stok: {upgrades.shieldCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Engellere çarptığında 1 kez canını kurtarır. Klasik&apos;te hemen, Seviyeli&apos;de 2. bölümden sonra (Bölüm 3+) açılır.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onBuyShield(1, 6)}
                        disabled={peanutBank < 6 || upgrades.shieldCount >= 99}
                        className={`py-2 px-2 rounded-lg text-xs font-bold font-mono-num transition-colors ${
                          peanutBank >= 6 && upgrades.shieldCount < 99
                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        +1 · 6F
                      </button>
                      <button
                        type="button"
                        onClick={() => onBuyShield(3, 15)}
                        disabled={peanutBank < 15 || upgrades.shieldCount >= 97}
                        className={`py-2 px-2 rounded-lg text-xs font-bold font-mono-num transition-colors ${
                          peanutBank >= 15 && upgrades.shieldCount < 97
                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        +3 · 15F
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'crateInventory' ? (
            <div className="flex flex-col gap-4">
              {/* Inventory Banner */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-cyan-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white">
                      Kutu Envanterin ({totalOwnedCrates} Adet)
                    </div>
                    <div className="text-xs text-slate-400">
                      Kutularını biriktir, ister tek tek ister toplu aç!
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('market')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 cursor-pointer shrink-0"
                >
                  Markete Dön
                </button>
              </div>

              {/* Crate Tier Inventory Cards */}
              <div className="flex flex-col gap-3">
                {CRATE_TIER_ORDER.map((tier) => {
                  const cfg = CRATE_TIER_CONFIGS[tier];
                  const isLeveledLocked = Boolean(cfg.leveledOnly) && gameMode !== 'leveled';
                  const owned = crateInventory[tier] || 0;
                  const maxBatchOpen = tier === 'mythic' ? 10 : 20;
                  const batchOpenCount = Math.min(owned, maxBatchOpen);

                  const borderClass =
                    tier === 'mythic'
                      ? 'border-rose-400/70 bg-gradient-to-r from-rose-950/60 via-slate-800/90 to-amber-950/35'
                      : tier === 'leveled_outfit'
                        ? 'border-emerald-400/70 bg-gradient-to-r from-emerald-950/65 via-slate-800/90 to-green-950/35'
                        : tier === 'outfit'
                          ? 'border-teal-400/65 bg-gradient-to-r from-teal-950/60 via-slate-800/90 to-emerald-950/35'
                          : tier === 'epic'
                            ? 'border-amber-400/50 bg-slate-800/80'
                            : 'border-purple-400/50 bg-slate-800/80';

                  const iconWrap =
                    tier === 'mythic'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                      : tier === 'leveled_outfit'
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                        : tier === 'outfit'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-400/40'
                          : tier === 'epic'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300';

                  return (
                    <div
                      key={tier}
                      className={`p-3.5 rounded-xl border flex flex-col gap-3 ${borderClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg shrink-0 ${iconWrap}`}>
                            {tier === 'mythic' ? (
                              <Crown className="w-5 h-5" />
                            ) : tier === 'outfit' || tier === 'leveled_outfit' ? (
                              <Shirt className="w-5 h-5" />
                            ) : tier === 'epic' ? (
                              <Sparkles className="w-5 h-5" />
                            ) : (
                              <Gift className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">{cfg.name}</span>
                              {cfg.badgeText && (
                                <span
                                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                    tier === 'leveled_outfit'
                                      ? 'text-emerald-200 bg-emerald-500/25 border-emerald-400/50'
                                      : 'text-rose-200 bg-rose-500/25 border-rose-400/50'
                                  }`}
                                >
                                  {cfg.badgeText}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
                          </div>
                        </div>

                        <div
                          className={`px-2.5 py-1 rounded-lg font-mono-num text-sm font-extrabold shrink-0 ${
                            owned > 0
                              ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200'
                              : 'bg-slate-900 border border-slate-700 text-slate-500'
                          }`}
                        >
                          x{owned}
                        </div>
                      </div>

                      {/* Open Controls */}
                      {isLeveledLocked ? (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-emerald-500/40">
                          <span className="text-[11px] font-semibold text-emerald-200">
                            Seviyeli Kıyafet Kasası sadece Seviyeli modda açılır.
                          </span>
                          {onSwitchToLeveled && (
                            <button
                              type="button"
                              onClick={onSwitchToLeveled}
                              className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold cursor-pointer shrink-0"
                            >
                              Seviyeliye Geç
                            </button>
                          )}
                        </div>
                      ) : owned > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenFromInventory(tier, 1)}
                            className="flex-1 min-w-[95px] py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors"
                          >
                            1x Aç (Rulet)
                          </button>

                          {owned >= 5 && (
                            <button
                              type="button"
                              onClick={() => handleOpenFromInventory(tier, 5)}
                              className="py-2 px-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-extrabold font-mono-num cursor-pointer transition-colors"
                            >
                              5x Aç
                            </button>
                          )}

                          {owned >= 10 && maxBatchOpen >= 10 && (
                            <button
                              type="button"
                              onClick={() => handleOpenFromInventory(tier, 10)}
                              className="py-2 px-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold font-mono-num cursor-pointer transition-colors"
                            >
                              10x Aç
                            </button>
                          )}

                          {owned > 1 && batchOpenCount !== 5 && batchOpenCount !== 10 && (
                            <button
                              type="button"
                              onClick={() => handleOpenFromInventory(tier, batchOpenCount)}
                              className="py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold font-mono-num cursor-pointer transition-colors"
                            >
                              {owned <= maxBatchOpen
                                ? `Hepsini Aç (${batchOpenCount}x)`
                                : `Toplu Aç (${batchOpenCount}x)`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          Envanterinde bu kutudan yok. Aşağıdan toplu satın alabilirsin:
                        </div>
                      )}

                      {/* Quick Bulk Top-Up inside Crate Inventory */}
                      {!isLeveledLocked && (
                        <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Hızlı Toplu Alım:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[1, 5, 10, 25].map((q) => {
                              const cost = cfg.unitCost * q;
                              const affordable = peanutBank >= cost;
                              return (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => onBuyCrates(tier, q)}
                                  disabled={!affordable}
                                  className={`px-2 py-1 rounded-md text-[11px] font-mono-num font-bold transition-colors ${
                                    affordable
                                      ? 'bg-slate-700 hover:bg-slate-600 text-amber-300 cursor-pointer'
                                      : 'bg-slate-900/70 text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  +{q} ({cost.toLocaleString('tr-TR')}F)
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'cosmetics' ? (
            <div className="flex flex-col gap-3.5">
              {/* Filter Bar */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 p-1 bg-slate-800 rounded-lg">
                  {(
                    [
                      { key: 'all', label: 'Tümü' },
                      { key: 'hat', label: 'Şapka' },
                      { key: 'glasses', label: 'Gözlük' },
                      { key: 'skin', label: 'Renk' },
                      { key: 'trail', label: 'İz' },
                      { key: 'suit', label: '???' },
                      { key: 'leveled', label: 'Seviyeli' },
                    ] as { key: 'all' | CosmeticCategory | 'leveled'; label: string }[]
                  ).map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategoryFilter(cat.key)}
                      className={`py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer text-center truncate ${
                        categoryFilter === cat.key
                          ? cat.key === 'leveled'
                            ? 'bg-emerald-500 text-slate-950 font-extrabold'
                            : cat.key === 'suit'
                              ? 'bg-rose-500 text-white font-extrabold'
                              : 'bg-purple-500 text-white'
                          : cat.key === 'leveled'
                            ? 'bg-emerald-500/15 text-emerald-300 hover:text-emerald-200 font-bold border border-emerald-500/35'
                            : cat.key === 'suit'
                              ? 'text-rose-300 hover:text-rose-200 font-bold'
                              : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {categoryFilter === 'leveled' && (
                  <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-200">
                      Seviyeli Özel Kostümler yalnızca Seviyeli modda kuşanılır ve Klasik moda geçmez!
                    </span>
                    {gameMode !== 'leveled' && onSwitchToLeveled && (
                      <button
                        type="button"
                        onClick={onSwitchToLeveled}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer shrink-0"
                      >
                        Seviyeli Moda Geç
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[130px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Kozmetik ara..."
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value as 'all' | Rarity)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="all">Nadirlik</option>
                    <option value="common">Yaygın</option>
                    <option value="rare">Nadir</option>
                    <option value="epic">Destansı</option>
                    <option value="legendary">Efsanevi</option>
                    <option value="mythic">Mitik</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setOnlyUnlocked((p) => !p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      onlyUnlocked
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Açıklar
                  </button>
                </div>
              </div>

              {/* Cosmetics Grid */}
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Aramana uygun kozmetik bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredItems.map((item) => {
                    const isUnlocked = unlockedSet.has(item.id);
                    const isEquipped = equipped[item.category] === item.id;
                    const isDropOnly = Boolean(item.dropOnly);
                    const isLeveledExclusive = Boolean(item.leveledOnly);
                    const isModeBlocked = isLeveledExclusive && gameMode !== 'leveled';
                    const isSecretLocked = !isUnlocked && Boolean(item.hiddenUntilUnlocked);
                    const canAfford = !isDropOnly && peanutBank >= item.cost;
                    const rarityMeta = RARITY_LABELS[item.rarity];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectOrBuyCosmetic(item)}
                        disabled={isModeBlocked || (!isUnlocked && (isDropOnly || !canAfford))}
                        className={`flex flex-col justify-between gap-2 p-2.5 rounded-xl border text-left transition-colors ${
                          isEquipped
                            ? isLeveledExclusive
                              ? 'bg-emerald-500/20 border-emerald-400 text-white cursor-pointer'
                              : 'bg-purple-500/20 border-purple-400 text-white cursor-pointer'
                            : isModeBlocked
                              ? 'bg-slate-900/95 border-emerald-500/35 text-slate-400 cursor-not-allowed'
                              : isUnlocked
                                ? isLeveledExclusive
                                  ? 'bg-emerald-950/35 border-emerald-500/50 hover:border-emerald-300 text-slate-100 cursor-pointer'
                                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-100 cursor-pointer'
                                : isDropOnly
                                  ? isLeveledExclusive
                                    ? 'bg-slate-900/95 border-emerald-500/50 text-slate-300 cursor-not-allowed'
                                    : 'bg-slate-900/95 border-rose-500/55 text-slate-300 cursor-not-allowed'
                                  : canAfford
                                    ? `bg-slate-800/45 ${rarityMeta.borderClass} hover:bg-slate-800 text-slate-200 cursor-pointer`
                                    : 'bg-slate-900/70 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="w-12 h-12 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden">
                            {isSecretLocked ? (
                              <span
                                className={`text-base font-black tracking-tight ${
                                  isLeveledExclusive ? 'text-emerald-300' : 'text-rose-300'
                                }`}
                              >
                                ???
                              </span>
                            ) : (
                              <CosmeticItemCanvas item={item} size={44} />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`text-[11px] font-semibold ${rarityMeta.textClass}`}>
                              {isSecretLocked ? '???' : rarityMeta.label}
                            </span>
                            {isLeveledExclusive && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                                Seviyeli
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-bold leading-snug line-clamp-2">
                          {isSecretLocked ? '???' : item.name}
                        </div>

                        {isSecretLocked && (
                          <div
                            className={`text-[11px] leading-snug ${
                              isLeveledExclusive ? 'text-emerald-200/85' : 'text-rose-200/85'
                            }`}
                          >
                            {item.dropRateLabel || "100.000'de 1 - Kutu"}
                          </div>
                        )}

                        <div className="pt-1 border-t border-slate-700/50 flex items-center justify-between w-full text-[11px]">
                          {isEquipped ? (
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                isLeveledExclusive ? 'text-emerald-300' : 'text-purple-300'
                              }`}
                            >
                              <Check className="w-3 h-3" />{' '}
                              {item.category === 'suit' ? 'Takılı · Çıkar' : 'Takılı'}
                            </span>
                          ) : isModeBlocked ? (
                            <span className="text-emerald-300/85 font-semibold">
                              Sadece Seviyeli Modda
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-slate-300 font-medium">
                              {item.category === 'suit' ? 'Üstüne Giy' : 'Kuşan'}
                            </span>
                          ) : isDropOnly ? (
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                isLeveledExclusive ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span>{item.dropRateLabel || '100.000 de 1 - Kutu'}</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-mono-num font-bold ${
                                canAfford ? 'text-amber-300' : 'text-slate-500'
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              {item.cost} Fıstık
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {/* Active Name Color Banner */}
              <div className="p-3 rounded-xl bg-slate-800/75 border border-rose-500/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Aktif İsim Önizlemesi ({unlockedNameColorSet.size - 1}/32 Açık)
                  </div>
                  <StyledPlayerName
                    name={previewPlayerName || 'Uçan Fil'}
                    colorId={equippedNameColor}
                    className="text-base font-extrabold truncate block mt-0.5"
                  />
                </div>
                <span className="text-[11px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-400/40 px-2.5 py-1 rounded-md shrink-0">
                  {NAME_COLOR_BY_ID[equippedNameColor]?.name || 'Klasik Beyaz'}
                </span>
              </div>

              {/* Tier Filter Bar */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-800 rounded-lg">
                  {(
                    [
                      { key: 'all', label: 'Tümü' },
                      { key: 'epic', label: 'Destansı' },
                      { key: 'legendary', label: 'Efsanevi' },
                      { key: 'mythic', label: 'Mitik' },
                      { key: 'emperor', label: 'İmparator' },
                    ] as { key: 'all' | NameColorTier; label: string }[]
                  ).map((tier) => (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => setNameTierFilter(tier.key)}
                      className={`py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer text-center truncate ${
                        nameTierFilter === tier.key
                          ? 'bg-rose-500 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[130px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nameSearchQuery}
                      onChange={(e) => setNameSearchQuery(e.target.value)}
                      placeholder="Renk veya tema ara..."
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setOnlyUnlockedNames((p) => !p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      onlyUnlockedNames
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Açıklar
                  </button>
                </div>
              </div>

              {/* Name Colors Grid */}
              {filteredNameColors.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Aramana uygun animasyonlu isim rengi bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredNameColors.map((item) => {
                    const isUnlocked = unlockedNameColorSet.has(item.id);
                    const isEquipped = equippedNameColor === item.id;
                    const canAfford = peanutBank >= item.cost;
                    const tierMeta = NAME_COLOR_TIER_LABELS[item.tier];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectOrBuyNameColor(item)}
                        disabled={!isUnlocked && !canAfford}
                        className={`flex flex-col justify-between gap-2 p-3 rounded-xl border text-left transition-colors ${
                          isEquipped
                            ? 'bg-rose-500/20 border-rose-400 text-white cursor-pointer'
                            : isUnlocked
                              ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-100 cursor-pointer'
                              : canAfford
                                ? `bg-slate-800/45 ${tierMeta.borderClass} hover:bg-slate-800 text-slate-200 cursor-pointer`
                                : 'bg-slate-900/70 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="text-[11px] font-bold text-slate-200 truncate">
                            {item.name}
                          </span>
                          <span className={`text-[10px] font-bold shrink-0 ${tierMeta.textClass}`}>
                            {tierMeta.label}
                          </span>
                        </div>

                        <div className="px-2.5 py-2 rounded-lg bg-slate-950/85 border border-slate-800/90">
                          <StyledPlayerName
                            name={previewPlayerName || 'Uçan Fil'}
                            colorId={item.id}
                            className="text-sm font-extrabold truncate block"
                          />
                        </div>

                        <div className="text-[10px] text-slate-400 truncate">
                          {item.colorsLabel}
                        </div>

                        <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between w-full text-[11px]">
                          {isEquipped ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-300">
                              <Check className="w-3 h-3" /> Takılı
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-slate-300 font-medium">Kuşan</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-mono-num font-bold ${
                                canAfford ? 'text-amber-300' : 'text-slate-500'
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              {item.cost.toLocaleString('tr-TR')} Fıstık
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <CaseOpeningModal
        isOpen={caseModalState.open}
        tier={caseModalState.tier}
        gameMode={gameMode}
        openedCount={caseModalState.openedCount}
        itemsPool={spinnerPool}
        winningItems={caseModalState.winningItems}
        isDuplicateBonus={caseModalState.isDuplicateBonus}
        duplicateRefund={caseModalState.duplicateRefund}
        note={caseModalState.note}
        onClose={() => setCaseModalState((prev) => ({ ...prev, open: false }))}
        onEquipWinner={(item) => onEquipCosmetic(item)}
        onRevealWinners={(winners) => {
          const rareSuits = winners.filter((w) => w.dropOnly || w.category === 'suit');
          if (rareSuits.length > 0 && onUltraRareDrop) {
            onUltraRareDrop(rareSuits[0]);
          }
        }}
      />
    </>
  );
}
