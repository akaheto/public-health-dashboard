import { queryParquet } from "./duckdb";
import { STATE_FIPS_BY_NAME, STATE_NAME_BY_FIPS } from "./states";
import type { SignalSeries, StateDatum } from "./types";

// Two independent MMR coverage estimates, deliberately kept separate rather
// than reconciled — they measure different things (see below) and showing
// only one would hide a real, large discrepancy the user should see.
//
// HealthMap: a crowd/estimate-based figure the brief itself references
// (verified 2026-07-26 to match its exact reference numbers: US 69.0%, MA
// 79.4%, ME 77.8%, VT 76.9%, CT 76.5%, MN 75.7%) — stale as of Dec 2024 at
// last check, which is disclosed via `asOf`, not hidden.
//
// NIS: the CDC National Immunization Survey's "≥1 Dose MMR by 24 months"
// estimate — an official survey, but measuring a different milestone/
// population than HealthMap's figure. Also stale (Nov 2024 at last check).
// NIS states came back ~97-99% vs. HealthMap's ~69-79% for the same rough
// period: a striking, real illustration of "sources aren't interchangeable,"
// not a bug in either pipeline.

const MEASLES_BUNDLE = "bundle_measles/dist/measles_state.parquet";
const NIS_BUNDLE = "bundle_childhood_immunizations/dist/nis_overall.parquet";

interface HealthmapRow {
  geography: string;
  date: string;
  value: number | null;
  source: string;
}

interface NisRow {
  geography: string;
  time: string;
  pct_uptake: number | null;
  vaccine: string;
}

export async function buildMmrHealthmapSeries(): Promise<SignalSeries> {
  const rows = await queryParquet<HealthmapRow>(MEASLES_BUNDLE, (url) =>
    `SELECT geography, CAST(date AS VARCHAR) AS date, value, source
     FROM read_parquet('${url}')
     WHERE source = 'mmr_coverage_healthmap'
     ORDER BY geography, date`
  );

  const states: StateDatum[] = [];
  let maxAsOf = "";
  for (const r of rows) {
    if (r.geography === "United States" || r.value == null) continue;
    const fips = STATE_FIPS_BY_NAME[r.geography];
    if (!fips) continue;
    states.push({
      stateFips: fips,
      stateName: r.geography,
      value: r.value,
      asOf: r.date,
    });
    if (r.date > maxAsOf) maxAsOf = r.date;
  }

  return {
    disease: "measles",
    signal: "mmr_coverage_healthmap",
    source: "HealthMap",
    unit: "% with ≥1 MMR dose (HealthMap estimate)",
    asOf: maxAsOf,
    states,
  };
}

function buildNisSeries(vaccineLabel: string, vaccineName: string, unit: string): Promise<SignalSeries> {
  return queryParquet<NisRow>(NIS_BUNDLE, (url) =>
    `SELECT geography, CAST(time AS VARCHAR) AS time, pct_uptake, vaccine
     FROM read_parquet('${url}')
     WHERE vaccine = '${vaccineLabel}'
       AND time = (SELECT max(time) FROM read_parquet('${url}') WHERE vaccine = '${vaccineLabel}')
     ORDER BY geography`
  ).then((rows) => {
    const states: StateDatum[] = [];
    let maxAsOf = "";
    for (const r of rows) {
      if (r.geography === "00" || r.pct_uptake == null) continue;
      const name = STATE_NAME_BY_FIPS[r.geography];
      if (!name) continue;
      states.push({
        stateFips: r.geography,
        stateName: name,
        value: r.pct_uptake,
        asOf: r.time,
      });
      if (r.time > maxAsOf) maxAsOf = r.time;
    }

    return {
      disease: "measles",
      signal: `nis_${vaccineName}`,
      source: "CDC NIS",
      unit,
      asOf: maxAsOf,
      states,
    };
  });
}

export async function buildMmrNisSeries(): Promise<SignalSeries> {
  return buildNisSeries("≥1 Dose MMR", "mmr", "% with ≥1 MMR dose by 24mo (NIS survey)");
}

export async function buildDtapNisSeries(): Promise<SignalSeries> {
  return buildNisSeries("≥4 Doses DTaP", "dtap", "% with ≥4 DTaP doses by 24mo (NIS survey)");
}

export async function buildPolioNisSeries(): Promise<SignalSeries> {
  return buildNisSeries("≥3 Doses Polio", "polio", "% with ≥3 polio doses by 24mo (NIS survey)");
}

export async function buildHepbNisSeries(): Promise<SignalSeries> {
  return buildNisSeries("≥3 Doses HepB", "hepb", "% with ≥3 hepatitis B doses by 24mo (NIS survey)");
}

export async function buildVaricellaVaxNisSeries(): Promise<SignalSeries> {
  return buildNisSeries("≥1 Dose Varicella", "varicella", "% with ≥1 varicella dose by 24mo (NIS survey)");
}

export async function buildCombined7SeriesNisSeries(): Promise<SignalSeries> {
  return buildNisSeries("4:3:1:3:3:1:4", "combined7", "% with Combined 7-vaccine series by 24mo (NIS survey)");
}
