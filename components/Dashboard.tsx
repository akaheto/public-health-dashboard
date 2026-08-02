"use client";

import { useMemo, useState } from "react";
import { Choropleth, type MapDatum } from "./Choropleth";
import { OverviewStrip } from "./OverviewStrip";
import { ChronicDiseasePanel, type ChronicDiseasePanelProps } from "./ChronicDiseasePanel";
import type {
  OverviewCard,
  MeaslesOverviewCard,
  SignalSeries,
  CountySeries,
} from "@/lib/pophive/types";
import { NYC_BOROUGH_FIPS } from "@/lib/nycDohmh";

type RespiratoryDisease = "flu" | "covid" | "rsv";
type Disease = RespiratoryDisease | "measles";

// NY, NJ, CT — the pinned tri-state view (brief section 5B).
const TRI_STATE_FIPS = ["36", "34", "09"];
const NYC_BOROUGH_FIPS_LIST = Object.values(NYC_BOROUGH_FIPS);

const RESPIRATORY_SIGNALS = ["CDC NSSP", "CDC NWSS", "CDC NHSN"] as const;
const MEASLES_SIGNALS = ["weekly", "cumulative"] as const;

const DISEASE_LABEL: Record<Disease, string> = {
  flu: "Influenza",
  covid: "COVID-19",
  rsv: "RSV",
  measles: "Measles",
};

const SIGNAL_LABEL: Record<string, string> = {
  "CDC NSSP": "ED visits %",
  "CDC NWSS": "Wastewater",
  "CDC NHSN": "Hospitalizations",
  weekly: "Weekly cases",
  cumulative: "Cumulative (season)",
};

export interface DashboardProps {
  overview: {
    flu: OverviewCard;
    covid: OverviewCard;
    rsv: OverviewCard;
    measles: MeaslesOverviewCard;
    generatedAt: string;
  };
  states: {
    flu: Record<string, SignalSeries>;
    covid: Record<string, SignalSeries>;
    rsv: Record<string, SignalSeries>;
    measles: { weekly: SignalSeries; cumulative: SignalSeries };
  };
  counties: {
    flu: CountySeries;
    covid: CountySeries;
    rsv: CountySeries;
  };
  vaccination: {
    mmrHealthmap: SignalSeries;
    mmrNis: SignalSeries;
  };
  chronic: ChronicDiseasePanelProps;
}

const MMR_SOURCES = ["mmrHealthmap", "mmrNis"] as const;
type MmrSource = (typeof MMR_SOURCES)[number];
const MMR_SOURCE_LABEL: Record<MmrSource, string> = {
  mmrHealthmap: "HealthMap",
  mmrNis: "CDC NIS",
};

function seriesToMapData(series: SignalSeries): Record<string, MapDatum> {
  const out: Record<string, MapDatum> = {};
  for (const s of series.states) {
    out[s.stateFips] = { value: s.value, asOf: s.asOf };
  }
  return out;
}

function countySeriesToMapData(series: CountySeries): Record<string, MapDatum> {
  const out: Record<string, MapDatum> = {};
  for (const c of series.counties) {
    out[c.countyFips] = {
      value: c.value,
      asOf: c.asOf,
      isEstimate: c.isStateEstimate,
      estimateNote: c.isStateEstimate
        ? "No county-specific report — showing the state estimate"
        : undefined,
    };
  }
  return out;
}

