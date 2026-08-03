"use client";

import { useMemo, useState } from "react";
import { Choropleth, type MapDatum } from "./Choropleth";
import { OverviewStrip } from "./OverviewStrip";
import { ChronicDiseasePanel, type ChronicDiseasePanelProps } from "./ChronicDiseasePanel";
import CDCDataExplorer from "./CDCDataExplorer";
import StateAssessment from "./StateAssessment";
import DiseaseProgression from "./DiseaseProgression";
import type {
  OverviewCard,
  MeaslesOverviewCard,
  SignalSeries,
  CountySeries,
} from "@/lib/pophive/types";
import { AVAILABLE_SIGNALS, SIGNAL_GROUPS, UNIT_BY_SOURCE, type Signal } from "@/lib/pophive/signals";
import { NYC_BOROUGH_FIPS } from "@/lib/nycDohmh";

type RespiratoryDisease = "flu" | "covid" | "rsv";
type Disease = RespiratoryDisease | "measles";

// NY, NJ, CT — the pinned tri-state view (brief section 5B).
const TRI_STATE_FIPS = ["36", "34", "09"];
const NYC_BOROUGH_FIPS_LIST = Object.values(NYC_BOROUGH_FIPS);

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
  "CDC NHSN": "Hospital admissions",
  "CDC RespNET": "Lab-confirmed hosp.",
  "CDC ILINet": "ILI visits %",
  "Epic Cosmos, ED": "Epic ED visits %",
  "Delphi Hospital Claims": "Hosp. claims %",
  "Delphi Doctor Claims": "Doctor claims %",
  Kinsa: "Kinsa illness signal",
  "Google Health Trends": "Google searches",
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
  counties?: {
    flu: CountySeries;
    covid: CountySeries;
    rsv: CountySeries;
    measles: CountySeries;
  };
  vaccination: {
    mmrHealthmap: SignalSeries;
    mmrNis: SignalSeries;
    dtapNis: SignalSeries;
    polioNis: SignalSeries;
    hepbNis: SignalSeries;
    varicellaVaxNis: SignalSeries;
    combined7Nis: SignalSeries;
  };
  chronic: ChronicDiseasePanelProps;
}

const VACCINE_TYPES = [
  { id: "mmr", label: "MMR", sources: ["mmrHealthmap", "mmrNis"] },
  { id: "dtap", label: "DTaP", sources: ["dtapNis"] },
  { id: "polio", label: "Polio", sources: ["polioNis"] },
  { id: "hepb", label: "Hepatitis B", sources: ["hepbNis"] },
  { id: "varicella", label: "Varicella", sources: ["varicellaVaxNis"] },
  { id: "combined7", label: "Combined 7-series", sources: ["combined7Nis"] },
] as const;
type VaccineType = (typeof VACCINE_TYPES)[number]["id"];

const MMR_SOURCES = ["mmrHealthmap", "mmrNis"] as const;
type MmrSource = (typeof MMR_SOURCES)[number];
const MMR_SOURCE_LABEL: Record<MmrSource, string> = {
  mmrHealthmap: "HealthMap",
  mmrNis: "CDC NIS",
};

