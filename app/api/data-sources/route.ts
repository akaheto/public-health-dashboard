// Data Source Metadata API
// Returns information about all CDC data sources, including update status

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

interface DataSourceMetadata {
  key: string;
  name: string;
  category: string;
  updateFrequency: "daily" | "weekly" | "monthly" | "annual";
  typicalLag: string;
  filename: string;
  rowCount: number;
  lastModified: string;
  lastModifiedTime: number;
}

interface MetadataResponse {
  success: boolean;
  sources: DataSourceMetadata[];
  timestamp: string;
  error?: string;
}

// Get file stats
async function getFileStats(filename: string): Promise<{ modTime: number; rowCount: number } | null> {
  try {
    const filepath = path.join(process.cwd(), "data", "generated", filename);
    const stats = await stat(filepath);

    // Try to read rowCount from file
    const data = await readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    const rowCount = Array.isArray(parsed) ? parsed.length : 0;

    return {
      modTime: stats.mtime.getTime(),
      rowCount,
    };
  } catch {
    return null;
  }
}

export async function GET(): Promise<Response> {
  try {
    const sources: DataSourceMetadata[] = [];

    // Tier 1 datasets configuration
    const tier1Sources = [
      {
        key: "epidemic-trends",
        name: "CDC Epidemic Trends and Rt",
        category: "infectious-disease",
        updateFrequency: "weekly" as const,
        typicalLag: "1 week",
        filename: "cdc-epidemic-trends.json",
      },
      {
        key: "nssp-ed-respiratory",
        name: "NSSP ED Respiratory Daily",
        category: "infectious-disease",
        updateFrequency: "daily" as const,
        typicalLag: "1-2 days",
        filename: "cdc-nssp-ed-respiratory.json",
      },
      {
        key: "ari-activity-level",
        name: "ARI Activity Level",
        category: "infectious-disease",
        updateFrequency: "weekly" as const,
        typicalLag: "1 week",
        filename: "cdc-ari-activity-level.json",
      },
      {
        key: "nndss-weekly",
        name: "NNDSS Weekly Data",
        category: "infectious-disease",
        updateFrequency: "weekly" as const,
        typicalLag: "1 week",
        filename: "cdc-nndss-weekly.json",
      },
      {
        key: "influenza-pneumonia-deaths",
        name: "Influenza, Pneumonia, COVID Deaths",
        category: "infectious-disease",
        updateFrequency: "weekly" as const,
        typicalLag: "1-2 weeks",
        filename: "cdc-influenza-pneumonia-deaths.json",
      },
      {
        key: "chronic-disease-indicators",
        name: "U.S. Chronic Disease Indicators",
        category: "chronic-disease",
        updateFrequency: "annual" as const,
        typicalLag: "1-2 years",
        filename: "cdc-chronic-disease-indicators.json",
      },
      {
        key: "brfss-historical",
        name: "BRFSS Historical Questions",
        category: "chronic-disease",
        updateFrequency: "annual" as const,
        typicalLag: "1-2 years",
        filename: "cdc-brfss-historical.json",
      },
      {
        key: "drug-poisoning-mortality",
        name: "Drug Poisoning Mortality",
        category: "injury",
        updateFrequency: "annual" as const,
        typicalLag: "1-2 years",
        filename: "cdc-drug-poisoning-mortality.json",
      },
      {
        key: "tbi-ed-visits",
        name: "TBI ED Visits",
        category: "injury",
        updateFrequency: "annual" as const,
        typicalLag: "1-2 years",
        filename: "cdc-tbi-ed-visits.json",
      },
      {
        key: "anxiety-depression",
        name: "Anxiety or Depression",
        category: "mental-health",
        updateFrequency: "weekly" as const,
        typicalLag: "2-3 days",
        filename: "cdc-anxiety-depression.json",
      },
      {
        key: "mental-health-care",
        name: "Mental Health Care Access",
        category: "mental-health",
        updateFrequency: "weekly" as const,
        typicalLag: "2-3 days",
        filename: "cdc-mental-health-care.json",
      },
    ];

    // Backlog datasets
    const backlogSources = [
      {
        key: "covid-test-positivity",
        name: "COVID-19 Test Positivity",
        category: "infectious-disease",
        updateFrequency: "weekly" as const,
        typicalLag: "1-2 weeks",
        filename: "cdc-backlog-seuz-s2cv.json",
      },
      {
        key: "healthcare-surveillance",
        name: "Healthcare Surveillance",
        category: "infectious-disease",
        updateFrequency: "daily" as const,
        typicalLag: "1-2 days",
        filename: "cdc-backlog-v58w-vynu.json",
      },
    ];

    const allSources = [...tier1Sources, ...backlogSources];

    // Fetch stats for each source
    for (const source of allSources) {
      const stats = await getFileStats(source.filename);
      if (stats) {
        sources.push({
          ...source,
          rowCount: stats.rowCount,
          lastModified: new Date(stats.modTime).toISOString(),
          lastModifiedTime: stats.modTime,
        });
      }
    }

    const response: MetadataResponse = {
      success: true,
      sources: sources.sort((a, b) => b.lastModifiedTime - a.lastModifiedTime),
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return Response.json(
      { success: false, error, sources: [] },
      { status: 500 }
    );
  }
}
