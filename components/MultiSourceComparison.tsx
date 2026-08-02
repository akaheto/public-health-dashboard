"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface DatasetConfig {
  id: string;
  label: string;
  color: string;
}

interface MultiSourceComparisonProps {
  datasets: DatasetConfig[];
  title: string;
  height?: number;
}

const colorPalette = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

export default function MultiSourceComparison({
  datasets,
  title,
  height = 400,
}: MultiSourceComparisonProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(90);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const allData: Record<string, any[]> = {};

        // Fetch each dataset
        for (const dataset of datasets) {
          const response = await fetch(`/api/health-data?dataset=${dataset.id}&limit=1000`);
          if (response.ok) {
            const result = await response.json();
            const rawData = result.data || [];

            const dataPoints = rawData
              .map((row: any) => {
                const date = row.date || row.time_period_start_date || row.year_start || row.week_ending_date;
                let value = row.percent_visits || row.value || row.data_value || row.rate_per_100000;

                if (date && value !== undefined && !isNaN(Number(value))) {
                  return { date: String(date), value: Number(value) };
                }
                return null;
              })
              .filter(Boolean);

            allData[dataset.id] = dataPoints;
          }
        }

        // Merge data by date
        const dateMap = new Map<string, DataPoint>();

        for (const [datasetId, dataPoints] of Object.entries(allData)) {
          const dataset = datasets.find((d) => d.id === datasetId);
          if (!dataset) continue;

          dataPoints.forEach((point: any) => {
            if (!dateMap.has(point.date)) {
              dateMap.set(point.date, { date: point.date });
            }
            dateMap.get(point.date)![datasetId] = point.value;
          });
        }

        // Sort by date
        const mergedData = Array.from(dateMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setData(mergedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [datasets]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">Loading comparison chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 rounded-lg p-6 border border-red-200 dark:border-red-700">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No data available for comparison</p>
      </div>
    );
  }

  // Filter data by selected range
  const filteredData =
    selectedRange > 0
      ? data.slice(Math.max(0, data.length - selectedRange))
      : data;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Normalized comparison of {datasets.length} datasets (scaled to 0-100)
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedRange(30)}
          className={`px-3 py-1 rounded text-sm ${selectedRange === 30 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          30d
        </button>
        <button
          onClick={() => setSelectedRange(90)}
          className={`px-3 py-1 rounded text-sm ${selectedRange === 90 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          90d
        </button>
        <button
          onClick={() => setSelectedRange(180)}
          className={`px-3 py-1 rounded text-sm ${selectedRange === 180 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          180d
        </button>
        <button
          onClick={() => setSelectedRange(0)}
          className={`px-3 py-1 rounded text-sm ${selectedRange === 0 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          All
        </button>
      </div>

      {/* Interactive Chart - Normalized */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval={Math.max(0, Math.floor(filteredData.length / 8))}
            />
            <YAxis tick={{ fontSize: 12 }} label={{ value: "Value", angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #4b5563",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value) => (typeof value === "number" ? value.toFixed(2) : value)}
            />
            <Legend />
            {datasets.map((dataset, idx) => (
              <Line
                key={dataset.id}
                type="monotone"
                dataKey={dataset.id}
                stroke={dataset.color || colorPalette[idx % colorPalette.length]}
                dot={false}
                isAnimationActive={false}
                name={dataset.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {datasets.map((dataset, idx) => {
          const values = filteredData
            .map((d) => d[dataset.id])
            .filter((v) => typeof v === "number") as number[];

          if (values.length === 0) return null;

          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;

          return (
            <div key={dataset.id} className="text-sm space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor: dataset.color || colorPalette[idx % colorPalette.length],
                  }}
                />
                {dataset.label}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 ml-5">
                Min: {min.toFixed(2)} | Avg: {avg.toFixed(2)} | Max: {max.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
