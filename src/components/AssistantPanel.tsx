import { Bot, Mic, MicOff, Send, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import { sendAssistantMessageApi, transcribeAudioApi } from '../services/api';
import type { AssistantMessage, LanguageCode } from '../types';

interface AssistantPanelProps {
  language: LanguageCode;
  activeContextSummary?: string;
  t: TranslationBundle;
}

export function AssistantPanel({
  language,
  activeContextSummary,
  t,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: 'Hello! I am your ScamShield AI Cybersecurity Assistant. Paste a suspicious message, ask about a phone call or payment request, or use the microphone button to speak your question. Note: Never share your real OTPs, passwords, or bank PINs.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);

    try {
      const { reply } = await sendAssistantMessageApi({
        messages: nextHistory,
        language,
        activeContextSummary,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text:
            err instanceof Error
              ? err.message
              : 'Sorry, I could not reach the assistant right now.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 200) return;

        setIsTranscribing(true);
        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = String(reader.result || '');
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const { text } = await transcribeAudioApi({
            base64Audio,
            mimeType,
            language,
          });
          if (text) {
            setInput((prev) => (prev ? `${prev} ${text}` : text));
          }
        } catch (err) {
          setMicError(
            err instanceof Error ? err.message : 'Could not transcribe voice input.'
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError('Microphone permission denied. Please allow microphone access to use voice input.');
    }
  };

  const quickPrompts = [
    'How can I spot a fake bank KYC message?',
    'Someone asked for my UPI PIN to send me a refund—is that safe?',
    'What should I do if I already clicked a suspicious link?',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-blue-400" />
          <span>{t.assistantHeading}</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1">{t.assistantSubheading}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/75 overflow-hidden flex flex-col h-[560px]">
        {/* Quick Prompts Bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-slate-950/50 flex flex-wrap items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          {quickPrompts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              className="px-2.5 py-1 rounded-md bg-slate-800/85 hover:bg-slate-800 text-xs text-slate-200 border border-white/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950/75 border border-white/10 text-slate-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-3 bg-slate-950/75 border border-white/10 text-xs text-slate-400">
                {t.analyzingBtn}
              </div>
            </div>
          )}
        </div>

        {/* Microphone & Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-4 border-t border-white/10 bg-slate-950/60 space-y-2"
        >
          {micError && <div className="text-xs text-red-300">{micError}</div>}
          {isTranscribing && (
            <div className="text-xs text-blue-300">{t.micTranscribing}</div>
          )}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/15'
              }`}
              aria-label={isRecording ? t.micStopLabel : t.micStartLabel}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>{t.micStopLabel}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>{t.micStartLabel}</span>
                </>
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.assistantPlaceholder}
              className="flex-1 rounded-lg bg-slate-900 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
            />

            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.assistantSendBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
