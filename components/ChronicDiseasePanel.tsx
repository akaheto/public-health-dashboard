"use client";

import { useMemo, useState } from "react";
import { Choropleth, type MapDatum } from "./Choropleth";
import type { IndicatorSeries, StateDatum } from "@/lib/pophive/types";

type Indicator = "diabetes" | "obesity" | "opioidOverdose" | "firearmMortality";

const INDICATOR_LABEL: Record<Indicator, string> = {
  diabetes: "Diabetes",
  obesity: "Obesity",
  opioidOverdose: "Opioid overdose",
  firearmMortality: "Firearm mortality",
};

export interface ChronicDiseasePanelProps {
  diabetes: IndicatorSeries | null;
  obesity: IndicatorSeries | null;
  opioidOverdose: IndicatorSeries | null;
  firearmMortality?: IndicatorSeries | null;
}

function toMapData(states: StateDatum[]): Record<string, MapDatum> {
  const out: Record<string, MapDatum> = {};
  for (const s of states) {
    out[s.stateFips] = { value: s.value, asOf: s.asOf };
  }
  return out;
}

export function ChronicDiseasePanel({
  diabetes,
  obesity,
  opioidOverdose,
  firearmMortality,
}: ChronicDiseasePanelProps) {
  // Find first available indicator
  const availableIndicators: Indicator[] = (
    [
      ["diabetes", diabetes],
      ["obesity", obesity],
      ["opioidOverdose", opioidOverdose],
      ["firearmMortality", firearmMortality],
    ] as const
  )
    .filter(([_, data]) => data != null)
    .map(([key]) => key as Indicator);

  const [indicator, setIndicator] = useState<Indicator>(availableIndicators[0] || "diabetes");

  const series = {
    diabetes,
    obesity,
    opioidOverdose,
    firearmMortality,
  }[indicator];

  if (!series) {
    return (
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          borderColor: "var(--color-border-default)",
          background: "var(--color-bg-surface)",
        }}
      >
        <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Data Unavailable
        </h3>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Chronic disease indicators are currently unavailable. Please try again later.
        </p>
      </div>
    );
  }

  const mapData = useMemo(() => toMapData(series.states), [series]);
  const unit = series.unit.includes("%") ? "%" : ` ${series.unit}`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Chronic Disease &amp; Behavioral Health
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Slower-cadence indicators (monthly to annual, mostly claims-based) — a
          representative slice of the full topic list, not the complete set. This tab
          does not auto-refresh on the same schedule as the outbreak tracker.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border p-1 self-start flex-wrap" style={{ borderColor: "var(--color-border-default)" }}>
        {availableIndicators.map((i) => (
          <button
            key={i}
            onClick={() => setIndicator(i)}
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{
              background: indicator === i ? "var(--color-focus)" : "transparent",
              color: indicator === i ? "white" : "var(--color-text-secondary)",
            }}
          >
            {INDICATOR_LABEL[i]}
          </button>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {series.source} &middot; {series.unit} &middot; as of {series.asOf}
      </p>

      <Choropleth view="states" data={mapData} unit={unit} />
    </div>
  );
}
