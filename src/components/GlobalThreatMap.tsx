import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { Globe, MapPin, Search, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import { GLOBAL_HOTSPOTS } from '../data/countriesAndMap';
import type { TranslationBundle } from '../i18n/translations';
import type { GlobalHotspot } from '../types';

interface GlobalThreatMapProps {
  customHotspots: GlobalHotspot[];
  t: TranslationBundle;
}

export function GlobalThreatMap({ customHotspots, t }: GlobalThreatMapProps) {
  const allHotspots = useMemo(
    () => [...customHotspots, ...GLOBAL_HOTSPOTS],
    [customHotspots]
  );

  const [tierFilter, setTierFilter] = useState<'All' | 'Critical' | 'High' | 'Elevated'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotspot, setSelectedHotspot] = useState<GlobalHotspot>(allHotspots[0]);

  const filteredHotspots = useMemo(() => {
    return allHotspots.filter((h) => {
      const matchesTier = tierFilter === 'All' || h.tier === tierFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q) ||
        h.primaryThreats.some((pt) => pt.toLowerCase().includes(q));
      return matchesTier && matchesQuery;
    });
  }, [allHotspots, tierFilter, searchQuery]);

  const { countries, projection, pathGen } = useMemo(() => {
    const topo = worldAtlas as unknown as {
      type: 'Topology';
      objects: { countries: Parameters<typeof feature>[1] };
    };
    const geojson = feature(topo as never, topo.objects.countries);
    const proj = geoNaturalEarth1().scale(175).translate([470, 255]);
    const pathGenerator = geoPath().projection(proj);
    const list = 'features' in geojson ? geojson.features : [];
    return { countries: list, projection: proj, pathGen: pathGenerator };
  }, []);

  const hotspotCountryNames = useMemo(() => {
    const map = new Map<string, GlobalHotspot>();
    for (const h of allHotspots) {
      map.set(h.country.toLowerCase(), h);
    }
    return map;
  }, [allHotspots]);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-blue-400" />
            <span>{t.mapHeading}</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">{t.mapSubheading}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="City, country, or scam..."
              className="pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-white/15 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400 w-52"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 border border-white/10">
            {(['All', 'Critical', 'High', 'Elevated'] as const).map((tier) => {
              const label =
                tier === 'All'
                  ? t.mapFilterAll
                  : tier === 'Critical'
                  ? t.mapFilterCritical
                  : tier === 'High'
                  ? t.mapFilterHigh
                  : t.mapFilterElevated;
              const active = tierFilter === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map + City Intelligence Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-xl border border-white/10 bg-slate-950/70 p-4 flex flex-col justify-between overflow-hidden">
          <svg
            viewBox="0 0 940 490"
            className="w-full h-auto"
            role="img"
            aria-label={t.mapHeading}
          >
            <rect width="940" height="490" rx="10" fill="#060c1a" />
            <g>
              {countries.map((c, idx) => {
                const name = String((c.properties as { name?: string })?.name || '');
                const matched = hotspotCountryNames.get(name.toLowerCase());
                const isSelectedCountry =
                  selectedHotspot.country.toLowerCase() === name.toLowerCase() ||
                  (selectedHotspot.country === 'United States' && name === 'United States of America');

                let fill = '#13203d';
                if (matched) {
                  fill =
                    matched.tier === 'Critical'
                      ? 'rgba(239, 68, 68, 0.28)'
                      : matched.tier === 'High'
                      ? 'rgba(245, 158, 11, 0.24)'
                      : 'rgba(56, 189, 248, 0.22)';
                }
                if (isSelectedCountry) {
                  fill = 'rgba(239, 68, 68, 0.44)';
                }

                return (
                  <path
                    key={c.id ?? idx}
                    d={pathGen(c as never) || ''}
                    fill={fill}
                    stroke="rgba(148, 163, 184, 0.22)"
                    strokeWidth="0.65"
                    className="transition-colors duration-150 hover:fill-blue-500/35"
                  />
                );
              })}
            </g>

            {/* City Cybercrime Markers */}
            {filteredHotspots.map((hotspot) => {
              const projected = projection([hotspot.lon, hotspot.lat]);
              if (!projected) return null;
              const [x, y] = projected;
              const isSelected = selectedHotspot.id === hotspot.id;
              const markerColor =
                hotspot.tier === 'Critical'
                  ? '#ef4444'
                  : hotspot.tier === 'High'
                  ? '#f59e0b'
                  : '#38bdf8';

              return (
                <g
                  key={hotspot.id}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 16 : 11}
                    fill={markerColor}
                    opacity={isSelected ? 0.28 : 0.16}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6.5 : 4.5}
                    fill={markerColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="fill-slate-100 text-[10px] font-medium pointer-events-none"
                  >
                    {hotspot.city.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 mt-2 border-t border-white/10 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                {t.mapFilterCritical} (85–100)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                {t.mapFilterHigh} (70–84)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                {t.mapFilterElevated} (50–69)
              </span>
            </div>
            <span className="font-mono tabular-nums">
              {filteredHotspots.length} active city zones
            </span>
          </div>
        </div>

        {/* Selected City Cybercrime Details + List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl border border-red-500/30 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{selectedHotspot.country} · {selectedHotspot.isoCode}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedHotspot.city}</h3>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-xs text-slate-400">{t.mapRiskIndexLabel}</div>
                <div
                  className={`text-xl font-bold ${
                    selectedHotspot.tier === 'Critical'
                      ? 'text-red-400'
                      : selectedHotspot.tier === 'High'
                      ? 'text-amber-300'
                      : 'text-sky-300'
                  }`}
                >
                  {selectedHotspot.riskIndex}/100
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{selectedHotspot.summary}</p>

            <div className="grid grid-cols-2 gap-3 border-y border-white/10 py-3 text-xs">
              <div>
                <div className="text-slate-400">{t.mapIncidentsLabel}</div>
                <div className="font-mono tabular-nums text-white font-semibold text-sm mt-0.5">
                  {selectedHotspot.reportedIncidents30d.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Severity Tier</div>
                <div className="font-semibold text-red-300 mt-0.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{selectedHotspot.tier}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-200 mb-2">{t.mapThreatsLabel}</div>
              <ul className="space-y-1">
                {selectedHotspot.primaryThreats.map((threat) => (
                  <li key={threat} className="text-xs text-slate-300">
                    • {threat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/65 p-4 flex-1 overflow-y-auto max-h-[260px] space-y-1.5">
            {filteredHotspots.map((hotspot) => {
              const active = hotspot.id === selectedHotspot.id;
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  onClick={() => setSelectedHotspot(hotspot)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 text-xs ${
                    active
                      ? 'bg-blue-600/25 border border-blue-400/40 text-white'
                      : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-semibold">{hotspot.city}</span>
                    <span className="text-slate-400"> · {hotspot.country}</span>
                  </div>
                  <span
                    className={`font-mono tabular-nums font-semibold shrink-0 ${
                      hotspot.tier === 'Critical'
                        ? 'text-red-400'
                        : hotspot.tier === 'High'
                        ? 'text-amber-300'
                        : 'text-sky-300'
                    }`}
                  >
                    {hotspot.riskIndex}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
