import StateHeatmap from "@/components/StateHeatmap";

export const metadata = {
  title: "Geographic Analysis | Public Health Dashboard",
  description: "State-level heatmaps and regional analysis of CDC health metrics",
};

export default function GeographicPage() {
  return (
    <div className="min-h-full" style={{ background: "var(--color-bg-page)" }}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 pb-4" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Geographic Analysis
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            State-level heatmaps and regional analysis of CDC health metrics
          </p>
        </header>

        <div className="mb-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">How to use:</span> Click any state to view detailed statistics. Colors indicate relative intensity:
            </p>
            <ul className="text-sm text-blue-900 dark:text-blue-100 mt-2 ml-4 space-y-1 list-disc">
              <li><span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>Green/Light blue = Low values</li>
              <li><span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-2"></span>Amber/Medium blue = Moderate values</li>
              <li><span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>Red/Dark blue = High values</li>
            </ul>
          </div>
        </div>

        {/* Infectious Disease Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Infectious Disease Surveillance</h2>
          <div className="space-y-8">
            <StateHeatmap
              datasetId="healthcare-surveillance"
              title="ED Visits by State - Healthcare Syndromic Surveillance"
              severity="neutral"
            />

            <StateHeatmap
              datasetId="nssp-ed-respiratory"
              title="Respiratory Illness by State - NSSP ED Data"
              severity="warning"
            />

            <StateHeatmap
              datasetId="covid-test-positivity"
              title="COVID-19 Test Positivity Rate by State"
              severity="warning"
            />
          </div>
        </section>

        {/* Mental Health Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Mental Health Indicators</h2>
          <div className="space-y-8">
            <StateHeatmap
              datasetId="anxiety-depression"
              title="Anxiety & Depression Prevalence by State"
              severity="warning"
            />

            <StateHeatmap
              datasetId="mental-health-care"
              title="Mental Health Care Access by State"
              severity="neutral"
            />
          </div>
        </section>

        {/* Injury & Mortality Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Injury & Mortality</h2>
          <div className="space-y-8">
            <StateHeatmap
              datasetId="drug-poisoning-mortality"
              title="Drug Overdose Mortality Rates by State"
              severity="warning"
            />
          </div>
        </section>

        {/* Regional Insights */}
        <section className="border-t" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4 mt-8">About Geographic Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Regional Clustering</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Data is grouped by region (Northeast, Midwest, Southeast, South-Central, Mountain, Southwest, West) to identify geographic patterns and shared risk factors.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">State-Level Metrics</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Each state shows its aggregated value, data point count, and range (min/max/avg). This helps identify outliers and regional disparities.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Heatmap Color Coding</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Green/blue = low values, amber/medium = moderate, red/dark = high. Two severity modes: warning (red spectrum) for concerning metrics, neutral (blue spectrum) for descriptive data.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Interactive Selection</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click any state to drill down into detailed statistics including data point count, min/max values, and regional context for deeper analysis.
              </p>
            </div>
          </div>
        </section>

        {/* US Regions Map */}
        <section className="border-t mt-8" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4 mt-8">US Regions (Phase 7)</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-sm mb-2">Northeast</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  CT, DE, MA, MD, ME, NH, NJ, NY, PA, RI, VT
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">Midwest</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  IL, IN, IA, KS, MI, MN, MO, ND, NE, OH, SD, WI
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">Southeast</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AL, AR, FL, GA, KY, LA, MS, NC, SC, TN, VA, WV
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">South-Central</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  OK, TX
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">Mountain</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  CO, ID, MT, NM, NV, UT, WY
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">West</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AK, CA, HI, OR, WA
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Future Enhancements */}
        <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4">Phase 7 Complete ✓</h2>
          <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            <li>✓ State-level aggregation and heatmaps</li>
            <li>✓ Regional grouping and statistics</li>
            <li>✓ Interactive state selection with drill-down</li>
            <li>✓ Dual color schemes (warning/neutral)</li>
            <li>✓ Data range and statistics per state</li>
          </ul>

          <h3 className="font-semibold text-sm mt-6 mb-3">Upcoming (Phase 8+)</h3>
          <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            <li>• County-level drill-down for selected states</li>
            <li>• Interactive SVG map visualization</li>
            <li>• Regional trend comparison charts</li>
            <li>• Interstate correlation analysis</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