export function Dashboard({
  overview,
  states,
  counties,
  vaccination,
  chronic,
}: DashboardProps) {
  const [mainTab, setMainTab] = useState<"outbreak" | "chronic">("outbreak");
  const [disease, setDisease] = useState<Disease>("flu");
  const [respiratorySignal, setRespiratorySignal] =
    useState<(typeof RESPIRATORY_SIGNALS)[number]>("CDC NSSP");
  const [measlesSignal, setMeaslesSignal] =
    useState<(typeof MEASLES_SIGNALS)[number]>("weekly");
  const [drilldown, setDrilldown] = useState<{ fips: string; name: string } | null>(
    null
  );
  const [triStateView, setTriStateView] = useState(false);
  const [mmrSource, setMmrSource] = useState<MmrSource>("mmrHealthmap");

  const isMeasles = disease === "measles";
  const canDrillDown = !isMeasles;

  const activeSeries: SignalSeries = isMeasles
    ? states.measles[measlesSignal]
    : states[disease as RespiratoryDisease][respiratorySignal];

  const stateMapData = useMemo(() => seriesToMapData(activeSeries), [activeSeries]);

  const countyMapData = useMemo(() => {
    if (isMeasles || (!drilldown && !triStateView)) return {};
    return countySeriesToMapData(counties[disease as RespiratoryDisease]);
  }, [isMeasles, drilldown, triStateView, disease, counties]);

  const mmrSeries = vaccination[mmrSource];
  const mmrMapData = useMemo(() => seriesToMapData(mmrSeries), [mmrSeries]);

  function handleSelectDisease(next: Disease) {
    setDisease(next);
    setDrilldown(null);
    if (next === "measles") setTriStateView(false);
  }

  function handleToggleTriState() {
    setDrilldown(null);
    setTriStateView((v) => !v);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-lg border p-1 self-start" style={{ borderColor: "var(--color-border-default)" }}>
        <button
          onClick={() => setMainTab("outbreak")}
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            background: mainTab === "outbreak" ? "var(--color-focus)" : "transparent",
            color: mainTab === "outbreak" ? "white" : "var(--color-text-secondary)",
          }}
        >
          Outbreak Tracker
        </button>
        <button
          onClick={() => setMainTab("chronic")}
          disabled={!chronic.diabetes}
          className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          style={{
            background: mainTab === "chronic" ? "var(--color-focus)" : "transparent",
            color: mainTab === "chronic" ? "white" : "var(--color-text-secondary)",
          }}
          title={!chronic.diabetes ? "Data unavailable" : undefined}
        >
          Chronic Disease &amp; Behavioral Health
        </button>
      </div>

      {mainTab === "chronic" ? (
        chronic.diabetes ? (
          <ChronicDiseasePanel {...(chronic as Required<typeof chronic>)} />
        ) : (
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
              Chronic disease and behavioral health data is currently unavailable. Please try
              again later.
            </p>
          </div>
        )
      ) : (
        <>
      <OverviewStrip
        flu={overview.flu}
        covid={overview.covid}
        rsv={overview.rsv}
        measles={overview.measles}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-default)" }}>
          {(["flu", "covid", "rsv", "measles"] as Disease[]).map((d) => (
            <button
              key={d}
              onClick={() => handleSelectDisease(d)}
              className="rounded-md px-3 py-1.5 text-sm font-medium"
              style={{
                background: disease === d ? "var(--color-focus)" : "transparent",
                color: disease === d ? "white" : "var(--color-text-secondary)",
              }}
            >
              {DISEASE_LABEL[d]}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-default)" }}>
          {!isMeasles &&
            RESPIRATORY_SIGNALS.map((s) => (
              <button
                key={s}
                onClick={() => setRespiratorySignal(s)}
                className="rounded-md px-3 py-1.5 text-sm font-medium"
                style={{
                  background: respiratorySignal === s ? "var(--color-bg-page)" : "transparent",
                  color: "var(--color-text-secondary)",
                  border:
                    respiratorySignal === s
                      ? "1px solid var(--color-border-default)"
                      : "1px solid transparent",
                }}
              >
                {SIGNAL_LABEL[s]}
              </button>
            ))}
          {isMeasles &&
            MEASLES_SIGNALS.map((s) => (
              <button
                key={s}
                onClick={() => setMeaslesSignal(s)}
                className="rounded-md px-3 py-1.5 text-sm font-medium"
                style={{
                  background: measlesSignal === s ? "var(--color-bg-page)" : "transparent",
                  color: "var(--color-text-secondary)",
                  border:
                    measlesSignal === s
                      ? "1px solid var(--color-border-default)"
                      : "1px solid transparent",
                }}
              >
                {SIGNAL_LABEL[s]}
              </button>
            ))}
        </div>

        <button
          onClick={handleToggleTriState}
          disabled={isMeasles}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          style={{
            borderColor: "var(--color-border-default)",
            background: triStateView ? "var(--color-focus)" : "transparent",
            color: triStateView ? "white" : "var(--color-text-secondary)",
          }}
          title={isMeasles ? "No county-level measles data yet" : undefined}
        >
          Tri-State + NYC
        </button>

        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Data current as of {activeSeries.asOf} &middot; generated{" "}
          {new Date(overview.generatedAt).toLocaleString()}
        </span>
      </div>

      {triStateView ? (
        <div>
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {`NY / NJ / CT counties · ${DISEASE_LABEL[disease]} ED visits % · NYC boroughs outlined`}
          </h3>
          <p className="mb-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            NYC borough values come from NYC DOHMH&apos;s own open data (true
            per-borough), not PopHIVE&apos;s NSSP feed, which sometimes shares one value
            across all 5 boroughs.
          </p>
          <Choropleth
            view="counties"
            data={countyMapData}
            unit="%"
            stateFips={TRI_STATE_FIPS}
            highlightFips={NYC_BOROUGH_FIPS_LIST}
            onBack={() => setTriStateView(false)}
          />
        </div>
      ) : !drilldown ? (
        <Choropleth
          view="states"
          data={stateMapData}
          unit={SIGNAL_LABEL[isMeasles ? measlesSignal : respiratorySignal].includes("%")
            ? "%"
            : ` ${activeSeries.unit}`}
          onSelectState={
            canDrillDown ? (fips, name) => setDrilldown({ fips, name }) : undefined
          }
        />
      ) : (
        <div>
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {drilldown.name} counties &middot; {DISEASE_LABEL[disease]} ED visits %
          </h3>
          <Choropleth
            view="counties"
            data={countyMapData}
            unit="%"
            stateFips={drilldown.fips}
            onBack={() => setDrilldown(null)}
          />
        </div>
      )}

      {isMeasles && !triStateView && !drilldown && (
        <div className="border-t pt-6" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              MMR vaccination coverage &middot; paired with the measles map above
            </h3>
            <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-default)" }}>
              {MMR_SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => setMmrSource(s)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: mmrSource === s ? "var(--color-bg-page)" : "transparent",
                    color: "var(--color-text-secondary)",
                    border:
                      mmrSource === s
                        ? "1px solid var(--color-border-default)"
                        : "1px solid transparent",
                  }}
                >
                  {MMR_SOURCE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            HealthMap and CDC NIS measure MMR coverage differently and disagree
            substantially (NIS reads much higher) — shown separately rather than
            averaged. Coverage data lags case data by months.
          </p>
          <p className="mb-2 text-xs font-medium" style={{ color: "var(--color-state-low)" }}>
            {MMR_SOURCE_LABEL[mmrSource]} data as of {mmrSeries.asOf} — much older than
            the measles case map above.
          </p>
          <Choropleth view="states" data={mmrMapData} unit="%" />
        </div>
      )}
      </>
      )}
    </div>
  );
}
