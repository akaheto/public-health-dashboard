// Health Data Query API
// Query CDC datasets by category, date range, geography, and more

import { readFile } from "node:fs/promises";
import path from "node:path";

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

// Load dataset file
async function loadDataset(filename: string): Promise<unknown[] | null> {
  try {
    const filepath = path.join(process.cwd(), "data", "generated", filename);
    const data = await readFile(filepath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

// Filter data by state
function filterByState(data: unknown[], state: string): unknown[] {
  if (!state) return data;

  const stateLower = state.toLowerCase();
  return data.filter((row) => {
    if (typeof row !== "object" || !row) return false;
    const obj = row as Record<string, unknown>;

    // Check common state field names
    const stateFields = ["state", "location_name", "geography", "state_or_territory", "reporting_state"];
    for (const field of stateFields) {
      if (field in obj && typeof obj[field] === "string") {
        if (obj[field]!.toLowerCase().includes(stateLower)) {
          return true;
        }
      }
    }

    return false;
  });
}

// Filter by date range
function filterByDateRange(data: unknown[], daysBack: number): unknown[] {
  if (!daysBack || daysBack > 365) return data; // Reasonable limit

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const isoDate = cutoffDate.toISOString().split("T")[0];

  const dateFields = ["date", "time_period_start_date", "year_start", "week_ending_date", "week_end"];

  return data.filter((row) => {
    if (typeof row !== "object" || !row) return false;
    const obj = row as Record<string, unknown>;

    for (const field of dateFields) {
      if (field in obj && typeof obj[field] === "string") {
        const val = obj[field]!;
        // Simple ISO date comparison
        if (typeof val === "string" && val >= isoDate) {
          return true;
        }
      }
    }

    return true; // Include if no date field found
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseParams(searchParams);

    // Dataset mapping
    const datasets: Record<string, string> = {
      "epidemic-trends": "cdc-epidemic-trends.json",
      "nssp-ed-respiratory": "cdc-nssp-ed-respiratory.json",
      "ari-activity-level": "cdc-ari-activity-level.json",
      "chronic-disease-indicators": "cdc-chronic-disease-indicators.json",
      "brfss-historical": "cdc-brfss-historical.json",
      "drug-poisoning-mortality": "cdc-drug-poisoning-mortality.json",
      "tbi-ed-visits": "cdc-tbi-ed-visits.json",
      "influenza-pneumonia-deaths": "cdc-influenza-pneumonia-deaths.json",
      "anxiety-depression": "cdc-anxiety-depression.json",
      "mental-health-care": "cdc-mental-health-care.json",
      "covid-test-positivity": "cdc-backlog-seuz-s2cv.json",
      "healthcare-surveillance": "cdc-backlog-v58w-vynu.json",
    };

    // If no dataset specified, list available datasets
    if (!params.dataset) {
      return Response.json({
        success: true,
        message: "Available datasets",
        datasets: Object.keys(datasets),
        usage: "?dataset=epidemic-trends&state=california&limit=100",
      });
    }

    // Validate dataset
    const filename = datasets[params.dataset];
    if (!filename) {
      return Response.json(
        {
          success: false,
          error: `Unknown dataset: ${params.dataset}`,
          available: Object.keys(datasets),
        },
        { status: 400 }
      );
    }

    // Load dataset
    const rawData = await loadDataset(filename);
    if (!rawData) {
      return Response.json(
        { success: false, error: `Could not load dataset: ${params.dataset}` },
        { status: 500 }
      );
    }

    // Apply filters
    let filteredData = rawData;

    if (params.state) {
      filteredData = filterByState(filteredData, params.state);
    }

    if (params.daysBack) {
      filteredData = filterByDateRange(filteredData, params.daysBack);
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
        originalRows: rawData.length,
        filters: {
          state: params.state || null,
          daysBack: params.daysBack || null,
          limit: params.limit,
        },
      },
    };

    return Response.json(response);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error }, { status: 500 });
  }
}
