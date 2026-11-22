import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Crown,
  Lock,
  LogIn,
  LogOut,
  Palette,
  Trophy,
  X,
} from 'lucide-react';
import { RENAME_PEANUT_COST, WEEKLY_RENAME_MS } from '../firebase';
import {
  BODY_TYPE_CONFIGS,
  DIFFICULTY_CONFIGS,
  Difficulty,
  GameMode,
  GameUser,
  LeaderboardEntry,
  LeveledLeaderboardEntry,
} from '../types/game';
import { validateDisplayName } from '../utils/profanity';
import { ElephantAvatarCanvas } from './CosmeticPreviewCanvas';
import StyledPlayerName from './StyledPlayerName';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  errorMsg: string | null;
  leveledEntries: LeveledLeaderboardEntry[];
  leveledLoading?: boolean;
  leveledErrorMsg?: string | null;
  initialModeTab?: GameMode;
  user: GameUser | null;
  isCreator: boolean;
  peanutBank: number;
  customDisplayName: string;
  equippedNameColor?: string;
  hasCustomName?: boolean;
  lastNameChangeMs?: number;
  onSaveDisplayName: (newName: string) => Promise<void>;
  onOpenNameColorShop?: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  entries,
  loading,
  errorMsg,
  leveledEntries,
  leveledLoading = false,
  leveledErrorMsg = null,
  initialModeTab = 'classic',
  user,
  isCreator,
  peanutBank,
  customDisplayName,
  equippedNameColor = 'name_default',
  hasCustomName = false,
  lastNameChangeMs,
  onSaveDisplayName,
  onOpenNameColorShop,
  onSignIn,
  onSignOut,
}: LeaderboardModalProps) {
  const [modeTab, setModeTab] = useState<GameMode>(initialModeTab);
  const [diffFilter, setDiffFilter] = useState<'all' | Difficulty>('all');
  const [nameInput, setNameInput] = useState<string>(customDisplayName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSavedMsg, setNameSavedMsg] = useState<string | null>(null);
  const [savingName, setSavingName] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setModeTab(initialModeTab);
    }
  }, [initialModeTab, isOpen]);

  useEffect(() => {
    setNameInput(customDisplayName);
    setNameError(null);
  }, [customDisplayName, isOpen]);

  const filteredEntries = useMemo(() => {
    if (diffFilter === 'all') return entries;
    return entries.filter((e) => e.difficulty === diffFilter);
  }, [diffFilter, entries]);

  const filteredLeveledEntries = useMemo(() => {
    if (diffFilter === 'all') return leveledEntries;
    return leveledEntries.filter((e) => e.difficulty === diffFilter);
  }, [diffFilter, leveledEntries]);

  const remainingRenameMs = useMemo(() => {
    if (!hasCustomName || !lastNameChangeMs) return 0;
    const elapsed = Date.now() - lastNameChangeMs;
    return elapsed < WEEKLY_RENAME_MS ? WEEKLY_RENAME_MS - elapsed : 0;
  }, [hasCustomName, lastNameChangeMs]);

  const isRenameLocked = remainingRenameMs > 0;
  const canAffordRename = peanutBank >= RENAME_PEANUT_COST;
  const remainingDays = Math.floor(remainingRenameMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.ceil(
    (remainingRenameMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  if (!isOpen) return null;

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRenameLocked) return;
    setNameSavedMsg(null);

    const trimmed = nameInput.trim();
    if (trimmed === customDisplayName.trim()) {
      setNameError('Zaten bu ismi kullanıyorsun.');
      return;
    }

    if (!canAffordRename) {
      setNameError(`İsim değiştirmek için en az ${RENAME_PEANUT_COST} Fıstık gerekiyor.`);
      return;
    }

    const check = validateDisplayName(trimmed, { allowReservedCreatorNames: isCreator });
    if (!check.valid) {
      setNameError(check.reason || 'Uygunsuz isim.');
      return;
    }

    setNameError(null);
    setSavingName(true);
    try {
      await onSaveDisplayName(trimmed);
      setNameSavedMsg(`İsmin güncellendi (-${RENAME_PEANUT_COST} Fıstık). 1 hafta boyunca kilitlendi.`);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'İsim kaydedilemedi.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">Savan Sıralaması</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Sıralamayı kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Status & Safe Nickname Bar */}
        <div className="px-5 py-3.5 bg-slate-800/50 border-b border-slate-800 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {user ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <StyledPlayerName
                  name={customDisplayName || user.displayName || 'Oyuncu'}
                  colorId={equippedNameColor}
                  className="text-sm font-extrabold"
                />
                {isCreator && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300 bg-amber-500/15 border border-amber-400/50 px-2.5 py-0.5 rounded-md">
                    <Crown className="w-3.5 h-3.5" />
                    Oyunun Yapımcısı
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-300">
                Skorunu sıralamaya yazdırmak için e-postanla giriş yap veya kayıt ol.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {onOpenNameColorShop && (
                <button
                  type="button"
                  onClick={onOpenNameColorShop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>İsim Rengi Al</span>
                </button>
              )}

              {user ? (
                <>
                  {user.isGuest && (
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Kayıt Ol / Giriş Yap</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Giriş Yap / Kayıt Ol</span>
                </button>
              )}
            </div>
          </div>

          {user && user.isGuest && (
            <div className="text-xs text-sky-200 bg-sky-500/10 border border-sky-400/30 rounded-lg px-3 py-2">
              Misafir hesabındasın. Global sıralamaya kalıcı skor yazdırmak için{' '}
              <button
                type="button"
                onClick={onSignIn}
                className="font-bold underline text-amber-300 cursor-pointer"
              >
                Kayıt Ol / Giriş Yap
              </button>
              .
            </div>
          )}

          {user && !user.isGuest && (
            <form onSubmit={handleNameSubmit} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={30}
                  disabled={isRenameLocked}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setNameError(null);
                    setNameSavedMsg(null);
                  }}
                  placeholder="Sıralamada görünecek ismin..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={savingName || isRenameLocked || !canAffordRename}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRenameLocked && <Lock className="w-3 h-3" />}
                  <span>
                    {savingName
                      ? 'Kontrol...'
                      : isRenameLocked
                        ? '1 Hafta Kilitli'
                        : `Değiştir · ${RENAME_PEANUT_COST}F`}
                  </span>
                </button>
              </div>
              {isRenameLocked ? (
                <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    İsmini haftada sadece 1 kez değiştirebilirsin. Kalan süre: {remainingDays} gün{' '}
                    {remainingHours} saat
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  İsim değişikliği <span className="font-mono-num text-amber-300 font-bold">{RENAME_PEANUT_COST} Fıstık</span> tutar ve 1 hafta kilitlenir.
                </div>
              )}
              {nameError && (
                <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}
              {nameSavedMsg && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameSavedMsg}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Game Mode Tabs + Difficulty Filter */}
        <div className="px-5 pt-3 pb-2 flex flex-col gap-2.5 border-b border-slate-800/70">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setModeTab('classic')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                modeTab === 'classic'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Klasik Sıralama ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setModeTab('leveled')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                modeTab === 'leveled'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Seviyeli Sıralama ({leveledEntries.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'easy', 'classic', 'turbo'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDiffFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  diffFilter === key
                    ? modeTab === 'leveled'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {key === 'all' ? 'Tüm Zorluklar' : DIFFICULTY_CONFIGS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
          {modeTab === 'classic' ? (
            errorMsg ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                Sıralama yüklenirken bir sorun oluştu. Lütfen biraz sonra tekrar dene.
              </div>
            ) : loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Sıralama yükleniyor...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Henüz kayıtlı skor yok. İlk skoru sen yazdır!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredEntries.map((entry, idx) => {
                  const isSelf = user?.uid === entry.uid;
                  const rank = idx + 1;
                  const rankColor =
                    rank === 1
                      ? 'text-amber-300'
                      : rank === 2
                        ? 'text-slate-200'
                        : rank === 3
                          ? 'text-orange-300'
                          : 'text-slate-400';

                  return (
                    <div
                      key={entry.uid}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                        entry.isCreator
                          ? 'bg-amber-500/10 border-amber-400/60'
                          : isSelf
                            ? 'bg-sky-500/10 border-sky-400/50'
                            : 'bg-slate-800/60 border-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-mono-num text-base font-extrabold w-7 text-center shrink-0 ${rankColor}`}
                        >
                          #{rank}
                        </span>

                        <ElephantAvatarCanvas
                          bodyType={entry.bodyType}
                          skinId={entry.skinId || 'skin_classic'}
                          hatId={entry.hatId || 'hat_none'}
                          glassesId={entry.glassesId || 'glasses_none'}
                          suitId={entry.suitId || 'suit_none'}
                          size={44}
                          background="dark"
                          scale={1.06}
                          className="rounded-xl border border-slate-700/80"
                        />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StyledPlayerName
                              name={entry.displayName}
                              colorId={entry.nameColorId}
                              className="text-sm font-bold truncate"
                            />
                            {entry.isCreator && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded">
                                <Crown className="w-3 h-3" />
                                Oyunun Yapımcısı
                              </span>
                            )}
                            {isSelf && !entry.isCreator && (
                              <span className="text-[11px] font-semibold text-sky-300">
                                (Sen)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {BODY_TYPE_CONFIGS[entry.bodyType]?.label || 'Normal'} Fil ·{' '}
                            {DIFFICULTY_CONFIGS[entry.difficulty]?.label || 'Klasik'} Zorluk
                          </div>
                        </div>
                      </div>

                      <div className="font-mono-num text-lg font-extrabold text-white shrink-0">
                        {entry.bestScore}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : leveledErrorMsg ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
              Seviyeli sıralama yüklenirken bir sorun oluştu. Lütfen biraz sonra tekrar dene.
            </div>
          ) : leveledLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Seviyeli sıralama yükleniyor...
            </div>
          ) : filteredLeveledEntries.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Seviyeli modda henüz kayıtlı lider yok. İlk bölümü tamamla ve zirveye çık!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredLeveledEntries.map((entry, idx) => {
                const isSelf = user?.uid === entry.uid;
                const rank = idx + 1;
                const rankColor =
                  rank === 1
                    ? 'text-emerald-300'
                    : rank === 2
                      ? 'text-slate-200'
                      : rank === 3
                        ? 'text-orange-300'
                        : 'text-slate-400';

                return (
                  <div
                    key={entry.uid}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                      entry.isCreator
                        ? 'bg-amber-500/10 border-amber-400/60'
                        : isSelf
                          ? 'bg-emerald-500/10 border-emerald-400/50'
                          : 'bg-slate-800/60 border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono-num text-base font-extrabold w-7 text-center shrink-0 ${rankColor}`}
                      >
                        #{rank}
                      </span>

                      <ElephantAvatarCanvas
                        bodyType={entry.bodyType}
                        skinId={entry.skinId || 'skin_classic'}
                        hatId={entry.hatId || 'hat_none'}
                        glassesId={entry.glassesId || 'glasses_none'}
                        suitId={entry.suitId || 'suit_none'}
                        size={44}
                        background="dark"
                        scale={1.06}
                        className="rounded-xl border border-slate-700/80"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StyledPlayerName
                            name={entry.displayName}
                            colorId={entry.nameColorId}
                            className="text-sm font-bold truncate"
                          />
                          {entry.isCreator && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded">
                              <Crown className="w-3 h-3" />
                              Oyunun Yapımcısı
                            </span>
                          )}
                          {isSelf && !entry.isCreator && (
                            <span className="text-[11px] font-semibold text-emerald-300">
                              (Sen)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {BODY_TYPE_CONFIGS[entry.bodyType]?.label || 'Normal'} Fil ·{' '}
                          {entry.completedLevels} Bölüm · En İyi: {entry.bestLevelScore} Puan
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/40 font-mono-num text-sm font-extrabold text-emerald-300">
                        Sv. {entry.maxLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
