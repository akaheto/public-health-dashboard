import DataSourceStatus from "@/components/DataSourceStatus";

export const metadata = {
  title: "Data Source Status | Public Health Dashboard",
  description: "Monitor freshness of CDC data sources based on expected update schedules",
};

export default function DataSourcesPage() {
  return (
    <div className="min-h-full" style={{ background: "var(--color-bg-page)" }}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 pb-4" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Data Source Freshness Dashboard
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Monitor CDC data source update status and freshness based on expected publication schedules
          </p>
        </header>

        <div className="space-y-8">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Note:</span> The "Rows Ingested" column shows the number of rows processed into the dashboard from each data source. Large datasets are limited to 100,000 rows to manage memory constraints (10k row chunks × 10 pages max). This represents the data available for querying in the dashboard, not the total rows available in the CDC dataset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950 p-4 rounded">
              <div className="text-sm font-semibold text-green-900 dark:text-green-100">Fresh</div>
              <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                Updated within expected timeframe
              </p>
            </div>
            <div className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded">
              <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Warning</div>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                Slightly delayed update
              </p>
            </div>
            <div className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950 p-4 rounded">
              <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">Stale</div>
              <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">
                Significantly overdue
              </p>
            </div>
            <div className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950 p-4 rounded">
              <div className="text-sm font-semibold text-red-900 dark:text-red-100">Error</div>
              <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                No data available
              </p>
            </div>
          </div>

          <DataSourceStatus />
        </div>
      </main>
    </div>
  );
}
