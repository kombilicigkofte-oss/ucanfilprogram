import React from 'react';
import { NAME_COLOR_BY_ID } from '../data/nameColors';

interface StyledPlayerNameProps {
  name: string;
  colorId?: string;
  className?: string;
}

export default function StyledPlayerName({
  name,
  colorId,
  className = '',
}: StyledPlayerNameProps) {
  const def = colorId ? NAME_COLOR_BY_ID[colorId] : undefined;
  if (!def || def.id === 'name_default') {
    return <span className={className}>{name}</span>;
  }

  const animClass = def.fastAnimation ? 'nc-fast' : 'nc-animated';
  return <span className={`${animClass} ${def.id} ${className}`}>{name}</span>;
}
