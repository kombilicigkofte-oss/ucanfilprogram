import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crown, Shirt, Sparkles, X } from 'lucide-react';
import { RARITY_LABELS } from '../data/cosmetics';
import { CRATE_TIER_CONFIGS } from '../data/crates';
import { CosmeticCategory, CosmeticItem, CrateTier, GameMode, Rarity } from '../types/game';
import { soundEngine } from '../utils/sound';
import { CosmeticItemCanvas } from './CosmeticPreviewCanvas';

interface CaseOpeningModalProps {
  isOpen: boolean;
  tier: CrateTier;
  gameMode?: GameMode;
  openedCount?: number;
  itemsPool: CosmeticItem[];
  winningItems: CosmeticItem[];
  isDuplicateBonus?: boolean;
  duplicateRefund?: number;
  note?: string;
  onClose: () => void;
  onEquipWinner: (item: CosmeticItem) => void;
  onRevealWinners?: (winners: CosmeticItem[]) => void;
}

const CATEGORY_NAMES: Record<CosmeticCategory, string> = {
  hat: 'Şapka',
  glasses: 'Gözlük',
  skin: 'Renk / Desen',
  trail: 'Uçuş İzi',
  suit: 'Özel Kıyafet (???)',
};

const RARITY_BG_GLOW: Record<Rarity, string> = {
  common: 'from-slate-700/40 to-slate-800/80 border-slate-500/70',
  rare: 'from-sky-600/35 to-slate-900/90 border-sky-400/80',
  epic: 'from-purple-600/40 to-slate-900/90 border-purple-400/90',
  legendary: 'from-amber-500/45 to-slate-900/95 border-amber-400',
  mythic: 'from-rose-600/45 via-slate-900 to-amber-500/35 border-rose-400',
};

const RARITY_BAR: Record<Rarity, string> = {
  common: 'bg-slate-400',
  rare: 'bg-sky-400',
  epic: 'bg-purple-400',
  legendary: 'bg-amber-400',
  mythic: 'bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400',
};

const CARD_WIDTH = 132;
const CARD_GAP = 8;
const STEP = CARD_WIDTH + CARD_GAP;
const TOTAL_SLOTS = 52;
const WINNING_INDEX = 40;
const SPIN_DURATION_MS = 4300;

