import fs from 'node:fs';
import path from 'node:path';
import type {
  BlocklistEntry,
  GlobalHotspot,
  OwnerConfig,
  PhoneNotificationEvent,
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'owner-config.json');
const PHONE_REGISTRY_FILE = path.join(DATA_DIR, 'phone-registry.json');

export const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'kkhushbu8518@gmail.com').trim().toLowerCase();

interface PhoneRegistryRecord {
  suspiciousCallsTillDate: number;
  communityReports: number;
  lastCheckedAt: string;
}

interface PhoneRegistryState {
  numbers: Record<string, PhoneRegistryRecord>;
  connectedNumbers: Record<string, { countryCode: string; countryName: string; connectedAt: string }>;
  notifications: PhoneNotificationEvent[];
}

function readFirebaseApiKey(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return typeof parsed.apiKey === 'string' ? parsed.apiKey : '';
    }
  } catch {
    // ignore
  }
  return '';
}

const DEFAULT_CONFIG: OwnerConfig = {
  ownerEmail: OWNER_EMAIL,
  suspiciousThreshold: 30,
  highRiskThreshold: 65,
  strictPaymentBlock: true,
  modules: {
    smsScanner: true,
    urlScanner: true,
    gmailScanner: true,
    phoneLookup: true,
    paymentGuard: true,
    threatMap: true,
    voiceAssistant: true,
  },
  blocklist: [
    {
      id: 'blk-1',
      type: 'domain',
      value: 'paypa1-security-verify.com',
      reason: 'Known credential harvesting lookalike domain',
      addedAt: '2026-11-20T10:00:00.000Z',
    },
    {
      id: 'blk-2',
      type: 'account',
      value: 'kyc-refund-desk@okaxis',
      reason: 'Flagged UPI collect-request fraud handle',
      addedAt: '2026-11-21T14:30:00.000Z',
    },
    {
      id: 'blk-3',
      type: 'phone',
      value: '+18005550199',
      reason: 'Repeated fake IRS/tax enforcement robocalls',
      addedAt: '2026-11-22T09:15:00.000Z',
    },
  ],
  customSafetyTips: [
    'Never share a 6-digit OTP or UPI PIN to "receive" money — PINs are only required to send funds.',
    'Check domain spelling character-by-character before entering banking or email passwords.',
    'Hang up on urgent callers claiming to be police, customs, or tax officers and call the official helpline directly.',
  ],
  customHotspots: [],
  updatedAt: new Date().toISOString(),
};

