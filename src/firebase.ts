import { initializeApp } from 'firebase/app';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  BannedIpRecord,
  BannedUidRecord,
  BodyType,
  CrateInventoryState,
  Difficulty,
  EquippedCosmetics,
  GameMode,
  GameUser,
  LeaderboardEntry,
  LeveledLeaderboardEntry,
  SavedCharacterPreset,
  UpgradesState,
} from './types/game';
import {
  isReservedCreatorName,
  sanitizeFallbackName,
  validateDisplayName,
} from './utils/profanity';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const WEEKLY_RENAME_MS = 7 * 24 * 60 * 60 * 1000;
export const RENAME_PEANUT_COST = 10;

const SESSION_STORAGE_KEY = 'ucan_fil_auth_session_v2';
const GUEST_UID_STORAGE_KEY = 'ucan_fil_guest_uid_v1';
const CREATOR_UID = 'acct_kyrmaniacraft';
const CREATOR_EMAIL_HASH =
  '99540054bc7aaaa1463ccce568db96d7aea396900d6e00253cce6bf0b4f5fd7b';
const CREATOR_DEFAULT_DISPLAY_NAME = 'ObezFil';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let currentSessionUser: GameUser | null = loadStoredSession();
const authListeners = new Set<(user: GameUser | null) => void>();

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentSessionUser?.uid ?? null,
      email: null,
      emailVerified: currentSessionUser ? !currentSessionUser.isGuest : false,
      isAnonymous: currentSessionUser?.isGuest ?? true,
      tenantId: null,
      providerInfo: currentSessionUser
        ? [
            {
              providerId: currentSessionUser.isGuest ? 'guest' : 'firestore-email-password',
              email: null,
            },
          ]
        : [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function computeSessionSig(user: GameUser): string {
  const payload = `${user.uid}|${user.accountId}|${user.displayName}|${user.isGuest}|${user.isCreator}`;
  let h = 2166136261;
  const salted = `ucan_fil_session_v2:${payload}`;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function loadStoredSession(): GameUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.uid !== 'string' || typeof parsed.accountId !== 'string') {
      return null;
    }
    const candidate: GameUser = {
      uid: parsed.uid,
      accountId: parsed.accountId,
      displayName: String(parsed.displayName || 'Oyuncu'),
      isGuest: Boolean(parsed.isGuest),
      isCreator: Boolean(parsed.isCreator && parsed.uid === CREATOR_UID && !parsed.isGuest),
    };
    if (parsed.sig !== computeSessionSig(candidate)) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

function persistSession(user: GameUser | null) {
  currentSessionUser = user;
  if (typeof window !== 'undefined') {
    try {
      if (!user) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        const sig = computeSessionSig(user);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...user, sig }));
      }
    } catch {
      // Ignore storage errors
    }
  }
  authListeners.forEach((cb) => cb(user));
}

function generateSaltHex(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < bytes; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sha256FallbackHex(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map((x) => x.toString(16).padStart(8, '0'))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback for non-secure contexts
    }
  }
  return sha256FallbackHex(input);
}

function validateEmail(raw: string): { valid: boolean; cleanEmail: string; reason?: string } {
  const cleanEmail = raw.trim().toLowerCase();
  if (cleanEmail.length < 5 || cleanEmail.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return {
      valid: false,
      cleanEmail,
      reason: 'Lütfen geçerli bir e-posta adresi gir (örnek: adin@gmail.com).',
    };
  }
  return { valid: true, cleanEmail };
}

export function getCurrentUser(): GameUser | null {
  return currentSessionUser;
}

export function isUserCreator(user: GameUser | null): boolean {
  if (!user || user.isGuest) return false;
  return Boolean(user.isCreator && user.uid === CREATOR_UID);
}

