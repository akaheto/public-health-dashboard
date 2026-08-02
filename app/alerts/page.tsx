import AlertsDashboard from "@/components/AlertsDashboard";

export const metadata = {
  title: "Health Alerts | Public Health Dashboard",
  description: "Monitor statistically significant increases in CDC health metrics",
};

export default function AlertsPage() {
  return (
    <div className="min-h-full" style={{ background: "var(--color-bg-page)" }}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 pb-4" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Health Alerts
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Automatically detect statistically significant increases in health metrics
          </p>
        </header>

        <div className="mb-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">How alerts work:</span> Real-time monitoring compares current values against historical baselines (30 days) using statistical analysis (Z-scores). An alert triggers when:
            </p>
            <ul className="text-sm text-blue-900 dark:text-blue-100 mt-2 ml-4 space-y-1 list-disc">
              <li>Value exceeds 2+ standard deviations from average (Z-score ≥ 2.0)</li>
              <li>Change is trending consistently upward (2-3+ consecutive increases)</li>
              <li>Percentage increase meets severity thresholds (10-25% for warnings, higher for critical)</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-red-900 dark:text-red-100">Critical Alerts</div>
            <p className="text-xs text-red-800 dark:text-red-200 mt-2">
              Z-score ≥ 2.5, 3+ trend days, 15-30% increase. Immediate attention needed.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Warning Alerts</div>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
              Z-score ≥ 2.0, 2+ trend days, 5-15% increase. Monitor closely.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-green-900 dark:text-green-100">Monitored Datasets</div>
            <p className="text-xs text-green-800 dark:text-green-200 mt-2">
              7 CDC datasets tracked: ED visits, COVID, deaths, mental health.
            </p>
          </div>
        </div>

        <AlertsDashboard />

        <div className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4">Monitored Datasets & Thresholds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Daily Updated</h3>
              <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Healthcare Surveillance (ED visits by condition)</li>
                <li>• NSSP ED Respiratory (respiratory illness tracking)</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Weekly Updated</h3>
              <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                <li>• COVID-19 Test Positivity (infection tracking)</li>
                <li>• Influenza/Pneumonia Deaths (mortality monitoring)</li>
                <li>• Anxiety & Depression (mental health crisis)</li>
                <li>• Mental Health Care Access (service availability)</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Annual Updated</h3>
              <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Drug Poisoning Mortality (overdose crisis)</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Alert Frequency</h3>
              <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Checked: Every 5 minutes</li>
                <li>• Daily datasets: Near real-time</li>
                <li>• Weekly datasets: After each update</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
