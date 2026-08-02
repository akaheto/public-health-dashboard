// Geographic Data Aggregator
// Aggregate CDC data by state and region

export interface StateData {
  stateCode: string;
  stateName: string;
  value: number;
  dataPoints: number;
  range: {
    min: number;
    max: number;
    avg: number;
  };
}

export interface RegionData {
  regionName: string;
  states: StateData[];
  avgValue: number;
  minValue: number;
  maxValue: number;
}

// State FIPS codes and metadata
export const STATE_METADATA: Record<string, { code: string; name: string; region: string }> = {
  AL: { code: "01", name: "Alabama", region: "Southeast" },
  AK: { code: "02", name: "Alaska", region: "West" },
  AZ: { code: "04", name: "Arizona", region: "Southwest" },
  AR: { code: "05", name: "Arkansas", region: "South-Central" },
  CA: { code: "06", name: "California", region: "West" },
  CO: { code: "08", name: "Colorado", region: "Mountain" },
  CT: { code: "09", name: "Connecticut", region: "Northeast" },
  DE: { code: "10", name: "Delaware", region: "Northeast" },
  FL: { code: "12", name: "Florida", region: "Southeast" },
  GA: { code: "13", name: "Georgia", region: "Southeast" },
  HI: { code: "15", name: "Hawaii", region: "West" },
  ID: { code: "16", name: "Idaho", region: "Mountain" },
  IL: { code: "17", name: "Illinois", region: "Midwest" },
  IN: { code: "18", name: "Indiana", region: "Midwest" },
  IA: { code: "19", name: "Iowa", region: "Midwest" },
  KS: { code: "20", name: "Kansas", region: "Mountain" },
  KY: { code: "21", name: "Kentucky", region: "Southeast" },
  LA: { code: "22", name: "Louisiana", region: "South-Central" },
  ME: { code: "23", name: "Maine", region: "Northeast" },
  MD: { code: "24", name: "Maryland", region: "Northeast" },
  MA: { code: "25", name: "Massachusetts", region: "Northeast" },
  MI: { code: "26", name: "Michigan", region: "Midwest" },
  MN: { code: "27", name: "Minnesota", region: "Midwest" },
  MS: { code: "28", name: "Mississippi", region: "South-Central" },
  MO: { code: "29", name: "Missouri", region: "Midwest" },
  MT: { code: "30", name: "Montana", region: "Mountain" },
  NE: { code: "31", name: "Nebraska", region: "Mountain" },
  NV: { code: "32", name: "Nevada", region: "West" },
  NH: { code: "33", name: "New Hampshire", region: "Northeast" },
  NJ: { code: "34", name: "New Jersey", region: "Northeast" },
  NM: { code: "35", name: "New Mexico", region: "Southwest" },
  NY: { code: "36", name: "New York", region: "Northeast" },
  NC: { code: "37", name: "North Carolina", region: "Southeast" },
  ND: { code: "38", name: "North Dakota", region: "Midwest" },
  OH: { code: "39", name: "Ohio", region: "Midwest" },
  OK: { code: "40", name: "Oklahoma", region: "South-Central" },
  OR: { code: "41", name: "Oregon", region: "West" },
  PA: { code: "42", name: "Pennsylvania", region: "Northeast" },
  RI: { code: "44", name: "Rhode Island", region: "Northeast" },
  SC: { code: "45", name: "South Carolina", region: "Southeast" },
  SD: { code: "46", name: "South Dakota", region: "Midwest" },
  TN: { code: "47", name: "Tennessee", region: "Southeast" },
  TX: { code: "48", name: "Texas", region: "South-Central" },
  UT: { code: "49", name: "Utah", region: "Mountain" },
  VT: { code: "50", name: "Vermont", region: "Northeast" },
  VA: { code: "51", name: "Virginia", region: "Southeast" },
  WA: { code: "53", name: "Washington", region: "West" },
  WV: { code: "54", name: "West Virginia", region: "Southeast" },
  WI: { code: "55", name: "Wisconsin", region: "Midwest" },
  WY: { code: "56", name: "Wyoming", region: "Mountain" },
};

export const REGIONS = ["Northeast", "Midwest", "Southeast", "South-Central", "Mountain", "Southwest", "West"];

/**
 * Aggregate data by state
 */
export function aggregateByState(data: any[]): StateData[] {
  const stateMap = new Map<string, number[]>();

  data.forEach((row) => {
    // Try to extract state information
    let state: string | undefined;
    let value: number | undefined;

    // Common state field names
    const stateFields = ["state", "location_name", "geography", "state_or_territory", "reporting_state"];
    const valueFields = ["value", "percent_visits", "data_value", "rate_per_100000"];

    for (const field of stateFields) {
      if (field in row && row[field]) {
        state = String(row[field]).toUpperCase().substring(0, 2);
        break;
      }
    }

    for (const field of valueFields) {
      if (field in row && row[field] !== undefined && !isNaN(Number(row[field]))) {
        value = Number(row[field]);
        break;
      }
    }

    if (state && value !== undefined && STATE_METADATA[state]) {
      if (!stateMap.has(state)) {
        stateMap.set(state, []);
      }
      stateMap.get(state)!.push(value);
    }
  });

  // Convert to StateData array
  const stateData: StateData[] = Array.from(stateMap.entries()).map(([stateCode, values]) => {
    const metadata = STATE_METADATA[stateCode];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      stateCode,
      stateName: metadata.name,
      value: avg,
      dataPoints: values.length,
      range: { min, max, avg },
    };
  });

  return stateData.sort((a, b) => a.stateName.localeCompare(b.stateName));
}

/**
 * Aggregate state data by region
 */
export function aggregateByRegion(stateData: StateData[]): RegionData[] {
  const regionMap = new Map<string, StateData[]>();

  stateData.forEach((state) => {
    const metadata = STATE_METADATA[state.stateCode];
    const region = metadata.region;

    if (!regionMap.has(region)) {
      regionMap.set(region, []);
    }
    regionMap.get(region)!.push(state);
  });

  return REGIONS
    .filter((region) => regionMap.has(region))
    .map((region) => {
      const states = regionMap.get(region)!;
      const values = states.map((s) => s.value);
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);

      return {
        regionName: region,
        states,
        avgValue,
        minValue,
        maxValue,
      };
    });
}

/**
 * Get color for value based on intensity
 */
export function getStateColor(value: number, min: number, max: number, severity: "warning" | "neutral" = "neutral"): string {
  const normalized = (value - min) / (max - min || 1);

  if (severity === "warning") {
    // Red spectrum for warnings
    if (normalized < 0.33) return "#10b981"; // green
    if (normalized < 0.66) return "#f59e0b"; // amber
    return "#ef4444"; // red
  } else {
    // Blue spectrum for neutral
    if (normalized < 0.33) return "#dbeafe"; // light blue
    if (normalized < 0.66) return "#60a5fa"; // medium blue
    return "#1e40af"; // dark blue
  }
}

/**
 * Get text color for contrast
 */
export function getContrastTextColor(backgroundColor: string): string {
  // Simple heuristic: if background is light, use dark text
  const lightColors = ["#dbeafe", "#fef3c7"];
  return lightColors.includes(backgroundColor) ? "#000" : "#fff";
}

/**
 * Format value for display
 */
export function formatStateValue(value: number, precision: number = 1): string {
  return value.toFixed(precision);
}
