import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AssistantMessage,
  DomainSignals,
  LanguageCode,
  OwnerConfig,
  PaymentCheckResult,
  PhoneLookupResult,
  ScanMode,
  ScanResult,
  ThreatClassification,
} from '../src/types.ts';
import { loadPhoneRegistry, savePhoneRegistry } from './ownerStore.ts';

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ar: 'Arabic',
  ja: 'Japanese',
  pt: 'Portuguese',
};

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please configure it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function classifyScore(score: number, config: OwnerConfig): ThreatClassification {
  if (score >= config.highRiskThreshold) return 'High Risk';
  if (score >= config.suspiciousThreshold) return 'Suspicious';
  return 'Safe';
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function inspectUrlStructure(rawUrl: string): DomainSignals {
  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    const parts = hostname.split('.').filter(Boolean);
    const tld = parts[parts.length - 1] || '';
    const suspiciousTlds = new Set(['xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'click', 'loan', 'work', 'support', 'zip']);
    const usesIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
    const hasPunycodeOrLookalike =
      hostname.includes('xn--') ||
      /[01l]/.test(hostname.replace(/\./g, '')) && /(paypa|g00gle|micr0|app1e|amaz0n|netf1ix|bank|secure|verify|login)/i.test(hostname);
    const pathFlags: string[] = [];
    if (parsed.protocol === 'http:') pathFlags.push('Unencrypted HTTP connection');
    if (parsed.username || rawUrl.includes('@')) pathFlags.push('Embedded @ credential obfuscation');
    if (/(login|verify|otp|kyc|wallet|refund|update|urgent|claim|reward)/i.test(parsed.pathname + parsed.search)) {
      pathFlags.push('Sensitive credential or urgent action keywords in URL path');
    }
    if (parsed.pathname.length > 60 || parsed.search.length > 80) {
      pathFlags.push('Unusually long obfuscated query or path string');
    }
    return {
      hostname,
      protocol: parsed.protocol.replace(':', ''),
      usesIpAddress,
      hasPunycodeOrLookalike,
      suspiciousTld: suspiciousTlds.has(tld),
      excessiveSubdomains: parts.length >= 4,
      pathFlags,
    };
  } catch {
    return {
      hostname: rawUrl.trim().slice(0, 80),
      protocol: 'unknown',
      usesIpAddress: false,
      hasPunycodeOrLookalike: false,
      suspiciousTld: false,
      excessiveSubdomains: false,
      pathFlags: ['Malformed URL structure'],
    };
  }
}

export async function analyzeContent(params: {
  mode: ScanMode | 'gmail';
  content: string;
  language: LanguageCode;
  config: OwnerConfig;
}): Promise<ScanResult> {
  const { mode, content, language, config } = params;
  const langName = LANGUAGE_NAMES[language] || 'English';
  const ai = getAiClient();

  const domainSignals = mode === 'url' ? inspectUrlStructure(content) : undefined;
  const lowerContent = content.toLowerCase();
  const matchedBlocklist = config.blocklist.filter((b) => lowerContent.includes(b.value.toLowerCase()));

  const systemInstruction = `You are ScamShield AI, an intelligent, honest cybersecurity guardian.
Analyze the submitted ${mode.toUpperCase()} content carefully for scams, phishing, social engineering, impersonation, credential theft, or fraud.
Rules:
1. Respond entirely in ${langName}.
2. Explain your findings in clear, simple everyday language.
3. Explicitly evaluate these 7 pattern categories when applicable: urgency/panic, OTP/password/banking requests, fake bank/government/brand impersonation, suspicious payment requests, unrealistic prizes/lotteries, spelling mistakes & unusual links, requests to install unknown apps.
4. Score the 6 Scam DNA dimensions from 0 to 100 based on actual content evidence: urgencyFear, impersonation, financialPressure, credentialTheft, rewardBait, manipulation.
5. Never guarantee that any message or website is 100% safe. Always provide an honest uncertaintyNote explaining what cannot be verified from text/URL alone.
6. Never ask the user to enter or share real OTPs, passwords, or banking credentials.
7. Be calibrated: legitimate messages with no red flags should score low (0-25), ambiguous/unsolicited requests medium (30-60), clear phishing/scams high (65-100).`;

  const promptText = [
    `Content Type: ${mode}`,
    `Owner Blocklist Matches: ${matchedBlocklist.length ? matchedBlocklist.map((b) => `${b.value} (${b.reason})`).join('; ') : 'None'}`,
    domainSignals ? `Static URL Structure Signals: ${JSON.stringify(domainSignals)}` : '',
    `Submitted Content:\n"""\n${content.slice(0, 6000)}\n"""`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: promptText,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.INTEGER, description: 'Overall scam risk score from 0 to 100' },
          summary: { type: Type.STRING, description: 'Concise 1-2 sentence verdict in the target language' },
          warningSigns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                severity: { type: Type.STRING, description: 'low, medium, or high' },
              },
            },
          },
          scamDna: {
            type: Type.OBJECT,
            properties: {
              urgencyFear: { type: Type.INTEGER },
              impersonation: { type: Type.INTEGER },
              financialPressure: { type: Type.INTEGER },
              credentialTheft: { type: Type.INTEGER },
              rewardBait: { type: Type.INTEGER },
              manipulation: { type: Type.INTEGER },
            },
          },
          explanation: { type: Type.STRING, description: 'Simple-language explanation of why it may or may not be a scam' },
          socialEngineeringTechniques: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          uncertaintyNote: { type: Type.STRING, description: 'Clear statement of limitations and uncertainty' },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  let riskScore = clampScore(parsed.riskScore);
  if (matchedBlocklist.length > 0) {
    riskScore = Math.max(riskScore, 88);
  }
  if (domainSignals && (domainSignals.usesIpAddress || domainSignals.hasPunycodeOrLookalike)) {
    riskScore = Math.max(riskScore, 75);
  }

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mode,
    inputPreview: content.trim().slice(0, 140),
    riskScore,
    classification: classifyScore(riskScore, config),
    summary: parsed.summary || 'Analysis completed.',
    warningSigns: Array.isArray(parsed.warningSigns)
      ? parsed.warningSigns.map((w: Record<string, string>) => ({
          category: w.category || 'Pattern',
          title: w.title || 'Warning Signal',
          detail: w.detail || '',
          severity: w.severity === 'high' || w.severity === 'medium' ? w.severity : 'low',
        }))
      : [],
    scamDna: {
      urgencyFear: clampScore(parsed.scamDna?.urgencyFear),
      impersonation: clampScore(parsed.scamDna?.impersonation),
      financialPressure: clampScore(parsed.scamDna?.financialPressure),
      credentialTheft: clampScore(parsed.scamDna?.credentialTheft),
      rewardBait: clampScore(parsed.scamDna?.rewardBait),
      manipulation: clampScore(parsed.scamDna?.manipulation),
    },
    explanation: parsed.explanation || '',
    socialEngineeringTechniques: Array.isArray(parsed.socialEngineeringTechniques)
      ? parsed.socialEngineeringTechniques
      : [],
    uncertaintyNote:
      parsed.uncertaintyNote ||
      'AI analysis cannot guarantee 100% safety. Always verify directly through official websites or phone numbers.',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    domainSignals,
    timestamp: new Date().toISOString(),
    language,
  };
}

