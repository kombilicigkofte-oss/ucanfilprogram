import React, { useState } from 'react';
import { Ban, Crown, Globe, Package, ShieldAlert, ShieldOff, Shirt, Sparkles, Trash2, X, Zap } from 'lucide-react';
import { BannedIpRecord, BannedUidRecord, LeaderboardEntry, LeveledLeaderboardEntry } from '../types/game';
import { BIOME_THEMES } from '../utils/renderer';

interface CreatorPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  godMode: boolean;
  onToggleGodMode: () => void;
  speedMultiplier: number;
  onChangeSpeedMultiplier: (val: number) => void;
  onGrantAllItems: () => void;
  onGrantSecretTuxedo: () => void;
  onGrantAllSuits: () => void;
  onGrantAllLeveledSuits?: () => void;
  onGrantOutfitCrates: (amount: number) => void;
  onGrantLeveledSuitCrates?: (amount: number) => void;
  onTestRareDropAnimation: (suitId?: string) => void;
  onAddPeanuts: (amount: number) => void;
  onSetCreatorLeaderboardScore: (score: number) => Promise<void>;
  onSetCreatorLevel?: (level: number) => Promise<void>;
  leaderboardEntries: LeaderboardEntry[];
  leveledEntries?: LeveledLeaderboardEntry[];
  onDeleteLeaderboardEntry: (uid: string) => Promise<void>;
  onDeleteLeveledLeaderboardEntry?: (uid: string) => Promise<void>;
  bannedIps: BannedIpRecord[];
  bannedUids: BannedUidRecord[];
  onBanPlayer: (entry: LeaderboardEntry, reason: string) => Promise<{ ipBanned: boolean; ipRaw?: string }>;
  onBanIpManually: (ipRaw: string, reason: string) => Promise<void>;
  onUnbanIp: (ipKey: string) => Promise<void>;
  onUnbanUid: (uid: string) => Promise<void>;
  biomeOverrideId?: string | null;
  onChangeBiomeOverride?: (biomeId: string | null) => void;
}

