"use client";

import { useEffect, useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { usStates, usNation, countiesForStates } from "@/lib/topology";
import type { Feature, Geometry } from "geojson";

// Sequential blue ramp, low -> high value. Low value fades toward the page
// background in both themes; high value stands out — which means light and
// dark mode need different endpoints (light mode: low=near-white, high=near-
// navy, both readable on a white surface; dark mode: low=dim/desaturated,
// high=bright, both readable on a near-black surface — a straight reuse of
// the light ramp put the darkest, highest-value steps almost invisible
// against the dark surface, confirmed visually 2026-07-26).
const SEQUENTIAL_RAMP_LIGHT = [
  "#cde2fb",
  "#b7d3f6",
  "#9ec5f4",
  "#86b6ef",
  "#6da7ec",
  "#5598e7",
  "#3987e5",
  "#2a78d6",
  "#256abf",
  "#1c5cab",
  "#184f95",
  "#104281",
  "#0d366b",
];

const SEQUENTIAL_RAMP_DARK = [
  "#182a3d",
  "#1a3350",
  "#1d3d62",
  "#204775",
  "#255588",
  "#2c649c",
  "#3373b0",
  "#3987e5",
  "#5598e7",
  "#6da7ec",
  "#86b6ef",
  "#9ec5f4",
  "#b7d3f6",
];

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return isDark;
}

export interface MapDatum {
  value: number;
  asOf: string;
  /** True when this entity's value is a disclosed fallback/estimate rather
   * than a true reading for that specific geography (e.g. an NSSP
   * state-estimate row standing in for a county, or an HSA value shared
   * across NYC boroughs). */
  isEstimate?: boolean;
  estimateNote?: string;
}

interface ChoroplethProps {
  view: "states" | "counties";
  /** Keyed by 2-digit state FIPS or 5-digit county FIPS. */
  data: Record<string, MapDatum>;
  unit: string;
  /** For the counties view: which state(s) we're drilled into. Accepts
   * multiple states for pinned multi-state panels (e.g. tri-state/NYC). */
  stateFips?: string | string[];
  /** County FIPS to visually call out with a distinct outline (e.g. the 5
   * NYC boroughs within the tri-state view). */
  highlightFips?: string[];
  onSelectState?: (fips: string, name: string) => void;
  onBack?: () => void;
}

const VIEWBOX = "0 0 975 610";

function formatValue(v: number, unit: string): string {
  const rounded = Math.abs(v) < 10 ? Math.round(v * 100) / 100 : Math.round(v);
  return `${rounded}${unit.startsWith("%") ? "" : " "}${unit}`;
}