const VACCINE_SOURCE_LABEL: Record<string, string> = {
  mmrHealthmap: "HealthMap",
  mmrNis: "CDC NIS",
  dtapNis: "CDC NIS",
  polioNis: "CDC NIS",
  hepbNis: "CDC NIS",
  varicellaVaxNis: "CDC NIS",
  combined7Nis: "CDC NIS",
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
  counties: initialCounties,
  vaccination,
  chronic,
}: DashboardProps) {
  const [mainTab, setMainTab] = useState<"outbreak" | "chronic" | "cdc">("outbreak");
  const [cdcTab, setCdcTab] = useState<"explorer" | "assessment" | "progression">("explorer");
  const [disease, setDisease] = useState<Disease>("flu");
  const [respiratorySignal, setRespiratorySignal] = useState<Signal>("CDC NSSP");
  const [measlesSignal, setMeaslesSignal] =
    useState<(typeof MEASLES_SIGNALS)[number]>("weekly");
  const [drilldown, setDrilldown] = useState<{ fips: string; name: string } | null>(
    null
  );
  const [triStateView, setTriStateView] = useState(false);
  const [vaccineType, setVaccineType] = useState<VaccineType>("mmr");
  const [mmrSource, setMmrSource] = useState<MmrSource>("mmrHealthmap");
  const [counties, setCounties] = useState<DashboardProps["counties"]>(initialCounties);
  const [loadingCounties, setLoadingCounties] = useState(false);

  const isMeasles = disease === "measles";
  const canDrillDown = true; // E-009: measles now supports county-level drill-down

  const activeSeries: SignalSeries = isMeasles
    ? states.measles[measlesSignal]
    : states[disease as RespiratoryDisease][respiratorySignal];

  const stateMapData = useMemo(() => seriesToMapData(activeSeries), [activeSeries]);

  const countyMapData = useMemo(() => {
    if ((!drilldown && !triStateView) || !counties) return {};
    const countyData = isMeasles ? counties.measles : counties[disease as RespiratoryDisease];
    if (!countyData) return {};
    return countySeriesToMapData(countyData);
  }, [isMeasles, drilldown, triStateView, disease, counties]);

  const getVaccineSeries = () => {
    if (vaccineType === "mmr") {
      return vaccination[mmrSource];
    }
    if (vaccineType === "dtap") return vaccination.dtapNis;
    if (vaccineType === "polio") return vaccination.polioNis;
    if (vaccineType === "hepb") return vaccination.hepbNis;
    if (vaccineType === "varicella") return vaccination.varicellaVaxNis;
    if (vaccineType === "combined7") return vaccination.combined7Nis;
    return vaccination.mmrNis;
  };

  const vaccineSeries = getVaccineSeries();
  const vaccineMapData = useMemo(() => seriesToMapData(vaccineSeries), [vaccineSeries]);

  async function fetchCountiesForState(stateFips: string) {
    if (loadingCounties) return;

    // Check if we already have this state's data in memory
    if (counties?.flu.counties.some((c) => c.countyFips.startsWith(stateFips))) {
      return; // Already loaded
    }

    setLoadingCounties(true);
    try {
      const response = await fetch(`/api/counties?stateFips=${stateFips}`);
      if (response.ok) {
        const data = await response.json();
        setCounties(data);
      }
    } catch (err) {
      console.error("Failed to fetch counties:", err);
    } finally {
      setLoadingCounties(false);
    }
  }

  function handleSelectDisease(next: Disease) {
    setDisease(next);
    setDrilldown(null);
    // E-009: measles now supports drill-down like respiratory diseases
  }

  function handleToggleTriState() {
    setDrilldown(null);
    const newTriStateView = !triStateView;
    setTriStateView(newTriStateView);
    if (newTriStateView) {
      // Loading tri-state view, fetch NY/NJ/CT data
      Promise.all([
        fetchCountiesForState("36"), // NY
        fetchCountiesForState("34"), // NJ
        fetchCountiesForState("09"), // CT
      ]);
    }
  }

  function handleDrillDown(fips: string, name: string) {
    setDrilldown({ fips, name });
    fetchCountiesForState(fips);
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
        <button
          onClick={() => setMainTab("cdc")}
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            background: mainTab === "cdc" ? "var(--color-focus)" : "transparent",
            color: mainTab === "cdc" ? "white" : "var(--color-text-secondary)",
          }}
        >
          CDC Dashboard
        </button>
      </div>

      {mainTab === "cdc" ? (
        <>
          {/* CDC Dashboard Subtabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: "explorer", label: "📊 Data Explorer", icon: "📊" },
                { id: "assessment", label: "🏥 State Assessment", icon: "🏥" },
                { id: "progression", label: "📈 Disease Progression", icon: "📈" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCdcTab(tab.id as typeof cdcTab)}
                  className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                    cdcTab === tab.id
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {cdcTab === "explorer" && <CDCDataExplorer />}
              {cdcTab === "assessment" && <StateAssessment />}
              {cdcTab === "progression" && <DiseaseProgression />}
            </div>
          </div>
        </>
      ) : mainTab === "chronic" ? (
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

        {!isMeasles ? (
          <select
            value={respiratorySignal}
            onChange={(e) => setRespiratorySignal(e.target.value as Signal)}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium"
            style={{
              borderColor: "var(--color-border-default)",
              background: "var(--color-bg-surface)",
              color: "var(--color-text-primary)",
            }}
          >
            <optgroup label="Syndromic surveillance">
              {SIGNAL_GROUPS.syndromic.map((s) => (
                <option key={s} value={s}>
                  {SIGNAL_LABEL[s]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Medical claims">
              {SIGNAL_GROUPS.medical.map((s) => (
                <option key={s} value={s}>
                  {SIGNAL_LABEL[s]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Behavioral signals">
              {SIGNAL_GROUPS.behavioral.map((s) => (
                <option key={s} value={s}>
                  {SIGNAL_LABEL[s]}
                </option>
              ))}
            </optgroup>
          </select>
        ) : (
          <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-default)" }}>
            {MEASLES_SIGNALS.map((s) => (
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
        )}

        <button
          onClick={handleToggleTriState}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium"
          style={{
            borderColor: "var(--color-border-default)",
            background: triStateView ? "var(--color-focus)" : "transparent",
            color: triStateView ? "white" : "var(--color-text-secondary)",
          }}
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
            {`NY / NJ / CT counties · ${DISEASE_LABEL[disease]} ${isMeasles ? "weekly cases" : "ED visits %"} · NYC boroughs outlined`}
          </h3>
          <p className="mb-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            NYC borough values come from NYC DOHMH&apos;s own open data (true
            per-borough), not PopHIVE&apos;s NSSP feed, which sometimes shares one value
            across all 5 boroughs.
          </p>
          <Choropleth
            view="counties"
            data={countyMapData}
            unit={isMeasles ? "cases" : "%"}
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
            canDrillDown ? handleDrillDown : undefined
          }
        />
      ) : (
        <div>
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {drilldown.name} counties &middot; {DISEASE_LABEL[disease]} {
              isMeasles ? "weekly cases" : "ED visits %"
            }
          </h3>
          <Choropleth
            view="counties"
            data={countyMapData}
            unit={isMeasles ? "cases" : "%"}
            stateFips={drilldown.fips}
            onBack={() => setDrilldown(null)}
          />
        </div>
      )}

      {isMeasles && !triStateView && !drilldown && (
        <div className="border-t pt-6" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Vaccination coverage &middot; paired with the measles map above
            </h3>
            <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-default)" }}>
              {VACCINE_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVaccineType(v.id)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: vaccineType === v.id ? "var(--color-bg-page)" : "transparent",
                    color: "var(--color-text-secondary)",
                    border:
                      vaccineType === v.id
                        ? "1px solid var(--color-border-default)"
                        : "1px solid transparent",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {vaccineType === "mmr" && (
              <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-default)" }}>
                {MMR_SOURCES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setMmrSource(s)}
                    className="rounded-md px-2 py-1 text-xs font-medium"
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
            )}
          </div>
          {vaccineType === "mmr" && (
            <p className="mb-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              HealthMap and CDC NIS measure MMR coverage differently and disagree
              substantially (NIS reads much higher) — shown separately rather than
              averaged. Coverage data lags case data by months.
            </p>
          )}
          <p className="mb-2 text-xs font-medium" style={{ color: "var(--color-state-low)" }}>
            {vaccineType === "mmr" ? MMR_SOURCE_LABEL[mmrSource] : "CDC NIS"} data as of {vaccineSeries.asOf} — much older than
            the measles case map above.
          </p>
          <Choropleth view="states" data={vaccineMapData} unit="%" />
        </div>
      )}
      </>
      )}
    </div>
  );
}
