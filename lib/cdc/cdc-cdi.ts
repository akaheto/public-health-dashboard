// CDC Chronic Disease Indicators (CDI) API connector
// Fetches state-level chronic disease prevalence and mortality data

import { queryFhir } from "./fhir-client";
import { STATE_FIPS_BY_NAME } from "../pophive/states";
import type { IndicatorSeries, StateDatum } from "../pophive/types";

// Supported CDI indicators
export type CDIIndicatorId =
  | "diabetes"
  | "heart_disease"
  | "stroke"
  | "asthma"
  | "copd"
  | "arthritis"
  | "hypertension"
  | "high_cholesterol"
  | "obesity"
  | "depression";

// Mapping from our indicator names to CDC CDI codes
const CDI_CODES: Record<CDIIndicatorId, string> = {
  diabetes: "DIABETES",
  heart_disease: "CHD",
  stroke: "STROKE",
  asthma: "ASTHMA",
  copd: "COPD",
  arthritis: "ARTHRITIS",
  hypertension: "HYPERTENSION",
  high_cholesterol: "HIGH_CHOLESTEROL",
  obesity: "OBESITY",
  depression: "DEPRESSION",
};

// CDC CDI indicator metadata
export const CDI_INDICATORS: Record<
  CDIIndicatorId,
  { label: string; unit: string; source: string }
> = {
  diabetes: {
    label: "Diabetes",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  heart_disease: {
    label: "Heart Disease",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  stroke: {
    label: "Stroke",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  asthma: {
    label: "Asthma",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  copd: {
    label: "COPD",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  arthritis: {
    label: "Arthritis",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  hypertension: {
    label: "Hypertension",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  high_cholesterol: {
    label: "High Cholesterol",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  obesity: {
    label: "Obesity",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
  depression: {
    label: "Depression",
    unit: "% prevalence among adults",
    source: "CDC CDI (BRFSS)",
  },
};

interface CDIResponse {
  Topic: string;
  Indicator: string;
  Data_Value: number;
  Data_Value_Footnote: string;
  Data_Value_Type: string;
  Data_Value_Unit: string;
  YearStart: number;
  YearEnd: number;
  LocationAbbr: string;
  LocationDesc: string;
}

export async function buildCDIIndicator(
  indicatorId: CDIIndicatorId
): Promise<IndicatorSeries | null> {
  try {
    const cdiCode = CDI_CODES[indicatorId];
    const metadata = CDI_INDICATORS[indicatorId];

    // CDC CDI API endpoint - requires app_token for authentication
    const appToken = process.env.CDC_API_TOKEN;
    if (!appToken) {
      throw new Error("CDC_API_TOKEN environment variable not set");
    }

    const apiUrl = new URL("https://chronicdata.cdc.gov/resource/g4ie-h725.json");
    apiUrl.searchParams.set("Indicator", cdiCode);
    apiUrl.searchParams.set("limit", "100000");
    apiUrl.searchParams.set("$$app_token", appToken);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "User-Agent": "Public-Health-Dashboard/1.0 (+https://github.com/benaheto/public-health-dashboard)",
      },
    });
    if (!response.ok) {
      throw new Error(`CDC CDI API error: ${response.status}`);
    }

    const data = (await response.json()) as CDIResponse[];

    // Group by state and get most recent year
    const stateData = new Map<string, CDIResponse>();
    let maxYear = 0;

    for (const row of data) {
      // Skip US totals and territories (keep only state abbreviations)
      if (row.LocationAbbr === "US" || !row.Data_Value) continue;

      // Keep the most recent year for each state
      const yearStart = row.YearStart || 0;
      if (yearStart >= maxYear) {
        if (yearStart > maxYear) {
          stateData.clear(); // Reset if we found a newer year
          maxYear = yearStart;
        }
        stateData.set(row.LocationAbbr, row);
      }
    }

    if (stateData.size === 0) return null;

    // Convert to StateDatum format
    const states: StateDatum[] = [];
    for (const [stateAbbr, row] of stateData.entries()) {
      const stateName = row.LocationDesc;
      // Try to get FIPS from state name, or use abbreviation as fallback
      let fips = STATE_FIPS_BY_NAME[stateName];
      if (!fips) {
        // Try to find by abbreviation
        for (const [name, code] of Object.entries(STATE_FIPS_BY_NAME)) {
          if (name.toUpperCase().includes(stateAbbr)) {
            fips = code;
            break;
          }
        }
      }

      if (!fips) continue;

      states.push({
        stateFips: fips,
        stateName,
        value: row.Data_Value,
        asOf: String(row.YearStart),
      });
    }

    if (states.length === 0) return null;

    return {
      topic: indicatorId,
      signal: indicatorId,
      source: metadata.source,
      unit: metadata.unit,
      asOf: String(maxYear),
      states,
    };
  } catch (err) {
    console.warn(`Failed to fetch CDC CDI indicator ${indicatorId}:`, err);
    return null;
  }
}

// Batch fetch multiple CDI indicators
export async function buildMultipleCDIIndicators(
  indicatorIds: CDIIndicatorId[]
): Promise<Record<CDIIndicatorId, IndicatorSeries | null>> {
  const results = await Promise.all(
    indicatorIds.map((id) => buildCDIIndicator(id))
  );

  const record: Record<CDIIndicatorId, IndicatorSeries | null> = {} as any;
  indicatorIds.forEach((id, idx) => {
    record[id] = results[idx];
  });

  return record;
}
