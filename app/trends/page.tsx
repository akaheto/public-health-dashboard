import TrendingChart from "@/components/TrendingChart";

export const metadata = {
  title: "Data Trends | Public Health Dashboard",
  description: "Visualize CDC data trends over time",
};

const trendingDatasets = [
  {
    datasetId: "epidemic-trends",
    name: "Disease Activity Trends",
    description: "COVID-19, Influenza, RSV trend classifications over time",
  },
  {
    datasetId: "nssp-ed-respiratory",
    name: "ED Respiratory Visits Trend",
    description: "Percentage of ED visits for respiratory illnesses",
  },
  {
    datasetId: "anxiety-depression",
    name: "Anxiety & Depression Trend",
    description: "Prevalence of anxiety and depression symptoms over time",
  },
  {
    datasetId: "mental-health-care",
    name: "Mental Health Care Access Trend",
    description: "Access to mental health services over time",
  },
  {
    datasetId: "drug-poisoning-mortality",
    name: "Drug Overdose Mortality Trend",
    description: "Drug poisoning mortality rates by year",
  },
  {
    datasetId: "covid-test-positivity",
    name: "COVID-19 Test Positivity Trend",
    description: "Weekly COVID-19 test positivity rates",
  },
  {
    datasetId: "influenza-pneumonia-deaths",
    name: "Influenza/Pneumonia Deaths Trend",
    description: "Weekly provisional death counts",
  },
  {
    datasetId: "healthcare-surveillance",
    name: "Healthcare Surveillance Trend",
    description: "ED visit percentages by condition over time",
  },
];

export default function TrendsPage() {
  return (
    <div className="min-h-full" style={{ background: "var(--color-bg-page)" }}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 pb-4" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            CDC Data Trends
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Visualize how health metrics are trending over time. Charts show relative trends using ASCII visualization.
          </p>
        </header>

        <div className="mb-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-semibold">How to read the charts:</span> Each █ block represents a data point. The height shows the value relative to the minimum and maximum in that dataset. Statistics show min/average/max values. Recent values are listed below the chart.
          </p>
        </div>

        <div className="space-y-6">
          {trendingDatasets.map((dataset) => (
            <div key={dataset.datasetId}>
              <div className="mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{dataset.description}</p>
              </div>
              <TrendingChart
                datasetId={dataset.datasetId}
                datasetName={dataset.name}
              />
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-border-default)" }}>
          <h2 className="text-lg font-semibold mb-4">Future Enhancements</h2>
          <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Interactive charts with zoom and pan capabilities</li>
            <li>• Multiple data source comparison on same chart</li>
            <li>• Geographic filtering (state-level trends)</li>
            <li>• Trend analysis (up/down/stable indicators)</li>
            <li>• Export trend data to CSV</li>
            <li>• Moving averages and smoothing options</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
