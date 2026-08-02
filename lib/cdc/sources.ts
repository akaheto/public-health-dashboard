// CDC Data Sources Registry
// Defines all CDC data sources, their endpoints, and hierarchy levels

export interface CDCSource {
  id: string; // e.g., "cdc-cdi", "cdc-wonder", "cdc-covid"
  name: string; // Human-readable name
  description: string;
  hierarchyLevel: 1 | 2 | 3 | 4 | 5;
  category: "chronic_disease" | "infectious_disease" | "vaccination" | "maternal_child" | "injury" | "mental_health" | "environmental" | "reproductive";
  endpoint: string; // API endpoint or data source URL
  hasApi: boolean;
  updateFrequency: "real-time" | "weekly" | "monthly" | "annual" | "as-available";
  typicalLag: string; // e.g., "1-2 weeks", "1-2 years"
  stateLevel: boolean;
  countyLevel: boolean;
  dataFormat: "json" | "csv" | "parquet" | "xml";
  authentication: boolean;
  fhir: boolean; // FHIR-compliant API
}

// Registry of all CDC data sources
export const CDC_SOURCES: Record<string, CDCSource> = {
  "cdc-cdi": {
    id: "cdc-cdi",
    name: "CDC Chronic Disease Indicators",
    description:
      "125+ state-level chronic disease prevalence and mortality indicators from CDC",
    hierarchyLevel: 1,
    category: "chronic_disease",
    endpoint: "https://chronicdata.cdc.gov/resource/",
    hasApi: true,
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "json",
    authentication: false,
    fhir: false,
  },
  "cdc-wonder": {
    id: "cdc-wonder",
    name: "CDC WONDER",
    description:
      "National vital statistics including mortality by cause (ICD-10), state-level",
    hierarchyLevel: 1,
    category: "chronic_disease",
    endpoint: "https://wonder.cdc.gov/",
    hasApi: false, // Limited API; primarily download-based
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: true,
    dataFormat: "csv",
    authentication: false,
    fhir: false,
  },
  "cdc-fhir": {
    id: "cdc-fhir",
    name: "CDC FHIR API",
    description: "Real-time CDC surveillance data via FHIR-compliant API",
    hierarchyLevel: 1,
    category: "infectious_disease",
    endpoint: "https://data.cdc.gov/",
    hasApi: true,
    updateFrequency: "real-time",
    typicalLag: "1-2 weeks",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "json",
    authentication: false,
    fhir: true,
  },
  "cdc-covid": {
    id: "cdc-covid",
    name: "CDC COVID-19 Data Hub",
    description: "COVID-19 cases, hospitalizations, deaths by state",
    hierarchyLevel: 1,
    category: "infectious_disease",
    endpoint: "https://data.cdc.gov/resource/r8kz-q6fi.json",
    hasApi: true,
    updateFrequency: "real-time",
    typicalLag: "1-2 weeks",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "json",
    authentication: false,
    fhir: false,
  },
  "cdc-flu": {
    id: "cdc-flu",
    name: "CDC FluSight / Influenza Surveillance",
    description: "Influenza surveillance data including hospitalizations",
    hierarchyLevel: 1,
    category: "infectious_disease",
    endpoint: "https://data.cdc.gov/",
    hasApi: true,
    updateFrequency: "weekly",
    typicalLag: "1-2 weeks",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "json",
    authentication: false,
    fhir: false,
  },
  "cdc-rsv": {
    id: "cdc-rsv",
    name: "CDC RSV Surveillance",
    description: "RSV hospitalization data by state",
    hierarchyLevel: 1,
    category: "infectious_disease",
    endpoint: "https://data.cdc.gov/",
    hasApi: true,
    updateFrequency: "weekly",
    typicalLag: "1-2 weeks",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "json",
    authentication: false,
    fhir: false,
  },
  "cdc-brfss": {
    id: "cdc-brfss",
    name: "CDC BRFSS",
    description:
      "Behavioral Risk Factor Surveillance System - self-reported health data",
    hierarchyLevel: 2,
    category: "chronic_disease",
    endpoint: "https://www.cdc.gov/brfss/",
    hasApi: false, // Download-based
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "csv",
    authentication: false,
    fhir: false,
  },
  "cdc-samhsa": {
    id: "cdc-samhsa",
    name: "CDC/SAMHSA NSDUH",
    description:
      "National Survey on Drug Use and Health - substance use and mental health",
    hierarchyLevel: 1,
    category: "mental_health",
    endpoint: "https://www.samhsa.gov/data/",
    hasApi: false, // Download-based
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "csv",
    authentication: false,
    fhir: false,
  },
  "cdc-wisqars": {
    id: "cdc-wisqars",
    name: "CDC WISQARS",
    description:
      "Web-based Injury Statistics Query and Reporting System - injury mortality and morbidity",
    hierarchyLevel: 1,
    category: "injury",
    endpoint: "https://www.cdc.gov/injury/wisqars/",
    hasApi: false, // Query-based interface
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: true,
    dataFormat: "csv",
    authentication: false,
    fhir: false,
  },
  "cdc-nchs": {
    id: "cdc-nchs",
    name: "CDC NCHS Vital Statistics",
    description: "National Center for Health Statistics - birth and death data",
    hierarchyLevel: 2,
    category: "maternal_child",
    endpoint: "https://www.cdc.gov/nchs/",
    hasApi: false, // Download-based
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: true,
    dataFormat: "csv",
    authentication: false,
    fhir: false,
  },
  "cdc-vaccination": {
    id: "cdc-vaccination",
    name: "CDC Vaccination Coverage",
    description: "National Immunization Survey - childhood and adult vaccination coverage",
    hierarchyLevel: 2,
    category: "vaccination",
    endpoint: "https://www.cdc.gov/vaccines/",
    hasApi: false, // Download-based
    updateFrequency: "annual",
    typicalLag: "1-2 years",
    stateLevel: true,
    countyLevel: false,
    dataFormat: "csv",
    authentication: false,
    fhir: false,
  },
};

// Helper to get source info
export function getSource(sourceId: string): CDCSource | undefined {
  return CDC_SOURCES[sourceId];
}

// Helper to get sources by category
export function getSourcesByCategory(
  category: CDCSource["category"]
): CDCSource[] {
  return Object.values(CDC_SOURCES).filter((s) => s.category === category);
}

// Helper to get sources by hierarchy level
export function getSourcesByHierarchyLevel(level: 1 | 2 | 3 | 4 | 5): CDCSource[] {
  return Object.values(CDC_SOURCES).filter((s) => s.hierarchyLevel === level);
}
