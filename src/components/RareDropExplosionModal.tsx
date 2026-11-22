import React, { useEffect, useRef } from 'react';
import { Check, Crown, Sparkles, X } from 'lucide-react';
import { RARITY_LABELS } from '../data/cosmetics';
import { BodyType, CosmeticItem, EquippedCosmetics } from '../types/game';
import { soundEngine } from '../utils/sound';
import { ElephantAvatarCanvas } from './CosmeticPreviewCanvas';

interface RareDropExplosionModalProps {
  item: CosmeticItem | null;
  bodyType: BodyType;
  equipped: EquippedCosmetics;
  isTestPreview?: boolean;
  onClose: () => void;
  onEquipAndClose: (item: CosmeticItem) => void;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  kind: 'shard' | 'spark';
}

const BURST_COLORS = [
  '#FACC15',
  '#FDE047',
  '#FB7185',
  '#F43F5E',
  '#38BDF8',
  '#FFFFFF',
  '#A855F7',
  '#F97316',
];

export default function RareDropExplosionModal({
  item,
  bodyType,
  equipped,
  isTestPreview = false,
  onClose,
  onEquipAndClose,
}: RareDropExplosionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!item) return;

    soundEngine.playRareDropCelebration();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const particles: BurstParticle[] = [];

    const spawnWave = (count: number, speedScale = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
        const speed = (180 + Math.random() * 680) * speedScale;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          size: 4 + Math.random() * 7,
          color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
          alpha: 1,
          decay: 0.34 + Math.random() * 0.32,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 12,
          kind: i % 3 === 0 ? 'shard' : 'spark',
        });
      }
    };

    // Initial massive CS-style explosion + secondary delayed burst
    spawnWave(135, 1.05);
    const wave2Timer = window.setTimeout(() => spawnWave(75, 0.85), 260);
    const wave3Timer = window.setTimeout(() => spawnWave(50, 0.7), 620);

    let animId = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 260 * dt;
        p.rotation += p.vRot * dt;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.kind === 'shard') {
          ctx.fillRect(-p.size * 0.65, -p.size * 0.28, p.size * 1.3, p.size * 0.56);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.clearTimeout(wave2Timer);
      window.clearTimeout(wave3Timer);
      window.removeEventListener('resize', resize);
    };
  }, [item]);

  if (!item) return null;

  const rarityMeta = RARITY_LABELS[item.rarity];
  const previewEquipped: EquippedCosmetics = {
    ...equipped,
    [item.category]: item.id,
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Screen Flashbang Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-amber-200 via-white to-rose-300 animate-cs-flash z-30" />

      {/* 60fps Explosion Confetti & Embers Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 w-full h-full z-20"
      />

      {/* Shaking Center Stage */}
      <div className="relative z-20 w-full max-w-lg flex flex-col items-center text-center animate-cs-shake">
        {/* Expanding Shockwave Rings */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border-4 border-amber-300/90 animate-cs-shockwave" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border-4 border-rose-400/85 animate-cs-shockwave-delay" />

        {/* Rotating Golden/Crimson Sunburst Rays */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-45 animate-cs-sunburst"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, rgba(250, 204, 21, 0.38) 0deg 10deg, transparent 10deg 25deg, rgba(244, 63, 94, 0.28) 25deg 34deg, transparent 34deg 50deg)',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Top Rare Drop Header */}
        <div className="relative flex flex-col items-center gap-1.5 mb-3 animate-cs-pop">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_24px_rgba(251,191,36,0.75)]">
            <Crown className="w-3.5 h-3.5" />
            <span>{isTestPreview ? 'TEST PATLAMASI · AŞIRI NADİR EŞYA' : '★ AŞIRI NADİR EŞYA DÜŞTÜ ★'}</span>
          </div>
          {item.dropRateLabel && (
            <div className="text-xs font-extrabold text-amber-300 tracking-wide drop-shadow">
              {item.dropRateLabel}
            </div>
          )}
        </div>

        {/* Glowing Card + Live Dressed Elephant Reveal */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-rose-950/85 border-2 border-amber-400 shadow-[0_0_60px_rgba(250,204,21,0.45),0_0_100px_rgba(244,63,94,0.35)] flex flex-col items-center gap-4 w-full animate-cs-pop">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative w-44 h-44 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-950/90 to-rose-500/20 border-2 border-amber-300/80 flex items-center justify-center shadow-[inset_0_0_30px_rgba(250,204,21,0.28)] overflow-hidden">
            <ElephantAvatarCanvas
              bodyType={bodyType}
              skinId={previewEquipped.skin}
              hatId={previewEquipped.hat}
              glassesId={previewEquipped.glasses}
              suitId={previewEquipped.suit}
              size={164}
              background="none"
              scale={1.55}
            />
            <div className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-amber-400/50 text-[10px] font-extrabold text-amber-300">
              <Sparkles className="w-3 h-3" />
              <span>{rarityMeta.label}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-rose-300 uppercase tracking-widest">
              Gizli Kıyafet (???)
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(250,204,21,0.4)]">
              {item.name}
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Mevcut filinin üstüne giyilir · Kulağın içine oturur!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
            {!isTestPreview && (
              <button
                type="button"
                onClick={() => onEquipAndClose(item)}
                className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Hemen Kuşan & Devam Et</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-600 cursor-pointer"
            >
              {isTestPreview ? 'Testi Kapat' : 'Harika, Kapat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
