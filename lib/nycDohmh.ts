// NYC DOHMH's own open data (D-008, M3 spike outcome): true per-borough
// ED-visit % for flu/COVID/RSV, filling in where PopHIVE's NSSP feed only
// has an HSA-shared value across all 5 boroughs. No auth, public CSVs.
// Not part of the `lib/pophive/` tree since this is a second, independent
// source with its own geography scheme (plain borough names) and cadence
// anchor (Thursdays, vs. PopHIVE's Tue/Fri).

const REPO_RAW =
  "https://raw.githubusercontent.com/nychealth/respiratory-illness-data/master/data";

export type RespiratoryDisease = "flu" | "covid" | "rsv";

const FILE_AND_PREFIX: Record<RespiratoryDisease, { file: string; prefix: string }> = {
  flu: { file: "ED_data_influenza.csv", prefix: "Influenza visits" },
  covid: { file: "ED_data_COVID-19.csv", prefix: "COVID-19 visits" },
  rsv: { file: "ED_data_RSV.csv", prefix: "RSV visits" },
};

// The 5 NYC boroughs' county FIPS codes.
export const NYC_BOROUGH_FIPS: Record<string, string> = {
  Bronx: "36005",
  Brooklyn: "36047", // Kings County
  Manhattan: "36061", // New York County
  Queens: "36081",
  "Staten Island": "36085", // Richmond County
};

export interface BoroughDatum {
  countyFips: string;
  boroughName: string;
  value: number;
  asOf: string;
  source: "NYC DOHMH";
}

// Minimal CSV parser sufficient for this repo's format: quoted header
// fields, unquoted numeric/date data fields, no embedded commas or escaped
// quotes within a field.
function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.replace(/^"|"$/g, "")));
  return { header, rows };
}

async function fetchDiseaseBoroughData(
  disease: RespiratoryDisease
): Promise<BoroughDatum[]> {
  const { file, prefix } = FILE_AND_PREFIX[disease];
  const res = await fetch(`${REPO_RAW}/${file}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch NYC DOHMH ${file}: ${res.status}`);
  }
  const { header, rows } = parseCsv(await res.text());
  const dateIdx = header.indexOf("date");

  const boroughColumns = Object.keys(NYC_BOROUGH_FIPS).map((borough) => ({
    borough,
    fips: NYC_BOROUGH_FIPS[borough],
    idx: header.indexOf(`${prefix} ${borough}`),
  }));

  if (boroughColumns.some((b) => b.idx === -1)) {
    throw new Error(
      `NYC DOHMH ${file}: expected borough columns not found (schema may have changed)`
    );
  }

  // Latest row with a parseable value, per borough (mirrors the
  // "latest available, not necessarily the same date for every entity"
  // approach already used for PopHIVE state/county series).
  const latestByBorough = new Map<string, BoroughDatum>();
  for (const row of rows) {
    const date = row[dateIdx];
    if (!date) continue;
    for (const { borough, fips, idx } of boroughColumns) {
      const raw = row[idx];
      if (raw === undefined || raw === "") continue;
      const value = Number(raw);
      if (Number.isNaN(value)) continue;
      const existing = latestByBorough.get(fips);
      if (!existing || date > existing.asOf) {
        latestByBorough.set(fips, {
          countyFips: fips,
          boroughName: borough,
          value,
          asOf: date,
          source: "NYC DOHMH",
        });
      }
    }
  }

  return Array.from(latestByBorough.values());
}

export async function fetchAllBoroughData(): Promise<
  Record<RespiratoryDisease, BoroughDatum[]>
> {
  const [flu, covid, rsv] = await Promise.all([
    fetchDiseaseBoroughData("flu"),
    fetchDiseaseBoroughData("covid"),
    fetchDiseaseBoroughData("rsv"),
  ]);
  return { flu, covid, rsv };
}