const DEFAULT_PHONE_STATE: PhoneRegistryState = {
  numbers: {
    '+18005550199': { suspiciousCallsTillDate: 412, communityReports: 187, lastCheckedAt: '2026-11-26T00:00:00.000Z' },
    '+919876543210': { suspiciousCallsTillDate: 294, communityReports: 142, lastCheckedAt: '2026-11-26T00:00:00.000Z' },
    '+442079460958': { suspiciousCallsTillDate: 89, communityReports: 36, lastCheckedAt: '2026-11-26T00:00:00.000Z' },
    '+2348012345678': { suspiciousCallsTillDate: 530, communityReports: 261, lastCheckedAt: '2026-11-26T00:00:00.000Z' },
  },
  connectedNumbers: {},
  notifications: [],
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadOwnerConfig(): OwnerConfig {
  try {
    ensureDataDir();
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<OwnerConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      ownerEmail: OWNER_EMAIL,
      modules: { ...DEFAULT_CONFIG.modules, ...(parsed.modules || {}) },
      blocklist: Array.isArray(parsed.blocklist) ? parsed.blocklist : DEFAULT_CONFIG.blocklist,
      customSafetyTips: Array.isArray(parsed.customSafetyTips) ? parsed.customSafetyTips : DEFAULT_CONFIG.customSafetyTips,
      customHotspots: Array.isArray(parsed.customHotspots) ? parsed.customHotspots : DEFAULT_CONFIG.customHotspots,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveOwnerConfig(next: OwnerConfig): OwnerConfig {
  ensureDataDir();
  const sanitized: OwnerConfig = {
    ...next,
    ownerEmail: OWNER_EMAIL,
    suspiciousThreshold: Math.min(60, Math.max(15, Number(next.suspiciousThreshold) || 30)),
    highRiskThreshold: Math.min(90, Math.max(45, Number(next.highRiskThreshold) || 65)),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
  return sanitized;
}

export function addBlocklistItem(entry: Omit<BlocklistEntry, 'id' | 'addedAt'>): OwnerConfig {
  const cfg = loadOwnerConfig();
  const item: BlocklistEntry = {
    id: `blk-${Date.now()}`,
    type: entry.type,
    value: entry.value.trim(),
    reason: entry.reason.trim() || 'Added by App Owner',
    addedAt: new Date().toISOString(),
  };
  cfg.blocklist = [item, ...cfg.blocklist];
  return saveOwnerConfig(cfg);
}

export function removeBlocklistItem(id: string): OwnerConfig {
  const cfg = loadOwnerConfig();
  cfg.blocklist = cfg.blocklist.filter((b) => b.id !== id);
  return saveOwnerConfig(cfg);
}

export function addCustomHotspot(hotspot: Omit<GlobalHotspot, 'id'>): OwnerConfig {
  const cfg = loadOwnerConfig();
  const next: GlobalHotspot = {
    ...hotspot,
    id: `hs-${Date.now()}`,
  };
  cfg.customHotspots = [next, ...cfg.customHotspots];
  return saveOwnerConfig(cfg);
}

export function loadPhoneRegistry(): PhoneRegistryState {
  try {
    ensureDataDir();
    if (!fs.existsSync(PHONE_REGISTRY_FILE)) {
      fs.writeFileSync(PHONE_REGISTRY_FILE, JSON.stringify(DEFAULT_PHONE_STATE, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(DEFAULT_PHONE_STATE)) as PhoneRegistryState;
    }
    const raw = fs.readFileSync(PHONE_REGISTRY_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PhoneRegistryState>;
    return {
      numbers: parsed.numbers || DEFAULT_PHONE_STATE.numbers,
      connectedNumbers: parsed.connectedNumbers || {},
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_PHONE_STATE)) as PhoneRegistryState;
  }
}

export function savePhoneRegistry(state: PhoneRegistryState): void {
  try {
    ensureDataDir();
    fs.writeFileSync(PHONE_REGISTRY_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export function registerConnectedPhone(normalizedNumber: string, countryCode: string, countryName: string): void {
  const state = loadPhoneRegistry();
  state.connectedNumbers[normalizedNumber] = {
    countryCode,
    countryName,
    connectedAt: new Date().toISOString(),
  };
  savePhoneRegistry(state);
}

export function recordPhoneNotification(event: PhoneNotificationEvent): PhoneNotificationEvent[] {
  const state = loadPhoneRegistry();
  state.notifications = [event, ...state.notifications].slice(0, 25);
  savePhoneRegistry(state);
  return state.notifications;
}

export async function verifyOwnerRequest(authHeader: string | undefined): Promise<{ ok: boolean; email?: string; reason?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, reason: 'Authentication required. Sign in as the app owner to save changes.' };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return { ok: false, reason: 'Missing authentication token.' };
  }

  const firebaseApiKey = readFirebaseApiKey();

  // First try verifying as a Firebase ID token
  if (firebaseApiKey) {
    try {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        }
      );
      if (fbRes.ok) {
        const fbData = (await fbRes.json()) as {
          users?: Array<{ email?: string; emailVerified?: boolean }>;
        };
        const user = fbData.users?.[0];
        if (user?.email && user.emailVerified !== false) {
          if (user.email.toLowerCase() === OWNER_EMAIL) {
            return { ok: true, email: user.email };
          }
          return {
            ok: false,
            email: user.email,
            reason: `Access denied. Only the app owner (${OWNER_EMAIL}) can modify configuration.`,
          };
        }
      }
    } catch {
      // Fall through to OAuth tokeninfo check
    }
  }

  // Fallback: verify as Google OAuth access token
  try {
    const gRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`
    );
    if (gRes.ok) {
      const info = (await gRes.json()) as { email?: string; email_verified?: string | boolean };
      const verified = info.email_verified === true || info.email_verified === 'true';
      if (info.email && verified) {
        if (info.email.toLowerCase() === OWNER_EMAIL) {
          return { ok: true, email: info.email };
        }
        return {
          ok: false,
          email: info.email,
          reason: `Access denied. Only the app owner (${OWNER_EMAIL}) can modify configuration.`,
        };
      }
    }
  } catch {
    // ignore
  }

  return { ok: false, reason: 'Could not verify owner credentials. Please sign in again.' };
}
