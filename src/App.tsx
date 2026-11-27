import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  BookOpen,
  Clock,
  CreditCard,
  Globe,
  History,
  Languages,
  Link2,
  Mail,
  MessageSquareWarning,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { AssistantPanel } from './components/AssistantPanel';
import { GlobalThreatMap } from './components/GlobalThreatMap';
import { GmailInboxPanel } from './components/GmailInboxPanel';
import { OwnerStudioPanel } from './components/OwnerStudioPanel';
import { PaymentGuardPanel } from './components/PaymentGuardPanel';
import { PhoneLookupPanel } from './components/PhoneLookupPanel';
import { EDUCATIONAL_TIPS, SAMPLE_SCENARIOS } from './data/countriesAndMap';
import { getTranslations, LANGUAGES } from './i18n/translations';
import { fetchPublicConfig, scanContentApi } from './services/api';
import { googleSignIn, initAuth, logout } from './services/firebaseAuth';
import type {
  LanguageCode,
  OwnerConfig,
  PaymentCheckResult,
  PhoneLookupResult,
  PhoneNotificationEvent,
  ScanHistoryItem,
  ScanMode,
  ScanResult,
  ThreatClassification,
  ThreatTheme,
} from './types';

type ActiveView = 'scanner' | 'phone' | 'payments' | 'map' | 'assistant' | 'owner';

const DEFAULT_PUBLIC_CONFIG: OwnerConfig = {
  ownerEmail: 'kkhushbu8518@gmail.com',
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
  blocklist: [],
  customSafetyTips: [],
  customHotspots: [],
  updatedAt: new Date().toISOString(),
};

