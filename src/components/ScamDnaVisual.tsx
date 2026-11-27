import { motion } from 'motion/react';
import type { TranslationBundle } from '../i18n/translations';
import type { ScamDna, ThreatClassification } from '../types';

interface ScamDnaVisualProps {
  scamDna: ScamDna;
  classification: ThreatClassification;
  t: TranslationBundle;
}

export function ScamDnaVisual({ scamDna, classification, t }: ScamDnaVisualProps) {
  const axes: Array<{ key: keyof ScamDna; label: string; value: number }> = [
    { key: 'urgencyFear', label: t.dnaUrgencyFear, value: scamDna.urgencyFear },
    { key: 'impersonation', label: t.dnaImpersonation, value: scamDna.impersonation },
    { key: 'financialPressure', label: t.dnaFinancialPressure, value: scamDna.financialPressure },
    { key: 'credentialTheft', label: t.dnaCredentialTheft, value: scamDna.credentialTheft },
    { key: 'rewardBait', label: t.dnaRewardBait, value: scamDna.rewardBait },
    { key: 'manipulation', label: t.dnaManipulation, value: scamDna.manipulation },
  ];

  const accentHex =
    classification === 'High Risk'
      ? '#ef4444'
      : classification === 'Suspicious'
      ? '#f59e0b'
      : '#10b981';

  const fillRgba =
    classification === 'High Risk'
      ? 'rgba(239, 68, 68, 0.24)'
      : classification === 'Suspicious'
      ? 'rgba(245, 158, 11, 0.22)'
      : 'rgba(16, 185, 129, 0.22)';

  const cx = 135;
  const cy = 125;
  const maxR = 82;
  const rings = [25, 50, 75, 100];

  const pointFor = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const r = (Math.max(6, pct) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (maxR + 24) * Math.cos(angle),
      labelY: cy + (maxR + 20) * Math.sin(angle),
      outerX: cx + maxR * Math.cos(angle),
      outerY: cy + maxR * Math.sin(angle),
    };
  };

  const polygonPoints = axes
    .map((axis, idx) => {
      const pt = pointFor(idx, axis.value);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="border border-white/10 rounded-xl bg-slate-950/50 p-5">
      <div className="mb-4">
        <h4 className="text-base font-semibold text-white">{t.scamDnaTitle}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{t.scamDnaSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 6-Axis Radar Chart */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <svg
            viewBox="0 0 270 250"
            className="w-full max-w-[270px] h-auto overflow-visible"
            role="img"
            aria-label={t.scamDnaTitle}
          >
            {rings.map((ring) => {
              const ringPts = axes
                .map((_, idx) => {
                  const angle = (Math.PI * 2 * idx) / axes.length - Math.PI / 2;
                  const r = (ring / 100) * maxR;
                  return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={ring}
                  points={ringPts}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.18)"
                  strokeWidth="1"
                />
              );
            })}

            {axes.map((axis, idx) => {
              const pt = pointFor(idx, 100);
              return (
                <g key={axis.key}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={pt.outerX}
                    y2={pt.outerY}
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="1"
                  />
                  <text
                    x={pt.labelX}
                    y={pt.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-300 text-[9px] font-medium"
                  >
                    {axis.label.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            <motion.polygon
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              points={polygonPoints}
              fill={fillRgba}
              stroke={accentHex}
              strokeWidth="2"
            />

            {axes.map((axis, idx) => {
              const pt = pointFor(idx, axis.value);
              return (
                <circle
                  key={`${axis.key}-dot`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill={accentHex}
                  stroke="#070d1c"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        {/* 6 Animated Horizontal Tactic Meters */}
        <div className="lg:col-span-7 space-y-3.5">
          {axes.map((axis, idx) => {
            const barColor =
              axis.value >= 65
                ? 'bg-red-500'
                : axis.value >= 35
                ? 'bg-amber-400'
                : 'bg-emerald-400';

            return (
              <div key={axis.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{axis.label}</span>
                  <span className="font-mono tabular-nums text-slate-300 font-semibold">
                    {axis.value}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800/90 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.02, axis.value / 100) }}
                    transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left center' }}
                    className={`h-full w-full rounded-full ${barColor}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
