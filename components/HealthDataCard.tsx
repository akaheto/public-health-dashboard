"use client";

import { useEffect, useState } from "react";
import CDCDataModal from "./CDCDataModal";

interface HealthDataItem {
  date?: string;
  state?: string | null;
  disease?: string | null;
  value?: number;
  category?: string | null;
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
  const [showModal, setShowModal] = useState(false);

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

  const stats = data && data.length > 0 ? {
    avg: (data.reduce((sum, item) => sum + (item.value ?? 0), 0) / data.length).toFixed(1),
    max: Math.max(...data.map((item) => item.value ?? -Infinity)).toFixed(1),
    min: Math.min(...data.map((item) => item.value ?? Infinity)).toFixed(1),
  } : null;

  return (
    <>
      <div
        onClick={() => data && data.length > 0 && setShowModal(true)}
        className={`border-l-4 rounded-lg p-4 ${colorMap[color]} ${
          data && data.length > 0 ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
        }`}
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
          <div className="text-sm text-gray-500">Data not available in this environment</div>
        ) : data && data.length > 0 && stats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
                <p className="text-lg font-bold">{stats.avg}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Low</p>
                <p className="text-lg font-bold">{stats.min}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">High</p>
                <p className="text-lg font-bold">{stats.max}</p>
              </div>
            </div>
            <p className="text-xs text-center text-blue-600 dark:text-blue-400 font-semibold">
              Click to explore all 50 states →
            </p>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No data available</div>
        )}
      </div>

      {showModal && (
        <CDCDataModal
          datasetId={datasetId}
          title={title}
          color={color}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
