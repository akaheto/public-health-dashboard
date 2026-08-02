"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

interface MetricData {
  name: string;
  stateValue: number;
  nationalAvg: number;
  percentOfAvg: number;
  status: "low" | "moderate" | "high";
}

export default function StateAssessment() {
  const [selectedState, setSelectedState] = useState("California");
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStateData(selectedState);
  }, [selectedState]);

  const fetchStateData = async (state: string) => {
    setLoading(true);
    try {
      const datasets = [
        { id: "epidemic-trends", name: "Epidemic Trends" },
        { id: "covid-test-positivity", name: "COVID-19 Test Positivity" },
        { id: "chronic-disease-indicators", name: "Chronic Disease Indicators" },
        { id: "drug-poisoning-mortality", name: "Drug Poisoning Mortality" },
        { id: "healthcare-surveillance", name: "Healthcare Surveillance" },
      ];

      const allData: Record<string, { state: number; national: number }> = {};

      for (const dataset of datasets) {
        const response = await fetch(`/api/health-data?dataset=${dataset.id}&limit=50`);
        if (response.ok) {
          const result = await response.json();
          const data = result.data as Array<{ stateName?: string; value?: number }>;

          const stateData = data.find(
            (d) => d.stateName?.toLowerCase() === state.toLowerCase()
          );
          const stateValue = stateData?.value ?? 0;
          const nationalAvg = data.length > 0
            ? data.reduce((sum, d) => sum + (d.value ?? 0), 0) / data.length
            : 0;

          allData[dataset.name] = {
            state: stateValue,
            national: nationalAvg,
          };
        }
      }

      const processedMetrics = Object.entries(allData).map(([name, values]) => {
        const percentOfAvg = values.national > 0
          ? Math.round((values.state / values.national) * 100)
          : 100;

        let status: "low" | "moderate" | "high" = "moderate";
        if (percentOfAvg < 80) status = "low";
        if (percentOfAvg > 120) status = "high";

        return {
          name,
          stateValue: parseFloat(values.state.toFixed(2)),
          nationalAvg: parseFloat(values.national.toFixed(2)),
          percentOfAvg,
          status,
        };
      });

      setMetrics(processedMetrics);
    } catch (err) {
      console.error("Failed to fetch state data:", err);
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = metrics.filter((m) => m.status === "high").length;
  const lowCount = metrics.filter((m) => m.status === "low").length;
  const overallStatus = highRiskCount > 2 ? "Elevated Health Concerns" : "Moderate Health Status";

  return (
    <div className="space-y-6">
      {/* State Selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2">Select State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading assessment...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Overall Status</p>
              <p className="text-2xl font-bold mt-2">{overallStatus}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metrics.length} metrics analyzed</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 p-6 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">High-Risk Metrics</p>
              <p className="text-2xl font-bold mt-2">{highRiskCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Above national average</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Strengths</p>
              <p className="text-2xl font-bold mt-2">{lowCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Below national average</p>
            </div>
          </div>

          {/* Health Assessment */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">Health Assessment for {selectedState}</h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Overall:</strong> {selectedState} shows{" "}
                {highRiskCount > 2 ? "elevated health concerns" : "moderate health indicators"} compared to national averages. The state has{" "}
                <strong>{highRiskCount} metrics above national average</strong> and{" "}
                <strong>{lowCount} metrics below average</strong>.
              </p>

              {highRiskCount > 0 && (
                <p>
                  <strong>Areas of Concern:</strong> {selectedState}'s{" "}
                  {metrics
                    .filter((m) => m.status === "high")
                    .map((m) => m.name.toLowerCase())
                    .join(", ")}{" "}
                  rates exceed national averages and warrant public health attention.
                </p>
              )}

              {lowCount > 0 && (
                <p>
                  <strong>Strengths:</strong> {selectedState} demonstrates{" "}
                  {lowCount > 1 ? "positive outcomes" : "strength"} in{" "}
                  {metrics
                    .filter((m) => m.status === "low")
                    .map((m) => m.name.toLowerCase())
                    .join(", ")}{" "}
                  with rates below the national average.
                </p>
              )}
            </div>
          </div>

          {/* Comparative Chart */}
          {metrics.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4">Metric Comparison: {selectedState} vs National Average</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stateValue" fill="#3b82f6" name={`${selectedState} Value`} />
                  <Bar dataKey="nationalAvg" fill="#9ca3af" name="National Average" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Metrics Table */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">Detailed Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Metric</th>
                    <th className="text-right py-3 px-4 font-semibold">{selectedState} Value</th>
                    <th className="text-right py-3 px-4 font-semibold">National Avg</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">{metric.name}</td>
                      <td className="py-3 px-4 text-right font-mono">{metric.stateValue}</td>
                      <td className="py-3 px-4 text-right font-mono">{metric.nationalAvg}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            metric.status === "low"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : metric.status === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {metric.status === "low" ? "Below Avg" : metric.status === "high" ? "Above Avg" : "Moderate"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