export function Choropleth({
  view,
  data,
  unit,
  stateFips,
  highlightFips,
  onSelectState,
  onBack,
}: ChoroplethProps) {
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    name: string;
    datum?: MapDatum;
  } | null>(null);

  const path = useMemo(() => geoPath(), []);
  const isDark = useIsDarkMode();
  const sequentialRamp = isDark ? SEQUENTIAL_RAMP_DARK : SEQUENTIAL_RAMP_LIGHT;

  const stateFipsList = Array.isArray(stateFips) ? stateFips : [stateFips ?? ""];
  const features =
    view === "states" ? usStates.features : countiesForStates(stateFipsList).features;

  const values = Object.values(data).map((d) => d.value);
  const maxValue = values.length ? Math.max(...values) : 1;
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain(sequentialRamp.map((_, i) => (i / (sequentialRamp.length - 1)) * (maxValue || 1)))
        .range(sequentialRamp)
        .clamp(true),
    [maxValue, sequentialRamp]
  );

  function fillFor(fips: string): string {
    const datum = data[fips];
    if (!datum) return "var(--color-no-data)";
    return colorScale(datum.value);
  }

  const stateOptions = useMemo(
    () =>
      usStates.features
        .map((f) => ({
          fips: String(f.id),
          name: (f.properties as { name?: string })?.name ?? String(f.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  return (
    <div className="relative w-full">
      {view === "states" && onSelectState && (
        <label className="mb-2 flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Jump to state (keyboard/screen-reader equivalent to clicking the map)
          <select
            className="rounded border px-2 py-1"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            value=""
            onChange={(e) => {
              const opt = stateOptions.find((s) => s.fips === e.target.value);
              if (opt) onSelectState(opt.fips, opt.name);
            }}
          >
            <option value="" disabled>
              Choose a state…
            </option>
            {stateOptions.map((s) => (
              <option key={s.fips} value={s.fips}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <svg
        viewBox={VIEWBOX}
        className="w-full h-auto"
        role="img"
        aria-label={`US ${view} choropleth, ${unit}`}
      >
        <path
          d={path(usNation.features[0] as Feature<Geometry>) ?? undefined}
          className="fill-none"
          stroke="var(--color-border-default)"
          strokeWidth={1.5}
        />
        {features.map((f) => {
          const fips = String(f.id);
          const name = (f.properties as { name?: string })?.name ?? fips;
          const datum = data[fips];
          return (
            <path
              key={fips}
              d={path(f as Feature<Geometry>) ?? undefined}
              fill={fillFor(fips)}
              stroke="var(--color-bg-surface)"
              strokeWidth={view === "states" ? 1 : 0.5}
              className={
                view === "states"
                  ? "cursor-pointer transition-opacity hover:opacity-80"
                  : ""
              }
              onClick={
                view === "states" && onSelectState
                  ? () => onSelectState(fips, name)
                  : undefined
              }
              onMouseMove={(e) => {
                const rect = (
                  e.currentTarget.ownerSVGElement as SVGSVGElement
                ).getBoundingClientRect();
                setHover({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  name,
                  datum,
                });
              }}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
        {view === "counties" &&
          features
            .filter((f) => data[String(f.id)]?.isEstimate)
            .map((f) => (
              <path
                key={`estimate-${f.id}`}
                d={path(f as Feature<Geometry>) ?? undefined}
                fill="none"
                stroke="var(--color-text-muted)"
                strokeDasharray="2,2"
                strokeWidth={1}
                pointerEvents="none"
              />
            ))}
        {view === "counties" &&
          highlightFips &&
          features
            .filter((f) => highlightFips.includes(String(f.id)))
            .map((f) => (
              <path
                key={`highlight-${f.id}`}
                d={path(f as Feature<Geometry>) ?? undefined}
                fill="none"
                stroke="var(--color-focus)"
                strokeWidth={1.5}
                pointerEvents="none"
              />
            ))}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: Math.min(hover.x + 12, 820),
            top: Math.max(hover.y - 12, 0),
            background: "var(--color-bg-surface)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
        >
          <div className="font-medium">{hover.name}</div>
          {hover.datum ? (
            <>
              <div>{formatValue(hover.datum.value, unit)}</div>
              <div style={{ color: "var(--color-text-muted)" }}>
                as of {hover.datum.asOf}
              </div>
              {hover.datum.isEstimate && (
                <div className="mt-1 max-w-[200px]" style={{ color: "var(--color-state-low)" }}>
                  {hover.datum.estimateNote ?? "Estimated value, not a direct reading"}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "var(--color-text-muted)" }}>No data</div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {view === "counties" && onBack && (
          <button
            onClick={onBack}
            className="rounded border px-2 py-1 font-medium"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            ← Back to national map
          </button>
        )}
        <span>0</span>
        <div
          className="h-2 flex-1 max-w-48 rounded-full"
          style={{
            background: `linear-gradient(to right, ${sequentialRamp.join(",")})`,
          }}
        />
        <span>
          {maxValue < 10 ? Math.round(maxValue * 100) / 100 : Math.round(maxValue)}
          {unit}
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "var(--color-no-data)" }}
          />
          No data
        </span>
        {view === "counties" && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed"
              style={{ borderColor: "var(--color-text-muted)" }}
            />
            Estimated (not county-specific)
          </span>
        )}
        {view === "counties" && highlightFips && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm border-2"
              style={{ borderColor: "var(--color-focus)" }}
            />
            NYC boroughs
          </span>
        )}
      </div>
    </div>
  );
}
