import InteractiveTrendChart from "@/components/InteractiveTrendChart";
import MultiSourceComparison from "@/components/MultiSourceComparison";

export const metadata = {
  title: "Data Visualizations | Public Health Dashboard",
  description: "Interactive charts and comparisons of CDC health trends",
};

export default function VisualizationsPage() {
  return (
    <div className="min-h-full" style={{ background: "var(--color-bg-page)" }}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 pb-4" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Enhanced Data Visualizations
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Interactive charts with date range selection, moving averages, and multi-source comparison
          </p>
        </header>

        <div className="mb-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-semibold">Features:</span> Use date range buttons to zoom in/out, hover over the chart for details, view 7-day and 14-day moving averages, download data as CSV, and compare multiple datasets side-by-side.
          </p>
        </div>

        {/* Individual Dataset Trends */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Individual Trends</h2>
          <div className="space-y-8">
            <InteractiveTrendChart
              datasetId="healthcare-surveillance"
              title="Healthcare Syndromic Surveillance - ED Visits"
              showMovingAverage={true}
              height={400}
            />

            <InteractiveTrendChart
              datasetId="nssp-ed-respiratory"
              title="NSSP ED Respiratory Visits Trend"
              showMovingAverage={true}
              height={400}
            />

            <InteractiveTrendChart
              datasetId="covid-test-positivity"
              title="COVID-19 Test Positivity Rate"
              showMovingAverage={true}
              height={400}
            />

            <InteractiveTrendChart
              datasetId="anxiety-depression"
              title="Anxiety & Depression Prevalence"
              showMovingAverage={true}
              height={400}
            />

            <InteractiveTrendChart
              datasetId="drug-poisoning-mortality"
              title="Drug Poisoning Mortality Rates"
              showMovingAverage={true}
              height={400}
            />
          </div>
        </section>

        {/* Multi-Source Comparisons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Multi-Source Comparisons</h2>
          <div className="space-y-8">
            <MultiSourceComparison
              title="Respiratory Illness Indicators Comparison"
              datasets={[
                {
                  id: "nssp-ed-respiratory",
                  label: "ED Respiratory Visits %",
                  color: "#3b82f6",
                },
                {
                  id: "covid-test-positivity",
                  label: "COVID Test Positivity %",
                  color: "#ef4444",
                },
              ]}
              height={400}
            />

            <MultiSourceComparison
              title="Mental Health Trends Comparison"
              datasets={[
                {
                  id: "anxiety-depression",
                  label: "Anxiety & Depression",
                  color: "#8b5cf6",
                },
                {
                  id: "mental-health-care",
                  label: "Mental Health Care Access",
                  color: "#06b6d4",
                },
              ]}
              height={400}
            />

            <MultiSourceComparison
              title="Infectious Disease Burden Comparison"
              datasets={[
                {
                  id: "healthcare-surveillance",
                  label: "ED Visits (Syndromic)",
                  color: "#10b981",
                },
                {
                  id: "influenza-pneumonia-deaths",
                  label: "Respiratory Deaths",
                  color: "#f59e0b",
                },
              ]}
              height={400}
            />
          </div>
        </section>

        {/* Features Documentation */}
        <section className="border-t" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4 mt-8">Visualization Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Date Range Selection</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Choose 30-day, 90-day, 180-day, or all-time views to zoom in on specific periods or see long-term trends.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Moving Averages</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                7-day (amber) and 14-day (red) moving averages smooth daily volatility to reveal underlying trends.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Interactive Tooltips</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Hover over any point to see exact date and values, including moving average calculations.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">CSV Export</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Download chart data as CSV for further analysis in spreadsheet or statistical software.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Multi-Source Comparison</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Compare multiple health indicators side-by-side to identify correlations and causation patterns.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Statistics Panel</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Min, average, and max values update dynamically with selected date range for quick analysis.
              </p>
            </div>
          </div>
        </section>

        {/* Future Enhancements */}
        <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4">Upcoming Features (Phase 7-8)</h2>
          <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Geographic filtering and state-level heatmaps</li>
            <li>• Predictive forecasting (2-4 week outlook)</li>
            <li>• Anomaly detection with confidence intervals</li>
            <li>• Custom alert rules per chart</li>
            <li>• Shareable chart snapshots</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
