import { Mail, RefreshCw, Shield } from 'lucide-react';
import { useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import { fetchGmailMessages } from '../services/api';
import type { GmailEmailSummary } from '../types';

interface GmailInboxPanelProps {
  accessToken: string | null;
  userEmail: string | null;
  onGoogleSignIn: () => Promise<void>;
  onScanEmail: (content: string, subject: string) => void;
  isScanning: boolean;
  t: TranslationBundle;
}

export function GmailInboxPanel({
  accessToken,
  userEmail,
  onGoogleSignIn,
  onScanEmail,
  isScanning,
  t,
}: GmailInboxPanelProps) {
  const [emails, setEmails] = useState<GmailEmailSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchInbox = async () => {
    if (!accessToken) return;
    setError(null);
    setIsLoading(true);
    try {
      const items = await fetchGmailMessages(accessToken, 8);
      setEmails(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch Gmail messages.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span>{t.gmailHeading}</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {userEmail ? `Connected: ${userEmail}` : t.gmailConnectDesc}
          </p>
        </div>

        {!accessToken ? (
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="gsi-material-button"
          >
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span className="gsi-material-button-contents">{t.signInGoogle}</span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFetchInbox}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.gmailFetchBtn}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/35 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {emails.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-5 text-center text-xs text-slate-400">
          {accessToken
            ? 'Click "Refresh Inbox" to load your recent Gmail messages for phishing analysis.'
            : t.gmailNoEmails}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {emails.map((email) => (
            <div
              key={email.id}
              className="rounded-lg border border-white/10 bg-slate-950/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{email.subject}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {email.from}
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1">{email.snippet}</p>
              </div>
              <button
                type="button"
                disabled={isScanning}
                onClick={() =>
                  onScanEmail(
                    `From: ${email.from}\nSubject: ${email.subject}\n\n${email.bodyText}`,
                    email.subject
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/90 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t.gmailScanEmailBtn}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
