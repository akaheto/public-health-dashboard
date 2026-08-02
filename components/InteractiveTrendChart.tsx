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
  value: number;
  movingAvg7?: number;
  movingAvg14?: number;
}

interface InteractiveTrendChartProps {
  datasetId: string;
  title: string;
  showMovingAverage?: boolean;
  daysBack?: number;
  height?: number;
}

export default function InteractiveTrendChart({
  datasetId,
  title,
  showMovingAverage = true,
  daysBack = 90,
  height = 400,
}: InteractiveTrendChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(daysBack);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/health-data?dataset=${datasetId}&limit=2000`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        const rawData = result.data || [];

        // Extract and process data
        const dataPoints: DataPoint[] = [];
        rawData.forEach((row: any) => {
          const date = row.date || row.time_period_start_date || row.year_start || row.week_ending_date;
          let value = row.percent_visits || row.value || row.data_value || row.rate_per_100000;

          if (date && value !== undefined && !isNaN(Number(value))) {
            dataPoints.push({
              date: String(date),
              value: Number(value),
            });
          }
        });

        // Sort by date
        dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate moving averages
        const withMovingAvg = dataPoints.map((point, idx) => {
          const window7 = dataPoints.slice(Math.max(0, idx - 6), idx + 1);
          const window14 = dataPoints.slice(Math.max(0, idx - 13), idx + 1);

          return {
            ...point,
            movingAvg7: window7.reduce((sum, p) => sum + p.value, 0) / window7.length,
            movingAvg14: window14.reduce((sum, p) => sum + p.value, 0) / window14.length,
          };
        });

        setData(withMovingAvg);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">Loading interactive chart...</p>
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
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Filter data by selected range
  const filteredData =
    selectedRange > 0
      ? data.slice(Math.max(0, data.length - selectedRange))
      : data;

  // Calculate statistics for filtered data
  const values = filteredData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const latest = values[values.length - 1];
  const change = latest - avg;
  const changePercent = (change / avg) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Min:</span>
            <span className="ml-1 font-mono font-semibold">{min.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Avg:</span>
            <span className="ml-1 font-mono font-semibold">{avg.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Max:</span>
            <span className="ml-1 font-mono font-semibold">{max.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Latest:</span>
            <span className={`ml-1 font-mono font-semibold ${changePercent > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {latest.toFixed(2)} ({changePercent > 0 ? "+" : ""}{changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
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

      {/* Interactive Chart */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval={Math.max(0, Math.floor(filteredData.length / 8))}
            />
            <YAxis tick={{ fontSize: 12 }} />
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              dot={false}
              isAnimationActive={false}
              name="Actual Value"
            />
            {showMovingAverage && (
              <>
                <Line
                  type="monotone"
                  dataKey="movingAvg7"
                  stroke="#f59e0b"
                  dot={false}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                  name="7-Day MA"
                />
                <Line
                  type="monotone"
                  dataKey="movingAvg14"
                  stroke="#ef4444"
                  dot={false}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                  name="14-Day MA"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Export Option */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            const csv = [
              ["Date", "Value", "7-Day MA", "14-Day MA"].join(","),
              ...filteredData.map((d) =>
                [d.date, d.value, d.movingAvg7?.toFixed(2) || "", d.movingAvg14?.toFixed(2) || ""].join(",")
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${datasetId}-trends.csv`;
            a.click();
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ↓ Download as CSV
        </button>
      </div>
    </div>
  );
}
