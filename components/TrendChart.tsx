"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface TrendChartProps {
  data: { date: string; value: number }[];
  peakValue: number;
  currentValue: number;
  unit: string;
}

export function TrendChart({ data, peakValue, currentValue, unit }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-center text-sm"
        style={{
          borderColor: "var(--color-border-default)",
          background: "var(--color-bg-surface)",
          color: "var(--color-text-secondary)",
        }}
      >
        No historical data available
      </div>
    );
  }

  return (
    <div className="w-full h-48 mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="var(--color-text-muted)"
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="var(--color-text-muted)"
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "0.5rem",
              color: "var(--color-text-primary)",
            }}
            formatter={(value: unknown) => {
              if (typeof value === "number") {
                return [value.toFixed(2), unit];
              }
              return [String(value), unit];
            }}
            labelFormatter={(label) => `${label}`}
          />
          <ReferenceLine
            y={peakValue}
            stroke="var(--color-text-muted)"
            strokeDasharray="5 5"
            label={{
              value: `Peak: ${peakValue.toFixed(2)}`,
              position: "right",
              fill: "var(--color-text-muted)",
              fontSize: 11,
              offset: 5,
            }}
          />
          <ReferenceLine
            y={currentValue}
            stroke="var(--color-focus)"
            label={{
              value: `Current`,
              position: "right",
              fill: "var(--color-focus)",
              fontSize: 11,
              offset: -10,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-focus)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