function themeFromClassification(classification: ThreatClassification): ThreatTheme {
  if (classification === 'High Risk') return 'danger';
  if (classification === 'Suspicious') return 'suspicious';
  return 'safe';
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('scanner');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [threatTheme, setThreatTheme] = useState<ThreatTheme>('neutral');

  // Auth & Gmail OAuth state (token held strictly in memory)
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Owner config & phone notifications
  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig>(DEFAULT_PUBLIC_CONFIG);
  const [connectedPhone, setConnectedPhone] = useState<{
    normalized: string;
    countryName: string;
  } | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<PhoneNotificationEvent[]>([]);

  // Scanner state
  const [scanTab, setScanTab] = useState<ScanMode | 'gmail'>('sms');
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);

  // History
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Image fallback tracking
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [emblemFailed, setEmblemFailed] = useState(false);

  const t = useMemo(() => getTranslations(language), [language]);
  const langMeta = useMemo(
    () => LANGUAGES.find((l) => l.code === language) || LANGUAGES[0],
    [language]
  );

  const isOwner = useMemo(
    () =>
      Boolean(authUser?.email) &&
      authUser!.email!.trim().toLowerCase() === ownerConfig.ownerEmail.trim().toLowerCase(),
    [authUser, ownerConfig.ownerEmail]
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = langMeta.dir;
  }, [language, langMeta.dir]);

  useEffect(() => {
    const unsub = initAuth(({ user, accessToken }) => {
      setAuthUser(user);
      setGmailAccessToken(accessToken);
    });
    fetchPublicConfig()
      .then(({ config, notifications }) => {
        setOwnerConfig(config);
        setRecentNotifications(notifications);
      })
      .catch(() => {
        // fallback defaults already set
      });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const { user, accessToken } = await googleSignIn();
      setAuthUser(user);
      setGmailAccessToken(accessToken || null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in cancelled or failed.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setAuthUser(null);
    setGmailAccessToken(null);
  };

  const pushHistory = (item: ScanHistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 20));
  };

  const runContentScan = async (mode: ScanMode | 'gmail', content: string, titleOverride?: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setScanError(null);
    setIsScanning(true);
    try {
      const result = await scanContentApi({
        mode,
        content: trimmed,
        language,
      });
      setCurrentScanResult(result);
      setThreatTheme(themeFromClassification(result.classification));
      pushHistory({
        id: result.id,
        type: mode,
        title: titleOverride || trimmed.slice(0, 64),
        riskScore: result.riskScore,
        classification: result.classification,
        timestamp: result.timestamp,
        result,
      });
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanTab === 'gmail') return;
    runContentScan(scanTab, scanInput);
  };

  const handlePhoneResult = (res: PhoneLookupResult) => {
    setThreatTheme(themeFromClassification(res.classification));
    pushHistory({
      id: `phone-${Date.now()}`,
      type: 'phone',
      title: `${res.normalizedNumber} (${res.countryName})`,
      riskScore: res.riskScore,
      classification: res.classification,
      timestamp: res.timestamp,
      result: res,
    });
  };

  const handlePaymentResult = (res: PaymentCheckResult) => {
    setThreatTheme(themeFromClassification(res.classification));
    pushHistory({
      id: `pay-${Date.now()}`,
      type: 'payment',
      title: `${res.receiverName} (${res.amount} ${res.currency})`,
      riskScore: res.riskScore,
      classification: res.classification,
      timestamp: res.timestamp,
      result: res,
    });
  };

  const handleHistorySelect = (item: ScanHistoryItem) => {
    setThreatTheme(themeFromClassification(item.classification));
    if (item.type === 'phone') {
      setActiveView('phone');
    } else if (item.type === 'payment') {
      setActiveView('payments');
    } else {
      setActiveView('scanner');
      setCurrentScanResult(item.result as ScanResult);
    }
  };

  const activeContextSummary = useMemo(() => {
    if (!currentScanResult) return undefined;
    return `Last Scan (${currentScanResult.mode}): ${currentScanResult.classification} (${currentScanResult.riskScore}/100). Summary: ${currentScanResult.summary}`;
  }, [currentScanResult]);

  const themeBannerText =
    threatTheme === 'safe'
      ? t.themeSafe
      : threatTheme === 'danger'
      ? t.themeDanger
      : threatTheme === 'suspicious'
      ? t.themeSuspicious
      : t.themeNeutral;

  const themeContainerClasses =
    threatTheme === 'safe'
      ? 'bg-[#041510] text-slate-100'
      : threatTheme === 'danger'
      ? 'bg-[#1a060b] text-slate-100'
      : threatTheme === 'suspicious'
      ? 'bg-[#181105] text-slate-100'
      : 'bg-[#070d1c] text-slate-100';

  const themeSurfaceBorder =
    threatTheme === 'safe'
      ? 'border-emerald-500/30'
      : threatTheme === 'danger'
      ? 'border-red-500/35'
      : threatTheme === 'suspicious'
      ? 'border-amber-400/35'
      : 'border-white/10';

  const allTips = useMemo(() => {
    const custom = ownerConfig.customSafetyTips.map((tip, idx) => ({
      title: `Safety Rule ${idx + 1}`,
      detail: tip,
    }));
    return [...custom, ...EDUCATIONAL_TIPS].slice(0, 4);
  }, [ownerConfig.customSafetyTips]);

  return (
    <div
      data-threat-theme={threatTheme}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${themeContainerClasses}`}
    >
      {/* Top Bar Contract: Exactly 3 Zones (Brand, 5 concise Nav Links, 1 Primary Action) */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md bg-slate-950/75 border-b ${themeSurfaceBorder}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('scanner')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-md"
          >
            {!emblemFailed ? (
              <img
                src="/src/assets/images/scamshield_emblem_icon_1795761044496.jpg"
                alt="ScamShield AI emblem"
                referrerPolicy="no-referrer"
                onError={() => setEmblemFailed(true)}
                className="w-8 h-8 rounded-lg object-cover border border-white/15 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
            )}
            <span className="text-lg font-bold tracking-tight text-white font-display">
              {t.brandTitle}
            </span>
          </button>

          {/* Zone 2: 5 Single-line Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            {(
              [
                ['scanner', t.navScanner],
                ['phone', t.navPhone],
                ['payments', t.navPayments],
                ['map', t.navMap],
                ['assistant', t.navAssistant],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeView === view
                    ? 'text-white border-blue-400'
                    : 'text-slate-300 hover:text-white border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => (authUser ? setActiveView('owner') : handleGoogleSignIn())}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              {authUser ? t.navOwner : t.signInGoogle}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Utility Toolbar (Language Switcher, Mobile Nav, Threat Theme & Session Info) */}
      <div className={`border-b ${themeSurfaceBorder} bg-slate-950/40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Mobile Navigation Strip */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
            {(
              [
                ['scanner', t.navScanner],
                ['phone', t.navPhone],
                ['payments', t.navPayments],
                ['map', t.navMap],
                ['assistant', t.navAssistant],
                ['owner', t.navOwner],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap shrink-0 ${
                  activeView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Left: Threat Theme Status + Reset */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">{t.themeStatusLabel}:</span>
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                threatTheme === 'safe'
                  ? 'text-emerald-300'
                  : threatTheme === 'danger'
                  ? 'text-red-300'
                  : threatTheme === 'suspicious'
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }`}
            >
              {threatTheme === 'danger' ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : threatTheme === 'suspicious' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{themeBannerText}</span>
            </span>

            {threatTheme !== 'neutral' && (
              <button
                type="button"
                onClick={() => setThreatTheme('neutral')}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetTheme}</span>
              </button>
            )}
          </div>

          {/* Right: Language Switcher + Account / Owner Link */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <label htmlFor="lang-select" className="text-slate-400">
                {t.languageLabel}:
              </label>
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="rounded-md bg-slate-900 border border-white/15 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.label})
                  </option>
                ))}
              </select>
            </div>

            {authUser ? (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="truncate max-w-[180px]">{authUser.email}</span>
                <span aria-hidden="true">·</span>
                <span className={isOwner ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  {isOwner ? t.ownerBadge : t.guestBadge}
                </span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setActiveView('owner')}
                  className="text-blue-300 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
                >
                  {t.navOwner}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-white whitespace-nowrap shrink-0"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('owner')}
                className="text-slate-300 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
              >
                {t.navOwner}
              </button>
            )}
          </div>
        </div>
      </div>

      {authError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-3">
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2.5 text-xs text-red-200">
            {authError}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7 space-y-8">
        {/* Welcoming Hero Section on Scanner View */}
        {activeView === 'scanner' && (
          <section
            className={`rounded-2xl border ${themeSurfaceBorder} overflow-hidden relative bg-slate-900/65`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-4 z-10">
                <div className="text-xs font-medium text-emerald-300 flex items-center gap-2">
                  <span>{t.brandTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.brandSubtitle}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight [text-wrap:balance]">
                  {t.tagline}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                  {t.heroDesc}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('scanner-input-box');
                      el?.focus();
                    }}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    {t.quickScanCta}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('phone')}
                    className="px-4 py-2.5 rounded-lg border border-white/15 bg-slate-950/60 hover:bg-slate-900 text-sm font-medium text-slate-200 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>{t.navPhone}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('payments')}
                    className="px-4 py-2.5 rounded-lg border border-white/15 bg-slate-950/60 hover:bg-slate-900 text-sm font-medium text-slate-200 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>{t.navPayments}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('map')}
                    className="px-4 py-2.5 rounded-lg border border-white/15 bg-slate-950/60 hover:bg-slate-900 text-sm font-medium text-slate-200 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>{t.navMap}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative min-h-[210px] lg:min-h-full bg-slate-950/80">
                {!backdropFailed ? (
                  <img
                    src="/src/assets/images/scamshield_command_backdrop_1795761043961.jpg"
                    alt="ScamShield AI Digital Safety Command Center"
                    referrerPolicy="no-referrer"
                    onError={() => setBackdropFailed(true)}
                    className="w-full h-full object-cover opacity-85"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950/40 to-emerald-950/30 p-8">
                    <ShieldCheck className="w-20 h-20 text-blue-400/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </section>
        )}

        {/* Active Module Views */}
        {activeView === 'scanner' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Scanner Input Panel */}
              <div className="lg:col-span-5 space-y-5">
                <div className={`rounded-xl border ${themeSurfaceBorder} bg-slate-900/75 p-5 space-y-4`}>
                  <div>
                    <h2 className="text-lg font-bold text-white">{t.scannerHeading}</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t.scannerSubheading}
                    </p>
                  </div>

                  {/* Segmented Mode Tabs */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-950/80 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setScanTab('sms')}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        scanTab === 'sms'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.tabSms}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanTab('url')}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        scanTab === 'url'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.tabUrl}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanTab('gmail')}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        scanTab === 'gmail'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.tabGmail}</span>
                    </button>
                  </div>

                  {scanTab === 'gmail' ? (
                    <GmailInboxPanel
                      accessToken={gmailAccessToken}
                      userEmail={authUser?.email || null}
                      onGoogleSignIn={handleGoogleSignIn}
                      onScanEmail={(content, subject) =>
                        runContentScan('gmail', content, `Gmail: ${subject}`)
                      }
                      isScanning={isScanning}
                      t={t}
                    />
                  ) : (
                    <form onSubmit={handleScannerSubmit} className="space-y-4">
                      {scanTab === 'url' ? (
                        <div className="space-y-2">
                          <input
                            id="scanner-input-box"
                            type="text"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            placeholder={t.urlPlaceholder}
                            className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3.5 py-3 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                          />
                          <p className="text-[11px] text-blue-300">{t.urlSafetyNotice}</p>
                        </div>
                      ) : (
                        <textarea
                          id="scanner-input-box"
                          rows={6}
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          placeholder={t.smsPlaceholder}
                          className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 leading-relaxed"
                        />
                      )}

                      {scanError && (
                        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                          {scanError}
                        </div>
                      )}

                      <div className="flex items-center gap-2.5">
                        <button
                          type="submit"
                          disabled={isScanning || !scanInput.trim()}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors whitespace-nowrap"
                        >
                          {isScanning ? t.analyzingBtn : t.analyzeBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScanInput('');
                            setCurrentScanResult(null);
                            setThreatTheme('neutral');
                            setScanError(null);
                          }}
                          className="py-2.5 px-4 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-800 text-sm font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
                        >
                          {t.clearBtn}
                        </button>
                      </div>

                      {/* Sample Scenarios */}
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <div className="text-xs font-medium text-slate-400">
                          {t.sampleScenariosTitle}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SAMPLE_SCENARIOS.map((sc) => (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => {
                                setScanTab(sc.mode);
                                setScanInput(sc.content);
                              }}
                              className="px-2.5 py-1.5 rounded-md bg-slate-800/85 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 transition-colors"
                            >
                              {sc.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Scan History */}
                <div className={`rounded-xl border ${themeSurfaceBorder} bg-slate-900/65 p-5 space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-400" />
                      <span>{t.historyTitle}</span>
                    </h3>
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistory([])}
                        className="text-xs text-slate-400 hover:text-red-300 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.clearHistoryBtn}</span>
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">{t.historyEmpty}</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleHistorySelect(item)}
                          className="w-full text-left rounded-lg border border-white/10 bg-slate-950/60 hover:bg-slate-900 px-3 py-2.5 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-100 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="uppercase font-mono">{item.type}</span>
                              <span aria-hidden="true">·</span>
                              <Clock className="w-3 h-3" />
                              <span className="tabular-nums">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`font-mono tabular-nums text-xs font-bold shrink-0 ${
                              item.classification === 'High Risk'
                                ? 'text-red-400'
                                : item.classification === 'Suspicious'
                                ? 'text-amber-300'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.riskScore}/100
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Results Dashboard */}
              <div className="lg:col-span-7">
                <AnalysisDashboard
                  result={currentScanResult}
                  isLoading={isScanning}
                  onClear={() => {
                    setCurrentScanResult(null);
                    setScanInput('');
                    setThreatTheme('neutral');
                  }}
                  t={t}
                />
              </div>
            </div>

            {/* Daily Online Safety Tips */}
            <section className={`rounded-xl border ${themeSurfaceBorder} bg-slate-900/55 p-6 space-y-4`}>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>{t.tipsTitle}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {allTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-white/10 bg-slate-950/50 p-4 space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-blue-300">
                      0{idx + 1}. {tip.title}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{tip.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === 'phone' && (
          <PhoneLookupPanel
            language={language}
            connectedPhone={connectedPhone}
            onConnectedPhoneChange={setConnectedPhone}
            recentNotifications={recentNotifications}
            onNotificationAdded={(ev) => setRecentNotifications((prev) => [ev, ...prev])}
            onResultReady={handlePhoneResult}
            t={t}
          />
        )}

        {activeView === 'payments' && (
          <PaymentGuardPanel
            language={language}
            strictPaymentBlock={ownerConfig.strictPaymentBlock}
            onResultReady={handlePaymentResult}
            t={t}
          />
        )}

        {activeView === 'map' && (
          <GlobalThreatMap customHotspots={ownerConfig.customHotspots} t={t} />
        )}

        {activeView === 'assistant' && (
          <AssistantPanel
            language={language}
            activeContextSummary={activeContextSummary}
            t={t}
          />
        )}

        {activeView === 'owner' && (
          <OwnerStudioPanel
            config={ownerConfig}
            userEmail={authUser?.email || null}
            onConfigUpdated={setOwnerConfig}
            onSignIn={handleGoogleSignIn}
            t={t}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className={`border-t ${themeSurfaceBorder} bg-slate-950/60 mt-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>
            {t.brandTitle} · {t.tagline}
          </span>
          <span>
            Never share real OTPs, passwords, or banking PINs with anyone online.
          </span>
        </div>
      </footer>
    </div>
  );
}
