import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  analyzeContent,
  chatAssistant,
  checkPaymentTransaction,
  lookupPhone,
  transcribeAudio,
} from './server/aiService.ts';
import {
  addBlocklistItem,
  addCustomHotspot,
  loadOwnerConfig,
  loadPhoneRegistry,
  OWNER_EMAIL,
  registerConnectedPhone,
  removeBlocklistItem,
  saveOwnerConfig,
  verifyOwnerRequest,
} from './server/ownerStore.ts';
import type { AssistantMessage, LanguageCode, OwnerConfig, ScanMode } from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ownerEmail: OWNER_EMAIL });
  });

  app.get('/api/config', (_req, res) => {
    const config = loadOwnerConfig();
    const phoneState = loadPhoneRegistry();
    res.json({ config, notifications: phoneState.notifications });
  });

  app.post('/api/scan', async (req, res) => {
    try {
      const { mode, content, language } = req.body as {
        mode?: ScanMode | 'gmail';
        content?: string;
        language?: LanguageCode;
      };
      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Please enter text, an email, or a URL to scan.' });
      }
      if (!mode || !['sms', 'email', 'url', 'gmail'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid scan mode.' });
      }
      const config = loadOwnerConfig();
      const result = await analyzeContent({
        mode,
        content: content.trim(),
        language: language || 'en',
        config,
      });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/phone/connect', (req, res) => {
    const { countryCode, countryName, dialCode, phoneNumber } = req.body as {
      countryCode?: string;
      countryName?: string;
      dialCode?: string;
      phoneNumber?: string;
    };
    const digits = (phoneNumber || '').replace(/[^\d]/g, '');
    if (digits.length < 5) {
      return res.status(400).json({ error: 'Enter a valid phone number to connect.' });
    }
    const cleanDial = (dialCode || '+1').replace(/[^\d+]/g, '');
    const normalized = `${cleanDial}${digits}`;
    registerConnectedPhone(normalized, countryCode || 'US', countryName || 'United States');
    return res.json({ normalized, countryCode: countryCode || 'US', countryName: countryName || 'United States' });
  });

  app.post('/api/phone/lookup', async (req, res) => {
    try {
      const { countryCode, countryName, dialCode, phoneNumber, contextNote, connectedUserPhone, language } = req.body as {
        countryCode?: string;
        countryName?: string;
        dialCode?: string;
        phoneNumber?: string;
        contextNote?: string;
        connectedUserPhone?: { normalized: string; countryName: string } | null;
        language?: LanguageCode;
      };
      const digits = (phoneNumber || '').replace(/[^\d]/g, '');
      if (digits.length < 5) {
        return res.status(400).json({ error: 'Please select a country and enter a valid phone number.' });
      }
      const config = loadOwnerConfig();
      const result = await lookupPhone({
        countryCode: countryCode || 'US',
        countryName: countryName || 'United States',
        dialCode: dialCode || '+1',
        phoneNumber: digits,
        contextNote,
        connectedUserPhone: connectedUserPhone || null,
        language: language || 'en',
        config,
      });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Phone lookup failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/payment/check', async (req, res) => {
    try {
      const { method, receiverName, receiverAccount, amount, currency, note, language } = req.body as {
        method?: string;
        receiverName?: string;
        receiverAccount?: string;
        amount?: string;
        currency?: string;
        note?: string;
        language?: LanguageCode;
      };
      if (!receiverAccount || !receiverAccount.trim()) {
        return res.status(400).json({ error: 'Receiver account, UPI ID, or wallet address is required.' });
      }
      const config = loadOwnerConfig();
      const result = await checkPaymentTransaction({
        method: method || 'UPI / Instant Transfer',
        receiverName: (receiverName || 'Unknown Recipient').trim(),
        receiverAccount: receiverAccount.trim(),
        amount: String(amount || '0'),
        currency: currency || 'USD',
        note: (note || '').trim(),
        language: language || 'en',
        config,
      });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment security check failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/assistant', async (req, res) => {
    try {
      const { messages, language, activeContextSummary } = req.body as {
        messages?: AssistantMessage[];
        language?: LanguageCode;
        activeContextSummary?: string;
      };
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Message history is required.' });
      }
      const reply = await chatAssistant({
        messages,
        language: language || 'en',
        activeContextSummary,
      });
      return res.json({ reply });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assistant request failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/transcribe', async (req, res) => {
    try {
      const { base64Audio, mimeType, language } = req.body as {
        base64Audio?: string;
        mimeType?: string;
        language?: LanguageCode;
      };
      if (!base64Audio) {
        return res.status(400).json({ error: 'Audio data is required.' });
      }
      const text = await transcribeAudio({
        base64Audio,
        mimeType: mimeType || 'audio/webm',
        language: language || 'en',
      });
      return res.json({ text });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transcription failed.';
      return res.status(500).json({ error: message });
    }
  });

  // Owner-only protected routes
  app.put('/api/owner/config', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization);
    if (!auth.ok) {
      return res.status(403).json({ error: auth.reason || 'Owner access required.' });
    }
    const incoming = req.body as Partial<OwnerConfig>;
    const current = loadOwnerConfig();
    const updated = saveOwnerConfig({
      ...current,
      ...incoming,
      modules: { ...current.modules, ...(incoming.modules || {}) },
    });
    return res.json({ config: updated });
  });

  app.post('/api/owner/blocklist', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization);
    if (!auth.ok) {
      return res.status(403).json({ error: auth.reason || 'Owner access required.' });
    }
    const { type, value, reason } = req.body as {
      type?: 'domain' | 'phone' | 'account';
      value?: string;
      reason?: string;
    };
    if (!type || !value?.trim()) {
      return res.status(400).json({ error: 'Blocklist type and value are required.' });
    }
    const updated = addBlocklistItem({ type, value, reason: reason || '' });
    return res.json({ config: updated });
  });

  app.delete('/api/owner/blocklist/:id', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization);
    if (!auth.ok) {
      return res.status(403).json({ error: auth.reason || 'Owner access required.' });
    }
    const updated = removeBlocklistItem(req.params.id);
    return res.json({ config: updated });
  });

  app.post('/api/owner/hotspots', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization);
    if (!auth.ok) {
      return res.status(403).json({ error: auth.reason || 'Owner access required.' });
    }
    const { city, country, isoCode, lat, lon, riskIndex, tier, primaryThreats, reportedIncidents30d, summary } =
      req.body;
    if (!city || !country) {
      return res.status(400).json({ error: 'City and country are required.' });
    }
    const updated = addCustomHotspot({
      city: String(city),
      country: String(country),
      isoCode: String(isoCode || 'XX').toUpperCase(),
      lat: Number(lat) || 0,
      lon: Number(lon) || 0,
      riskIndex: Math.min(100, Math.max(0, Number(riskIndex) || 75)),
      tier: tier === 'Critical' || tier === 'High' ? tier : 'Elevated',
      primaryThreats: Array.isArray(primaryThreats) ? primaryThreats : ['Phishing & Online Fraud'],
      reportedIncidents30d: Number(reportedIncidents30d) || 120,
      summary: String(summary || 'Added by app owner'),
    });
    return res.json({ config: updated });
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScamShield AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ScamShield AI server:', err);
  process.exit(1);
});