export async function registerWithEmailPassword(params: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<GameUser> {
  const eCheck = validateEmail(params.email);
  if (!eCheck.valid) {
    throw new Error(eCheck.reason || 'Geçersiz e-posta adresi.');
  }
  if (params.password.length < 4 || params.password.length > 64) {
    throw new Error('Şifre en az 4 karakter olmalıdır.');
  }

  const accountId = await sha256Hex(eCheck.cleanEmail);
  const isCreator = accountId === CREATOR_EMAIL_HASH;

  const fallbackLocalPart = eCheck.cleanEmail
    .split('@')[0]
    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ _-]/g, '')
    .slice(0, 24);
  const defaultName = isCreator
    ? CREATOR_DEFAULT_DISPLAY_NAME
    : fallbackLocalPart.length >= 2
      ? fallbackLocalPart
      : 'Savan Filcisi';
  const desiredDisplay = (params.displayName || '').trim() || defaultName;

  const dCheck = validateDisplayName(desiredDisplay, { allowReservedCreatorNames: isCreator });
  if (!dCheck.valid) {
    throw new Error(dCheck.reason || 'Görünen ad uygun değil.');
  }
  const safeDisplayName = sanitizeFallbackName(desiredDisplay, {
    allowReservedCreatorNames: isCreator,
  });

  const path = `accounts/${accountId}`;
  try {
    const ref = doc(db, 'accounts', accountId);
    const existingSnap = await getDoc(ref);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      // Gracefully sign in if account was created earlier before code removal and password matches
      const candidateHash = await sha256Hex(`${String(existingData.salt || '')}:${params.password}`);
      if (existingData.emailVerified === false && candidateHash === String(existingData.passwordHash || '')) {
        const uid = isCreator ? CREATOR_UID : String(existingData.uid || `acct_${accountId}`);
        const user: GameUser = {
          uid,
          accountId,
          displayName: String(existingData.displayName || safeDisplayName),
          isGuest: false,
          isCreator,
        };
        persistSession(user);
        return user;
      }
      throw new Error('Bu e-posta adresiyle zaten bir hesap var. Giriş Yap sekmesini dene.');
    }

    const salt = generateSaltHex(16);
    const passwordHash = await sha256Hex(`${salt}:${params.password}`);
    const uid = isCreator ? CREATOR_UID : `acct_${accountId}`;

    await setDoc(ref, {
      uid,
      accountId,
      displayName: safeDisplayName,
      salt,
      passwordHash,
      isCreator,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const user: GameUser = {
      uid,
      accountId,
      displayName: safeDisplayName,
      isGuest: false,
      isCreator,
    };
    persistSession(user);
    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('zaten bir hesap') || error.message.includes('uygun'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function signInWithEmailPassword(params: {
  email: string;
  password: string;
}): Promise<GameUser> {
  const eCheck = validateEmail(params.email);
  if (!eCheck.valid) {
    throw new Error(eCheck.reason || 'Geçersiz e-posta adresi.');
  }
  if (!params.password) {
    throw new Error('Lütfen şifreni gir.');
  }

  const accountId = await sha256Hex(eCheck.cleanEmail);
  const path = `accounts/${accountId}`;
  try {
    const snap = await getDoc(doc(db, 'accounts', accountId));
    if (!snap.exists()) {
      throw new Error('Bu e-posta ile kayıtlı hesap bulunamadı. Önce Kayıt Ol sekmesinden hesap oluştur.');
    }
    const data = snap.data();
    const candidateHash = await sha256Hex(`${String(data.salt || '')}:${params.password}`);
    if (candidateHash !== String(data.passwordHash || '')) {
      throw new Error('Şifre hatalı. Lütfen kontrol edip tekrar dene.');
    }

    const isCreator = Boolean(data.isCreator && accountId === CREATOR_EMAIL_HASH);
    const uid = isCreator ? CREATOR_UID : String(data.uid || `acct_${accountId}`);
    const displayName = String(data.displayName || (isCreator ? CREATOR_DEFAULT_DISPLAY_NAME : 'Oyuncu'));

    const user: GameUser = {
      uid,
      accountId,
      displayName,
      isGuest: false,
      isCreator,
    };
    persistSession(user);
    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('bulunamadı') || error.message.includes('Şifre hatalı'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

export async function signInAsGuest(guestName?: string): Promise<GameUser> {
  const cleanName = (guestName || '').trim() || 'Misafir Fil';
  const check = validateDisplayName(cleanName, { allowReservedCreatorNames: false });
  if (!check.valid) {
    throw new Error(check.reason || 'Uygunsuz takma ad.');
  }
  const safeName = sanitizeFallbackName(cleanName, { allowReservedCreatorNames: false });

  let guestUid = '';
  if (typeof window !== 'undefined') {
    try {
      guestUid = localStorage.getItem(GUEST_UID_STORAGE_KEY) || '';
      if (!/^guest_[a-z0-9]{6,20}$/.test(guestUid)) {
        guestUid = `guest_${generateSaltHex(6)}`;
        localStorage.setItem(GUEST_UID_STORAGE_KEY, guestUid);
      }
    } catch {
      guestUid = `guest_${generateSaltHex(6)}`;
    }
  } else {
    guestUid = `guest_${generateSaltHex(6)}`;
  }

  const user: GameUser = {
    uid: guestUid,
    accountId: guestUid,
    displayName: safeName,
    isGuest: true,
    isCreator: false,
  };
  persistSession(user);
  return user;
}

export async function signOutUser(): Promise<void> {
  persistSession(null);
}

export function subscribeAuthState(callback: (user: GameUser | null) => void): () => void {
  authListeners.add(callback);

  // Re-verify persisted registered session against Firestore cleanly
  const snapshotUser = currentSessionUser;
  if (snapshotUser && !snapshotUser.isGuest) {
    getDoc(doc(db, 'accounts', snapshotUser.accountId))
      .then((snap) => {
        if (!snap.exists()) {
          persistSession(null);
          return;
        }
        const data = snap.data();
        const isCreator = Boolean(
          data.isCreator && snapshotUser.accountId === CREATOR_EMAIL_HASH
        );
        const verifiedUser: GameUser = {
          uid: isCreator ? CREATOR_UID : String(data.uid || `acct_${snapshotUser.accountId}`),
          accountId: snapshotUser.accountId,
          displayName: String(data.displayName || snapshotUser.displayName),
          isGuest: false,
          isCreator,
        };
        currentSessionUser = verifiedUser;
        if (typeof window !== 'undefined') {
          try {
            const sig = computeSessionSig(verifiedUser);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...verifiedUser, sig }));
          } catch {
            // Ignore storage errors
          }
        }
        callback(verifiedUser);
      })
      .catch(() => {
        callback(snapshotUser);
      });
  } else {
    Promise.resolve().then(() => callback(snapshotUser));
  }

  return () => {
    authListeners.delete(callback);
  };
}

export async function fetchClientIp(): Promise<{ ipRaw: string; ipKey: string }> {
  try {
    const res = await fetch('/api/client-ip');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.ipRaw && data?.ipKey) {
          return { ipRaw: String(data.ipRaw), ipKey: String(data.ipKey) };
        }
      }
    }
  } catch {
    // Fallback when running on static hosting (e.g. Netlify / GitHub Pages)
  }

  try {
    const res = await fetch('https://api64.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      const raw = typeof data?.ip === 'string' ? data.ip.trim().slice(0, 64) : '';
      if (raw) {
        const ipKey = raw.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 64) || 'unknown_ip';
        return { ipRaw: raw, ipKey };
      }
    }
  } catch {
    // Fallback if offline or blocked
  }

  return { ipRaw: 'unknown', ipKey: 'unknown_ip' };
}

