// Documentation Page

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Health Data API Documentation</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-gray-600 mb-4">
          Query CDC health surveillance data across multiple categories: infectious diseases,
          chronic disease indicators, injury mortality, and mental health metrics. Data is updated
          daily and archived for historical analysis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Endpoint</h2>
        <code className="block bg-gray-100 p-4 rounded mb-4 text-sm">GET /api/health-data</code>
        <p className="text-gray-600">
          Returns JSON with health data from CDC datasets. Supports filtering by state, date range,
          and row limit.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Datasets (12 total)</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">Infectious Disease (6 datasets)</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">epidemic-trends</code> —
                COVID-19, Influenza, RSV trends (505k rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">nssp-ed-respiratory</code> — ED
                respiratory visit % (291k rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">ari-activity-level</code> —
                Acute respiratory illness activity
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">influenza-pneumonia-deaths</code>
                — Provisional weekly deaths (50k rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">covid-test-positivity</code> —
                Weekly test positivity rates (600 rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">healthcare-surveillance</code> —
                ED visits by condition (11k rows)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Chronic Disease (2 datasets)</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">chronic-disease-indicators</code>
                — CDC CDI indicators (399k rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">brfss-historical</code> — BRFSS
                behavioral health (7.3k rows)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Injuries & Mortality (2 datasets)</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">drug-poisoning-mortality</code> —
                Overdose mortality (53k rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">tbi-ed-visits</code> — TBI ED
                visits
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Mental Health (2 datasets)</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">anxiety-depression</code> —
                Anxiety/depression indicators (16.8k rows)
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">mental-health-care</code> —
                Mental health care access (10.4k rows)
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Query Parameters</h2>
        <div className="space-y-4 text-sm">
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded">dataset</code>
            <span className="text-red-600 ml-2">required</span>
            <p className="text-gray-600 ml-4 mt-1">
              Dataset ID from list above. Omit to see available datasets.
            </p>
          </div>
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded">state</code>
            <p className="text-gray-600 ml-4 mt-1">
              Filter by state name (e.g., "California", "Texas")
            </p>
          </div>
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded">daysBack</code>
            <p className="text-gray-600 ml-4 mt-1">
              Last N days of data (max 365). Omit for all data.
            </p>
          </div>
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded">limit</code>
            <p className="text-gray-600 ml-4 mt-1">Maximum rows to return (default: 1000)</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Examples</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">List available datasets</p>
            <code className="block bg-gray-100 p-3 rounded overflow-x-auto">
              GET /api/health-data
            </code>
          </div>

          <div>
            <p className="font-semibold mb-2">COVID trends for last 30 days</p>
            <code className="block bg-gray-100 p-3 rounded overflow-x-auto text-xs">
              GET /api/health-data?dataset=epidemic-trends&daysBack=30
            </code>
          </div>

          <div>
            <p className="font-semibold mb-2">Anxiety/depression for California</p>
            <code className="block bg-gray-100 p-3 rounded overflow-x-auto text-xs">
              GET /api/health-data?dataset=anxiety-depression&state=California
            </code>
          </div>

          <div>
            <p className="font-semibold mb-2">First 100 chronic disease indicators</p>
            <code className="block bg-gray-100 p-3 rounded overflow-x-auto text-xs">
              GET /api/health-data?dataset=chronic-disease-indicators&limit=100
            </code>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Response Format</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
          {JSON.stringify(
            {
              success: true,
              dataset: "epidemic-trends",
              rows: 100,
              data: [
                {
                  date: "2026-08-01",
                  disease: "COVID-19",
                  state: "California",
                  category: "Declining",
                },
              ],
              metadata: {
                originalRows: 505853,
                filters: { state: null, daysBack: 30, limit: 100 },
              },
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Data Updates</h2>
        <p className="text-gray-600 text-sm">
          Data is fetched daily during the build process and archived for historical analysis. Most
          datasets update weekly or monthly. Daily snapshots are stored in{" "}
          <code>/data/archive/</code> for trend analysis.
        </p>
      </section>
    </div>
  );
}
