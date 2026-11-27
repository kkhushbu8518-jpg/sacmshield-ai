import type {
  AssistantMessage,
  BlocklistEntry,
  GmailEmailSummary,
  GlobalHotspot,
  LanguageCode,
  OwnerConfig,
  PaymentCheckResult,
  PhoneLookupResult,
  PhoneNotificationEvent,
  ScanMode,
  ScanResult,
} from '../types';

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function fetchPublicConfig() {
  return apiJson<{ config: OwnerConfig; notifications: PhoneNotificationEvent[] }>('/api/config');
}

export function scanContentApi(payload: {
  mode: ScanMode | 'gmail';
  content: string;
  language: LanguageCode;
}) {
  return apiJson<ScanResult>('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function connectUserPhoneApi(payload: {
  countryCode: string;
  countryName: string;
  dialCode: string;
  phoneNumber: string;
}) {
  return apiJson<{ normalized: string; countryCode: string; countryName: string }>('/api/phone/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function lookupPhoneApi(payload: {
  countryCode: string;
  countryName: string;
  dialCode: string;
  phoneNumber: string;
  contextNote?: string;
  connectedUserPhone?: { normalized: string; countryName: string } | null;
  language: LanguageCode;
}) {
  return apiJson<PhoneLookupResult>('/api/phone/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function checkPaymentApi(payload: {
  method: string;
  receiverName: string;
  receiverAccount: string;
  amount: string;
  currency: string;
  note: string;
  language: LanguageCode;
}) {
  return apiJson<PaymentCheckResult>('/api/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function sendAssistantMessageApi(payload: {
  messages: AssistantMessage[];
  language: LanguageCode;
  activeContextSummary?: string;
}) {
  return apiJson<{ reply: string }>('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function transcribeAudioApi(payload: {
  base64Audio: string;
  mimeType: string;
  language: LanguageCode;
}) {
  return apiJson<{ text: string }>('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateOwnerConfigApi(token: string, config: Partial<OwnerConfig>) {
  return apiJson<{ config: OwnerConfig }>('/api/owner/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });
}

export function addOwnerBlocklistApi(
  token: string,
  entry: Omit<BlocklistEntry, 'id' | 'addedAt'>
) {
  return apiJson<{ config: OwnerConfig }>('/api/owner/blocklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });
}

export function removeOwnerBlocklistApi(token: string, id: string) {
  return apiJson<{ config: OwnerConfig }>(`/api/owner/blocklist/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function addOwnerHotspotApi(token: string, hotspot: Omit<GlobalHotspot, 'id'>) {
  return apiJson<{ config: OwnerConfig }>('/api/owner/hotspots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(hotspot),
  });
}

function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

interface GmailPayloadPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayloadPart[];
}

function extractPlainText(payload?: GmailPayloadPart): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data).replace(/<[^>]+>/g, ' ');
  }
  return '';
}

export async function fetchGmailMessages(accessToken: string, maxResults = 8): Promise<GmailEmailSummary[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${errText}`);
  }
  const listData = (await listRes.json()) as { messages?: Array<{ id: string; threadId: string }> };
  const refs = listData.messages || [];
  if (refs.length === 0) return [];

  const details = await Promise.all(
    refs.map(async (ref) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!msgRes.ok) return null;
      const msg = (await msgRes.json()) as {
        id: string;
        threadId: string;
        snippet?: string;
        payload?: GmailPayloadPart & { headers?: Array<{ name: string; value: string }> };
      };
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      const bodyText = extractPlainText(msg.payload) || msg.snippet || '';
      return {
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader('From') || 'Unknown Sender',
        subject: getHeader('Subject') || '(No Subject)',
        date: getHeader('Date') || '',
        snippet: msg.snippet || '',
        bodyText: bodyText.slice(0, 4000),
      } satisfies GmailEmailSummary;
    })
  );

  return details.filter((d): d is GmailEmailSummary => d !== null);
}
