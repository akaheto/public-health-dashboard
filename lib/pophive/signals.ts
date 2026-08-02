// Signal configuration and UI metadata — safe to import on both client and server.
// Does not depend on DuckDB or other build-time-only modules.

export const AVAILABLE_SIGNALS = [
  "CDC NSSP",
  "CDC NWSS",
  "CDC NHSN",
  "CDC RespNET",
  "CDC ILINet",
  "Epic Cosmos, ED",
  "Delphi Hospital Claims",
  "Delphi Doctor Claims",
  "Kinsa",
  "Google Health Trends",
] as const;

export type Signal = (typeof AVAILABLE_SIGNALS)[number];

export const SIGNAL_GROUPS = {
  syndromic: ["CDC NSSP", "CDC NWSS", "CDC NHSN", "CDC RespNET", "CDC ILINet"] as const,
  medical: ["Epic Cosmos, ED", "Delphi Hospital Claims", "Delphi Doctor Claims"] as const,
  behavioral: ["Kinsa", "Google Health Trends"] as const,
} as const;

export const UNIT_BY_SOURCE: Record<string, string> = {
  "CDC NSSP": "% of ED visits",
  "CDC NWSS": "wastewater viral activity level",
  "CDC NHSN": "hospital admissions",
  "CDC RespNET": "lab-confirmed hospitalizations per 100,000",
  "CDC ILINet": "% of outpatient visits (ILI)",
  "Epic Cosmos, ED": "% of ED visits (Epic Cosmos)",
  Kinsa: "illness signal (unitless index)",
  "Google Health Trends": "scaled search index",
  "Delphi Hospital Claims": "% of new hospital admissions",
  "Delphi Doctor Claims": "% of outpatient doctor visits",
};
