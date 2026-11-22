import React, { useEffect, useState } from 'react';
import { CalendarCheck2, CheckCircle2, Clock, Gift, X } from 'lucide-react';
import { DailyQuestDefinition, DailyQuestsState } from '../data/dailyQuests';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: DailyQuestDefinition[];
  questState: DailyQuestsState;
  onClaimReward: (quest: DailyQuestDefinition) => void;
  onClaimAllRewards: () => void;
}

function getTimeUntilMidnightLabel(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours} sa ${mins} dk`;
}

export default function DailyQuestsModal({
  isOpen,
  onClose,
  quests,
  questState,
  onClaimReward,
  onClaimAllRewards,
}: DailyQuestsModalProps) {
  const [countdown, setCountdown] = useState<string>(() => getTimeUntilMidnightLabel());

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(getTimeUntilMidnightLabel());
    const id = window.setInterval(() => {
      setCountdown(getTimeUntilMidnightLabel());
    }, 30000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const claimableCount = quests.filter((q) => {
    const val = questState.progress[q.id] || 0;
    return val >= q.target && !questState.claimedIds.includes(q.id);
  }).length;

  const completedCount = quests.filter(
    (q) => (questState.progress[q.id] || 0) >= q.target
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <CalendarCheck2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                Günlük Görevler
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Yenilenmeye {countdown} · {completedCount}/3 tamamlandı</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Günlük görevleri kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest Cards */}
        <div className="p-5 flex flex-col gap-3">
          {quests.map((quest) => {
            const rawVal = questState.progress[quest.id] || 0;
            const currentVal = Math.min(quest.target, rawVal);
            const pct = Math.min(100, Math.round((currentVal / quest.target) * 100));
            const isDone = rawVal >= quest.target;
            const isClaimed = questState.claimedIds.includes(quest.id);

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col gap-3 ${
                  isClaimed
                    ? 'bg-slate-800/35 border-slate-800 opacity-75'
                    : isDone
                      ? 'bg-emerald-500/10 border-emerald-400/60'
                      : 'bg-slate-800/65 border-slate-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 font-mono-num">
                        #{quest.slot}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        {quest.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      {quest.description}
                    </p>
                  </div>

                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Alındı</span>
                    </span>
                  ) : isDone ? (
                    <button
                      type="button"
                      onClick={() => onClaimReward(quest)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold font-mono-num shrink-0 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Ödülü Al · +{quest.rewardPeanuts}F</span>
                    </button>
                  ) : (
                    <div className="font-mono-num text-xs font-bold text-amber-300 shrink-0">
                      +{quest.rewardPeanuts} Fıstık
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-950/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono-num text-xs font-bold text-slate-300 shrink-0">
                    {currentVal} / {quest.target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Görevler her gece yarısı otomatik yenilenir.
          </span>
          {claimableCount >= 2 && (
            <button
              type="button"
              onClick={onClaimAllRewards}
              className="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap"
            >
              Hepsini Al ({claimableCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
