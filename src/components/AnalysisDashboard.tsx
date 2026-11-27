import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Link2Off,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import type { ScanResult } from '../types';
import { ScamDnaVisual } from './ScamDnaVisual';

interface AnalysisDashboardProps {
  result: ScanResult | null;
  isLoading: boolean;
  onClear: () => void;
  t: TranslationBundle;
}

export function AnalysisDashboard({ result, isLoading, onClear, t }: AnalysisDashboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    const lines = [
      `ScamShield AI — ${result.classification} (${result.riskScore}/100)`,
      `Summary: ${result.summary}`,
      `Warning Signs: ${result.warningSigns.map((w) => `${w.title}: ${w.detail}`).join(' | ') || 'None'}`,
      `Explanation: ${result.explanation}`,
      `Recommendations: ${result.recommendations.join('; ')}`,
      `Notice: ${result.uncertaintyNote}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 rounded bg-slate-800 animate-pulse" />
          <div className="h-5 w-24 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="h-24 rounded-lg bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 rounded-lg bg-slate-800/50 animate-pulse" />
          <div className="h-44 rounded-lg bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-8 text-center flex flex-col items-center justify-center min-h-[340px]">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/25 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t.emptyResultsTitle}</h3>
        <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">{t.emptyResultsDesc}</p>
      </div>
    );
  }

  const isDanger = result.classification === 'High Risk';
  const isWarn = result.classification === 'Suspicious';

  const statusTone = isDanger
    ? {
        border: 'border-red-500/45',
        bg: 'bg-red-950/35',
        text: 'text-red-300',
        bar: 'bg-red-500',
        badgeLabel: t.highRiskLabel,
        Icon: ShieldAlert,
      }
    : isWarn
    ? {
        border: 'border-amber-400/45',
        bg: 'bg-amber-950/30',
        text: 'text-amber-300',
        bar: 'bg-amber-400',
        badgeLabel: t.suspiciousLabel,
        Icon: AlertTriangle,
      }
    : {
        border: 'border-emerald-500/45',
        bg: 'bg-emerald-950/30',
        text: 'text-emerald-300',
        bar: 'bg-emerald-500',
        badgeLabel: t.safeLabel,
        Icon: ShieldCheck,
      };

  const StatusIcon = statusTone.Icon;

  return (
    <div className={`rounded-xl border ${statusTone.border} bg-slate-900/75 p-6 space-y-6 transition-colors duration-200`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t.resultsHeading}</h3>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span className="uppercase font-mono">{result.mode}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t.copiedLabel : t.copyResultsBtn}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.clearBtn}
          </button>
        </div>
      </div>

      {/* Risk Score + Verdict */}
      <div className={`rounded-xl border ${statusTone.border} ${statusTone.bg} p-5`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-white/15 bg-slate-950/70 flex flex-col items-center justify-center shrink-0">
              <span className={`text-2xl font-bold font-mono tabular-nums ${statusTone.text}`}>
                {result.riskScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
            </div>
            <div>
              <div className="text-xs text-slate-400">{t.classificationLabel}</div>
              <div className={`flex items-center gap-2 text-lg font-bold mt-0.5 ${statusTone.text}`}>
                <StatusIcon className="w-5 h-5 shrink-0" />
                <span>{statusTone.badgeLabel}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t.riskScoreLabel}</span>
              <span className="font-mono tabular-nums font-semibold">{result.riskScore} / 100</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-950/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${statusTone.bar}`}
                style={{ width: `${Math.max(4, result.riskScore)}%` }}
              />
            </div>
            <p className="text-sm text-slate-100 leading-relaxed pt-1">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* Safe URL Inspection Metadata (Never Clickable) */}
      {result.domainSignals && (
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
            <Link2Off className="w-4 h-4 shrink-0" />
            <span>{t.urlSafetyNotice}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <div className="text-slate-400">Host</div>
              <div className="font-mono text-slate-100 break-all mt-0.5">{result.domainSignals.hostname}</div>
            </div>
            <div>
              <div className="text-slate-400">Protocol</div>
              <div className="font-mono text-slate-100 uppercase mt-0.5">{result.domainSignals.protocol}</div>
            </div>
            <div>
              <div className="text-slate-400">Lookalike / Punycode</div>
              <div className="font-mono text-slate-100 mt-0.5">
                {result.domainSignals.hasPunycodeOrLookalike ? 'Flagged' : 'None Detected'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Suspicious TLD / IP</div>
              <div className="font-mono text-slate-100 mt-0.5">
                {result.domainSignals.usesIpAddress || result.domainSignals.suspiciousTld ? 'Flagged' : 'Standard'}
              </div>
            </div>
          </div>
          {result.domainSignals.pathFlags.length > 0 && (
            <div className="text-xs text-amber-300 pt-1">
              {result.domainSignals.pathFlags.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Scam DNA Fingerprint */}
      <ScamDnaVisual scamDna={result.scamDna} classification={result.classification} t={t} />

      {/* Warning Signs & Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-5 space-y-3">
          <h4 className="text-sm font-semibold text-white">{t.warningSignsLabel}</h4>
          {result.warningSigns.length === 0 ? (
            <p className="text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t.noWarningsLabel}</span>
            </p>
          ) : (
            <ul className="space-y-3">
              {result.warningSigns.map((sign, index) => (
                <li key={`${sign.title}-${index}`} className="border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-100">{sign.title}</span>
                    <span
                      className={`font-mono uppercase ${
                        sign.severity === 'high'
                          ? 'text-red-400'
                          : sign.severity === 'medium'
                          ? 'text-amber-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {sign.category} · {sign.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{sign.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-white">{t.explanationLabel}</h4>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{result.explanation}</p>
            {result.socialEngineeringTechniques.length > 0 && (
              <div className="mt-3 text-xs text-blue-300">
                {result.socialEngineeringTechniques.join(' · ')}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10">
            <h4 className="text-sm font-semibold text-white">{t.recommendationsLabel}</h4>
            <ul className="mt-2 space-y-1.5">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Honesty & Uncertainty Notice */}
      <div className="rounded-lg border border-blue-400/20 bg-blue-950/25 px-4 py-3 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-200">{t.uncertaintyLabel}: </span>
          <span>{result.uncertaintyNote}</span>
        </div>
      </div>
    </div>
  );
}
