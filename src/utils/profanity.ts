// Advanced Turkish & English profanity / inappropriate name detector
// Normalizes leetspeak, separators, diacritics, and repeated characters.

const BANNED_EXACT_OR_ROOTS = [
  'amk',
  'aq',
  'amq',
  'amcik',
  'amcık',
  'orospu',
  'orosbu',
  'orspu',
  'piç',
  'pic',
  'siktir',
  'sikik',
  'sikerim',
  'sikim',
  'sikiş',
  'sikis',
  'yarrak',
  'yarak',
  'taşak',
  'tasak',
  'tassak',
  'taşşak',
  'göt',
  'gotveren',
  'götveren',
  'pezevenk',
  'kahpe',
  'kaltak',
  'ibne',
  'puşt',
  'pust',
  'şerefsiz',
  'serefsiz',
  'oç',
  'oc',
  'ananı',
  'anani',
  'bacını',
  'bacini',
  'yavşak',
  'yavsak',
  'gavat',
  'döl',
  'fahişe',
  'fahise',
  'kancık',
  'kancik',
  'mal',
  'salak',
  'aptal',
  'gerizekalı',
  'gerizekali',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  'cock',
  'pussy',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
  'retard',
];

function normalizeText(input: string): string {
  const lower = input.toLocaleLowerCase('tr-TR');

  const leetMapped = lower
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // Remove spaces, dots, underscores, hyphens, emojis, punctuation
  const stripped = leetMapped.replace(/[^a-z]/g, '');
  // Collapse 3+ repeated characters down to 1 or 2 to catch "aaammmkkk"
  return stripped.replace(/(.)\1{2,}/g, '$1');
}

function normalizeWords(input: string): string[] {
  return input
    .toLocaleLowerCase('tr-TR')
    .split(/[\s._\-/,]+/)
    .map((w) => normalizeText(w))
    .filter(Boolean);
}

const RESERVED_CREATOR_SLUGS = ['obezfil', 'kyrmaniacraft'];

export function isReservedCreatorName(rawName: string): boolean {
  const collapsed = normalizeText(rawName);
  if (!collapsed) return false;
  return RESERVED_CREATOR_SLUGS.some((slug) => collapsed.includes(slug));
}

export interface NameValidationResult {
  valid: boolean;
  reason?: string;
}

export interface NameValidationOptions {
  allowReservedCreatorNames?: boolean;
}

export function validateDisplayName(
  rawName: string,
  options?: NameValidationOptions
): NameValidationResult {
  const trimmed = rawName.trim();

  if (trimmed.length < 2) {
    return { valid: false, reason: 'Oyuncu ismi en az 2 karakter olmalı.' };
  }
  if (trimmed.length > 30) {
    return { valid: false, reason: 'Oyuncu ismi en fazla 30 karakter olabilir.' };
  }

  if (!options?.allowReservedCreatorNames && isReservedCreatorName(trimmed)) {
    return {
      valid: false,
      reason: 'ObezFil ve kyrmaniacraft isimleri oyunun yapımcısına özeldir. Lütfen başka bir isim seç.',
    };
  }

  const collapsedAll = normalizeText(trimmed);
  const words = normalizeWords(trimmed);

  // Short exact-word bans so normal names containing "oc" or "mal" inside another word aren't falsely flagged
  const shortExactOnly = new Set(['aq', 'oc', 'mal', 'amk', 'amq', 'sik']);

  for (const term of BANNED_EXACT_OR_ROOTS) {
    const normTerm = normalizeText(term);
    if (!normTerm) continue;

    if (shortExactOnly.has(normTerm)) {
      if (words.includes(normTerm) || collapsedAll === normTerm) {
        return {
          valid: false,
          reason: 'Bu isim uygunsuz veya küfürlü ifadeler içeriyor. Lütfen başka bir isim seç.',
        };
      }
    } else if (collapsedAll.includes(normTerm)) {
      return {
        valid: false,
        reason: 'Bu isim uygunsuz veya küfürlü ifadeler içeriyor. Lütfen başka bir isim seç.',
      };
    }
  }

  return { valid: true };
}

export function sanitizeFallbackName(
  rawName: string,
  options?: NameValidationOptions
): string {
  const trimmed = rawName.trim().slice(0, 30);
  const check = validateDisplayName(trimmed, options);
  return check.valid ? trimmed : 'Savan Filcisi';
}
