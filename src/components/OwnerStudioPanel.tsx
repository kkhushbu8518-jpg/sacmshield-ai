import { Check, Lock, Plus, Shield, Trash2, Unlock } from 'lucide-react';
import { useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import {
  addOwnerBlocklistApi,
  addOwnerHotspotApi,
  removeOwnerBlocklistApi,
  updateOwnerConfigApi,
} from '../services/api';
import { getAccessToken, getIdToken } from '../services/firebaseAuth';
import type { BlocklistEntry, OwnerConfig } from '../types';

interface OwnerStudioPanelProps {
  config: OwnerConfig;
  userEmail: string | null;
  onConfigUpdated: (next: OwnerConfig) => void;
  onSignIn: () => Promise<void>;
  t: TranslationBundle;
}

export function OwnerStudioPanel({
  config,
  userEmail,
  onConfigUpdated,
  onSignIn,
  t,
}: OwnerStudioPanelProps) {
  const isOwner =
    Boolean(userEmail) &&
    userEmail!.trim().toLowerCase() === config.ownerEmail.trim().toLowerCase();

  const [suspiciousThreshold, setSuspiciousThreshold] = useState(config.suspiciousThreshold);
  const [highRiskThreshold, setHighRiskThreshold] = useState(config.highRiskThreshold);
  const [strictPaymentBlock, setStrictPaymentBlock] = useState(config.strictPaymentBlock);
  const [modules, setModules] = useState(config.modules);

  const [newEntryType, setNewEntryType] = useState<BlocklistEntry['type']>('domain');
  const [newEntryValue, setNewEntryValue] = useState('');
  const [newEntryReason, setNewEntryReason] = useState('');

  const [hsCity, setHsCity] = useState('');
  const [hsCountry, setHsCountry] = useState('');
  const [hsLat, setHsLat] = useState('28.6139');
  const [hsLon, setHsLon] = useState('77.2090');
  const [hsRisk, setHsRisk] = useState('82');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthToken = async (): Promise<string> => {
    const idToken = await getIdToken();
    if (idToken) return idToken;
    const accessToken = getAccessToken();
    if (accessToken) return accessToken;
    throw new Error('Please sign in with the Owner Google account first.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setIsSaving(true);
    try {
      const token = await getAuthToken();
      const res = await updateOwnerConfigApi(token, {
        suspiciousThreshold,
        highRiskThreshold,
        strictPaymentBlock,
        modules,
      });
      onConfigUpdated(res.config);
      setStatusMsg(t.savedLabel);
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlocklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryValue.trim()) return;
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      const res = await addOwnerBlocklistApi(token, {
        type: newEntryType,
        value: newEntryValue,
        reason: newEntryReason,
      });
      onConfigUpdated(res.config);
      setNewEntryValue('');
      setNewEntryReason('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add blocklist item.');
    }
  };

  const handleRemoveBlocklist = async (id: string) => {
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      const res = await removeOwnerBlocklistApi(token, id);
      onConfigUpdated(res.config);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not remove item.');
    }
  };

  const handleAddHotspot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hsCity.trim() || !hsCountry.trim()) return;
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      const riskNum = Number(hsRisk) || 75;
      const res = await addOwnerHotspotApi(token, {
        city: hsCity.trim(),
        country: hsCountry.trim(),
        isoCode: hsCountry.trim().slice(0, 2).toUpperCase(),
        lat: Number(hsLat) || 0,
        lon: Number(hsLon) || 0,
        riskIndex: riskNum,
        tier: riskNum >= 85 ? 'Critical' : riskNum >= 70 ? 'High' : 'Elevated',
        primaryThreats: ['Owner-Reported Cybercrime Zone'],
        reportedIncidents30d: 450,
        summary: 'Custom regional risk hotspot added by app owner.',
      });
      onConfigUpdated(res.config);
      setHsCity('');
      setHsCountry('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add map hotspot.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-blue-400" />
            <span>{t.ownerHeading}</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">{t.ownerSubheading}</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {isOwner ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <Unlock className="w-4 h-4" />
              <span>{t.ownerUnlockedBadge} ({userEmail})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <Lock className="w-4 h-4" />
              <span>{t.ownerLockedTitle}</span>
            </span>
          )}
        </div>
      </div>

      {!isOwner && (
        <div className="rounded-xl border border-amber-400/35 bg-amber-950/25 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="text-sm font-semibold text-amber-200 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{t.ownerLockedTitle}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.ownerLockedDesc}
              {userEmail ? ` (Signed in as ${userEmail})` : ''}
            </p>
          </div>
          {!userEmail && (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              {t.signInGoogle}
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/35 px-4 py-2.5 text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sensitivity & Policy Controls */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-6 rounded-xl border border-white/10 bg-slate-900/75 p-5 space-y-5"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-200 font-semibold">{t.suspiciousThresholdLabel}</span>
                <span className="font-mono tabular-nums text-amber-300 font-semibold">
                  {suspiciousThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={60}
                disabled={!isOwner}
                value={suspiciousThreshold}
                onChange={(e) => setSuspiciousThreshold(Number(e.target.value))}
                className="w-full accent-amber-400 disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-200 font-semibold">{t.highRiskThresholdLabel}</span>
                <span className="font-mono tabular-nums text-red-400 font-semibold">
                  {highRiskThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min={45}
                max={90}
                disabled={!isOwner}
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
                className="w-full accent-red-500 disabled:opacity-50"
              />
            </div>

            <label className="flex items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs text-slate-200 cursor-pointer">
              <span className="font-semibold">{t.strictPaymentLabel}</span>
              <input
                type="checkbox"
                disabled={!isOwner}
                checked={strictPaymentBlock}
                onChange={(e) => setStrictPaymentBlock(e.target.checked)}
                className="h-4 w-4 accent-blue-500"
              />
            </label>
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">Active Protection Modules</div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {(
                [
                  ['smsScanner', 'SMS & Email Scanner'],
                  ['urlScanner', 'URL Scanner'],
                  ['gmailScanner', 'Gmail Scanner'],
                  ['phoneLookup', 'Phone Lookup'],
                  ['paymentGuard', 'Payment Guard'],
                  ['threatMap', 'Global Threat Map'],
                  ['voiceAssistant', 'Voice AI Assistant'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-200"
                >
                  <span className="truncate">{label}</span>
                  <input
                    type="checkbox"
                    disabled={!isOwner}
                    checked={modules[key]}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 accent-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {isOwner && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors inline-flex items-center justify-center gap-2"
            >
              {statusMsg ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{isSaving ? t.savingLabel : statusMsg || t.saveConfigBtn}</span>
            </button>
          )}
        </form>

        {/* Blocklist & Custom Map Hotspots */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-xl border border-white/10 bg-slate-900/75 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">{t.blocklistTitle}</h3>

            {isOwner && (
              <form onSubmit={handleAddBlocklist} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  value={newEntryType}
                  onChange={(e) => setNewEntryType(e.target.value as BlocklistEntry['type'])}
                  className="sm:col-span-3 rounded-lg bg-slate-950 border border-white/15 px-2.5 py-2 text-xs text-white"
                >
                  <option value="domain">Domain</option>
                  <option value="phone">Phone</option>
                  <option value="account">Account / UPI</option>
                </select>
                <input
                  type="text"
                  value={newEntryValue}
                  onChange={(e) => setNewEntryValue(e.target.value)}
                  placeholder="Value to flag"
                  className="sm:col-span-4 rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newEntryReason}
                  onChange={(e) => setNewEntryReason(e.target.value)}
                  placeholder="Reason"
                  className="sm:col-span-3 rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addBlocklistBtn}</span>
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {config.blocklist.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-white truncate">
                      {entry.type.toUpperCase()} · {entry.value}
                    </div>
                    <div className="text-slate-400 truncate mt-0.5">{entry.reason}</div>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBlocklist(entry.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0"
                      aria-label="Remove entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isOwner && (
            <form
              onSubmit={handleAddHotspot}
              className="rounded-xl border border-white/10 bg-slate-900/75 p-5 space-y-3"
            >
              <h3 className="text-sm font-semibold text-white">Add Threat Map City Hotspot</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  value={hsCity}
                  onChange={(e) => setHsCity(e.target.value)}
                  placeholder="City"
                  className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={hsCountry}
                  onChange={(e) => setHsCountry(e.target.value)}
                  placeholder="Country"
                  className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={hsLat}
                  onChange={(e) => setHsLat(e.target.value)}
                  placeholder="Lat"
                  className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  value={hsLon}
                  onChange={(e) => setHsLon(e.target.value)}
                  placeholder="Lon"
                  className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs font-mono text-white"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={hsRisk}
                  onChange={(e) => setHsRisk(e.target.value)}
                  placeholder="Risk"
                  className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
              >
                Add Hotspot to Global Map
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
