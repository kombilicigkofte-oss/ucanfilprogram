import React, { useEffect, useRef } from 'react';
import { BodyType, CosmeticItem, EquippedCosmetics } from '../types/game';
import { drawCosmeticItemIcon, drawElephantPortrait } from '../utils/renderer';

interface CosmeticItemCanvasProps {
  item: CosmeticItem;
  size?: number;
  className?: string;
}

export function CosmeticItemCanvas({
  item,
  size = 44,
  className = '',
}: CosmeticItemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    drawCosmeticItemIcon(ctx, size, size, item, 1.2);
    ctx.restore();
  }, [item, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}

interface ElephantAvatarCanvasProps {
  bodyType: BodyType;
  skinId?: string;
  hatId?: string;
  glassesId?: string;
  suitId?: string;
  size?: number;
  background?: 'none' | 'savanna' | 'dark';
  scale?: number;
  className?: string;
}

export function ElephantAvatarCanvas({
  bodyType,
  skinId = 'skin_classic',
  hatId = 'hat_none',
  glassesId = 'glasses_none',
  suitId = 'suit_none',
  size = 44,
  background = 'dark',
  scale = 1,
  className = '',
}: ElephantAvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    const equipped: EquippedCosmetics = {
      skin: skinId,
      hat: hatId,
      glasses: glassesId,
      trail: 'trail_none',
      suit: suitId,
    };
    drawElephantPortrait(ctx, size, size, bodyType, equipped, {
      background,
      time: 1.2,
      scale,
    });
    ctx.restore();
  }, [background, bodyType, glassesId, hatId, scale, size, skinId, suitId]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
