// Socrata SODA3 API client for CDC data.cdc.gov
// Handles pagination, filtering, and row limits for public CDC datasets

export interface SODAQueryOptions {
  limit?: number; // Default 1000 (Socrata limit)
  offset?: number;
  where?: string; // SoQL WHERE clause
  select?: string; // Specific columns
  orderBy?: string;
  groupBy?: string;
}

export interface SODAResponse<T> {
  data: T[];
  totalRows: number;
  hasMore: boolean;
  pageInfo: {
    limit: number;
    offset: number;
    returned: number;
  };
}

export async function querySODA<T>(
  datasetId: string,
  options: SODAQueryOptions = {}
): Promise<SODAResponse<T>> {
  const {
    limit = 1000, // Socrata default
    offset = 0,
    where,
    select = "*",
    orderBy,
    groupBy,
  } = options;

  const url = new URL(`https://data.cdc.gov/api/v3/views/${datasetId}/query.json`);

  // Build SoQL query
  const params: string[] = [];
  params.push(`$select=${encodeURIComponent(select)}`);
  params.push(`$limit=${limit}`);
  params.push(`$offset=${offset}`);

  if (where) params.push(`$where=${encodeURIComponent(where)}`);
  if (orderBy) params.push(`$order=${encodeURIComponent(orderBy)}`);
  if (groupBy) params.push(`$group=${encodeURIComponent(groupBy)}`);

  url.search = params.join("&");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`SODA API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T[];

  return {
    data,
    totalRows: data.length,
    hasMore: data.length === limit, // If we got exactly limit rows, there might be more
    pageInfo: {
      limit,
      offset,
      returned: data.length,
    },
  };
}

// Paginate through all results
export async function querySODAAll<T>(
  datasetId: string,
  options: SODAQueryOptions = {}
): Promise<T[]> {
  const allData: T[] = [];
  let offset = 0;
  const limit = 1000;

  // Limit pagination to avoid excessive API calls (e.g., max 10 pages = 10k rows)
  const maxPages = 10;
  let pageCount = 0;

  while (pageCount < maxPages) {
    const response = await querySODA<T>(datasetId, {
      ...options,
      limit,
      offset,
    });

    allData.push(...response.data);

    if (!response.hasMore || response.data.length === 0) {
      break;
    }

    offset += limit;
    pageCount++;
  }

  return allData;
}

// Query with recent data filter
export async function querySODARecent<T>(
  datasetId: string,
  dateField: string,
  daysBack: number = 7,
  options: SODAQueryOptions = {}
): Promise<SODAResponse<T>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const isoDate = cutoffDate.toISOString().split("T")[0];

  const whereClause = `${dateField} >= '${isoDate}'`;
  const combinedWhere = options.where
    ? `${whereClause} AND (${options.where})`
    : whereClause;

  return querySODA<T>(datasetId, {
    ...options,
    where: combinedWhere,
    orderBy: `${dateField} DESC`,
  });
}
