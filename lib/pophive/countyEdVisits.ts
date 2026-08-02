import { queryParquet } from "./duckdb";
import { toCountyFips, isRealCountyFips } from "./fips";
import type { CountySeries, CountyDatum } from "./types";

type RespiratoryDisease = "flu" | "covid" | "rsv";

const BUNDLE_FILE: Record<RespiratoryDisease, string> = {
  flu: "bundle_respiratory/dist/flu_ed_visits_by_county.parquet",
  covid: "bundle_respiratory/dist/covid_ed_visits_by_county.parquet",
  rsv: "bundle_respiratory/dist/rsv_ed_visits_by_county.parquet",
};

const VALUE_COLUMN: Record<RespiratoryDisease, string> = {
  flu: "percent_visits_flu",
  covid: "percent_visits_covid",
  rsv: "percent_visits_rsv",
};

interface CountyRow {
  fips: number;
  week_end: string;
  value: number | null;
  is_state_estimate: number;
}

export async function buildCountySeries(
  disease: RespiratoryDisease
): Promise<CountySeries> {
  const bundle = BUNDLE_FILE[disease];
  const valueCol = VALUE_COLUMN[disease];

  // Only the most recent 8 weeks are pulled — county-level files carry
  // multi-year history and we only need the latest reported value per
  // county, so this keeps the DuckDB scan (and the resulting JSON) small.
  const rows = await queryParquet<CountyRow>(bundle, (url) =>
    `SELECT fips, CAST(week_end AS VARCHAR) AS week_end,
            ${valueCol} AS value, is_state_estimate
     FROM read_parquet('${url}')
     WHERE week_end >= (SELECT max(week_end) - INTERVAL 56 DAY FROM read_parquet('${url}'))
     ORDER BY fips, week_end`
  );

  // is_state_estimate = 1 rows duplicate the state value into every county
  // row for that state (confirmed empirically: identical values across many
  // FIPS on the same date) rather than reporting a true county figure. Real
  // per-county reporting (is_state_estimate = 0) covers ~75% of counties at
  // any given week; for the rest we fall back to the state estimate but
  // keep `isStateEstimate: true` so the UI can disclose it rather than
  // implying county-specific precision that doesn't exist.
  const withValue = rows.filter((r) => r.value != null);
  const real = withValue.filter((r) => r.is_state_estimate === 0);
  const estimated = withValue.filter((r) => r.is_state_estimate === 1);

  function latestByCounty(source: CountyRow[]): Map<string, CountyRow> {
    const byCounty = new Map<string, CountyRow[]>();
    for (const r of source) {
      const fips = toCountyFips(r.fips);
      if (!isRealCountyFips(fips)) continue;
      if (!byCounty.has(fips)) byCounty.set(fips, []);
      byCounty.get(fips)!.push(r);
    }
    const latest = new Map<string, CountyRow>();
    for (const [fips, list] of byCounty) {
      list.sort((a, b) => a.week_end.localeCompare(b.week_end));
      latest.set(fips, list[list.length - 1]);
    }
    return latest;
  }

  const realLatest = latestByCounty(real);
  const estimatedLatest = latestByCounty(estimated);

  const counties: CountyDatum[] = [];
  let maxAsOf = "";
  for (const [fips, row] of realLatest) {
    counties.push({
      countyFips: fips,
      value: row.value as number,
      isStateEstimate: false,
      asOf: row.week_end,
    });
    if (row.week_end > maxAsOf) maxAsOf = row.week_end;
  }
  for (const [fips, row] of estimatedLatest) {
    if (realLatest.has(fips)) continue; // prefer real data where it exists
    counties.push({
      countyFips: fips,
      value: row.value as number,
      isStateEstimate: true,
      asOf: row.week_end,
    });
    if (row.week_end > maxAsOf) maxAsOf = row.week_end;
  }

  return {
    disease,
    signal: "CDC NSSP",
    source: "CDC NSSP",
    unit: "% of ED visits",
    asOf: maxAsOf,
    counties,
  };
}
