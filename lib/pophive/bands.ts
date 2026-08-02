import type { Level, Trend } from "./types";

// Our own level banding, derived from % of trailing 2-year peak.
//
// This is NOT PopHIVE's own internal classification — their exact
// minimal/low/moderate/high thresholds are not published (only a
// `rule_applied` tag like "R7_historical_band" is returned by their tools).
// Calibrated 2026-07-25 against two real anchors from PopHIVE's own
// get_current_status: flu at 0.9% of peak -> "minimal", RSV at 1.9% ->
// "minimal", COVID at 6.5% -> "low". The moderate/high boundaries below are
// our own estimate, since no real high-season example was available at
// calibration time — always surfaced to the user as an approximation.
export function levelFromPctOfPeak(pct: number): {
  level: Level;
  approximate: true;
} {
  if (pct <= 5) return { level: "minimal", approximate: true };
  if (pct <= 20) return { level: "low", approximate: true };
  if (pct <= 50) return { level: "moderate", approximate: true };
  return { level: "high", approximate: true };
}

// Our own trend rule: relative change vs. ~28 days ago. This will not always
// match PopHIVE's own "direction" label — verified 2026-07-25 that PopHIVE
// applies some noise-gating we don't replicate (e.g. their CDC NSSP signal
// for COVID was voted "stable" despite a +65% relative rise over 4 weeks,
// per their own caveat that low-level week-to-week changes are often noise).
// We use plain relative change, disclosed as our own approximation, rather
// than chasing their unpublished per-signal voting/noise-gating logic.
const TREND_RELATIVE_THRESHOLD = 0.15;

export function trendFromRelativeChange(current: number, prior: number): Trend {
  if (prior === 0) return current > 0 ? "rising" : "stable";
  const change = (current - prior) / prior;
  if (change > TREND_RELATIVE_THRESHOLD) return "rising";
  if (change < -TREND_RELATIVE_THRESHOLD) return "declining";
  return "stable";
}
