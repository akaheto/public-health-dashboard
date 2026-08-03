import { queryParquet } from "./duckdb";
import { STATE_FIPS_BY_NAME, STATE_NAME_BY_FIPS } from "./states";
import { trendFromRelativeChange } from "./bands";
import type { MeaslesOverviewCard, SignalSeries, StateDatum, CountySeries, CountyDatum } from "./types";

const STATE_BUNDLE_FILE = "bundle_measles/dist/measles_state.parquet";
const COUNTY_BUNDLE_FILE = "bundle_measles/dist/measles_county.parquet";

interface MeaslesRow {
  geography: string;
  date: string;
  value: number | null;
  source: string;
}

const rowCache = new Map<string, Promise<MeaslesRow[]>>();

function loadRows(source: string, bundle: string = STATE_BUNDLE_FILE): Promise<MeaslesRow[]> {
  const key = `${bundle}:${source}`;
  if (!rowCache.has(key)) {
    rowCache.set(
      key,
      queryParquet<MeaslesRow>(bundle, (url) =>
        `SELECT geography, CAST(date AS VARCHAR) AS date, value, source
         FROM read_parquet('${url}')
         WHERE source = '${source}'
         ORDER BY geography, date`
      )
    );
  }
  return rowCache.get(key)!;
}

function daysAgo(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function buildMeaslesOverviewCard(): Promise<MeaslesOverviewCard> {
  const rows = await loadRows("jhu_measles_cases");
  const national = rows
    .filter((r) => r.geography === "United States" && r.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (national.length === 0) {
    throw new Error("No national jhu_measles_cases rows found");
  }

  const latest = national[national.length - 1];
  const cutoff = daysAgo(latest.date, 28);
  const priorCandidates = national.filter((r) => r.date <= cutoff);
  const prior = priorCandidates[priorCandidates.length - 1];
  const priorValue = prior ? (prior.value as number) : (latest.value as number);

  const stateRowsAtLatestDate = rows.filter(
    (r) => r.geography !== "United States" && r.date === latest.date && (r.value ?? 0) > 0
  );

  return {
    disease: "measles",
    label: "Measles",
    weeklyCasesUS: latest.value as number,
    weeklyCasesUSPrior4w: priorValue,
    trend: trendFromRelativeChange(latest.value as number, priorValue),
    activeStateCount: stateRowsAtLatestDate.length,
    asOf: latest.date,
    source: "jhu_measles_cases",
    levelNotClassified: true,
  };
}

async function buildStateSeries(
  source: "jhu_measles_cases" | "cdc_measles_cases_nnds_cum",
  unit: string
): Promise<SignalSeries> {
  const rows = await loadRows(source);
  const byState = new Map<string, MeaslesRow[]>();

  for (const r of rows) {
    if (r.geography === "United States" || r.value == null) continue;
    const fips = STATE_FIPS_BY_NAME[r.geography];
    if (!fips) continue;
    if (!byState.has(fips)) byState.set(fips, []);
    byState.get(fips)!.push(r);
  }

  const states: StateDatum[] = [];
  let maxAsOf = "";
  for (const [fips, list] of byState) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const latest = list[list.length - 1];
    states.push({
      stateFips: fips,
      stateName: STATE_NAME_BY_FIPS[fips],
      value: latest.value as number,
      asOf: latest.date,
    });
    if (latest.date > maxAsOf) maxAsOf = latest.date;
  }

  return {
    disease: "measles",
    signal: source,
    source,
    unit,
    asOf: maxAsOf,
    states,
  };
}

export function buildMeaslesWeeklySeries(): Promise<SignalSeries> {
  return buildStateSeries("jhu_measles_cases", "reported cases (weekly)");
}

// Resets to 0 every January (NNDSS convention) — must never be diffed or
// averaged across the reset. This series is a single snapshot (latest
// cumulative-to-date value per state), so the reset only matters if this
// function is ever extended to compute a change over time.
export function buildMeaslesCumulativeSeries(): Promise<SignalSeries> {
  return buildStateSeries(
    "cdc_measles_cases_nnds_cum",
    "cumulative reported cases (NNDSS, resets each January)"
  );
}

// E-009: County-level measles drill-down (E-009)
export async function buildMeaslesCountySeries(): Promise<CountySeries> {
  const rows = await loadRows("jhu_measles_cases", COUNTY_BUNDLE_FILE);
  const byCounty = new Map<string, MeaslesRow[]>();

  for (const r of rows) {
    if (r.value == null) continue;
    // Geography codes in measles_county.parquet are mostly standard county FIPS
    const countyFips = r.geography;
    if (countyFips.length !== 5 || !/^\d+$/.test(countyFips)) continue; // Skip non-FIPS geographies
    if (!byCounty.has(countyFips)) byCounty.set(countyFips, []);
    byCounty.get(countyFips)!.push(r);
  }

  const counties: CountyDatum[] = [];
  let maxAsOf = "";
  for (const [countyFips, list] of byCounty) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const latest = list[list.length - 1];
    counties.push({
      countyFips,
      value: latest.value as number,
      isStateEstimate: false,
      asOf: latest.date,
      source: "jhu_measles_cases",
    });
    if (latest.date > maxAsOf) maxAsOf = latest.date;
  }

  return {
    disease: "measles",
    signal: "jhu_measles_cases",
    source: "jhu_measles_cases",
    unit: "reported cases (weekly)",
    asOf: maxAsOf,
    counties,
  };
}
