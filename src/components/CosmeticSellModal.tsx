import React, { useMemo, useState } from 'react';
import { Coins, Search, Tag, Trash2, X } from 'lucide-react';
import {
  COSMETIC_CATALOG,
  RARITY_LABELS,
  getCosmeticSellPrice,
} from '../data/cosmetics';
import { CosmeticCategory, CosmeticItem, EquippedCosmetics } from '../types/game';
import { CosmeticItemCanvas } from './CosmeticPreviewCanvas';

interface CosmeticSellModalProps {
  isOpen: boolean;
  onClose: () => void;
  peanutBank: number;
  unlockedIds: string[];
  equipped: EquippedCosmetics;
  onSellCosmetic: (item: CosmeticItem) => void;
  onSellBulkCosmetics: (items: CosmeticItem[]) => void;
}

export default function CosmeticSellModal({
  isOpen,
  onClose,
  peanutBank,
  unlockedIds,
  equipped,
  onSellCosmetic,
  onSellBulkCosmetics,
}: CosmeticSellModalProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | CosmeticCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<'high' | 'low'>('high');
  const [confirmBulkCommon, setConfirmBulkCommon] = useState<boolean>(false);

  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);

  const sellableItems = useMemo(() => {
    return COSMETIC_CATALOG.filter(
      (item) => unlockedSet.has(item.id) && item.cost > 0 && !item.dropOnly
    );
  }, [unlockedSet]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = sellableItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const pa = getCosmeticSellPrice(a);
      const pb = getCosmeticSellPrice(b);
      return sortMode === 'high' ? pb - pa : pa - pb;
    });
  }, [categoryFilter, searchQuery, sellableItems, sortMode]);

  const unequippedCommons = useMemo(() => {
    return sellableItems.filter(
      (item) => item.rarity === 'common' && equipped[item.category] !== item.id
    );
  }, [equipped, sellableItems]);

  const unequippedCommonsValue = useMemo(
    () => unequippedCommons.reduce((sum, item) => sum + getCosmeticSellPrice(item), 0),
    [unequippedCommons]
  );

  const totalInventoryValue = useMemo(
    () => sellableItems.reduce((sum, item) => sum + getCosmeticSellPrice(item), 0),
    [sellableItems]
  );

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Kozmetik Satış Tezgahı"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] lg:w-[485px] bg-slate-900/95 backdrop-blur-md border-l border-emerald-500/40 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              Satış Tezgahı
            </h2>
            <div className="text-xs text-slate-400">
              {sellableItems.length} satılabilir · Toplam +{totalInventoryValue}F değer
            </div>
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
            aria-label="Satış tezgahını kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info + Quick Bulk Sell Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-900/70 flex flex-col gap-2.5">
        <p className="text-xs text-slate-300">
          Kullanmadığın kozmetikleri mağaza değerinin %50 fıstık karşılığında bozdurabilirsin. Takılı bir eşyayı satarsan otomatik çıkarılır.
        </p>

        {unequippedCommons.length >= 2 && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="text-xs text-slate-200">
              <span className="font-bold">{unequippedCommons.length}</span> takılı olmayan Yaygın eşya
            </div>
            {confirmBulkCommon ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSellBulkCosmetics(unequippedCommons);
                    setConfirmBulkCommon(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Onayla · +{unequippedCommonsValue}F
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBulkCommon(false)}
                  className="px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmBulkCommon(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-bold cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hepsini Sat · +{unequippedCommonsValue}F</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-800/70 flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-800 rounded-lg">
          {(
            [
              { key: 'all', label: 'Tümü' },
              { key: 'hat', label: 'Şapka' },
              { key: 'glasses', label: 'Gözlük' },
              { key: 'skin', label: 'Renk' },
              { key: 'trail', label: 'İz' },
            ] as { key: 'all' | CosmeticCategory; label: string }[]
          ).map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer text-center truncate ${
                categoryFilter === cat.key
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Satılacak kozmetik ara..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'high' | 'low')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            <option value="high">En Değerli</option>
            <option value="low">En Ucuz</option>
          </select>
        </div>
      </div>

      {/* Sellable Items List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {sellableItems.length === 0 ? (
          <div className="py-14 text-center flex flex-col items-center gap-2 text-slate-400">
            <Coins className="w-8 h-8 text-slate-600" />
            <div className="text-sm font-semibold text-slate-300">
              Satabileceğin kozmetik henüz yok.
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              Uçuşlarda mor kutu yakalayarak veya Marketten kozmetik açarak buraya getirebilirsin.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Aramana uygun satılabilir kozmetik bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const sellPrice = getCosmeticSellPrice(item);
              const isEquipped = equipped[item.category] === item.id;
              const rarityMeta = RARITY_LABELS[item.rarity];

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between gap-2.5 p-3 rounded-xl border ${
                    isEquipped
                      ? 'bg-slate-800/80 border-amber-400/50'
                      : `bg-slate-800/60 ${rarityMeta.borderClass}`
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden">
                        <CosmeticItemCanvas item={item} size={44} />
                      </div>
                      <span className={`text-[11px] font-semibold ${rarityMeta.textClass}`}>
                        {rarityMeta.label}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white leading-snug line-clamp-2">
                      {item.name}
                    </div>

                    {isEquipped && (
                      <span className="text-[10px] font-semibold text-amber-300">
                        Şu an takılı (satılınca çıkarılır)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSellCosmetic(item)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold font-mono-num transition-colors cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Sat · +{sellPrice}F</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