export default function CaseOpeningModal({
  isOpen,
  tier,
  gameMode = 'classic',
  openedCount = 1,
  itemsPool,
  winningItems,
  isDuplicateBonus = false,
  duplicateRefund = 5,
  note,
  onClose,
  onEquipWinner,
  onRevealWinners,
}: CaseOpeningModalProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [finished, setFinished] = useState<boolean>(false);
  const [equippedIds, setEquippedIds] = useState<string[]>([]);

  const primaryWinner = winningItems[0] || null;

  const stripItems = useMemo(() => {
    if (!isOpen || !primaryWinner || itemsPool.length === 0) return [];
    const list: CosmeticItem[] = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      if (i === WINNING_INDEX) {
        list.push(primaryWinner);
      } else {
        const candidate = itemsPool[Math.floor(Math.random() * itemsPool.length)];
        list.push(candidate);
      }
    }
    return list;
  }, [isOpen, itemsPool, primaryWinner]);

  const onRevealWinnersRef = useRef(onRevealWinners);
  useEffect(() => {
    onRevealWinnersRef.current = onRevealWinners;
  }, [onRevealWinners]);

  useEffect(() => {
    if (!isOpen || !primaryWinner || stripItems.length === 0) return;

    setFinished(false);
    setEquippedIds([]);

    const viewportWidth = viewportRef.current?.clientWidth || 620;
    const centerX = viewportWidth / 2;
    const jitter = (Math.random() - 0.5) * 44;
    const targetTranslate = -(WINNING_INDEX * STEP + CARD_WIDTH / 2 - centerX + jitter);

    if (trackRef.current) {
      trackRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }

    let animId = 0;
    let lastTickSlot = -1;
    const startTime = performance.now();

    const stepFrame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / SPIN_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3.5);
      const currentX = targetTranslate * eased;

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${currentX}px, 0px, 0px)`;
      }

      const activeSlot = Math.floor((centerX - currentX) / STEP);
      if (activeSlot !== lastTickSlot && activeSlot >= 0) {
        lastTickSlot = activeSlot;
        soundEngine.playRouletteTick();
      }

      if (t < 1) {
        animId = requestAnimationFrame(stepFrame);
      } else {
        setFinished(true);
        const hasUltraRare = winningItems.some((w) => w.dropOnly || w.category === 'suit');
        if (!hasUltraRare) {
          soundEngine.playCrateUnlock();
        }
        if (onRevealWinnersRef.current) {
          onRevealWinnersRef.current(winningItems);
        }
      }
    };

    animId = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, primaryWinner, stripItems, winningItems]);

  if (!isOpen || !primaryWinner) return null;

  const isMultiDrop = winningItems.length > 1;
  const crateName = CRATE_TIER_CONFIGS[tier].name;
  const rarityMeta = RARITY_LABELS[primaryWinner.rarity];

  const handleEquipOne = (item: CosmeticItem) => {
    onEquipWinner(item);
    setEquippedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
  };

  const handleEquipAll = () => {
    // Apply from lowest rarity to highest so the best item stays equipped per slot
    [...winningItems].reverse().forEach((item) => onEquipWinner(item));
    setEquippedIds(winningItems.map((i) => i.id));
  };

  const headerTitle =
    openedCount > 1
      ? `${openedCount}x ${crateName} Açılıyor... (${winningItems.length} Eşya)`
      : tier === 'mythic'
        ? "Mitik Kasa Açılıyor... (3'lü Eşya)"
        : `${crateName} Açılıyor...`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {tier === 'mythic' ? (
              <Crown className="w-5 h-5 text-rose-400" />
            ) : tier === 'leveled_outfit' ? (
              <Shirt className="w-5 h-5 text-emerald-400" />
            ) : tier === 'outfit' ? (
              <Shirt className="w-5 h-5 text-teal-400" />
            ) : (
              <Sparkles
                className={`w-5 h-5 ${tier === 'epic' ? 'text-amber-400' : 'text-purple-400'}`}
              />
            )}
            <h3 className="text-lg font-extrabold text-white">{headerTitle}</h3>
          </div>
          {finished && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Sandık ekranını kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CS-Style Roulette Viewport */}
        <div className="p-5 sm:p-6 flex flex-col gap-5 overflow-y-auto">
          <div
            ref={viewportRef}
            className="relative w-full h-40 shrink-0 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center"
          >
            {/* Left/Right edge shadows */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10" />

            {/* Center Needle */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-amber-400 z-20 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-amber-400 z-20" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-amber-400 z-20" />

            {/* Scrolling Strip */}
            <div
              ref={trackRef}
              className="flex items-center will-change-transform"
              style={{ gap: `${CARD_GAP}px` }}
            >
              {stripItems.map((item, idx) => {
                const rMeta = RARITY_LABELS[item.rarity];
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{ width: `${CARD_WIDTH}px` }}
                    className={`shrink-0 h-28 rounded-xl border bg-gradient-to-b flex flex-col justify-between p-2.5 overflow-hidden ${RARITY_BG_GLOW[item.rarity]}`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="w-11 h-11 rounded-lg bg-slate-900/80 border border-slate-700/70 flex items-center justify-center shrink-0 overflow-hidden">
                        <CosmeticItemCanvas item={item} size={40} />
                      </div>
                      <span className={`text-[10px] font-bold ${rMeta.textClass}`}>
                        {rMeta.label}
                      </span>
                    </div>

                    <div className="text-xs font-extrabold text-white leading-tight line-clamp-2">
                      {item.name}
                    </div>

                    <div className={`h-1 w-full rounded-full ${RARITY_BAR[item.rarity]}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Winner Reveal Area */}
          {finished ? (
            isMultiDrop ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-extrabold text-rose-300">
                      {openedCount > 1
                        ? `${openedCount}x ${crateName} Ödüllerin (${winningItems.length} Eşya!)`
                        : `${crateName} Ödüllerin (${winningItems.length} Eşya!)`}
                    </div>
                    {isDuplicateBonus && duplicateRefund > 0 && (
                      <div className="text-xs font-semibold text-amber-300">
                        Zaten açık eşyalar için +{duplicateRefund} Fıstık iade edildi!
                      </div>
                    )}
                    {note && (
                      <div className="text-xs font-semibold text-teal-300 mt-0.5">{note}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEquipAll}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Hepsini Kuşan</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {winningItems.map((item, idx) => {
                    const rMeta = RARITY_LABELS[item.rarity];
                    const isEq = equippedIds.includes(item.id);
                    return (
                      <div
                        key={`${item.id}-win-${idx}`}
                        className={`p-3 rounded-xl border bg-gradient-to-b flex flex-col justify-between gap-2.5 ${RARITY_BG_GLOW[item.rarity]}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-white/60 flex items-center justify-center shrink-0 overflow-hidden">
                            <CosmeticItemCanvas item={item} size={44} />
                          </div>
                          <span className={`text-[10px] font-bold ${rMeta.textClass}`}>
                            {rMeta.label}
                          </span>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-300">
                            {item.leveledOnly ? 'Seviyeli Özel Kostüm' : CATEGORY_NAMES[item.category]}
                          </div>
                          <div className="text-xs font-extrabold text-white leading-snug line-clamp-2">
                            {item.name}
                          </div>
                          {item.dropOnly && (
                            <div
                              className={`text-[10px] font-extrabold mt-0.5 ${
                                item.leveledOnly ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              {item.dropRateLabel || "100.000'de 1 Efsane!"}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEquipOne(item)}
                          disabled={isEq || (Boolean(item.leveledOnly) && gameMode !== 'leveled')}
                          className={`w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isEq
                              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 cursor-default'
                              : item.leveledOnly && gameMode !== 'leveled'
                                ? 'bg-slate-800 text-emerald-300/80 border border-emerald-500/30 cursor-not-allowed'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {isEq
                              ? 'Kuşanıldı'
                              : item.leveledOnly && gameMode !== 'leveled'
                                ? 'Seviyeli Modda Giyilir'
                                : 'Kuşan'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className={`p-4 sm:p-5 rounded-xl border bg-gradient-to-r flex flex-wrap items-center justify-between gap-4 ${RARITY_BG_GLOW[primaryWinner.rarity]}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-900/90 border-2 border-white/70 shadow-lg flex items-center justify-center shrink-0 overflow-hidden">
                    <CosmeticItemCanvas item={primaryWinner} size={56} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300">
                      {primaryWinner.leveledOnly
                        ? 'Seviyeli Özel Kostüm'
                        : CATEGORY_NAMES[primaryWinner.category]}{' '}
                      · <span className={rarityMeta.textClass}>{rarityMeta.label}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold text-white">
                      {primaryWinner.name}
                    </div>
                    {primaryWinner.dropOnly && (
                      <div
                        className={`text-xs font-extrabold mt-0.5 ${
                          primaryWinner.leveledOnly ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {primaryWinner.dropRateLabel || "100.000'de 1"} Şansla Düştü!
                      </div>
                    )}
                    {isDuplicateBonus && (
                      <div className="text-xs font-semibold text-amber-300 mt-0.5">
                        Zaten açıktı · +{duplicateRefund} Fıstık iade edildi!
                      </div>
                    )}
                    {note && (
                      <div className="text-xs font-semibold text-teal-300 mt-0.5">{note}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEquipOne(primaryWinner)}
                    disabled={
                      equippedIds.includes(primaryWinner.id) ||
                      (Boolean(primaryWinner.leveledOnly) && gameMode !== 'leveled')
                    }
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      equippedIds.includes(primaryWinner.id)
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 cursor-default'
                        : primaryWinner.leveledOnly && gameMode !== 'leveled'
                          ? 'bg-slate-800 text-emerald-300/80 border border-emerald-500/30 cursor-not-allowed'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {equippedIds.includes(primaryWinner.id)
                        ? 'Kuşanıldı'
                        : primaryWinner.leveledOnly && gameMode !== 'leveled'
                          ? 'Seviyeli Modda Giyilir'
                          : 'Hemen Kuşan'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    Tamam
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center text-xs sm:text-sm text-slate-400 py-2">
              {tier === 'mythic'
                ? 'Mitik Kasa açılıyor... 3 eşya birden geliyor!'
                : tier === 'leveled_outfit'
                  ? 'Seviyeli Kıyafet Kasası dönüyor... Özel Seviyeli kostümler şansı!'
                  : tier === 'outfit'
                    ? 'Gizli Kıyafet Kasası dönüyor... 1/5.000+ efsane kıyafet şansı!'
                    : 'Kutu açılıyor... Şansın bol olsun!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