export async function saveUserPrivateIp(uid: string, ipKey: string, ipRaw: string): Promise<void> {
  const path = `user_ips/${uid}`;
  try {
    await setDoc(doc(db, 'user_ips', uid), {
      uid,
      ipKey: ipKey.slice(0, 64),
      ipRaw: ipRaw.slice(0, 64),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function checkIfBanned(
  ipKey: string,
  uid?: string
): Promise<{ banned: boolean; reason?: string }> {
  try {
    if (ipKey) {
      const ipSnap = await getDoc(doc(db, 'banned_ips', ipKey));
      if (ipSnap.exists()) {
        return {
          banned: true,
          reason: String(ipSnap.data().reason || 'IP adresin oyunun yapımcısı tarafından yasaklandı.'),
        };
      }
    }
    if (uid) {
      const uidSnap = await getDoc(doc(db, 'banned_uids', uid));
      if (uidSnap.exists()) {
        return {
          banned: true,
          reason: String(uidSnap.data().reason || 'Hesabın oyunun yapımcısı tarafından yasaklandı.'),
        };
      }
    }
  } catch {
    // Allow access on transient check error rather than false banning
  }
  return { banned: false };
}

export interface CloudUserProgress {
  peanutBank: number;
  bodyType: BodyType;
  unlockedIds: string[];
  equipped: EquippedCosmetics;
  upgrades: UpgradesState;
  dailyQuestsDate?: string;
  dailyQuestsProgress?: Record<string, number>;
  dailyQuestsClaimed?: string[];
  preferredDifficulty?: Difficulty;
  preferredGameMode?: GameMode;
  unlockedLevel?: number;
  completedLevels?: number;
  bestLevelScore?: number;
  bestEasy?: number;
  bestClassic?: number;
  bestTurbo?: number;
  unlockedNameColors?: string[];
  equippedNameColor?: string;
  leveledBodyType?: BodyType;
  leveledEquipped?: EquippedCosmetics;
  leveledEquippedNameColor?: string;
  unlockedAchievements?: string[];
  bestLeveledCleanFlightSec?: number;
  crateInventory?: CrateInventoryState;
  savedCharacters?: SavedCharacterPreset[];
  updatedAtMs?: number;
}

export async function fetchCloudUserProgress(uid: string): Promise<CloudUserProgress | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const rawProgress: Record<string, number> = {};
    if (data.dailyQuestsProgress && typeof data.dailyQuestsProgress === 'object') {
      Object.entries(data.dailyQuestsProgress as Record<string, unknown>)
        .slice(0, 10)
        .forEach(([k, v]) => {
          rawProgress[k.slice(0, 40)] = Math.max(0, Math.floor(Number(v) || 0));
        });
    }
    const updatedAtMs =
      data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : undefined;
    return {
      peanutBank: Number(data.peanutBank) || 0,
      bodyType:
        data.bodyType === 'slim' || data.bodyType === 'chubby' ? data.bodyType : 'normal',
      unlockedIds: Array.isArray(data.unlockedIds) ? data.unlockedIds : [],
      equipped: {
        hat: data.equippedHat || 'hat_none',
        glasses: data.equippedGlasses || 'glasses_none',
        skin: data.equippedSkin || 'skin_classic',
        trail: data.equippedTrail || 'trail_none',
        suit: data.equippedSuit || 'suit_none',
      },
      upgrades: {
        magnetLevel: Number(data.magnetLevel) || 0,
        doublePeanutLevel: Number(data.doublePeanutLevel) || 0,
        shieldCount: Number(data.shieldCount) || 0,
      },
      dailyQuestsDate:
        typeof data.dailyQuestsDate === 'string' ? data.dailyQuestsDate.slice(0, 12) : undefined,
      dailyQuestsProgress: rawProgress,
      dailyQuestsClaimed: Array.isArray(data.dailyQuestsClaimed)
        ? data.dailyQuestsClaimed.slice(0, 3).map((x) => String(x).slice(0, 40))
        : [],
      preferredDifficulty:
        data.preferredDifficulty === 'easy' || data.preferredDifficulty === 'turbo'
          ? data.preferredDifficulty
          : 'classic',
      preferredGameMode: data.preferredGameMode === 'leveled' ? 'leveled' : 'classic',
      unlockedLevel: Math.max(1, Math.min(9999, Math.floor(Number(data.unlockedLevel) || 1))),
      completedLevels: Math.max(0, Math.min(9999, Math.floor(Number(data.completedLevels) || 0))),
      bestLevelScore: Math.max(0, Math.min(999999, Math.floor(Number(data.bestLevelScore) || 0))),
      bestEasy: Math.max(0, Math.min(999999, Math.floor(Number(data.bestEasy) || 0))),
      bestClassic: Math.max(0, Math.min(999999, Math.floor(Number(data.bestClassic) || 0))),
      bestTurbo: Math.max(0, Math.min(999999, Math.floor(Number(data.bestTurbo) || 0))),
      unlockedNameColors: Array.isArray(data.unlockedNameColors)
        ? data.unlockedNameColors.slice(0, 60).map((x) => String(x).slice(0, 40))
        : ['name_default'],
      equippedNameColor:
        typeof data.equippedNameColor === 'string'
          ? data.equippedNameColor.slice(0, 40)
          : 'name_default',
      leveledBodyType:
        data.leveledBodyType === 'slim' || data.leveledBodyType === 'chubby'
          ? data.leveledBodyType
          : data.bodyType === 'slim' || data.bodyType === 'chubby'
            ? data.bodyType
            : 'normal',
      leveledEquipped: {
        hat: String(data.leveledEquippedHat || data.equippedHat || 'hat_none').slice(0, 40),
        glasses: String(data.leveledEquippedGlasses || data.equippedGlasses || 'glasses_none').slice(0, 40),
        skin: String(data.leveledEquippedSkin || data.equippedSkin || 'skin_classic').slice(0, 40),
        trail: String(data.leveledEquippedTrail || data.equippedTrail || 'trail_none').slice(0, 40),
        suit: String(data.leveledEquippedSuit || 'suit_none').slice(0, 40),
      },
      leveledEquippedNameColor:
        typeof data.leveledEquippedNameColor === 'string'
          ? data.leveledEquippedNameColor.slice(0, 40)
          : typeof data.equippedNameColor === 'string'
            ? data.equippedNameColor.slice(0, 40)
            : 'name_default',
      unlockedAchievements: Array.isArray(data.unlockedAchievements)
        ? data.unlockedAchievements.slice(0, 60).map((x) => String(x).slice(0, 40))
        : [],
      bestLeveledCleanFlightSec: Math.max(
        0,
        Math.min(999999, Math.floor(Number(data.bestLeveledCleanFlightSec) || 0))
      ),
      crateInventory: {
        standard: Math.max(0, Math.min(9999, Math.floor(Number(data.crateInventory?.standard) || 0))),
        epic: Math.max(0, Math.min(9999, Math.floor(Number(data.crateInventory?.epic) || 0))),
        mythic: Math.max(0, Math.min(9999, Math.floor(Number(data.crateInventory?.mythic) || 0))),
        outfit: Math.max(0, Math.min(9999, Math.floor(Number(data.crateInventory?.outfit) || 0))),
        leveled_outfit: Math.max(
          0,
          Math.min(9999, Math.floor(Number(data.crateInventory?.leveled_outfit) || 0))
        ),
      },
      savedCharacters: Array.isArray(data.savedCharacters)
        ? (data.savedCharacters as unknown[]).slice(0, 12).map((raw, idx) => {
            const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
            const eq = (r.equipped && typeof r.equipped === 'object' ? r.equipped : {}) as Record<string, unknown>;
            return {
              id: String(r.id || `preset_${idx}`).slice(0, 48),
              name: String(r.name || `Kombin #${idx + 1}`).slice(0, 24),
              bodyType: r.bodyType === 'slim' || r.bodyType === 'chubby' ? r.bodyType : 'normal',
              equipped: {
                hat: String(eq.hat || 'hat_none').slice(0, 40),
                glasses: String(eq.glasses || 'glasses_none').slice(0, 40),
                skin: String(eq.skin || 'skin_classic').slice(0, 40),
                trail: String(eq.trail || 'trail_none').slice(0, 40),
                suit: String(eq.suit || 'suit_none').slice(0, 40),
              },
              nameColorId: String(r.nameColorId || 'name_default').slice(0, 40),
              savedAtMs: Math.max(0, Math.floor(Number(r.savedAtMs) || Date.now())),
            };
          })
        : [],
      updatedAtMs,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveCloudUserProgress(
  uid: string,
  progress: CloudUserProgress
): Promise<void> {
  const path = `users/${uid}`;
  const trimmedIds = progress.unlockedIds.slice(0, 200);
  const safeProgress: Record<string, number> = {};
  if (progress.dailyQuestsProgress) {
    Object.entries(progress.dailyQuestsProgress)
      .slice(0, 10)
      .forEach(([k, v]) => {
        safeProgress[k.slice(0, 40)] = Math.max(0, Math.min(99999, Math.floor(Number(v) || 0)));
      });
  }
  const safeClaimed = (progress.dailyQuestsClaimed || [])
    .slice(0, 3)
    .map((id) => String(id).slice(0, 40));
  const safeNameColors = Array.from(
    new Set([
      'name_default',
      ...(progress.unlockedNameColors || []).map((id) => String(id).slice(0, 40)),
    ])
  ).slice(0, 60);
  const safeEquippedNameColor = (progress.equippedNameColor || 'name_default').slice(0, 40);
  const safeLeveledEquipped = progress.leveledEquipped || progress.equipped;
  const safeLeveledNameColor = (
    progress.leveledEquippedNameColor ||
    safeEquippedNameColor ||
    'name_default'
  ).slice(0, 40);
  const safeUnlockedAchievements = Array.from(
    new Set((progress.unlockedAchievements || []).map((id) => String(id).slice(0, 40)))
  ).slice(0, 60);

  const safeNum = (val: unknown, min: number, max: number) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
  };

  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      peanutBank: safeNum(progress.peanutBank, 0, 9999999),
      bodyType:
        progress.bodyType === 'slim' || progress.bodyType === 'chubby' ? progress.bodyType : 'normal',
      unlockedIds: trimmedIds.length > 0 ? trimmedIds : ['hat_none'],
      equippedHat: String(progress.equipped?.hat || 'hat_none').slice(0, 40),
      equippedGlasses: String(progress.equipped?.glasses || 'glasses_none').slice(0, 40),
      equippedSkin: String(progress.equipped?.skin || 'skin_classic').slice(0, 40),
      equippedTrail: String(progress.equipped?.trail || 'trail_none').slice(0, 40),
      equippedSuit: String(progress.equipped?.suit || 'suit_none').slice(0, 40),
      magnetLevel: safeNum(progress.upgrades?.magnetLevel, 0, 5),
      doublePeanutLevel: safeNum(progress.upgrades?.doublePeanutLevel, 0, 5),
      shieldCount: safeNum(progress.upgrades?.shieldCount, 0, 99),
      ...(progress.dailyQuestsDate
        ? { dailyQuestsDate: progress.dailyQuestsDate.slice(0, 12) }
        : {}),
      dailyQuestsProgress: safeProgress,
      dailyQuestsClaimed: safeClaimed,
      ...(progress.preferredDifficulty
        ? { preferredDifficulty: progress.preferredDifficulty }
        : {}),
      ...(progress.preferredGameMode
        ? { preferredGameMode: progress.preferredGameMode }
        : {}),
      unlockedLevel: safeNum(progress.unlockedLevel ?? 1, 1, 9999),
      completedLevels: safeNum(progress.completedLevels ?? 0, 0, 9999),
      bestLevelScore: safeNum(progress.bestLevelScore ?? 0, 0, 999999),
      bestEasy: safeNum(progress.bestEasy ?? 0, 0, 999999),
      bestClassic: safeNum(progress.bestClassic ?? 0, 0, 999999),
      bestTurbo: safeNum(progress.bestTurbo ?? 0, 0, 999999),
      unlockedNameColors: safeNameColors,
      equippedNameColor: safeEquippedNameColor,
      leveledBodyType:
        progress.leveledBodyType === 'slim' || progress.leveledBodyType === 'chubby'
          ? progress.leveledBodyType
          : progress.bodyType === 'slim' || progress.bodyType === 'chubby'
            ? progress.bodyType
            : 'normal',
      leveledEquippedHat: String(safeLeveledEquipped.hat || 'hat_none').slice(0, 40),
      leveledEquippedGlasses: String(safeLeveledEquipped.glasses || 'glasses_none').slice(0, 40),
      leveledEquippedSkin: String(safeLeveledEquipped.skin || 'skin_classic').slice(0, 40),
      leveledEquippedTrail: String(safeLeveledEquipped.trail || 'trail_none').slice(0, 40),
      leveledEquippedSuit: String(safeLeveledEquipped.suit || 'suit_none').slice(0, 40),
      leveledEquippedNameColor: safeLeveledNameColor,
      unlockedAchievements: safeUnlockedAchievements,
      bestLeveledCleanFlightSec: safeNum(progress.bestLeveledCleanFlightSec ?? 0, 0, 999999),
      crateInventory: {
        standard: safeNum(progress.crateInventory?.standard, 0, 9999),
        epic: safeNum(progress.crateInventory?.epic, 0, 9999),
        mythic: safeNum(progress.crateInventory?.mythic, 0, 9999),
        outfit: safeNum(progress.crateInventory?.outfit, 0, 9999),
        leveled_outfit: safeNum(progress.crateInventory?.leveled_outfit, 0, 9999),
      },
      ...(Array.isArray(progress.savedCharacters)
        ? {
            savedCharacters: progress.savedCharacters.slice(0, 12).map((p) => ({
              id: String(p.id).slice(0, 48),
              name: String(p.name).slice(0, 24),
              bodyType: p.bodyType === 'slim' || p.bodyType === 'chubby' ? p.bodyType : 'normal',
              equipped: {
                hat: String(p.equipped.hat || 'hat_none').slice(0, 40),
                glasses: String(p.equipped.glasses || 'glasses_none').slice(0, 40),
                skin: String(p.equipped.skin || 'skin_classic').slice(0, 40),
                trail: String(p.equipped.trail || 'trail_none').slice(0, 40),
                suit: String(p.equipped.suit || 'suit_none').slice(0, 40),
              },
              nameColorId: String(p.nameColorId || 'name_default').slice(0, 40),
              savedAtMs: safeNum(p.savedAtMs || Date.now(), 0, 9999999999999),
            })),
          }
        : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchSelfLeaderboardEntry(uid: string): Promise<LeaderboardEntry | null> {
  const path = `leaderboard/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'leaderboard', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const lastChange =
      data.lastNameChangeAt instanceof Timestamp ? data.lastNameChangeAt.toMillis() : undefined;
    return {
      uid: String(data.uid || snap.id),
      displayName: String(data.displayName || 'Uçan Fil'),
      bestScore: Number(data.bestScore) || 0,
      difficulty:
        data.difficulty === 'easy' || data.difficulty === 'turbo' ? data.difficulty : 'classic',
      bodyType:
        data.bodyType === 'slim' || data.bodyType === 'chubby' ? data.bodyType : 'normal',
      skinId: typeof data.skinId === 'string' ? data.skinId : undefined,
      hatId: typeof data.hatId === 'string' ? data.hatId : undefined,
      glassesId: typeof data.glassesId === 'string' ? data.glassesId : undefined,
      suitId: typeof data.suitId === 'string' ? data.suitId : undefined,
      nameColorId: typeof data.nameColorId === 'string' ? data.nameColorId : undefined,
      isCreator: Boolean(data.isCreator),
      hasCustomName: Boolean(data.hasCustomName),
      lastNameChangeMs: lastChange,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function submitLeaderboardScore(params: {
  user: GameUser;
  score: number;
  difficulty: Difficulty;
  bodyType: BodyType;
  equipped: EquippedCosmetics;
  nameColorId?: string;
  customDisplayName?: string;
  forceWrite?: boolean;
  syncOutfitOnly?: boolean;
}): Promise<{
  renamed: boolean;
  displayName: string;
  hasCustomName: boolean;
  lastNameChangeMs?: number;
}> {
  const {
    user,
    score,
    difficulty,
    bodyType,
    equipped,
    nameColorId,
    customDisplayName,
    forceWrite,
    syncOutfitOnly,
  } = params;
  const safeNameColorId = (nameColorId || 'name_default').slice(0, 40);
  if (user.isGuest) {
    return { renamed: false, displayName: user.displayName, hasCustomName: false };
  }

  const path = `leaderboard/${user.uid}`;
  const creatorFlag = isUserCreator(user);
  const candidateName = (customDisplayName || user.displayName || (creatorFlag ? CREATOR_DEFAULT_DISPLAY_NAME : 'Uçan Fil')).trim();

  if (customDisplayName !== undefined) {
    const check = validateDisplayName(candidateName, { allowReservedCreatorNames: creatorFlag });
    if (!check.valid) {
      throw new Error(check.reason || 'Uygunsuz isim');
    }
  }

  const safeCandidateName = sanitizeFallbackName(candidateName, {
    allowReservedCreatorNames: creatorFlag,
  });

  try {
    const ref = doc(db, 'leaderboard', user.uid);
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;
    const prevBest = existingData ? Number(existingData.bestScore) || 0 : -1;

    if (existingSnap.exists() && existingData) {
      const existingName = String(existingData.displayName || safeCandidateName);
      const hadCustomName = Boolean(existingData.hasCustomName);
      const hasValidTs = existingData.lastNameChangeAt instanceof Timestamp;
      const existingChangeMs = hasValidTs
        ? (existingData.lastNameChangeAt as Timestamp).toMillis()
        : undefined;

      if (customDisplayName !== undefined) {
        if (safeCandidateName === existingName) {
          return {
            renamed: false,
            displayName: existingName,
            hasCustomName: hadCustomName,
            lastNameChangeMs: existingChangeMs,
          };
        }

        if (hadCustomName && existingChangeMs !== undefined) {
          const elapsed = Date.now() - existingChangeMs;
          if (elapsed < WEEKLY_RENAME_MS) {
            const remainingMs = WEEKLY_RENAME_MS - elapsed;
            const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const hours = Math.ceil((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            throw new Error(
              `İsmini haftada sadece 1 kez değiştirebilirsin. Kalan süre: ${days} gün ${hours} saat.`
            );
          }
        }

        const nextBest = Math.max(prevBest, score, 0);
        await setDoc(ref, {
          uid: user.uid,
          displayName: safeCandidateName,
          bestScore: Math.min(999999, Math.floor(nextBest)),
          difficulty,
          bodyType,
          skinId: equipped.skin.slice(0, 40),
          hatId: equipped.hat.slice(0, 40),
          glassesId: equipped.glasses.slice(0, 40),
          suitId: (equipped.suit || 'suit_none').slice(0, 40),
          nameColorId: safeNameColorId,
          isCreator: creatorFlag,
          hasCustomName: true,
          lastNameChangeAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Also update account's displayName, leveled leaderboard, & session
        if (user.accountId) {
          updateDoc(doc(db, 'accounts', user.accountId), {
            displayName: safeCandidateName,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
          persistSession({ ...user, displayName: safeCandidateName });
        }
        updateDoc(doc(db, 'leveled_leaderboard', user.uid), {
          displayName: safeCandidateName,
          hasCustomName: true,
          lastNameChangeAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});

        return {
          renamed: true,
          displayName: safeCandidateName,
          hasCustomName: true,
          lastNameChangeMs: Date.now(),
        };
      }

      if (score > prevBest || forceWrite || syncOutfitOnly || !hasValidTs) {
        const nextBest =
          forceWrite && !syncOutfitOnly ? Math.max(score, 0) : Math.max(prevBest, score, 0);
        await setDoc(ref, {
          uid: user.uid,
          displayName: existingName,
          bestScore: Math.min(999999, Math.floor(nextBest)),
          difficulty,
          bodyType,
          skinId: equipped.skin.slice(0, 40),
          hatId: equipped.hat.slice(0, 40),
          glassesId: equipped.glasses.slice(0, 40),
          suitId: (equipped.suit || 'suit_none').slice(0, 40),
          nameColorId: safeNameColorId,
          isCreator: creatorFlag,
          hasCustomName: hadCustomName,
          lastNameChangeAt: hasValidTs ? existingData.lastNameChangeAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return {
        renamed: false,
        displayName: existingName,
        hasCustomName: hadCustomName,
        lastNameChangeMs: existingChangeMs,
      };
    }

    // First-time document creation
    const isManualRename = customDisplayName !== undefined;
    await setDoc(ref, {
      uid: user.uid,
      displayName: safeCandidateName,
      bestScore: Math.min(999999, Math.max(0, Math.floor(score))),
      difficulty,
      bodyType,
      skinId: equipped.skin.slice(0, 40),
      hatId: equipped.hat.slice(0, 40),
      glassesId: equipped.glasses.slice(0, 40),
      nameColorId: safeNameColorId,
      isCreator: creatorFlag,
      hasCustomName: isManualRename,
      lastNameChangeAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      renamed: isManualRename,
      displayName: safeCandidateName,
      hasCustomName: isManualRename,
      lastNameChangeMs: Date.now(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('haftada')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
    return { renamed: false, displayName: safeCandidateName, hasCustomName: false };
  }
}

export async function deleteLeaderboardEntry(targetUid: string): Promise<void> {
  const path = `leaderboard/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'leaderboard', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function banPlayerByUidAndIp(params: {
  targetUid: string;
  displayName: string;
  reason: string;
}): Promise<{ ipBanned: boolean; ipRaw?: string }> {
  const { targetUid, displayName, reason } = params;
  const safeReason = (reason.trim() || 'Kurallara aykırı davranış').slice(0, 120);
  const safeName = (displayName.trim() || 'Oyuncu').slice(0, 40);

  try {
    await setDoc(doc(db, 'banned_uids', targetUid), {
      uid: targetUid,
      displayName: safeName,
      reason: safeReason,
      bannedAt: serverTimestamp(),
    });

    let ipBanned = false;
    let ipRawFound: string | undefined;
    try {
      const ipDoc = await getDoc(doc(db, 'user_ips', targetUid));
      if (ipDoc.exists()) {
        const ipData = ipDoc.data();
        const ipKey = String(ipData.ipKey || '');
        const ipRaw = String(ipData.ipRaw || '');
        if (ipKey && ipRaw) {
          await setDoc(doc(db, 'banned_ips', ipKey), {
            ipKey,
            ipRaw,
            reason: safeReason,
            bannedDisplayName: safeName,
            bannedAt: serverTimestamp(),
          });
          ipBanned = true;
          ipRawFound = ipRaw;
        }
      }
    } catch {
      // Ignore if user_ips missing
    }

    await deleteDoc(doc(db, 'leaderboard', targetUid)).catch(() => {});
    await deleteDoc(doc(db, 'leveled_leaderboard', targetUid)).catch(() => {});
    return { ipBanned, ipRaw: ipRawFound };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `banned_uids/${targetUid}`);
    return { ipBanned: false };
  }
}

export async function banIpManually(ipRaw: string, reason: string): Promise<void> {
  const cleanIp = ipRaw.trim().slice(0, 64);
  const ipKey = cleanIp.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 64);
  if (!cleanIp || !ipKey) return;
  const path = `banned_ips/${ipKey}`;
  try {
    await setDoc(doc(db, 'banned_ips', ipKey), {
      ipKey,
      ipRaw: cleanIp,
      reason: (reason.trim() || 'IP Yasaklandı').slice(0, 120),
      bannedDisplayName: 'Manuel IP Ban',
      bannedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function unbanIp(ipKey: string): Promise<void> {
  const path = `banned_ips/${ipKey}`;
  try {
    await deleteDoc(doc(db, 'banned_ips', ipKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function unbanUid(uid: string): Promise<void> {
  const path = `banned_uids/${uid}`;
  try {
    await deleteDoc(doc(db, 'banned_uids', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeBannedLists(
  onIps: (ips: BannedIpRecord[]) => void,
  onUids: (uids: BannedUidRecord[]) => void
) {
  const unsubIps = onSnapshot(
    collection(db, 'banned_ips'),
    (snap) => {
      onIps(
        snap.docs.map((d) => ({
          ipKey: String(d.data().ipKey || d.id),
          ipRaw: String(d.data().ipRaw || d.id),
          reason: String(d.data().reason || 'Yasaklı'),
          bannedDisplayName: d.data().bannedDisplayName
            ? String(d.data().bannedDisplayName)
            : undefined,
        }))
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'banned_ips');
      } catch {
        // Ignore if unauthorized
      }
    }
  );

  const unsubUids = onSnapshot(
    collection(db, 'banned_uids'),
    (snap) => {
      onUids(
        snap.docs.map((d) => ({
          uid: String(d.data().uid || d.id),
          displayName: d.data().displayName ? String(d.data().displayName) : undefined,
          reason: String(d.data().reason || 'Yasaklı'),
        }))
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'banned_uids');
      } catch {
        // Ignore if unauthorized
      }
    }
  );

  return () => {
    unsubIps();
    unsubUids();
  };
}

export function deduplicateLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const creatorCandidates = entries.filter(
    (e) => e.uid === CREATOR_UID || e.isCreator || isReservedCreatorName(e.displayName)
  );
  const nonCreators: LeaderboardEntry[] = [];
  const seenUids = new Set<string>();

  for (const entry of entries) {
    if (entry.uid === CREATOR_UID || entry.isCreator || isReservedCreatorName(entry.displayName)) {
      continue;
    }
    if (seenUids.has(entry.uid)) continue;
    seenUids.add(entry.uid);
    nonCreators.push(entry);
  }

  if (creatorCandidates.length === 0) {
    return nonCreators.sort((a, b) => b.bestScore - a.bestScore);
  }

  // Prefer the canonical acct_kyrmaniacraft doc; collapse duplicate creator docs (e.g. old Google Auth UID) into one row
  const canonical =
    creatorCandidates.find((e) => e.uid === CREATOR_UID) ||
    creatorCandidates.find((e) => e.isCreator) ||
    creatorCandidates[0];
  const highestCreatorScore = creatorCandidates.reduce(
    (max, e) => (e.isCreator || e.uid === CREATOR_UID ? Math.max(max, e.bestScore) : max),
    canonical.bestScore
  );

  const collapsedCreator: LeaderboardEntry = {
    ...canonical,
    bestScore: highestCreatorScore,
    isCreator: true,
  };

  return [collapsedCreator, ...nonCreators].sort((a, b) => b.bestScore - a.bestScore);
}

export async function cleanupDuplicateCreatorLeaderboardEntries(
  user: GameUser
): Promise<{ removedCount: number; highestMergedScore: number }> {
  if (!isUserCreator(user)) {
    return { removedCount: 0, highestMergedScore: 0 };
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'leaderboard'), orderBy('bestScore', 'desc'), limit(50))
    );
    const docsList = snap.docs.map((d) => ({
      id: d.id,
      uid: String(d.data().uid || d.id),
      displayName: String(d.data().displayName || ''),
      bestScore: Number(d.data().bestScore) || 0,
      isCreator: Boolean(d.data().isCreator),
    }));

    const duplicates = docsList.filter(
      (d) => d.id !== CREATOR_UID && (d.isCreator || isReservedCreatorName(d.displayName))
    );
    if (duplicates.length === 0) {
      return { removedCount: 0, highestMergedScore: 0 };
    }

    const canonicalDoc = docsList.find((d) => d.id === CREATOR_UID);
    const highestDupCreatorScore = duplicates.reduce(
      (max, d) => (d.isCreator ? Math.max(max, d.bestScore) : max),
      canonicalDoc?.bestScore ?? 0
    );

    if (canonicalDoc && highestDupCreatorScore > canonicalDoc.bestScore) {
      await updateDoc(doc(db, 'leaderboard', CREATOR_UID), {
        bestScore: Math.min(999999, Math.floor(highestDupCreatorScore)),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }

    await Promise.all(
      duplicates.map((dup) => deleteDoc(doc(db, 'leaderboard', dup.id)).catch(() => {}))
    );

    return {
      removedCount: duplicates.length,
      highestMergedScore: highestDupCreatorScore,
    };
  } catch {
    return { removedCount: 0, highestMergedScore: 0 };
  }
}

export function subscribeLeaderboard(
  onData: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'leaderboard';
  const q = query(collection(db, path), orderBy('bestScore', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const lastChange =
          data.lastNameChangeAt instanceof Timestamp
            ? data.lastNameChangeAt.toMillis()
            : undefined;
        return {
          uid: String(data.uid || d.id),
          displayName: String(data.displayName || 'Oyuncu'),
          bestScore: Number(data.bestScore) || 0,
          difficulty:
            data.difficulty === 'easy' || data.difficulty === 'turbo' ? data.difficulty : 'classic',
          bodyType:
            data.bodyType === 'slim' || data.bodyType === 'chubby' ? data.bodyType : 'normal',
          skinId: typeof data.skinId === 'string' ? data.skinId : undefined,
          hatId: typeof data.hatId === 'string' ? data.hatId : undefined,
          glassesId: typeof data.glassesId === 'string' ? data.glassesId : undefined,
          suitId: typeof data.suitId === 'string' ? data.suitId : undefined,
          nameColorId: typeof data.nameColorId === 'string' ? data.nameColorId : undefined,
          isCreator: Boolean(data.isCreator),
          hasCustomName: Boolean(data.hasCustomName),
          lastNameChangeMs: lastChange,
          updatedAt: data.updatedAt,
        };
      });
      onData(deduplicateLeaderboardEntries(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function fetchSelfLeveledLeaderboardEntry(
  uid: string
): Promise<LeveledLeaderboardEntry | null> {
  const path = `leveled_leaderboard/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'leveled_leaderboard', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const lastChange =
      data.lastNameChangeAt instanceof Timestamp ? data.lastNameChangeAt.toMillis() : undefined;
    return {
      uid: String(data.uid || snap.id),
      displayName: String(data.displayName || 'Uçan Fil'),
      maxLevel: Math.max(1, Number(data.maxLevel) || 1),
      bestLevelScore: Math.max(0, Number(data.bestLevelScore) || 0),
      completedLevels: Math.max(0, Number(data.completedLevels) || 0),
      difficulty:
        data.difficulty === 'easy' || data.difficulty === 'turbo' ? data.difficulty : 'classic',
      bodyType:
        data.bodyType === 'slim' || data.bodyType === 'chubby' ? data.bodyType : 'normal',
      skinId: typeof data.skinId === 'string' ? data.skinId : undefined,
      hatId: typeof data.hatId === 'string' ? data.hatId : undefined,
      glassesId: typeof data.glassesId === 'string' ? data.glassesId : undefined,
      suitId: typeof data.suitId === 'string' ? data.suitId : undefined,
      nameColorId: typeof data.nameColorId === 'string' ? data.nameColorId : undefined,
      isCreator: Boolean(data.isCreator),
      hasCustomName: Boolean(data.hasCustomName),
      lastNameChangeMs: lastChange,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function submitLeveledLeaderboardScore(params: {
  user: GameUser;
  maxLevel: number;
  bestLevelScore: number;
  completedLevels: number;
  difficulty: Difficulty;
  bodyType: BodyType;
  equipped: EquippedCosmetics;
  nameColorId?: string;
  customDisplayName?: string;
  forceWrite?: boolean;
  syncOutfitOnly?: boolean;
}): Promise<void> {
  const {
    user,
    maxLevel,
    bestLevelScore,
    completedLevels,
    difficulty,
    bodyType,
    equipped,
    nameColorId,
    customDisplayName,
    forceWrite,
    syncOutfitOnly,
  } = params;
  if (user.isGuest) return;

  const path = `leveled_leaderboard/${user.uid}`;
  const creatorFlag = isUserCreator(user);
  const safeNameColorId = (nameColorId || 'name_default').slice(0, 40);
  const candidateName = (
    customDisplayName ||
    user.displayName ||
    (creatorFlag ? CREATOR_DEFAULT_DISPLAY_NAME : 'Uçan Fil')
  ).trim();
  const safeCandidateName = sanitizeFallbackName(candidateName, {
    allowReservedCreatorNames: creatorFlag,
  });

  const safeLevel = Math.max(1, Math.min(9999, Math.floor(maxLevel)));
  const safeBestScore = Math.max(0, Math.min(999999, Math.floor(bestLevelScore)));
  const safeCompleted = Math.max(0, Math.min(9999, Math.floor(completedLevels)));

  try {
    const ref = doc(db, 'leveled_leaderboard', user.uid);
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    if (existingSnap.exists() && existingData) {
      const existingName = String(existingData.displayName || safeCandidateName);
      const hadCustomName = Boolean(existingData.hasCustomName);
      const hasValidTs = existingData.lastNameChangeAt instanceof Timestamp;
      const prevLevel = Math.max(1, Number(existingData.maxLevel) || 1);
      const prevScore = Math.max(0, Number(existingData.bestLevelScore) || 0);
      const prevCompleted = Math.max(0, Number(existingData.completedLevels) || 0);

      const improved =
        safeLevel > prevLevel || safeBestScore > prevScore || safeCompleted > prevCompleted;

      if (improved || forceWrite || syncOutfitOnly || !hasValidTs) {
        const nextLevel =
          forceWrite && !syncOutfitOnly ? safeLevel : Math.max(prevLevel, safeLevel);
        const nextScore =
          forceWrite && !syncOutfitOnly ? safeBestScore : Math.max(prevScore, safeBestScore);
        const nextCompleted =
          forceWrite && !syncOutfitOnly ? safeCompleted : Math.max(prevCompleted, safeCompleted);

        await setDoc(ref, {
          uid: user.uid,
          displayName: existingName,
          maxLevel: nextLevel,
          bestLevelScore: nextScore,
          completedLevels: nextCompleted,
          difficulty,
          bodyType,
          skinId: equipped.skin.slice(0, 40),
          hatId: equipped.hat.slice(0, 40),
          glassesId: equipped.glasses.slice(0, 40),
          suitId: (equipped.suit || 'suit_none').slice(0, 40),
          nameColorId: safeNameColorId,
          isCreator: creatorFlag,
          hasCustomName: hadCustomName,
          lastNameChangeAt: hasValidTs ? existingData.lastNameChangeAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return;
    }

    await setDoc(ref, {
      uid: user.uid,
      displayName: safeCandidateName,
      maxLevel: safeLevel,
      bestLevelScore: safeBestScore,
      completedLevels: safeCompleted,
      difficulty,
      bodyType,
      skinId: equipped.skin.slice(0, 40),
      hatId: equipped.hat.slice(0, 40),
      glassesId: equipped.glasses.slice(0, 40),
      suitId: (equipped.suit || 'suit_none').slice(0, 40),
      nameColorId: safeNameColorId,
      isCreator: creatorFlag,
      hasCustomName: false,
      lastNameChangeAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeveledLeaderboardEntry(targetUid: string): Promise<void> {
  const path = `leveled_leaderboard/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'leveled_leaderboard', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function deduplicateLeveledLeaderboardEntries(
  entries: LeveledLeaderboardEntry[]
): LeveledLeaderboardEntry[] {
  const sortFn = (a: LeveledLeaderboardEntry, b: LeveledLeaderboardEntry) => {
    if (b.maxLevel !== a.maxLevel) return b.maxLevel - a.maxLevel;
    if (b.completedLevels !== a.completedLevels) return b.completedLevels - a.completedLevels;
    return b.bestLevelScore - a.bestLevelScore;
  };
  const creatorCandidates = entries.filter(
    (e) => e.uid === CREATOR_UID || e.isCreator || isReservedCreatorName(e.displayName)
  );
  const nonCreators: LeveledLeaderboardEntry[] = [];
  const seenUids = new Set<string>();

  for (const entry of entries) {
    if (entry.uid === CREATOR_UID || entry.isCreator || isReservedCreatorName(entry.displayName)) {
      continue;
    }
    if (seenUids.has(entry.uid)) continue;
    seenUids.add(entry.uid);
    nonCreators.push(entry);
  }

  if (creatorCandidates.length === 0) {
    return nonCreators.sort(sortFn);
  }

  const canonical =
    creatorCandidates.find((e) => e.uid === CREATOR_UID) ||
    creatorCandidates.find((e) => e.isCreator) ||
    creatorCandidates[0];
  const highestLevel = creatorCandidates.reduce(
    (max, e) => (e.isCreator || e.uid === CREATOR_UID ? Math.max(max, e.maxLevel) : max),
    canonical.maxLevel
  );
  const highestScore = creatorCandidates.reduce(
    (max, e) => (e.isCreator || e.uid === CREATOR_UID ? Math.max(max, e.bestLevelScore) : max),
    canonical.bestLevelScore
  );

  const collapsedCreator: LeveledLeaderboardEntry = {
    ...canonical,
    maxLevel: highestLevel,
    bestLevelScore: highestScore,
    isCreator: true,
  };

  return [collapsedCreator, ...nonCreators].sort(sortFn);
}

export function subscribeLeveledLeaderboard(
  onData: (entries: LeveledLeaderboardEntry[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'leveled_leaderboard';
  const q = query(collection(db, path), orderBy('maxLevel', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: LeveledLeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const lastChange =
          data.lastNameChangeAt instanceof Timestamp
            ? data.lastNameChangeAt.toMillis()
            : undefined;
        return {
          uid: String(data.uid || d.id),
          displayName: String(data.displayName || 'Oyuncu'),
          maxLevel: Math.max(1, Number(data.maxLevel) || 1),
          bestLevelScore: Math.max(0, Number(data.bestLevelScore) || 0),
          completedLevels: Math.max(0, Number(data.completedLevels) || 0),
          difficulty:
            data.difficulty === 'easy' || data.difficulty === 'turbo' ? data.difficulty : 'classic',
          bodyType:
            data.bodyType === 'slim' || data.bodyType === 'chubby' ? data.bodyType : 'normal',
          skinId: typeof data.skinId === 'string' ? data.skinId : undefined,
          hatId: typeof data.hatId === 'string' ? data.hatId : undefined,
          glassesId: typeof data.glassesId === 'string' ? data.glassesId : undefined,
          suitId: typeof data.suitId === 'string' ? data.suitId : undefined,
          nameColorId: typeof data.nameColorId === 'string' ? data.nameColorId : undefined,
          isCreator: Boolean(data.isCreator),
          hasCustomName: Boolean(data.hasCustomName),
          lastNameChangeMs: lastChange,
          updatedAt: data.updatedAt,
        };
      });
      onData(deduplicateLeveledLeaderboardEntries(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

