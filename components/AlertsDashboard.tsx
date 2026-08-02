"use client";

import { useEffect, useState } from "react";
import { getDatasetInfo } from "@/lib/alerts/alert-rules";

interface AlertResult {
  datasetId: string;
  severity: "warning" | "critical";
  triggered: boolean;
  currentValue: number;
  baselineAverage: number;
  zScore: number;
  changePercent: number;
  trendDays: number;
  message: string;
  triggeredAt: string;
}

interface AlertsData {
  success: boolean;
  alerts: AlertResult[];
  timestamp: string;
  activeAlerts: AlertResult[];
  warningCount: number;
  criticalCount: number;
}

export default function AlertsDashboard() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/alerts");

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load alerts");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No alert data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-green-900 dark:text-green-100">All Clear</div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
            {data.alerts.length - data.activeAlerts.length}
          </div>
          <p className="text-xs text-green-800 dark:text-green-200 mt-1">datasets normal</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Warnings</div>
          <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
            {data.warningCount}
          </div>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">trending up slightly</p>
        </div>

        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-red-900 dark:text-red-100">Critical</div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">
            {data.criticalCount}
          </div>
          <p className="text-xs text-red-800 dark:text-red-200 mt-1">significant increase</p>
        </div>
      </div>

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Active Alerts</h3>
          {data.activeAlerts.map((alert, idx) => {
            const datasetInfo = getDatasetInfo(alert.datasetId);
            const bgColor =
              alert.severity === "critical"
                ? "bg-red-50 dark:bg-red-950 border-l-red-500"
                : "bg-yellow-50 dark:bg-yellow-950 border-l-yellow-500";
            const textColor =
              alert.severity === "critical"
                ? "text-red-900 dark:text-red-100"
                : "text-yellow-900 dark:text-yellow-100";

            return (
              <div key={idx} className={`border-l-4 rounded-lg p-4 ${bgColor} space-y-2`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold ${textColor}`}>
                      {alert.severity.toUpperCase()}: {datasetInfo?.name || alert.datasetId}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {datasetInfo?.alertReason}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-3">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Current</div>
                    <div className="font-semibold text-lg">{alert.currentValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Baseline Avg</div>
                    <div className="font-semibold text-lg">{alert.baselineAverage.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Change</div>
                    <div className={`font-semibold text-lg ${alert.changePercent > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {alert.changePercent > 0 ? "+" : ""}{alert.changePercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Z-Score / Trend</div>
                    <div className="font-semibold text-lg">
                      {alert.zScore.toFixed(2)} / {alert.trendDays}d
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-300 dark:border-gray-600">
                  Updated: {new Date(alert.triggeredAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <p className="text-green-900 dark:text-green-100 font-semibold">✓ All systems normal</p>
          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
            No statistically significant increases detected in monitored datasets
          </p>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
        Last checked: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
