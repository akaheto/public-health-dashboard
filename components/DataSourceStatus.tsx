"use client";

import { useEffect, useState } from "react";

interface DataSource {
  key: string;
  name: string;
  category: string;
  updateFrequency: "daily" | "weekly" | "monthly" | "annual";
  typicalLag: string;
  lastModified?: string;
  rowCount?: number;
  status: "fresh" | "warning" | "stale" | "error";
  hoursSinceUpdate?: number;
  expectedUpdateDate?: string;
}

interface DataRow {
  [key: string]: unknown;
}

const categoryLabels: Record<string, string> = {
  "infectious-disease": "Infectious Disease",
  "chronic-disease": "Chronic Disease",
  injury: "Injury & Mortality",
  "mental-health": "Mental Health",
};

const statusColors = {
  fresh: "bg-green-100 dark:bg-green-950 border-l-4 border-l-green-500",
  warning: "bg-yellow-100 dark:bg-yellow-950 border-l-4 border-l-yellow-500",
  stale: "bg-orange-100 dark:bg-orange-950 border-l-4 border-l-orange-500",
  error: "bg-red-100 dark:bg-red-950 border-l-4 border-l-red-500",
};

const statusBadges = {
  fresh: "text-green-700 dark:text-green-300 font-semibold",
  warning: "text-yellow-700 dark:text-yellow-300 font-semibold",
  stale: "text-orange-700 dark:text-orange-300 font-semibold",
  error: "text-red-700 dark:text-red-300 font-semibold",
};

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleString();
}

function getExpectedUpdateDate(lastModified: Date, frequency: string): Date {
  const expectedDate = new Date(lastModified);

  switch (frequency) {
    case "daily":
      expectedDate.setDate(expectedDate.getDate() + 1);
      break;
    case "weekly":
      expectedDate.setDate(expectedDate.getDate() + 7);
      break;
    case "monthly":
      expectedDate.setMonth(expectedDate.getMonth() + 1);
      break;
    case "annual":
      expectedDate.setFullYear(expectedDate.getFullYear() + 1);
      break;
  }

  return expectedDate;
}

export default function DataSourceStatus() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<DataRow[] | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  const handleSourceClick = async (sourceKey: string) => {
    if (expandedSource === sourceKey) {
      setExpandedSource(null);
      setExpandedData(null);
      return;
    }

    setExpandedSource(sourceKey);
    setExpandedLoading(true);

    try {
      const response = await fetch(`/api/health-data?dataset=${sourceKey}&limit=5`);
      if (response.ok) {
        const result = await response.json();
        setExpandedData(result.data || []);
      } else {
        setExpandedData([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setExpandedData([]);
    } finally {
      setExpandedLoading(false);
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/data-sources");
        if (!response.ok) throw new Error("Failed to fetch metadata");

        const data = await response.json();
        const apiSources = data.sources || [];

        const sources: DataSource[] = apiSources.map((source: any) => {
          const lastModified = new Date(source.lastModified);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60);
          const status = getDataStatus(hoursSinceUpdate, source.updateFrequency);
          const expectedUpdateDate = getExpectedUpdateDate(lastModified, source.updateFrequency);

          return {
            ...source,
            status,
            hoursSinceUpdate,
            expectedUpdateDate: expectedUpdateDate.toISOString(),
          };
        });

        setDataSources(sources);
      } catch (error) {
        console.error("Failed to fetch data source status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const frequencyOrder = { daily: 0, weekly: 1, monthly: 2, annual: 3 };

  const categories = ["infectious-disease", "chronic-disease", "injury", "mental-health"];
  const filtered = selectedCategory ? dataSources.filter((s) => s.category === selectedCategory) : dataSources;
  const byCategory = categories.map((cat) => ({
    category: cat,
    sources: filtered
      .filter((s) => s.category === cat)
      .sort((a, b) => frequencyOrder[a.updateFrequency] - frequencyOrder[b.updateFrequency]),
  }));

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading data source status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Data Source Freshness Monitor</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded text-sm ${selectedCategory === null ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            All ({dataSources.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded text-sm ${selectedCategory === cat ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              {categoryLabels[cat]} ({filtered.filter((s) => s.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {byCategory
        .filter((group) => group.sources.length > 0)
        .map((group) => (
          <section key={group.category} className="space-y-2">
            <h3 className="text-lg font-semibold">
              {categoryLabels[group.category]} ({group.sources.length})
            </h3>

            <div className="space-y-1 text-sm">
              {/* Header row */}
              <div className="grid gap-3 px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 mb-1" style={{
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr"
              }}>
                <div>Source</div>
                <div>Frequency</div>
                <div>Lag</div>
                <div title="Rows ingested into dashboard">Rows Ingested</div>
                <div>Last Updated</div>
              </div>

              {/* Data rows */}
              {group.sources.map((source) => (
                <div key={source.key} className="space-y-1">
                  <button
                    onClick={() => handleSourceClick(source.key)}
                    className={`w-full text-left ${statusColors[source.status]} rounded px-3 py-2 grid gap-3 items-center hover:opacity-80 transition-opacity cursor-pointer`}
                    style={{
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr"
                    }}
                  >
                    <span className={`${statusBadges[source.status]}`}>
                      {source.name}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {source.updateFrequency}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {source.typicalLag}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {source.rowCount} rows
                    </span>
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      <div>{formatDate(source.lastModified)}</div>
                      {(source.status === "warning" || source.status === "stale" || source.status === "error") && (
                        <div className={`${statusBadges[source.status]} text-xs mt-1`}>
                          Expected: {formatDate(source.expectedUpdateDate)}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Expanded data view */}
                  {expandedSource === source.key && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded px-3 py-3 ml-2 border-l-2 border-gray-400 dark:border-gray-600">
                      {expandedLoading ? (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">Loading data...</p>
                      ) : expandedData && expandedData.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Recent Data ({expandedData.length} rows):
                          </p>
                          <div className="space-y-2 overflow-x-auto">
                            {expandedData.map((row, idx) => (
                              <div key={idx} className="text-xs bg-white dark:bg-gray-700 rounded p-2 border border-gray-300 dark:border-gray-600">
                                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-40">
                                  {JSON.stringify(row, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">No data available</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

function getDataStatus(hoursSinceUpdate: number, frequency: string): "fresh" | "warning" | "stale" | "error" {
  const thresholds: Record<string, { fresh: number; warning: number; stale: number }> = {
    daily: { fresh: 26, warning: 48, stale: 72 },
    weekly: { fresh: 9 * 24, warning: 14 * 24, stale: 21 * 24 },
    monthly: { fresh: 33 * 24, warning: 45 * 24, stale: 60 * 24 },
    annual: { fresh: 400 * 24, warning: 450 * 24, stale: 500 * 24 },
  };

  const threshold = thresholds[frequency] || thresholds.daily;

  if (hoursSinceUpdate <= threshold.fresh) return "fresh";
  if (hoursSinceUpdate <= threshold.warning) return "warning";
  if (hoursSinceUpdate <= threshold.stale) return "stale";
  return "error";
}
