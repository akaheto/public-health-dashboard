"use client";

import { useEffect, useState } from "react";

interface HealthDataItem {
  date?: string;
  state?: string;
  value?: number;
  category?: string;
  [key: string]: unknown;
}

interface HealthDataCardProps {
  datasetId: string;
  title: string;
  description: string;
  color: "red" | "orange" | "amber" | "green" | "blue" | "purple";
}

const colorMap = {
  red: "border-l-red-500 bg-red-50 dark:bg-red-950",
  orange: "border-l-orange-500 bg-orange-50 dark:bg-orange-950",
  amber: "border-l-amber-500 bg-amber-50 dark:bg-amber-950",
  green: "border-l-green-500 bg-green-50 dark:bg-green-950",
  blue: "border-l-blue-500 bg-blue-50 dark:bg-blue-950",
  purple: "border-l-purple-500 bg-purple-50 dark:bg-purple-950",
};

export default function HealthDataCard({
  datasetId,
  title,
  description,
  color,
}: HealthDataCardProps) {
  const [data, setData] = useState<HealthDataItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/health-data?dataset=${datasetId}&limit=5`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data || []);

        // Extract date from metadata
        if (result.metadata?.filters?.daysBack) {
          const date = new Date();
          date.setDate(date.getDate() - result.metadata.filters.daysBack);
          setLastUpdated(date.toLocaleDateString());
        }

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

  return (
    <div
      className={`border-l-4 rounded-lg p-4 ${colorMap[color]}`}
      style={{
        borderLeftColor: color === "red" ? "#ef4444" :
                        color === "orange" ? "#f97316" :
                        color === "amber" ? "#f59e0b" :
                        color === "green" ? "#22c55e" :
                        color === "blue" ? "#3b82f6" :
                        "#a855f7",
      }}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading data...</div>
      ) : error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.slice(0, 3).map((item, idx) => (
            <div key={idx} className="text-sm flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                {(item.state || item.disease || item.category || "Data")}
              </span>
              {item.value && (
                <span className="font-mono font-semibold">
                  {typeof item.value === "number"
                    ? item.value.toFixed(1)
                    : String(item.value)}
                </span>
              )}
            </div>
          ))}
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}
