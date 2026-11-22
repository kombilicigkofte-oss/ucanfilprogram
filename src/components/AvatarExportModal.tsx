import React, { useMemo, useState } from 'react';
import { Download, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { BODY_TYPE_CONFIGS, BodyType, EquippedCosmetics } from '../types/game';
import { exportElephantAvatarDataUrl } from '../utils/renderer';
import { ElephantAvatarCanvas } from './CosmeticPreviewCanvas';

interface AvatarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodyType: BodyType;
  equipped: EquippedCosmetics;
}

export default function AvatarExportModal({
  isOpen,
  onClose,
  bodyType,
  equipped,
}: AvatarExportModalProps) {
  const [background, setBackground] = useState<'none' | 'savanna'>('none');
  const [downloadedMsg, setDownloadedMsg] = useState<boolean>(false);

  const previewUrl = useMemo(() => {
    if (!isOpen) return '';
    return exportElephantAvatarDataUrl(bodyType, equipped, background, 512);
  }, [background, bodyType, equipped, isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `ucan-fil-pp-${background === 'none' ? 'seffaf' : 'savan'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedMsg(true);
    window.setTimeout(() => setDownloadedMsg(false), 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">
                Filini PNG İndir (PP)
              </h2>
              <div className="text-xs text-slate-400">
                512×512 yüksek çözünürlüklü profil fotoğrafı
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="PP penceresini kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Stage */}
        <div className="p-5 flex flex-col items-center gap-4">
          <div
            className="relative p-3 rounded-2xl border border-slate-700/80 overflow-hidden flex items-center justify-center"
            style={
              background === 'none'
                ? {
                    backgroundImage:
                      'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#0f172a',
                  }
                : undefined
            }
          >
            <ElephantAvatarCanvas
              bodyType={bodyType}
              skinId={equipped.skin}
              hatId={equipped.hat}
              glassesId={equipped.glasses}
              suitId={equipped.suit}
              size={220}
              background={background}
              scale={1.08}
              className="rounded-xl"
            />
          </div>

          <div className="text-xs text-slate-400 text-center">
            Aktif görünüm: <span className="text-slate-200 font-semibold">{BODY_TYPE_CONFIGS[bodyType].label} Fil</span> · Şu anki şapkan, gözlüğün ve renginle çıkar.
          </div>

          {/* Background Toggle */}
          <div className="w-full grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setBackground('none')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                background === 'none'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Şeffaf PNG (Arka Plansız)
            </button>
            <button
              type="button"
              onClick={() => setBackground('savanna')}
              className={`inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                background === 'savanna'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Savan Gökyüzü</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{downloadedMsg ? 'İndirildi! (ucan-fil-pp.png)' : '512×512 PNG İndir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
