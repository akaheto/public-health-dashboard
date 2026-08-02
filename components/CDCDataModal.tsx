"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface StateData {
  state?: string;
  value?: number;
  stateName?: string;
  [key: string]: unknown;
}

interface CDCDataModalProps {
  datasetId: string;
  title: string;
  color: string;
  onClose: () => void;
}

export default function CDCDataModal({
  datasetId,
  title,
  color,
  onClose,
}: CDCDataModalProps) {
  const [data, setData] = useState<StateData[]>([]);
  const [filteredData, setFilteredData] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "value">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/health-data?dataset=${datasetId}&limit=50`);
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasetId]);

  useEffect(() => {
    let filtered = data.filter((item) => {
      const stateName = (item.state || item.stateName || "").toLowerCase();
      return stateName.includes(searchTerm.toLowerCase());
    });

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = (a.state || a.stateName || "").toLowerCase();
        const nameB = (b.state || b.stateName || "").toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        const valA = a.value ?? 0;
        const valB = b.value ?? 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });

    setFilteredData(filtered);
  }, [data, sortBy, sortOrder, searchTerm]);

  const stats = {
    avg: data.length > 0 ? (data.reduce((sum, item) => sum + (item.value ?? 0), 0) / data.length).toFixed(2) : "N/A",
    min: data.length > 0 ? Math.min(...data.map((item) => item.value ?? Infinity)).toFixed(2) : "N/A",
    max: data.length > 0 ? Math.max(...data.map((item) => item.value ?? -Infinity)).toFixed(2) : "N/A",
  };

  const chartData = filteredData.slice(0, 20).map((item) => ({
    name: (item.state || item.stateName || "").substring(0, 2).toUpperCase(),
    value: item.value ?? 0,
  }));

  const getColorValue = (index: number) => {
    const colors = {
      red: "#ef4444",
      orange: "#f97316",
      amber: "#f59e0b",
      green: "#22c55e",
      blue: "#3b82f6",
      purple: "#a855f7",
    };
    return (colors as Record<string, string>)[color] || "#3b82f6";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-gray-600 dark:text-gray-400">All 50 states</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-light"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">National Average</p>
              <p className="text-2xl font-bold mt-2">{stats.avg}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Lowest</p>
              <p className="text-2xl font-bold mt-2">{stats.min}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Highest</p>
              <p className="text-2xl font-bold mt-2">{stats.max}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-4">Top 20 States by Value</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={getColorValue(0)}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorValue(index)} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "value")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="name">Sort by Name</option>
              <option value="value">Sort by Value</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">State</th>
                    <th className="text-right py-3 px-4 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="py-3 px-4">{item.state || item.stateName}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {(item.value ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">No states match your search</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
