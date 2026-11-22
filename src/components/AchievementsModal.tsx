import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Lock, Medal, ShieldCheck, Sparkles, Trophy, X } from 'lucide-react';
import { LEVELED_ACHIEVEMENTS, MEDAL_TIER_STYLES } from '../data/achievements';
import { CRATE_TIER_CONFIGS } from '../data/crates';
import { AchievementCategory } from '../types/game';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedAchievementIds: string[];
  unlockedLevel: number;
  bestLeveledScore: number;
  bestLeveledCleanFlightSec: number;
}

export default function AchievementsModal({
  isOpen,
  onClose,
  unlockedAchievementIds,
  unlockedLevel,
  bestLeveledScore,
  bestLeveledCleanFlightSec,
}: AchievementsModalProps) {
  const [filter, setFilter] = useState<'all' | AchievementCategory>('all');

  const unlockedSet = useMemo(() => new Set(unlockedAchievementIds), [unlockedAchievementIds]);
  const completedLevels = Math.max(0, unlockedLevel - 1);

  const visibleAchievements = useMemo(() => {
    if (filter === 'all') return LEVELED_ACHIEVEMENTS;
    return LEVELED_ACHIEVEMENTS.filter((a) => a.category === filter);
  }, [filter]);

  if (!isOpen) return null;

  const getCurrentProgress = (category: AchievementCategory): number => {
    if (category === 'score') return bestLeveledScore;
    if (category === 'flight') return Math.floor(bestLeveledCleanFlightSec);
    return completedLevels;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                Seviyeli Başarımlar & Madalyalar
              </h2>
              <p className="text-xs text-emerald-300/85">
                Sadece Seviyeli modda geçerli madalyalar, rozetler ve özel kasa ödülleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Başarımlar panelini kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-800/75 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-semibold">Madalyalar</div>
            <div className="text-base font-extrabold font-mono-num text-emerald-300">
              {unlockedSet.size} / {LEVELED_ACHIEVEMENTS.length}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/75 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-semibold">Geçilen Bölüm</div>
            <div className="text-base font-extrabold font-mono-num text-sky-300">
              {completedLevels}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/75 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-semibold">En İyi Puan</div>
            <div className="text-base font-extrabold font-mono-num text-amber-300">
              {bestLeveledScore}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/75 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-semibold">Hasarsız Uçuş</div>
            <div className="text-base font-extrabold font-mono-num text-purple-300">
              {Math.floor(bestLeveledCleanFlightSec)} sn
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800/70">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-800 rounded-xl">
            {(
              [
                { key: 'all', label: 'Tümü' },
                { key: 'score', label: 'Skor' },
                { key: 'flight', label: 'Hasarsız Uçuş' },
                { key: 'level', label: 'Bölümler' },
              ] as { key: 'all' | AchievementCategory; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer truncate ${
                  filter === tab.key
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {visibleAchievements.map((ach) => {
            const isUnlocked = unlockedSet.has(ach.id);
            const currentVal = getCurrentProgress(ach.category);
            const pct = isUnlocked
              ? 100
              : Math.max(0, Math.min(100, Math.round((currentVal / ach.target) * 100)));
            const style = MEDAL_TIER_STYLES[ach.medalTier];
            const crateCfg = ach.rewardCrateTier ? CRATE_TIER_CONFIGS[ach.rewardCrateTier] : null;

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col gap-2.5 ${
                  isUnlocked
                    ? `bg-gradient-to-r ${style.badgeBg} ${style.border} ring-1 ${style.ring}`
                    : 'bg-slate-800/60 border-slate-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? `bg-slate-900/75 ${style.border} ${style.text}`
                          : 'bg-slate-900/80 border-slate-700 text-slate-500'
                      }`}
                    >
                      {ach.category === 'score' ? (
                        <Trophy className="w-5 h-5" />
                      ) : ach.category === 'flight' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <Medal className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white">{ach.title}</span>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-950/60 border ${style.border} ${style.text}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{ach.description}</p>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-400/50 px-2 py-1 rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Kazanıldı</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-900/80 border border-slate-700 px-2 py-1 rounded-lg shrink-0">
                      <Lock className="w-3 h-3" />
                      <span className="font-mono-num">
                        {Math.min(currentVal, ach.target)}/{ach.target} {ach.unitLabel}
                      </span>
                    </span>
                  )}
                </div>

                {/* Progress Bar + Rewards */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[140px] h-2 rounded-full bg-slate-950/75 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold shrink-0">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono-num">
                      +{ach.rewardPeanuts} Fıstık
                    </span>
                    {crateCfg && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-200">
                        <Sparkles className="w-3 h-3" />
                        <span>+1 {crateCfg.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
