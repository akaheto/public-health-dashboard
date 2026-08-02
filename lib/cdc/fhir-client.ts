// CDC FHIR API Client
// For future use with real-time CDC surveillance data (COVID-19, flu, RSV, etc.)

export async function queryFhir<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T[]> {
  try {
    const url = new URL(endpoint);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status}`);
    }

    const data = await response.json();
    // FHIR responses can have different structures depending on the endpoint
    // This is a placeholder - will be refined as we add more CDC data sources
    return data.entry ? data.entry.map((e: any) => e.resource) : data;
  } catch (err) {
    console.warn(`FHIR query failed (${endpoint}):`, err);
    return [];
  }
}