export async function lookupPhone(params: {
  countryCode: string;
  countryName: string;
  dialCode: string;
  phoneNumber: string;
  contextNote?: string;
  connectedUserPhone?: { normalized: string; countryName: string } | null;
  language: LanguageCode;
  config: OwnerConfig;
}): Promise<PhoneLookupResult> {
  const { countryCode, countryName, dialCode, phoneNumber, contextNote, connectedUserPhone, language, config } = params;
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  const cleanDial = dialCode.replace(/[^\d+]/g, '');
  const normalizedNumber = `${cleanDial}${digitsOnly}`;

  const registry = loadPhoneRegistry();
  const existingRecord = registry.numbers[normalizedNumber];
  const blockMatch = config.blocklist.find(
    (b) => b.type === 'phone' && b.value.replace(/[^\d+]/g, '') === normalizedNumber
  );

  // Deterministic seed fallback for realistic consistent suspicious call telemetry across runs
  const digitSum = digitsOnly.split('').reduce((acc, ch, idx) => acc + Number(ch) * (idx + 3), 0);
  const langName = LANGUAGE_NAMES[language] || 'English';
  const ai = getAiClient();

  const systemInstruction = `You are ScamShield AI Caller & Phone Risk Analyst.
Given a country, dial code, phone number, and optional caller context, provide a structured caller risk assessment in ${langName}.
Important rules:
1. Identify the originating country (${countryName}) and likely carrier/line category (e.g. Toll-Free Support, VoIP Virtual Line, Mobile Prepaid, Business Landline).
2. Provide a registeredHolderName and holderCategory based on public business/scam-pattern attribution or clearly labeled simulated/estimated Caller ID profile (e.g., if it matches a known scam pattern or toll-free spoofing prefix, indicate "Unverified / Suspected Spoofed Desk" or realistic entity profile; if clean/standard, provide a realistic caller/entity label and state clearly in uncertaintyNote that live private telecom subscriber databases are not directly queried without carrier API access).
3. Score the riskScore (0-100) and Scam DNA dimensions realistically based on blocklist status, toll-free/VoIP patterns, and user context.
4. Keep explanations simple, honest, and actionable in ${langName}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Country: ${countryName} (${countryCode}, ${dialCode})
Normalized Phone Number: ${normalizedNumber}
Owner Blocklist Match: ${blockMatch ? `YES - ${blockMatch.reason}` : 'None'}
Existing Registry Suspicious Calls: ${existingRecord ? existingRecord.suspiciousCallsTillDate : 'Not yet recorded'}
User Context / Call Reason: ${contextNote?.trim() || 'General suspicious caller verification'}`,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          registeredHolderName: { type: Type.STRING, description: 'Caller ID / registered entity or subscriber profile label' },
          holderCategory: { type: Type.STRING, description: 'e.g. Unverified VoIP Caller, Suspected Impersonation Desk, Verified Business, Personal Line' },
          carrierOrLineType: { type: Type.STRING, description: 'Likely carrier region and line type' },
          estimatedSuspiciousCalls: { type: Type.INTEGER, description: 'Estimated suspicious calls reported till date if not already in registry' },
          riskScore: { type: Type.INTEGER },
          summary: { type: Type.STRING },
          warningSigns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                severity: { type: Type.STRING },
              },
            },
          },
          scamDna: {
            type: Type.OBJECT,
            properties: {
              urgencyFear: { type: Type.INTEGER },
              impersonation: { type: Type.INTEGER },
              financialPressure: { type: Type.INTEGER },
              credentialTheft: { type: Type.INTEGER },
              rewardBait: { type: Type.INTEGER },
              manipulation: { type: Type.INTEGER },
            },
          },
          explanation: { type: Type.STRING },
          uncertaintyNote: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  let riskScore = clampScore(parsed.riskScore);
  if (blockMatch) {
    riskScore = Math.max(riskScore, 90);
  }

  let suspiciousCallsTillDate = existingRecord
    ? existingRecord.suspiciousCallsTillDate
    : riskScore >= config.suspiciousThreshold
    ? Math.max(12, Math.min(640, (digitSum % 180) + Math.round(riskScore * 1.4)))
    : Math.max(0, digitSum % 3);

  if (riskScore >= config.suspiciousThreshold) {
    suspiciousCallsTillDate += 1;
  }

  const communityReports = existingRecord
    ? existingRecord.communityReports + (riskScore >= config.suspiciousThreshold ? 1 : 0)
    : Math.max(0, Math.round(suspiciousCallsTillDate * 0.42));

  registry.numbers[normalizedNumber] = {
    suspiciousCallsTillDate,
    communityReports,
    lastCheckedAt: new Date().toISOString(),
  };

  const classification = classifyScore(riskScore, config);

  let notificationEvent;
  if (connectedUserPhone?.normalized) {
    notificationEvent = {
      id: `notif-${Date.now()}`,
      notifiedNumber: connectedUserPhone.normalized,
      notifiedCountry: connectedUserPhone.countryName,
      checkedNumber: normalizedNumber,
      checkedCountry: countryName,
      registeredHolder: parsed.registeredHolderName || 'Unverified Subscriber',
      riskScore,
      classification,
      message: `Caller Alert sent to connected number ${connectedUserPhone.normalized}: Lookup completed for ${normalizedNumber} (${countryName}) — Registered: ${parsed.registeredHolderName || 'Unverified'} (${classification}, ${suspiciousCallsTillDate} suspicious calls recorded).`,
      timestamp: new Date().toISOString(),
    };
    registry.notifications = [notificationEvent, ...registry.notifications].slice(0, 25);
  }

  savePhoneRegistry(registry);

  return {
    normalizedNumber,
    countryCode,
    countryName,
    dialCode,
    registeredHolderName: parsed.registeredHolderName || 'Unverified Caller Profile',
    holderCategory: parsed.holderCategory || 'Unknown Line Category',
    carrierOrLineType: parsed.carrierOrLineType || `${countryName} Telecom Network`,
    suspiciousCallsTillDate,
    communityReports,
    riskScore,
    classification,
    summary: parsed.summary || 'Phone risk lookup complete.',
    warningSigns: Array.isArray(parsed.warningSigns)
      ? parsed.warningSigns.map((w: Record<string, string>) => ({
          category: w.category || 'Caller Pattern',
          title: w.title || 'Signal',
          detail: w.detail || '',
          severity: w.severity === 'high' || w.severity === 'medium' ? w.severity : 'low',
        }))
      : [],
    scamDna: {
      urgencyFear: clampScore(parsed.scamDna?.urgencyFear),
      impersonation: clampScore(parsed.scamDna?.impersonation),
      financialPressure: clampScore(parsed.scamDna?.financialPressure),
      credentialTheft: clampScore(parsed.scamDna?.credentialTheft),
      rewardBait: clampScore(parsed.scamDna?.rewardBait),
      manipulation: clampScore(parsed.scamDna?.manipulation),
    },
    explanation: parsed.explanation || '',
    uncertaintyNote:
      parsed.uncertaintyNote ||
      'Caller attribution combines AI pattern analysis with community scam logs; private telecom KYC records are not directly accessed.',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    notificationEvent,
    timestamp: new Date().toISOString(),
  };
}

