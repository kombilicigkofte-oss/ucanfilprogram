import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn, Sparkles, UserCheck, UserPlus, X } from 'lucide-react';
import {
  registerWithEmailPassword,
  signInAsGuest,
  signInWithEmailPassword,
} from '../firebase';
import { GameUser } from '../types/game';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: GameUser) => void;
  initialMode?: 'login' | 'register' | 'guest';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>(initialMode);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let loggedUser: GameUser;
      if (mode === 'login') {
        loggedUser = await signInWithEmailPassword({ email, password });
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Şifreler birbiriyle eşleşmiyor.');
        }
        loggedUser = await registerWithEmailPassword({
          email,
          password,
          displayName,
        });
      } else {
        loggedUser = await signInAsGuest(guestName);
      }

      onSuccess?.(loggedUser);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div>
            <h2 className="text-lg font-extrabold text-white">Savan Hesabı</h2>
            <p className="text-xs text-slate-400">
              E-posta ve şifrenle giriş yap; eşyaların ve skorların her sitede güvende kalsın
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Giriş penceresini kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Kayıt Ol</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('guest');
                setErrorMsg(null);
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                mode === 'guest'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Misafir</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          {mode !== 'guest' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  required
                  maxLength={120}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Oyuncu İsmi (Sıralamada Görünecek Ad)
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Örn: Savan Aslanı"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    maxLength={64}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 4 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Şifre Tekrar
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    maxLength={64}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifreni tekrar yaz"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Misafir Takma Adı
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Misafir Fil"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-sky-200 leading-relaxed">
                Şifresiz hemen oynarsın ve eşyaların bu tarayıcıda saklanır. İleride tüm cihazlardan
                erişmek istersen <strong>Kayıt Ol</strong> diyerek mevcut eşyalarını e-posta hesabına
                aktarabilirsin.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/50 text-xs font-semibold text-rose-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-1 w-full py-3 px-5 rounded-xl font-extrabold text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60 ${
              mode === 'login'
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : mode === 'register'
                  ? 'bg-purple-500 hover:bg-purple-400 text-white'
                  : 'bg-sky-400 hover:bg-sky-300 text-slate-950'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {loading
                ? 'Bağlanıyor...'
                : mode === 'login'
                  ? 'Giriş Yap'
                  : mode === 'register'
                    ? 'Hesabı Oluştur ve Gir'
                    : 'Misafir Olarak Devam Et'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
