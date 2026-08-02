// Fetch backlog datasets
// Same fetching pattern as Tier 1, but stores separately for future prioritization

import { querySODARecent } from "./soda-client";
import { DATASET_BACKLOG } from "./dataset-backlog";
import { archiveDataset } from "./data-archive";

export interface BacklogFetchResult {
  datasetId: string;
  datasetName: string;
  success: boolean;
  rowCount: number;
  error?: string;
  fetchedAt: string;
}

export async function fetchAllBacklogDatasets(
  daysBack: number = 30
): Promise<{ results: BacklogFetchResult[]; data: Record<string, unknown[]> }> {
  const results: BacklogFetchResult[] = [];
  const data: Record<string, unknown[]> = {};

  // Large datasets need special handling
  const largeDatasetIds = ["x9gk-5huc"]; // NNDSS - known to be very large
  const pageSize = 10000; // Fetch in chunks to avoid memory issues

  for (const dataset of DATASET_BACKLOG) {
    try {
      console.log(`Fetching backlog: ${dataset.name} (${dataset.id})...`);

      const datasetId = dataset.id;
      let allData: unknown[] = [];

      // Special handling for large datasets
      if (largeDatasetIds.includes(datasetId)) {
        console.log(`  (Large dataset - paginating in ${pageSize}-row chunks)`);
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;
        const maxPages = 10; // Limit to 100k rows (10 pages * 10k)

        while (hasMore && pageCount < maxPages) {
          try {
            const response = await querySODARecent(datasetId, "date", daysBack, {
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
        const response = await querySODARecent(datasetId, "date", daysBack, {
          limit: 1000,
        });
        allData = response.data;
      }

      data[dataset.id] = allData;

      // Archive the snapshot
      try {
        await archiveDataset(`backlog-${dataset.id}`, datasetId, allData);
      } catch (archiveErr) {
        console.warn(`Failed to archive backlog-${dataset.id}:`, archiveErr);
      }

      results.push({
        datasetId: dataset.id,
        datasetName: dataset.name,
        success: true,
        rowCount: allData.length,
        fetchedAt: new Date().toISOString(),
      });

      console.log(`  ✓ ${allData.length} rows`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        datasetId: dataset.id,
        datasetName: dataset.name,
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

// Fetch a single backlog dataset
export async function fetchBacklogDataset(
  datasetId: string,
  daysBack: number = 30
): Promise<{ success: boolean; data: unknown[]; error?: string }> {
  const dataset = DATASET_BACKLOG.find((d) => d.id === datasetId);

  if (!dataset) {
    return {
      success: false,
      data: [],
      error: `Dataset not in backlog: ${datasetId}`,
    };
  }

  try {
    // Try common date field names
    const dateFields = ["date", "time_period_start_date", "year_start", "week_ending_date"];
    let response;

    for (const dateField of dateFields) {
      try {
        response = await querySODARecent(datasetId, dateField, daysBack);
        break;
      } catch (err) {
        // Try next field
        continue;
      }
    }

    if (!response) {
      throw new Error("Could not find suitable date field for filtering");
    }

    await archiveDataset(`backlog-${datasetId}`, datasetId, response.data);

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
