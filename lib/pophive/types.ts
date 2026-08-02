export type DiseaseTopic = "flu" | "covid" | "rsv" | "measles";

export type Level = "minimal" | "low" | "moderate" | "high";
export type Trend = "rising" | "stable" | "declining";

export interface OverviewCard {
  disease: DiseaseTopic;
  label: string;
  value: number;
  unit: string;
  level: Level;
  trend: Trend;
  pctOfPeak: number;
  peakValue: number;
  source: string;
  asOf: string;
  /** True when the level banding is our own approximation (see docs), not an
   * official PopHIVE-published category. */
  levelIsApproximate: boolean;
}

export interface StateDatum {
  stateFips: string;
  stateName: string;
  value: number;
  asOf: string;
}

export interface SignalSeries {
  disease: DiseaseTopic;
  signal: string;
  source: string;
  unit: string;
  asOf: string;
  states: StateDatum[];
}

// Same shape as SignalSeries, for state-level series that aren't tied to one
// of the four outbreak diseases (e.g. chronic-disease/behavioral-health
// indicators) — kept as its own type rather than force-fitting a
// `DiseaseTopic` value that wouldn't mean anything.
export interface IndicatorSeries {
  topic: string;
  signal: string;
  source: string;
  unit: string;
  asOf: string;
  states: StateDatum[];
}

export interface CountyDatum {
  countyFips: string;
  value: number;
  isStateEstimate: boolean;
  asOf: string;
  /** Defaults to the parent CountySeries.source when omitted (e.g. "CDC
   * NSSP"). Set explicitly when a specific county's value came from a
   * different source than the rest of the series — e.g. "NYC DOHMH" for a
   * borough blended in per D-008. */
  source?: string;
}

export interface CountySeries {
  disease: DiseaseTopic;
  signal: string;
  source: string;
  unit: string;
  asOf: string;
  counties: CountyDatum[];
}

// Measles gets no level classification — PopHIVE's own tools explicitly
// decline to classify outbreak severity for measles ("PopHIVE does not
// classify outbreaks; consult your state health department"), so we don't
// fabricate one either. This card carries case counts and a trend only.
export interface MeaslesOverviewCard {
  disease: "measles";
  label: "Measles";
  weeklyCasesUS: number;
  weeklyCasesUSPrior4w: number;
  trend: Trend;
  activeStateCount: number;
  asOf: string;
  source: "jhu_measles_cases";
  levelNotClassified: true;
}
