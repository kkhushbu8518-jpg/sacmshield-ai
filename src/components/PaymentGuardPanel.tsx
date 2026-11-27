import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Info,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { PAYMENT_PRESETS } from '../data/countriesAndMap';
import type { TranslationBundle } from '../i18n/translations';
import { checkPaymentApi } from '../services/api';
import type { LanguageCode, PaymentCheckResult } from '../types';
import { ScamDnaVisual } from './ScamDnaVisual';

interface PaymentGuardPanelProps {
  language: LanguageCode;
  strictPaymentBlock: boolean;
  onResultReady: (result: PaymentCheckResult) => void;
  t: TranslationBundle;
}

export function PaymentGuardPanel({
  language,
  strictPaymentBlock,
  onResultReady,
  t,
}: PaymentGuardPanelProps) {
  const [method, setMethod] = useState('UPI / Instant Transfer');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [amount, setAmount] = useState('120');
  const [currency, setCurrency] = useState('USD');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentCheckResult | null>(null);
  const [transferFeedback, setTransferFeedback] = useState<'none' | 'confirmed' | 'blocked'>('none');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTransferFeedback('none');
    setIsLoading(true);
    try {
      const res = await checkPaymentApi({
        method,
        receiverName,
        receiverAccount,
        amount,
        currency,
        note,
        language,
      });
      setResult(res);
      onResultReady(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment check failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: (typeof PAYMENT_PRESETS)[number]) => {
    setMethod(preset.method);
    setReceiverName(preset.receiverName);
    setReceiverAccount(preset.receiverAccount);
    setAmount(preset.amount);
    setCurrency(preset.currency);
    setNote(preset.note);
    setTransferFeedback('none');
  };

  const handleConfirmTransfer = () => {
    if (!result) return;
    if (result.status === 'fraud' && strictPaymentBlock) {
      setTransferFeedback('blocked');
      return;
    }
    setTransferFeedback('confirmed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-blue-400" />
          <span>{t.paymentHeading}</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1">{t.paymentSubheading}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCheck}
          className="lg:col-span-5 rounded-xl border border-white/10 bg-slate-900/75 p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {t.paymentMethodLabel}
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
              >
                <option value="UPI / Instant Transfer">UPI / Instant Transfer</option>
                <option value="Bank Transfer">Bank Transfer / IBAN</option>
                <option value="International Wire">International Wire</option>
                <option value="Card / Merchant Checkout">Card / Merchant Checkout</option>
                <option value="Crypto Wallet">Crypto Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {t.amountLabel}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg bg-slate-950/90 border border-white/15 px-2 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              {t.receiverNameLabel}
            </label>
            <input
              type="text"
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="e.g., City Power Co. or Support Agent"
              className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              {t.receiverAccountLabel}
            </label>
            <input
              type="text"
              required
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              placeholder="e.g., merchant@okbank or IBAN / wallet"
              className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              {t.paymentNoteLabel}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did the receiver tell you this payment is for?"
              className="w-full rounded-lg bg-slate-950/90 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !receiverAccount.trim()}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
          >
            {isLoading ? t.analyzingBtn : t.verifyPaymentBtn}
          </button>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-xs text-slate-400">{t.sampleScenariosTitle}</div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 whitespace-nowrap"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="lg:col-span-7">
          {!result && !isLoading && (
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-8 text-center min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/25 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t.emptyResultsTitle}</h3>
              <p className="text-sm text-slate-400 max-w-md mt-2">
                Enter receiver details to immediately detect whether the destination account is flagged for fraud or appears secured before paying.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
              <div className="h-16 rounded-lg bg-slate-800/70 animate-pulse" />
              <div className="h-44 rounded-lg bg-slate-800/50 animate-pulse" />
            </div>
          )}

          {result && !isLoading && (
            <div
              className={`rounded-xl border p-6 space-y-5 bg-slate-900/80 ${
                result.status === 'fraud'
                  ? 'border-red-500/55'
                  : result.status === 'suspicious'
                  ? 'border-amber-400/50'
                  : 'border-emerald-500/55'
              }`}
            >
              {/* Immediate Receiver Notification Banner */}
              <div
                className={`rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
                  result.status === 'fraud'
                    ? 'border-red-500/50 bg-red-950/45'
                    : result.status === 'suspicious'
                    ? 'border-amber-400/45 bg-amber-950/35'
                    : 'border-emerald-500/45 bg-emerald-950/35'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {result.status === 'fraud' ? (
                    <ShieldAlert className="w-9 h-9 text-red-400 shrink-0" />
                  ) : result.status === 'suspicious' ? (
                    <AlertTriangle className="w-9 h-9 text-amber-300 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-9 h-9 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        result.status === 'fraud'
                          ? 'text-red-300'
                          : result.status === 'suspicious'
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {result.status === 'fraud'
                        ? t.paymentFraudBadge
                        : result.status === 'suspicious'
                        ? t.paymentSuspiciousBadge
                        : t.paymentSecuredBadge}
                    </div>
                    <div className="text-xs text-slate-200 mt-0.5">
                      {result.receiverName} ·{' '}
                      <span className="font-mono">{result.receiverAccount}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">{t.riskScoreLabel}</div>
                  <div className="text-2xl font-bold text-white">{result.riskScore}/100</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-semibold text-white">{result.headline}</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
              </div>

              {/* Action Gate */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-4">
                <div className="text-xs text-slate-300 font-mono tabular-nums">
                  {result.method} · {result.amount} {result.currency}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    result.status === 'fraud'
                      ? 'bg-red-600/80 hover:bg-red-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {t.confirmPaymentBtn}
                </button>
              </div>

              {transferFeedback === 'blocked' && (
                <div className="rounded-lg border border-red-500/45 bg-red-950/45 px-4 py-3 text-xs text-red-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{t.paymentBlockedNotice}</span>
                </div>
              )}

              {transferFeedback === 'confirmed' && (
                <div className="rounded-lg border border-emerald-500/45 bg-emerald-950/45 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.paymentSuccessNotice}</span>
                </div>
              )}

              <ScamDnaVisual scamDna={result.scamDna} classification={result.classification} t={t} />

              {result.warningSigns.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    {t.warningSignsLabel}
                  </h4>
                  <ul className="space-y-2">
                    {result.warningSigns.map((w, idx) => (
                      <li key={idx} className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-100">{w.title}:</span> {w.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
