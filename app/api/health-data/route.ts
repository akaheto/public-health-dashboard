// Health Data Query API
// Query processed CDC/health datasets by category, geography, and more

import statesData from "@/data/generated/states.json";
import chronicData from "@/data/generated/chronic.json";
import overviewData from "@/data/generated/overview.json";
import vaccinationData from "@/data/generated/vaccination.json";
import countiesData from "@/data/generated/counties.json";

export const runtime = "nodejs";

interface QueryParams {
  dataset?: string; // "epidemic-trends", "anxiety-depression", etc
  category?: string; // "infectious-disease", "chronic-disease", etc
  state?: string; // Filter by state name
  daysBack?: number; // Last N days
  limit?: number; // Max rows to return
  backlog?: boolean; // Include backlog datasets
}

interface DataResponse {
  success: boolean;
  dataset: string;
  rows: number;
  data: unknown[];
  metadata?: Record<string, unknown>;
  error?: string;
}

interface StateData {
  stateFips?: string;
  stateName?: string;
  state?: string;
  disease?: string;
  value?: number;
  [key: string]: unknown;
}

// Parse query parameters from URL
function parseParams(searchParams: URLSearchParams): QueryParams {
  return {
    dataset: searchParams.get("dataset") || undefined,
    category: searchParams.get("category") || undefined,
    state: searchParams.get("state") || undefined,
    daysBack: searchParams.get("daysBack") ? parseInt(searchParams.get("daysBack")!) : undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 1000,
    backlog: searchParams.get("backlog") === "true",
  };
}

// Load processed dataset file
function loadDataset(filename: string): Record<string, unknown> | null {
  const datasets: Record<string, Record<string, unknown>> = {
    "states.json": statesData as Record<string, unknown>,
    "chronic.json": chronicData as Record<string, unknown>,
    "overview.json": overviewData as Record<string, unknown>,
    "vaccination.json": vaccinationData as Record<string, unknown>,
    "counties.json": countiesData as Record<string, unknown>,
  };
  return datasets[filename] || null;
}

// Extract state data from processed JSON structure and flatten into array
function extractStatesFromProcessedData(data: Record<string, unknown>, disease?: string): StateData[] {
  const result: StateData[] = [];

  // Helper function to find states array in a nested structure
  function findStatesArray(obj: Record<string, unknown>): Array<Record<string, unknown>> | null {
    // Check if object itself has states array (chronic.json style)
    if ("states" in obj) {
      return obj.states as Array<Record<string, unknown>>;
    }
    // Check nested objects (states.json style)
    for (const value of Object.values(obj)) {
      if (typeof value === "object" && value !== null) {
        const nested = value as Record<string, unknown>;
        if ("states" in nested) {
          return nested.states as Array<Record<string, unknown>>;
        }
      }
    }
    return null;
  }

  if (disease && disease in data) {
    const diseaseData = data[disease] as Record<string, unknown>;
    if (diseaseData) {
      const states = findStatesArray(diseaseData);
      if (states) {
        states.forEach((state) => {
          result.push({
            disease,
            state: (state.stateName as string) || "",
            value: state.value as number,
            ...state,
          });
        });
      }
    }
  } else {
    // No specific disease, extract all diseases
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        const states = findStatesArray(value as Record<string, unknown>);
        if (states) {
          states.forEach((state) => {
            result.push({
              disease: key,
              state: (state.stateName as string) || "",
              value: state.value as number,
              ...state,
            });
          });
        }
      }
    });
  }

  return result;
}

// Filter data by state
function filterByState(data: StateData[], state: string): StateData[] {
  if (!state) return data;

  const stateLower = state.toLowerCase();
  return data.filter((row) => {
    return (
      (row.state && row.state.toLowerCase().includes(stateLower)) ||
      (row.stateName && row.stateName.toLowerCase().includes(stateLower))
    );
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseParams(searchParams);

    // Dataset mapping to processed data files
    const datasets: Record<string, { file: string; disease?: string }> = {
      "epidemic-trends": { file: "states.json", disease: "flu" },
      "nssp-ed-respiratory": { file: "states.json" },
      "ari-activity-level": { file: "states.json" },
      "chronic-disease-indicators": { file: "chronic.json" },
      "brfss-historical": { file: "chronic.json" },
      "drug-poisoning-mortality": { file: "states.json" },
      "tbi-ed-visits": { file: "states.json" },
      "influenza-pneumonia-deaths": { file: "states.json", disease: "flu" },
      "anxiety-depression": { file: "chronic.json" },
      "mental-health-care": { file: "chronic.json" },
      "covid-test-positivity": { file: "states.json", disease: "covid" },
      "healthcare-surveillance": { file: "states.json" },
    };

    // If no dataset specified, list available datasets
    if (!params.dataset) {
      return Response.json({
        success: true,
        message: "Available datasets (using processed summary data)",
        datasets: Object.keys(datasets),
        usage: "?dataset=epidemic-trends&state=california&limit=100",
        note: "CDC data is available by state. Processed from CDC NSSP, PopHIVE, and CDC summary datasets.",
      });
    }

    // Validate dataset
    const datasetConfig = datasets[params.dataset];
    if (!datasetConfig) {
      return Response.json(
        {
          success: false,
          error: `Unknown dataset: ${params.dataset}`,
          available: Object.keys(datasets),
        },
        { status: 400 }
      );
    }

    // Load processed dataset
    const rawData = loadDataset(datasetConfig.file);
    if (!rawData) {
      return Response.json(
        { success: false, error: `Could not load dataset: ${params.dataset}` },
        { status: 500 }
      );
    }

    // Extract state data and flatten structure
    let filteredData = extractStatesFromProcessedData(rawData, datasetConfig.disease);

    // Apply filters
    if (params.state) {
      filteredData = filterByState(filteredData, params.state);
    }

    // Apply limit
    if (params.limit && params.limit > 0) {
      filteredData = filteredData.slice(0, params.limit);
    }

    // Return response
    const response: DataResponse = {
      success: true,
      dataset: params.dataset,
      rows: filteredData.length,
      data: filteredData,
      metadata: {
        filters: {
          state: params.state || null,
          limit: params.limit,
        },
        source: "Processed CDC data (NSSP, PopHIVE, CDC summaries)",
      },
    };

    return Response.json(response);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error }, { status: 500 });
  }
}
