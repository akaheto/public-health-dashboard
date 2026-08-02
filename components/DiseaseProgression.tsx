"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DiseaseMetric {
  name: string;
  states: Array<{ name: string; value: number }>;
}

interface TopStates {
  disease: string;
  topStates: Array<{ rank: number; state: string; value: number }>;
  minState: { state: string; value: number };
  maxState: { state: string; value: number };
  trend: "increasing" | "stable" | "decreasing";
}

export default function DiseaseProgression() {
  const [selectedDisease, setSelectedDisease] = useState("epidemic-trends");
  const [topStates, setTopStates] = useState<TopStates | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<Array<{ state: string; value: number }>>([]);

  const diseases = [
    { id: "epidemic-trends", name: "Epidemic Trends", icon: "🦠" },
    { id: "covid-test-positivity", name: "COVID-19 Test Positivity", icon: "😷" },
    { id: "drug-poisoning-mortality", name: "Drug Overdose Deaths", icon: "⚠️" },
    { id: "healthcare-surveillance", name: "Healthcare Surveillance", icon: "🏥" },
  ];

  useEffect(() => {
    fetchProgressionData(selectedDisease);
  }, [selectedDisease]);

  const fetchProgressionData = async (diseaseId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/health-data?dataset=${diseaseId}&limit=50`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data as Array<{ stateName?: string; value?: number }>;

        // Get top states
        const sortedStates = [...data]
          .filter((d) => d.stateName && d.value !== undefined)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .slice(0, 10);

        const topStatesData = sortedStates.map((d, idx) => ({
          rank: idx + 1,
          state: d.stateName || "",
          value: parseFloat((d.value ?? 0).toFixed(2)),
        }));

        const allValues = data
          .filter((d) => d.value !== undefined)
          .map((d) => d.value ?? 0);
        const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;
        const trend =
          topStatesData[0]?.value > avgValue * 1.2
            ? ("increasing" as const)
            : topStatesData[0]?.value < avgValue * 0.8
            ? ("decreasing" as const)
            : ("stable" as const);

        const minState = [...data].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0];
        const maxState = [...data].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];

        setTopStates({
          disease: diseaseId,
          topStates: topStatesData,
          minState: { state: minState?.stateName || "", value: minState?.value ?? 0 },
          maxState: { state: maxState?.stateName || "", value: maxState?.value ?? 0 },
          trend,
        });

        // Prepare chart data
        const chartData = sortedStates.slice(0, 10).map((d) => ({
          state: (d.stateName || "").substring(0, 2).toUpperCase(),
          value: parseFloat((d.value ?? 0).toFixed(2)),
        }));
        setChartData(chartData);
      }
    } catch (err) {
      console.error("Failed to fetch progression data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDiseaseLabel = diseases.find((d) => d.id === selectedDisease)?.name || "";
  const trendEmoji = topStates?.trend === "increasing" ? "📈" : topStates?.trend === "decreasing" ? "📉" : "➡️";
  const maxValue = topStates?.maxState.value ?? 0;

  return (
    <div className="space-y-6">
      {/* Disease Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {diseases.map((disease) => (
          <button
            key={disease.id}
            onClick={() => setSelectedDisease(disease.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedDisease === disease.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <span className="text-2xl block mb-1">{disease.icon}</span>
            <p className="font-semibold text-sm">{disease.name}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading progression data...</div>
      ) : topStates ? (
        <>
          {/* Trend Summary */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">{selectedDiseaseLabel}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Disease progression and geographic distribution analysis
                </p>
              </div>
              <div className="text-5xl">{trendEmoji}</div>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Highest Risk State</p>
              <p className="text-2xl font-bold">{topStates.maxState.state}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Value: {topStates.maxState.value.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Lowest Risk State</p>
              <p className="text-2xl font-bold">{topStates.minState.state}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Value: {topStates.minState.value.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Trend</p>
              <p className="text-2xl font-bold">
                {topStates.trend === "increasing" ? "Rising" : topStates.trend === "decreasing" ? "Declining" : "Stable"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {topStates.trend === "increasing"
                  ? "Cases increasing in high-risk areas"
                  : topStates.trend === "decreasing"
                  ? "Cases declining overall"
                  : "Stable across regions"}
              </p>
            </div>
          </div>

          {/* Geographic Distribution Chart */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4">Top 10 States by Disease Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="state" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ranking Table */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">State Rankings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              States with highest disease activity levels for {selectedDiseaseLabel.toLowerCase()}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="text-center py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">State</th>
                    <th className="text-right py-3 px-4 font-semibold">Value</th>
                    <th className="text-center py-3 px-4 font-semibold">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {topStates.topStates.map((row, idx) => {
                    const avgValue = (topStates.topStates.reduce((sum, s) => sum + s.value, 0) / topStates.topStates.length);
                    let riskLevel = "Moderate";
                    if (row.value > avgValue * 1.3) riskLevel = "High";
                    if (row.value < avgValue * 0.7) riskLevel = "Low";

                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="text-center py-3 px-4 font-bold">#{row.rank}</td>
                        <td className="py-3 px-4">{row.state}</td>
                        <td className="py-3 px-4 text-right font-mono">{row.value.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              riskLevel === "High"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : riskLevel === "Low"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {riskLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>💡</span>
              Key Insights
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>
                • <strong>{topStates.maxState.state}</strong> shows the highest disease activity for {selectedDiseaseLabel.toLowerCase()} with a value of{" "}
                <strong>{topStates.maxState.value.toFixed(2)}</strong>
              </li>
              <li>
                • The gap between highest ({topStates.maxState.state}) and lowest ({topStates.minState.state}) states indicates{" "}
                <strong>{((topStates.maxState.value / (topStates.minState.value || 1)) * 100 - 100).toFixed(0)}% variation</strong> in disease activity
              </li>
              <li>
                • Current trend indicates {topStates.trend === "increasing" ? "growing" : "declining"} disease pressure in affected regions
              </li>
              <li>
                • Public health resources should focus on the top 5 affected states for greatest impact
              </li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
