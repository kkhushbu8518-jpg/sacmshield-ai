import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Globe2,
  Info,
  Link2,
  Phone,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { COUNTRIES } from '../data/countriesAndMap';
import type { TranslationBundle } from '../i18n/translations';
import { connectUserPhoneApi, lookupPhoneApi } from '../services/api';
import type { LanguageCode, PhoneLookupResult, PhoneNotificationEvent } from '../types';
import { ScamDnaVisual } from './ScamDnaVisual';

interface PhoneLookupPanelProps {
  language: LanguageCode;
  connectedPhone: { normalized: string; countryName: string } | null;
  onConnectedPhoneChange: (next: { normalized: string; countryName: string } | null) => void;
  recentNotifications: PhoneNotificationEvent[];
  onNotificationAdded: (event: PhoneNotificationEvent) => void;
  onResultReady: (result: PhoneLookupResult) => void;
  t: TranslationBundle;
}

export function PhoneLookupPanel({
  language,
  connectedPhone,
  onConnectedPhoneChange,
  recentNotifications,
  onNotificationAdded,
  onResultReady,
  t,
}: PhoneLookupPanelProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhoneLookupResult | null>(null);

  // Connect My Number state
  const [myCountryCode, setMyCountryCode] = useState('IN');
  const [myPhoneInput, setMyPhoneInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode) || COUNTRIES[0];
  const myCountry = COUNTRIES.find((c) => c.code === myCountryCode) || COUNTRIES[0];

  const handleConnectMyNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError(null);
    setIsConnecting(true);
    try {
      const res = await connectUserPhoneApi({
        countryCode: myCountry.code,
        countryName: myCountry.name,
        dialCode: myCountry.dialCode,
        phoneNumber: myPhoneInput,
      });
      onConnectedPhoneChange({ normalized: res.normalized, countryName: res.countryName });
      setMyPhoneInput('');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect number.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await lookupPhoneApi({
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        dialCode: selectedCountry.dialCode,
        phoneNumber,
        contextNote,
        connectedUserPhone: connectedPhone,
        language,
      });
      setResult(res);
      if (res.notificationEvent) {
        onNotificationAdded(res.notificationEvent);
      }
      onResultReady(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phone lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSamplePhone = (countryCode: string, num: string, note: string) => {
    setSelectedCountryCode(countryCode);
    setPhoneNumber(num);
    setContextNote(note);
  };

  const isDanger = result?.classification === 'High Risk';
  const isWarn = result?.classification === 'Suspicious';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Phone className="w-6 h-6 text-blue-400" />
          <span>{t.phoneHeading}</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1">{t.phoneSubheading}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Phone Check + Connect My Number */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleLookup}
            className="rounded-xl border border-white/10 bg-slate-900/75 p-5 space-y-4"
          >
            {/* 1. Country Selection BEFORE entering phone number */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {t.selectCountryLabel}
              </label>
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.dialCode})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Phone Number Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {t.enterPhoneLabel}
              </label>
              <div className="flex items-stretch gap-2">
                <div className="px-3 py-2.5 rounded-lg bg-slate-950/90 border border-white/15 text-sm font-mono text-blue-300 flex items-center shrink-0">
                  {selectedCountry.dialCode}
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={selectedCountry.placeholder}
                  className="flex-1 rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Optional Context */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {t.phoneContextLabel}
              </label>
              <input
                type="text"
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                placeholder="e.g., Claimed to be bank KYC officer asking for OTP"
                className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || phoneNumber.trim().length < 5}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors whitespace-nowrap"
            >
              {isLoading ? t.analyzingBtn : t.lookupPhoneBtn}
            </button>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="text-xs text-slate-400">{t.sampleScenariosTitle}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    loadSamplePhone('IN', '9876543210', 'Caller demanded urgent bank KYC OTP update')
                  }
                  className="px-2.5 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 whitespace-nowrap"
                >
                  +91 Suspect KYC Caller
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadSamplePhone('US', '8005550199', 'Robocall threatening tax arrest warrant')
                  }
                  className="px-2.5 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 whitespace-nowrap"
                >
                  +1 IRS Impersonator
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadSamplePhone('GB', '2079460958', 'Appointment confirmation from local clinic')
                  }
                  className="px-2.5 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 whitespace-nowrap"
                >
                  +44 Clean Clinic Line
                </button>
              </div>
            </div>
          </form>

          {/* Connect My Number for Instant Notification */}
          <div className="rounded-xl border border-white/10 bg-slate-900/75 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span>{t.connectMyNumberTitle}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{t.connectMyNumberDesc}</p>

            {connectedPhone ? (
              <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/30 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.connectedNumberActive}</span>
                  </div>
                  <div className="font-mono text-sm text-white mt-0.5">
                    {connectedPhone.normalized} · {connectedPhone.countryName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onConnectedPhoneChange(null)}
                  className="px-3 py-1.5 rounded-md border border-white/15 bg-slate-900 text-xs text-slate-200 hover:text-white whitespace-nowrap shrink-0"
                >
                  {t.disconnectNumberBtn}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectMyNumber} className="space-y-2.5">
                <div className="flex gap-2">
                  <select
                    value={myCountryCode}
                    onChange={(e) => setMyCountryCode(e.target.value)}
                    className="rounded-lg bg-slate-950/90 border border-white/15 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={myPhoneInput}
                    onChange={(e) => setMyPhoneInput(e.target.value)}
                    placeholder={myCountry.placeholder}
                    className="flex-1 rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
                {connectError && <p className="text-xs text-red-300">{connectError}</p>}
                <button
                  type="submit"
                  disabled={isConnecting || myPhoneInput.trim().length < 5}
                  className="w-full py-2 px-3 rounded-lg border border-emerald-400/35 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-50 text-xs font-semibold text-emerald-200 transition-colors"
                >
                  {t.connectNumberBtn}
                </button>
              </form>
            )}

            {recentNotifications.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-amber-300" />
                  <span>Recent Caller Notifications</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {recentNotifications.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[11px] text-slate-300 rounded-md bg-slate-950/60 border border-white/10 p-2 leading-relaxed"
                    >
                      {ev.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Phone Lookup Results */}
        <div className="lg:col-span-7">
          {!result && !isLoading && (
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-8 text-center min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/25 flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t.emptyResultsTitle}</h3>
              <p className="text-sm text-slate-400 max-w-md mt-2">
                Select a country, enter the suspicious phone number, and view the registered profile, originating country, and suspicious call count.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
              <div className="h-6 w-56 rounded bg-slate-800 animate-pulse" />
              <div className="h-28 rounded-lg bg-slate-800/60 animate-pulse" />
              <div className="h-44 rounded-lg bg-slate-800/50 animate-pulse" />
            </div>
          )}

          {result && !isLoading && (
            <div
              className={`rounded-xl border p-6 space-y-5 bg-slate-900/80 ${
                isDanger
                  ? 'border-red-500/50'
                  : isWarn
                  ? 'border-amber-400/50'
                  : 'border-emerald-500/50'
              }`}
            >
              {/* Notification Event Banner if connected number was notified */}
              {result.notificationEvent && (
                <div className="rounded-lg border border-blue-400/40 bg-blue-950/40 p-3.5 flex items-start gap-3">
                  <BellRing className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-100 leading-relaxed">
                    <div className="font-semibold">{t.callerNotificationBanner}</div>
                    <div className="mt-0.5 text-blue-200/90">{result.notificationEvent.message}</div>
                  </div>
                </div>
              )}

              {/* Verdict Header */}
              <div
                className={`rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
                  isDanger
                    ? 'border-red-500/40 bg-red-950/35'
                    : isWarn
                    ? 'border-amber-400/40 bg-amber-950/30'
                    : 'border-emerald-500/40 bg-emerald-950/30'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {isDanger ? (
                    <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-8 h-8 text-amber-300 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-mono text-lg font-bold text-white">
                      {result.normalizedNumber}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        isDanger
                          ? 'text-red-300'
                          : isWarn
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {result.classification} · {result.riskScore}/100
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">{t.suspiciousCallsLabel}</div>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      result.suspiciousCallsTillDate > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {result.suspiciousCallsTillDate.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Registration & Origin Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.registeredHolderLabel}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    {result.registeredHolderName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{result.holderCategory}</div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.originCountryLabel}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    {result.countryName} ({result.countryCode})
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t.carrierTypeLabel}: {result.carrierOrLineType}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>

              {/* Scam DNA Fingerprint */}
              <ScamDnaVisual scamDna={result.scamDna} classification={result.classification} t={t} />

              {/* Explanation & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    {t.explanationLabel}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>
                  <div className="text-xs text-slate-400 pt-1">
                    {t.communityReportsLabel}:{' '}
                    <span className="font-mono tabular-nums text-slate-200">
                      {result.communityReports.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    {t.recommendationsLabel}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-blue-400/20 bg-blue-950/25 px-4 py-3 flex items-start gap-2.5 text-xs text-slate-300">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{result.uncertaintyNote}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
