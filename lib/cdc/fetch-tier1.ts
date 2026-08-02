// Fetch all Tier 1 datasets efficiently
// Handles pagination, recent-data filtering, error handling, and archival

import { querySODARecent } from "./soda-client";
import { TIER1_DATASETS } from "./tier1-datasets";
import { archiveDataset } from "./data-archive";

export interface FetchResult {
  datasetKey: string;
  datasetId: string;
  success: boolean;
  rowCount: number;
  error?: string;
  fetchedAt: string;
}

export async function fetchAllTier1Datasets(
  daysBack: number = 30
): Promise<{ results: FetchResult[]; data: Record<string, unknown[]> }> {
  const results: FetchResult[] = [];
  const data: Record<string, unknown[]> = {};

  // Known large datasets that need pagination
  const largeDatasets = ["nndss-weekly"];
  const pageSize = 10000;

  for (const [key, config] of Object.entries(TIER1_DATASETS)) {
    try {
      console.log(`Fetching ${config.name} (${config.id})...`);

      let allData: unknown[] = [];

      // Special handling for large datasets
      if (largeDatasets.includes(key)) {
        console.log(`  (Large dataset - paginating in ${pageSize}-row chunks)`);
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;
        const maxPages = 10; // Limit to 100k rows

        while (hasMore && pageCount < maxPages) {
          try {
            const response = await querySODARecent(config.id, config.dateField, daysBack, {
              limit: pageSize,
              offset,
            });

            allData = allData.concat(response.data);
            hasMore = response.hasMore && response.data.length > 0;
            offset += pageSize;
            pageCount++;

            console.log(`    Page ${pageCount}: ${response.data.length} rows (total: ${allData.length})`);
          } catch (pageErr) {
            console.warn(`    Page ${pageCount} failed:`, pageErr);
            hasMore = false;
          }
        }
      } else {
        // Standard fetch for smaller datasets
        const response = await querySODARecent(config.id, config.dateField, daysBack, {
          limit: 1000,
        });
        allData = response.data;
      }

      data[key] = allData;

      // Archive the snapshot
      try {
        await archiveDataset(key, config.id, allData);
      } catch (archiveErr) {
        console.warn(`Failed to archive ${key}:`, archiveErr);
      }

      results.push({
        datasetKey: key,
        datasetId: config.id,
        success: true,
        rowCount: allData.length,
        fetchedAt: new Date().toISOString(),
      });

      console.log(`  ✓ ${allData.length} rows`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        datasetKey: key,
        datasetId: config.id,
        success: false,
        rowCount: 0,
        error: errorMsg,
        fetchedAt: new Date().toISOString(),
      });

      console.warn(`  ✗ Failed: ${errorMsg}`);
    }
  }

  return { results, data };
}

// Fetch a single dataset
export async function fetchSingleDataset(
  datasetKey: string,
  daysBack: number = 30
): Promise<{ success: boolean; data: unknown[]; error?: string }> {
  const config = TIER1_DATASETS[datasetKey];

  if (!config) {
    return {
      success: false,
      data: [],
      error: `Unknown dataset key: ${datasetKey}`,
    };
  }

  try {
    const response = await querySODARecent(config.id, config.dateField, daysBack);

    await archiveDataset(datasetKey, config.id, response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: [],
      error: errorMsg,
    };
  }
}

// Fetch multiple specific datasets
export async function fetchDatasets(
  datasetKeys: string[],
  daysBack: number = 30
): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {};

  for (const key of datasetKeys) {
    const result = await fetchSingleDataset(key, daysBack);
    if (result.success) {
      data[key] = result.data;
    }
  }

  return data;
}