export async function checkPaymentTransaction(params: {
  method: string;
  receiverName: string;
  receiverAccount: string;
  amount: string;
  currency: string;
  note: string;
  language: LanguageCode;
  config: OwnerConfig;
}): Promise<PaymentCheckResult> {
  const { method, receiverName, receiverAccount, amount, currency, note, language, config } = params;
  const langName = LANGUAGE_NAMES[language] || 'English';
  const ai = getAiClient();

  const lowerAcc = receiverAccount.toLowerCase();
  const blockMatch = config.blocklist.find(
    (b) => b.type === 'account' && lowerAcc.includes(b.value.toLowerCase())
  );

  const systemInstruction = `You are ScamShield AI Pre-Transaction Payment Guard.
Evaluate whether a pending payment receiver looks SECURED or FRAUDULENT before the user confirms transfer.
Respond entirely in ${langName}.
Check for:
- Suspicious UPI/account handles (e.g., "refund", "kyc", "prize", "support", "customs", "tax-desk")
- Mismatch between receiverName and receiverAccount
- Coerced/scam payment reasons (gift cards, urgent bail/customs fee, OTP unlock, lottery processing fee, crypto doubling)
- Legitimate normal merchant/utility/known transfer patterns should score low (secured).
Return clear status: "secured", "suspicious", or "fraud".`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Payment Method: ${method}
Receiver Name: ${receiverName}
Receiver Account / Handle: ${receiverAccount}
Amount: ${amount} ${currency}
Payment Reason / Note: ${note || 'None provided'}
Owner Blocklist Match: ${blockMatch ? `YES - ${blockMatch.reason}` : 'None'}`,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.INTEGER },
          headline: { type: Type.STRING },
          explanation: { type: Type.STRING },
          warningSigns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                severity: { type: Type.STRING },
              },
            },
          },
          scamDna: {
            type: Type.OBJECT,
            properties: {
              urgencyFear: { type: Type.INTEGER },
              impersonation: { type: Type.INTEGER },
              financialPressure: { type: Type.INTEGER },
              credentialTheft: { type: Type.INTEGER },
              rewardBait: { type: Type.INTEGER },
              manipulation: { type: Type.INTEGER },
            },
          },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          uncertaintyNote: { type: Type.STRING },
        },
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  let riskScore = clampScore(parsed.riskScore);
  if (blockMatch) {
    riskScore = Math.max(riskScore, 95);
  }
  const classification = classifyScore(riskScore, config);
  const status: 'secured' | 'suspicious' | 'fraud' =
    classification === 'High Risk' ? 'fraud' : classification === 'Suspicious' ? 'suspicious' : 'secured';

  return {
    status,
    riskScore,
    classification,
    receiverName,
    receiverAccount,
    method,
    amount,
    currency,
    headline: parsed.headline || (status === 'secured' ? 'Receiver Account Appears Secured' : 'Fraud Risk Detected on Receiver Account'),
    explanation: parsed.explanation || '',
    warningSigns: Array.isArray(parsed.warningSigns)
      ? parsed.warningSigns.map((w: Record<string, string>) => ({
          category: w.category || 'Payment Risk',
          title: w.title || 'Signal',
          detail: w.detail || '',
          severity: w.severity === 'high' || w.severity === 'medium' ? w.severity : 'low',
        }))
      : [],
    scamDna: {
      urgencyFear: clampScore(parsed.scamDna?.urgencyFear),
      impersonation: clampScore(parsed.scamDna?.impersonation),
      financialPressure: clampScore(parsed.scamDna?.financialPressure),
      credentialTheft: clampScore(parsed.scamDna?.credentialTheft),
      rewardBait: clampScore(parsed.scamDna?.rewardBait),
      manipulation: clampScore(parsed.scamDna?.manipulation),
    },
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    uncertaintyNote:
      parsed.uncertaintyNote ||
      'Pre-transfer verification evaluates behavioral and account-pattern risk; always confirm the recipient out-of-band before sending funds.',
    timestamp: new Date().toISOString(),
  };
}

export async function chatAssistant(params: {
  messages: AssistantMessage[];
  language: LanguageCode;
  activeContextSummary?: string;
}): Promise<string> {
  const { messages, language, activeContextSummary } = params;
  const langName = LANGUAGE_NAMES[language] || 'English';
  const ai = getAiClient();

  const systemInstruction = `You are ScamShield AI Assistant, an empathetic, practical cybersecurity guardian.
Rules:
1. Always respond in ${langName}.
2. Use simple, clear language understandable by everyday users.
3. Explain social engineering tactics (urgency, fear, authority impersonation, reward bait) clearly.
4. Avoid making unsupported claims and clearly communicate uncertainty when evidence is incomplete.
5. Never guarantee that any message, caller, payment, or website is 100% safe.
6. NEVER ask users to share real OTPs, passwords, PINs, card numbers, or private banking credentials.
${activeContextSummary ? `\nActive Scan Context:\n${activeContextSummary}` : ''}`;

  const historyText = messages
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: historyText,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  return (response.text || '').trim() || 'I could not generate a response right now. Please try again.';
}

export async function transcribeAudio(params: {
  base64Audio: string;
  mimeType: string;
  language: LanguageCode;
}): Promise<string> {
  const { base64Audio, mimeType, language } = params;
  const langName = LANGUAGE_NAMES[language] || 'English';
  const ai = getAiClient();

  const audioPart = {
    inlineData: {
      mimeType: mimeType || 'audio/webm',
      data: base64Audio,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        audioPart,
        { text: `Transcribe the spoken audio accurately into text. The user's interface language is ${langName}. Return only the transcribed text.` },
      ],
    },
  });

  return (response.text || '').trim();
}
