"use client";

import { useEffect, useState } from "react";

interface TrendData {
  date: string;
  value: number;
  label?: string;
}

interface TrendingChartProps {
  datasetId: string;
  datasetName: string;
  dateField?: string;
  valueField?: string;
}

export default function TrendingChart({
  datasetId,
  datasetName,
  dateField = "date",
  valueField = "value",
}: TrendingChartProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ min: number; max: number; avg: number } | null>(null);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/health-data?dataset=${datasetId}&limit=1000`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        const rawData = result.data || [];

        // Extract date and value pairs
        const trendData: TrendData[] = [];
        const values: number[] = [];

        rawData.forEach((row: any) => {
          // Try to find date field
          const date = row[dateField] || row.date || row.time_period_start_date || row.year_start || row.week_ending_date;

          // Try to find value field
          let value = row[valueField];
          if (value === undefined) {
            // Try common value field names
            value = row.percent_visits || row.value || row.data_value || row.rate_per_100000;
          }

          if (date && value !== undefined && !isNaN(Number(value))) {
            trendData.push({
              date: String(date),
              value: Number(value),
            });
            values.push(Number(value));
          }
        });

        // Sort by date
        trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate statistics
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          setStats({ min, max, avg });
        }

        setData(trendData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trend data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [datasetId, dateField, valueField]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-2">{datasetName}</h3>
        <p className="text-sm text-gray-500">Loading trend data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 rounded-lg p-6 border border-red-200 dark:border-red-700">
        <h3 className="font-semibold text-lg text-red-900 dark:text-red-100 mb-2">{datasetName}</h3>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-2">{datasetName}</h3>
        <p className="text-sm text-gray-500">No trend data available</p>
      </div>
    );
  }

  // Simple ASCII chart
  const chartHeight = 10;
  const chartWidth = Math.min(60, data.length);
  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  // Sample data for display (take every nth point to fit in width)
  const step = Math.ceil(data.length / chartWidth);
  const sampledData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  // Create ASCII chart
  const chart: string[] = [];
  for (let row = chartHeight; row >= 0; row--) {
    let line = "";
    const threshold = minValue + (range * row) / chartHeight;

    for (const point of sampledData) {
      if (point.value >= threshold) {
        line += "█";
      } else {
        line += " ";
      }
    }
    chart.push(line);
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{datasetName}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {data.length} data points from {data[0]?.date} to {data[data.length - 1]?.date}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600">
            <div className="text-gray-600 dark:text-gray-400">Min</div>
            <div className="font-semibold text-lg">{stats.min.toFixed(2)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600">
            <div className="text-gray-600 dark:text-gray-400">Average</div>
            <div className="font-semibold text-lg">{stats.avg.toFixed(2)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600">
            <div className="text-gray-600 dark:text-gray-400">Max</div>
            <div className="font-semibold text-lg">{stats.max.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs overflow-x-auto">
        {chart.map((line, i) => (
          <div key={i} className="h-4">
            {line}
          </div>
        ))}
        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
          {sampledData[0]?.date} → {sampledData[sampledData.length - 1]?.date}
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400">
        <p className="font-semibold mb-1">Recent values:</p>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {data.slice(-10).reverse().map((point, i) => (
            <div key={i} className="flex justify-between">
              <span>{point.date}</span>
              <span className="font-mono">{point.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
