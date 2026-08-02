"use client";

import type { OverviewCard, MeaslesOverviewCard, Level, Trend } from "@/lib/pophive/types";
import { TrendChart } from "./TrendChart";

const LEVEL_COLOR: Record<Level, string> = {
  minimal: "var(--color-state-minimal)",
  low: "var(--color-state-low)",
  moderate: "var(--color-state-serious)",
  high: "var(--color-state-critical)",
};

const LEVEL_LABEL: Record<Level, string> = {
  minimal: "Minimal",
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

const TREND_ARROW: Record<Trend, string> = {
  rising: "↑",
  stable: "→",
  declining: "↓",
};

const TREND_LABEL: Record<Trend, string> = {
  rising: "Rising",
  stable: "Stable",
  declining: "Declining",
};

function Trend({ trend }: { trend: Trend }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-medium"
      style={{ color: "var(--color-text-secondary)" }}
    >
      <span aria-hidden>{TREND_ARROW[trend]}</span>
      {TREND_LABEL[trend]}
    </span>
  );
}

function Card({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      className={compact ? "flex-1 min-w-[160px] rounded-lg border p-4" : "flex-1 min-w-[200px] rounded-lg border p-4"}
      style={{
        background: "var(--color-bg-surface)",
        borderColor: "var(--color-border-default)",
      }}
    >
      {children}
    </div>
  );
}

function RespiratoryCard({ card }: { card: OverviewCard }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {card.label}
        </h3>
        <Trend trend={card.trend} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: LEVEL_COLOR[card.level] }}
        />
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {LEVEL_LABEL[card.level]}
        </span>
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {card.pctOfPeak}% of 2-year peak &middot; {card.value}
        {card.unit}
      </p>
      {card.historicalPoints && card.historicalPoints.length > 0 && (
        <div className="mt-3">
          <TrendChart
            data={card.historicalPoints}
            peakValue={card.peakValue}
            currentValue={card.value}
            unit={card.unit}
          />
        </div>
      )}
      <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        {card.source} &middot; as of {card.asOf}
        {card.levelIsApproximate && " · level is our own estimate, not PopHIVE's"}
      </p>
    </Card>
  );
}

function MeaslesCard({ card }: { card: MeaslesOverviewCard }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {card.label}
        </h3>
        <Trend trend={card.trend} />
      </div>
      <div className="mt-2">
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {card.weeklyCasesUS} cases
        </span>
        <span className="ml-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          reported nationally that week
        </span>
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {card.activeStateCount} states with active weekly case reports
      </p>
      <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        {`JHU measles tracker · as of ${card.asOf} · PopHIVE does not classify measles outbreak severity, so no level is shown`}
      </p>
    </Card>
  );
}

export function OverviewStrip({
  flu,
  covid,
  rsv,
  measles,
}: {
  flu: OverviewCard;
  covid: OverviewCard;
  rsv: OverviewCard;
  measles: MeaslesOverviewCard;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <RespiratoryCard card={flu} />
      <RespiratoryCard card={covid} />
      <RespiratoryCard card={rsv} />
      <MeaslesCard card={measles} />
    </div>
  );
}
