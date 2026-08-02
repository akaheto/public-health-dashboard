"use client";

import { useEffect, useState } from "react";
import {
  aggregateByState,
  aggregateByRegion,
  getStateColor,
  getContrastTextColor,
  formatStateValue,
  type StateData,
  type RegionData,
} from "@/lib/geo/state-aggregator";

interface StateHeatmapProps {
  datasetId: string;
  title: string;
  severity?: "warning" | "neutral";
}

export default function StateHeatmap({ datasetId, title, severity = "neutral" }: StateHeatmapProps) {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

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

        const aggregated = aggregateByState(rawData);
        const regions = aggregateByRegion(aggregated);

        setStateData(aggregated);
        setRegionData(regions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setStateData([]);
        setRegionData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">Loading state heatmap...</p>
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

  if (stateData.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No state data available</p>
      </div>
    );
  }

  const minValue = Math.min(...stateData.map((s) => s.value));
  const maxValue = Math.max(...stateData.map((s) => s.value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {stateData.length} states | Range: {formatStateValue(minValue)} - {formatStateValue(maxValue)}
        </p>
      </div>

      {/* Regional Summary */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">By Region</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {regionData.map((region) => (
            <div
              key={region.regionName}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{region.regionName}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {region.states.length} states
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Avg: {formatStateValue(region.avgValue)} | Min: {formatStateValue(region.minValue)} | Max:{" "}
                {formatStateValue(region.maxValue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* State Grid Heatmap */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">State-by-State Heatmap</h4>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {stateData.map((state) => {
            const bgColor = getStateColor(state.value, minValue, maxValue, severity);
            const textColor = getContrastTextColor(bgColor);

            return (
              <button
                key={state.stateCode}
                onClick={() => setSelectedState(selectedState === state.stateCode ? null : state.stateCode)}
                className="aspect-square rounded-lg font-semibold text-sm hover:opacity-80 transition-opacity border border-gray-300 dark:border-gray-600"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                }}
                title={`${state.stateName}: ${formatStateValue(state.value)}`}
              >
                {state.stateCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected State Details */}
      {selectedState && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          {(() => {
            const state = stateData.find((s) => s.stateCode === selectedState);
            if (!state) return null;

            return (
              <>
                <div className="font-semibold">{state.stateName}</div>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                    <span className="ml-2 font-mono font-semibold">{formatStateValue(state.value)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
                    <span className="ml-2 font-mono font-semibold">{state.dataPoints}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Range:</span>
                    <span className="ml-2 font-mono font-semibold">
                      {formatStateValue(state.range.min)} - {formatStateValue(state.range.max)} (avg:{" "}
                      {formatStateValue(state.range.avg)})
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {severity === "warning" ? "Green = Low | Amber = Moderate | Red = High" : "Light blue = Low | Medium blue = Moderate | Dark blue = High"}
        </p>
        <div className="flex gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${severity === "warning" ? "bg-green-500" : "bg-blue-100"}`} />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${severity === "warning" ? "bg-yellow-500" : "bg-blue-500"}`} />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${severity === "warning" ? "bg-red-500" : "bg-blue-900"}`} />
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
