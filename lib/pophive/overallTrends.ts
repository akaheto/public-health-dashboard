import { queryParquet } from "./duckdb";
import { STATE_FIPS_BY_NAME, STATE_NAME_BY_FIPS } from "./states";
import { levelFromPctOfPeak, trendFromRelativeChange } from "./bands";
import { AVAILABLE_SIGNALS, UNIT_BY_SOURCE, type Signal } from "./signals";
import type { OverviewCard, SignalSeries, StateDatum } from "./types";

type RespiratoryDisease = "flu" | "covid" | "rsv";

interface TrendRow {
  geography: string;
  date: string;
  value: number | null;
  source: string;
}

const BUNDLE_FILE: Record<RespiratoryDisease, string> = {
  flu: "bundle_respiratory/dist/flu_overall_trends.parquet",
  covid: "bundle_respiratory/dist/covid_overall_trends.parquet",
  rsv: "bundle_respiratory/dist/rsv_overall_trends.parquet",
};

const DISEASE_LABEL: Record<RespiratoryDisease, string> = {
  flu: "Influenza",
  covid: "COVID-19",
  rsv: "RSV",
};

// Signals are now defined in signals.ts for client-safe importing without DuckDB.

const rowCache = new Map<string, Promise<TrendRow[]>>();

function loadRows(
  disease: RespiratoryDisease,
  source: string
): Promise<TrendRow[]> {
  const key = `${disease}:${source}`;
  if (!rowCache.has(key)) {
    rowCache.set(
      key,
      queryParquet<TrendRow>(BUNDLE_FILE[disease], (url) =>
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

function yearsAgo(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export async function buildOverviewCard(
  disease: RespiratoryDisease
): Promise<OverviewCard> {
  const source: Signal = "CDC NSSP";
  const rows = await loadRows(disease, source);
  const national = rows
    .filter((r) => r.geography === "United States" && r.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (national.length === 0) {
    throw new Error(`No national ${source} rows found for ${disease}`);
  }

  const latest = national[national.length - 1];
  const windowStart = yearsAgo(latest.date, 2);
  const windowRows = national.filter((r) => r.date >= windowStart);
  const peakValue = Math.max(...windowRows.map((r) => r.value as number));
  const pctOfPeak = peakValue > 0 ? ((latest.value as number) / peakValue) * 100 : 0;

  const fourWeeksAgoCutoff = daysAgo(latest.date, 28);
  const priorCandidates = national.filter((r) => r.date <= fourWeeksAgoCutoff);
  const prior = priorCandidates[priorCandidates.length - 1];

  const { level, approximate } = levelFromPctOfPeak(pctOfPeak);
  const trend = trendFromRelativeChange(
    latest.value as number,
    prior ? (prior.value as number) : (latest.value as number)
  );

  return {
    disease,
    label: DISEASE_LABEL[disease],
    value: latest.value as number,
    unit: UNIT_BY_SOURCE[source],
    level,
    trend,
    pctOfPeak: Math.round(pctOfPeak * 10) / 10,
    peakValue: Math.round(peakValue * 100) / 100,
    source,
    asOf: latest.date,
    levelIsApproximate: approximate,
    historicalPoints: windowRows.map((r) => ({
      date: r.date,
      value: r.value as number,
    })),
  };
}

export async function buildStateSignalSeries(
  disease: RespiratoryDisease,
  source: Signal
): Promise<SignalSeries> {
  const rows = await loadRows(disease, source);
  const byState = new Map<string, TrendRow[]>();

  for (const r of rows) {
    if (r.geography === "United States" || r.value == null) continue;
    const fips = STATE_FIPS_BY_NAME[r.geography];
    if (!fips) continue; // territory or unrecognized geography — skip, not a US state
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
    disease,
    signal: source,
    source,
    unit: UNIT_BY_SOURCE[source],
    asOf: maxAsOf,
    states,
  };
}
