// Data Archive System - Builds a library of historical health data
// Stores daily snapshots for trend analysis and historical reference

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

export interface ArchivedDataset {
  datasetKey: string;
  datasetId: string;
  fetchedAt: string;
  dataCount: number;
  data: unknown[];
  metadata: {
    dateRange?: { min: string; max: string };
    stateCount?: number;
    geography?: string[];
  };
}

export interface ArchiveIndex {
  lastUpdated: string;
  datasets: {
    [key: string]: {
      latestFetch: string;
      fetchCount: number;
      oldestArchive: string;
      newestArchive: string;
    };
  };
}

const ARCHIVE_DIR = path.join(process.cwd(), "data", "archive");

// Ensure archive directory exists
async function ensureArchiveDir(): Promise<void> {
  try {
    await mkdir(ARCHIVE_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
}

// Archive a dataset snapshot
export async function archiveDataset(
  datasetKey: string,
  datasetId: string,
  data: unknown[]
): Promise<void> {
  await ensureArchiveDir();

  const now = new Date();
  const isoDate = now.toISOString();
  const dateStr = isoDate.split("T")[0];

  const archived: ArchivedDataset = {
    datasetKey,
    datasetId,
    fetchedAt: isoDate,
    dataCount: data.length,
    data,
    metadata: {
      dateRange: extractDateRange(data),
      stateCount: extractUniqueGeography(data).length,
      geography: extractUniqueGeography(data),
    },
  };

  // Save as YYYY-MM-DD-{datasetKey}.json
  const filename = `${dateStr}-${datasetKey}.json`;
  const filepath = path.join(ARCHIVE_DIR, filename);

  await writeFile(filepath, JSON.stringify(archived, null, 2));

  // Update archive index
  await updateArchiveIndex(datasetKey, isoDate);
}

// Extract date range from dataset (heuristic)
function extractDateRange(
  data: unknown[]
): { min: string; max: string } | undefined {
  const dateFields = ["date", "time_period_start_date", "year_start", "week_ending_date"];

  for (const record of data) {
    if (typeof record !== "object" || !record) continue;
    const obj = record as Record<string, unknown>;

    for (const field of dateFields) {
      if (field in obj) {
        const val = obj[field];
        if (typeof val === "string") {
          return { min: val, max: val }; // Simplified - would need full scan for actual range
        }
      }
    }
  }

  return undefined;
}

// Extract unique geography/states
function extractUniqueGeography(data: unknown[]): string[] {
  const geoFields = ["state", "location_name", "geography", "state_or_territory", "reporting_state"];
  const geo = new Set<string>();

  for (const record of data) {
    if (typeof record !== "object" || !record) continue;
    const obj = record as Record<string, unknown>;

    for (const field of geoFields) {
      if (field in obj) {
        const val = obj[field];
        if (typeof val === "string" && val.trim()) {
          geo.add(val);
        }
      }
    }
  }

  return Array.from(geo).sort();
}

// Update the archive index
async function updateArchiveIndex(datasetKey: string, fetchedAt: string): Promise<void> {
  const indexPath = path.join(ARCHIVE_DIR, "index.json");

  let index: ArchiveIndex = {
    lastUpdated: new Date().toISOString(),
    datasets: {},
  };

  try {
    const existing = await readFile(indexPath, "utf-8");
    index = JSON.parse(existing);
  } catch (err) {
    // First time - create new index
  }

  if (!index.datasets[datasetKey]) {
    index.datasets[datasetKey] = {
      latestFetch: fetchedAt,
      fetchCount: 1,
      oldestArchive: fetchedAt,
      newestArchive: fetchedAt,
    };
  } else {
    index.datasets[datasetKey].latestFetch = fetchedAt;
    index.datasets[datasetKey].fetchCount += 1;
    index.datasets[datasetKey].newestArchive = fetchedAt;
  }

  index.lastUpdated = new Date().toISOString();

  await writeFile(indexPath, JSON.stringify(index, null, 2));
}

// Get archived data for a dataset (most recent)
export async function getLatestArchive(
  datasetKey: string
): Promise<ArchivedDataset | null> {
  await ensureArchiveDir();

  const indexPath = path.join(ARCHIVE_DIR, "index.json");

  try {
    const indexData = await readFile(indexPath, "utf-8");
    const index = JSON.parse(indexData) as ArchiveIndex;

    if (!index.datasets[datasetKey]) {
      return null;
    }

    const newestDate = index.datasets[datasetKey].newestArchive;
    const filename = `${newestDate}-${datasetKey}.json`;
    const filepath = path.join(ARCHIVE_DIR, filename);

    const data = await readFile(filepath, "utf-8");
    return JSON.parse(data) as ArchivedDataset;
  } catch (err) {
    return null;
  }
}

// Get archive statistics
export async function getArchiveStats(): Promise<ArchiveIndex | null> {
  const indexPath = path.join(ARCHIVE_DIR, "index.json");

  try {
    const data = await readFile(indexPath, "utf-8");
    return JSON.parse(data) as ArchiveIndex;
  } catch (err) {
    return null;
  }
}