export default function CreatorPanelModal({
  isOpen,
  onClose,
  godMode,
  onToggleGodMode,
  speedMultiplier,
  onChangeSpeedMultiplier,
  onGrantAllItems,
  onGrantSecretTuxedo,
  onGrantAllSuits,
  onGrantAllLeveledSuits,
  onGrantOutfitCrates,
  onGrantLeveledSuitCrates,
  onTestRareDropAnimation,
  onAddPeanuts,
  onSetCreatorLeaderboardScore,
  onSetCreatorLevel,
  leaderboardEntries,
  leveledEntries = [],
  onDeleteLeaderboardEntry,
  onDeleteLeveledLeaderboardEntry,
  bannedIps,
  bannedUids,
  onBanPlayer,
  onBanIpManually,
  onUnbanIp,
  onUnbanUid,
  biomeOverrideId = null,
  onChangeBiomeOverride,
}: CreatorPanelModalProps) {
  const [customScoreInput, setCustomScoreInput] = useState<string>('999');
  const [customLevelInput, setCustomLevelInput] = useState<string>('10');
  const [banReasonInput, setBanReasonInput] = useState<string>('Kurallara aykırı davranış');
  const [manualIpInput, setManualIpInput] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyScore = async () => {
    const parsed = Math.max(0, Math.min(999999, Math.floor(Number(customScoreInput) || 0)));
    await onSetCreatorLeaderboardScore(parsed);
    setStatusNote(`Klasik sıralama skorun ${parsed} olarak güncellendi.`);
  };

  const handleApplyLevel = async () => {
    if (!onSetCreatorLevel) return;
    const parsed = Math.max(1, Math.min(9999, Math.floor(Number(customLevelInput) || 1)));
    await onSetCreatorLevel(parsed);
    setStatusNote(`Seviyeli mod seviyen Sv.${parsed} olarak güncellendi.`);
  };

  const handleManualIpBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = manualIpInput.trim();
    if (!ip) return;
    await onBanIpManually(ip, banReasonInput);
    setManualIpInput('');
    setStatusNote(`${ip} IP adresi yasaklandı.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-amber-400/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800 bg-amber-500/10">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-amber-200">
                Yapımcı Kontrol Paneli
              </h2>
              <p className="text-xs text-amber-300/80">
                Bu menü yalnızca oyunun sahibine görünür.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Yapımcı panelini kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {statusNote && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-semibold text-emerald-200 flex items-center justify-between">
              <span>{statusNote}</span>
              <button
                type="button"
                onClick={() => setStatusNote(null)}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}

          {/* Gameplay Overrides */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 mb-2.5">
              Oyun & Fizik Kontrolleri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onToggleGodMode}
                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  godMode
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Ölümsüzlük (God Mode)</div>
                    <div className="text-xs text-slate-400">
                      Borulara çarpınca ölmezsin
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold">
                  {godMode ? 'AÇIK' : 'KAPALI'}
                </span>
              </button>

              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white inline-flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Oyun Hızı Çarpanı
                  </span>
                  <span className="font-mono-num text-amber-300 font-bold">{speedMultiplier}x</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.5, 1, 1.5, 2].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => onChangeSpeedMultiplier(mult)}
                      className={`py-1.5 rounded-lg text-xs font-mono-num font-bold cursor-pointer transition-colors ${
                        speedMultiplier === mult
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Grants */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 mb-2.5">
              Envanter & Kaynak Yönetimi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onGrantAllItems();
                  setStatusNote('Tüm normal/mitik kozmetikler, max güçlendirmeler ve 99 kalkan verildi!');
                }}
                className="p-3.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 border border-purple-400/60 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5 text-purple-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Bütün Eşyaları Ver</div>
                  <div className="text-xs text-purple-200/80">
                    Tüm Kozmetikler (Mitik dahil) + Max Güç & 99 Kalkan
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddPeanuts(1000);
                  setStatusNote('Kasana +1000 Altın Fıstık eklendi!');
                }}
                className="p-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <Crown className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">+1.000 Fıstık Ekle</div>
                  <div className="text-xs text-amber-200/80">
                    Kasana anında sınırsız fıstık bas
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onGrantSecretTuxedo();
                  setStatusNote('??? (Kraliyet Smokin) açıldı ve karakterinin üstüne giydirildi!');
                }}
                className="p-3.5 rounded-xl bg-gradient-to-r from-rose-600/25 via-slate-800/90 to-amber-500/20 hover:from-rose-600/35 hover:to-amber-500/30 border border-rose-400/70 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5 text-rose-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Kraliyet Smokin Ver & Giy (???)</div>
                  <div className="text-xs text-rose-200/85">
                    100.000&apos;de 1 smokini açar ve filinin üstüne giydirir
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onGrantAllSuits();
                  setStatusNote('Tüm 14 gizli kıyafet (???) envanterine açıldı!');
                }}
                className="p-3.5 rounded-xl bg-gradient-to-r from-teal-600/25 via-slate-800/90 to-emerald-500/20 hover:from-teal-600/35 hover:to-emerald-500/30 border border-teal-400/70 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <Shirt className="w-5 h-5 text-teal-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Tüm Gizli Kıyafetleri Aç (14)</div>
                  <div className="text-xs text-teal-200/85">
                    14 gizli kıyafetin tamamını dolabına ekler (??? sekmesinden seç)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onGrantOutfitCrates(25);
                  setStatusNote('Kutu Çantana +25 Gizli Kıyafet Kasası eklendi!');
                }}
                className="p-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/60 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <Package className="w-5 h-5 text-cyan-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">+25 Gizli Kıyafet Kasası Ver</div>
                  <div className="text-xs text-cyan-200/85">
                    Test için Kutu Çantana 25 adet kıyafet kasası ekler
                  </div>
                </div>
              </button>

              {onGrantLeveledSuitCrates && (
                <button
                  type="button"
                  onClick={() => {
                    onGrantLeveledSuitCrates(10);
                    setStatusNote('Kutu Çantana +10 Seviyeli Kıyafet Kasası eklendi!');
                  }}
                  className="p-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/60 text-left transition-colors cursor-pointer flex items-center gap-3"
                >
                  <Package className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">+10 Seviyeli Kıyafet Kasası</div>
                    <div className="text-xs text-emerald-200/85">
                      5 Seviyeli özel kostüm kasası ekler
                    </div>
                  </div>
                </button>
              )}

              {onGrantAllLeveledSuits && (
                <button
                  type="button"
                  onClick={() => {
                    onGrantAllLeveledSuits();
                    setStatusNote('5 Seviyeli özel kostümü envanterine açıldı!');
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600/25 via-slate-800/90 to-green-500/20 hover:from-emerald-600/35 hover:to-green-500/30 border border-emerald-400/70 text-left transition-colors cursor-pointer flex items-center gap-3"
                >
                  <Shirt className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">5 Seviyeli Kostümü Aç</div>
                    <div className="text-xs text-emerald-200/85">
                      Surypap, Bass, Swamp, Frind, Filyman kostümlerini açar
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => onTestRareDropAnimation()}
                className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-amber-500/25 hover:from-amber-500/35 hover:to-rose-500/35 border border-amber-400/80 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <Zap className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">CS Patlama & Müzik Dene 💥</div>
                  <div className="text-xs text-amber-200/90">
                    Aşırı nadir kıyafet çıkma efektini + müziğini anında test et
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Leaderboard Overrides (Klasik & Seviyeli) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-400 mb-2">
                Klasik Sıralama Skoru Yaz
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={999999}
                  value={customScoreInput}
                  onChange={(e) => setCustomScoreInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleApplyScore}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  Skor Yaz
                </button>
              </div>
            </div>

            {onSetCreatorLevel && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-2">
                  Seviyeli Mod Seviyesi Yaz
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={customLevelInput}
                    onChange={(e) => setCustomLevelInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLevel}
                    className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    Seviye Yaz
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 30 Biomes Explorer & Live Preview */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="text-xs font-bold text-slate-400 inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Biyom Galerisi & Canlı Önizleme ({BIOME_THEMES.length} Biyom)</span>
              </h3>
              {onChangeBiomeOverride && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeBiomeOverride(null);
                    setStatusNote('Biyom seçimi otomatik moda döndürüldü.');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    !biomeOverrideId
                      ? 'bg-sky-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Otomatik (Normal)
                </button>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
              {BIOME_THEMES.map((b, idx) => {
                const isSelected = biomeOverrideId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      if (!onChangeBiomeOverride) return;
                      onChangeBiomeOverride(isSelected ? null : b.id);
                      setStatusNote(
                        isSelected
                          ? 'Biyom önizlemesi kapatıldı.'
                          : `Canlı sahne #${idx + 1} ${b.name} biyomuna alındı!`
                      );
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/50'
                        : 'bg-slate-800/75 border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className="w-full h-5 rounded-md border border-slate-950/60 flex items-end justify-end p-0.5 overflow-hidden"
                      style={{
                        background: `linear-gradient(180deg, ${b.skyTop} 0%, ${b.skyMid} 58%, ${b.skyBottom} 100%)`,
                      }}
                    >
                      <div
                        className="w-3.5 h-3 rounded-sm border border-slate-950/70"
                        style={{ backgroundColor: b.pipeMid }}
                      />
                      <div
                        className="ml-0.5 w-3.5 h-2 rounded-sm border border-slate-950/70"
                        style={{ backgroundColor: b.groundTop }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <span className="text-[11px] font-bold text-white truncate">
                        #{idx + 1} {b.name}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: b.badgeColor }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Moderation & IP/UID Banning */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-400">
                Oyuncu Moderasyonu & Ban ({leaderboardEntries.length} Kayıt)
              </h3>
              <input
                type="text"
                maxLength={100}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="Ban sebebi..."
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400 w-52"
              />
            </div>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {leaderboardEntries.map((entry) => (
                <div
                  key={entry.uid}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700/70 text-xs"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-bold text-white truncate">{entry.displayName}</span>
                    {entry.isCreator && (
                      <span className="text-[10px] font-bold text-amber-300">(Yapımcı)</span>
                    )}
                    <span className="font-mono-num text-slate-400">· {entry.bestScore}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!entry.isCreator && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await onBanPlayer(entry, banReasonInput);
                          setStatusNote(
                            res.ipBanned
                              ? `${entry.displayName} hesabı ve IP adresi (${res.ipRaw}) yasaklandı!`
                              : `${entry.displayName} hesabı yasaklandı (IP kaydı henüz yoktu).`
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Banla (UID+IP)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteLeaderboardEntry(entry.uid);
                        setStatusNote(`${entry.displayName} sıralamadan silindi.`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {leveledEntries.length > 0 && onDeleteLeveledLeaderboardEntry && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-emerald-300 mb-1.5">
                  Seviyeli Sıralama Kayıtları ({leveledEntries.length})
                </div>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {leveledEntries.map((entry) => (
                    <div
                      key={`lvl-${entry.uid}`}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/70 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="font-bold text-white truncate">{entry.displayName}</span>
                        <span className="font-mono-num text-emerald-300">Sv.{entry.maxLevel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteLeveledLeaderboardEntry(entry.uid);
                          setStatusNote(`${entry.displayName} Seviyeli sıralamadan silindi.`);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Sil</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Banned IPs & UIDs Management */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400">
              Yasaklı IP & Hesaplar ({bannedIps.length} IP · {bannedUids.length} Hesap)
            </h3>

            <form onSubmit={handleManualIpBan} className="flex items-center gap-2">
              <input
                type="text"
                value={manualIpInput}
                onChange={(e) => setManualIpInput(e.target.value)}
                placeholder="Manuel IP adresi gir (örn: 192.168.1.10)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                IP Banla
              </button>
            </form>

            {(bannedIps.length > 0 || bannedUids.length > 0) ? (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {bannedIps.map((item) => (
                  <div
                    key={`ip-${item.ipKey}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono-num font-bold text-rose-200 truncate">
                        IP: {item.ipRaw}{' '}
                        {item.bannedDisplayName ? `(${item.bannedDisplayName})` : ''}
                      </div>
                      <div className="text-[11px] text-rose-300/80 truncate">{item.reason}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await onUnbanIp(item.ipKey);
                        setStatusNote(`${item.ipRaw} IP yasağı kaldırıldı.`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold cursor-pointer shrink-0"
                    >
                      <ShieldOff className="w-3 h-3" />
                      <span>IP Kaldır</span>
                    </button>
                  </div>
                ))}

                {bannedUids.map((item) => (
                  <div
                    key={`uid-${item.uid}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-amber-200 truncate">
                        Hesap: {item.displayName || item.uid}
                      </div>
                      <div className="text-[11px] text-amber-300/80 truncate">{item.reason}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await onUnbanUid(item.uid);
                        setStatusNote(`${item.displayName || item.uid} hesap yasağı kaldırıldı.`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold cursor-pointer shrink-0"
                    >
                      <ShieldOff className="w-3 h-3" />
                      <span>Hesap Kaldır</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Şu anda yasaklı IP veya hesap yok.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
