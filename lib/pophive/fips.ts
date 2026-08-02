// PopHIVE's NSSP-sourced bundles carry `fips` as a DOUBLE (e.g. 1007), not a
// zero-padded string — but us-atlas TopoJSON ids are zero-padded strings
// ("01007" for county, "01" for state). These helpers do that conversion and
// apply the scope's FIPS-exclusion rules (masked counties, national rows).

export function toCountyFips(raw: number): string {
  return String(Math.round(raw)).padStart(5, "0");
}

export function toStateFips(raw: number): string {
  return String(Math.round(raw)).padStart(2, "0");
}

// County FIPS codes ending in "990" are masked/non-real (per PopHIVE's own
// data-quality guidance); "00"/"US" rows are national aggregates. Both must
// be excluded from county-level work.
export function isRealCountyFips(fips: string): boolean {
  if (fips.endsWith("990")) return false;
  if (fips === "00000" || fips === "US") return false;
  return true;
}
