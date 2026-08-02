// CDC Tier 1 Public Datasets - Comprehensive health monitoring
// All datasets are publicly accessible on data.cdc.gov

export interface DatasetConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  dateField: string; // Field to filter for recent data
  stateField: string; // Field containing state/geography
  valueFields: string[]; // Fields to extract as values
  updateFrequency: "daily" | "weekly" | "monthly" | "annual";
  typicalLag: string;
}

export const TIER1_DATASETS: Record<string, DatasetConfig> = {
  // Infectious Disease Surveillance
  "epidemic-trends": {
    id: "5dqz-y4ea",
    name: "CDC Epidemic Trends and Rt",
    category: "infectious-disease",
    description: "COVID-19, Influenza, RSV trend classifications (Declining/Growing/etc)",
    dateField: "date",
    stateField: "state",
    valueFields: ["category", "disease"],
    updateFrequency: "weekly",
    typicalLag: "1 week",
  },

  "nssp-ed-respiratory": {
    id: "vjzj-u7u8",
    name: "NSSP Emergency Department Respiratory Daily",
    category: "infectious-disease",
    description: "ED visit percentages for respiratory illnesses by state",
    dateField: "date",
    stateField: "geography",
    valueFields: ["pathogen", "percent_visits"],
    updateFrequency: "daily",
    typicalLag: "1-2 days",
  },

  "ari-activity-level": {
    id: "f3zz-zga5",
    name: "Level of Acute Respiratory Illness Activity by State",
    category: "infectious-disease",
    description: "ARI activity levels (minimal, low, moderate, high, very high) by state",
    dateField: "date",
    stateField: "state",
    valueFields: ["activity_level"],
    updateFrequency: "weekly",
    typicalLag: "1 week",
  },

  "nndss-weekly": {
    id: "x9gk-5huc",
    name: "NNDSS Weekly Data",
    category: "infectious-disease",
    description: "Notifiable disease surveillance - TB, STIs, food-borne, etc",
    dateField: "mmwr_week",
    stateField: "reporting_state",
    valueFields: ["diseases"],
    updateFrequency: "weekly",
    typicalLag: "1 week",
  },

  // Chronic Disease
  "chronic-disease-indicators": {
    id: "hksd-2xuw",
    name: "U.S. Chronic Disease Indicators",
    category: "chronic-disease",
    description:
      "125+ state-level chronic disease indicators from CDC (diabetes, heart disease, stroke, etc)",
    dateField: "year_start",
    stateField: "location_name",
    valueFields: ["data_value", "indicator_description"],
    updateFrequency: "annual",
    typicalLag: "1-2 years",
  },

  "brfss-historical": {
    id: "iuq5-y9ct",
    name: "BRFSS Historical Questions",
    category: "chronic-disease",
    description: "Behavioral Risk Factor Surveillance System - chronic disease behaviors",
    dateField: "year",
    stateField: "state",
    valueFields: ["question", "response"],
    updateFrequency: "annual",
    typicalLag: "1-2 years",
  },

  // Injuries & Mortality
  "drug-poisoning-mortality": {
    id: "pbkm-d27e",
    name: "Drug Poisoning Mortality by County",
    category: "injury",
    description: "Overdose mortality rates by county",
    dateField: "year",
    stateField: "state",
    valueFields: ["rate_per_100000", "number_of_deaths"],
    updateFrequency: "annual",
    typicalLag: "1-2 years",
  },

  "tbi-ed-visits": {
    id: "45um-c62r",
    name: "TBI-related Emergency Department Visits",
    category: "injury",
    description: "Traumatic Brain Injury ED visits and hospitalizations by state",
    dateField: "year",
    stateField: "state_or_territory",
    valueFields: ["rate_per_100000", "sex", "age_group"],
    updateFrequency: "annual",
    typicalLag: "1-2 years",
  },

  "influenza-pneumonia-deaths": {
    id: "ynw2-4viq",
    name: "Provisional Death Counts for Influenza, Pneumonia, and COVID-19",
    category: "infectious-disease",
    description: "Weekly provisional death counts",
    dateField: "week_ending_date",
    stateField: "state",
    valueFields: ["death_counts_influenza", "death_counts_pneumonia", "death_counts_covid19"],
    updateFrequency: "weekly",
    typicalLag: "1-2 weeks",
  },

  // Mental Health
  "anxiety-depression": {
    id: "8pt5-q6wp",
    name: "Indicators of Anxiety or Depression",
    category: "mental-health",
    description: "Anxiety/depression indicators based on last 7 days symptoms",
    dateField: "time_period_start_date",
    stateField: "state",
    valueFields: ["value", "indicator"],
    updateFrequency: "weekly",
    typicalLag: "2-3 days",
  },

  "mental-health-care": {
    id: "yni7-er2q",
    name: "Mental Health Care in the Last 4 Weeks",
    category: "mental-health",
    description: "Received mental health care in last 4 weeks",
    dateField: "time_period_start_date",
    stateField: "state",
    valueFields: ["value"],
    updateFrequency: "weekly",
    typicalLag: "2-3 days",
  },
};

// Helper to get datasets by category
export function getDatasetsByCategory(
  category: string
): Record<string, DatasetConfig> {
  return Object.fromEntries(
    Object.entries(TIER1_DATASETS).filter(([, config]) => config.category === category)
  );
}

// Helper to get all dataset IDs
export function getAllDatasetIds(): string[] {
  return Object.values(TIER1_DATASETS).map((config) => config.id);
}
