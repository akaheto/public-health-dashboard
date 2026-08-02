// Dataset Backlog - Additional CDC datasets to integrate
// Add datasets here as you discover them; they'll be prioritized for Phase 2+

export interface BacklogDataset {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  priority: "high" | "medium" | "low";
  notes: string;
  addedAt: string;
  updateFrequency?: "daily" | "weekly" | "monthly" | "annual";
  typicalLag?: string;
}

export const DATASET_BACKLOG: BacklogDataset[] = [
  {
    id: "seuz-s2cv",
    name: "COVID-19 Test Positivity Data",
    category: "infectious-disease",
    endpoint: "https://data.cdc.gov/resource/seuz-s2cv.json",
    priority: "high",
    notes: "Weekly COVID-19 test positivity rates by state",
    addedAt: "2026-08-02T00:00:00Z",
    updateFrequency: "weekly",
    typicalLag: "1-2 weeks",
  },
  {
    id: "v58w-vynu",
    name: "Healthcare Syndromic Surveillance - Conditions",
    category: "infectious-disease",
    endpoint: "https://data.cdc.gov/resource/v58w-vynu.json",
    priority: "high",
    notes: "ED visit percentages by condition and age group (respiratory, GI, etc)",
    addedAt: "2026-08-02T00:00:00Z",
    updateFrequency: "daily",
    typicalLag: "1-2 days",
  },
  {
    id: "x9gk-5huc",
    name: "NNDSS - Notifiable Disease Surveillance",
    category: "infectious-disease",
    endpoint: "https://data.cdc.gov/resource/x9gk-5huc.json",
    priority: "high",
    notes: "Weekly notifiable disease counts by disease and state (Anthrax, TB, STIs, etc)",
    addedAt: "2026-08-02T00:00:00Z",
    updateFrequency: "weekly",
    typicalLag: "1-2 weeks",
  },
];

export function addToBacklog(dataset: BacklogDataset): void {
  DATASET_BACKLOG.push(dataset);
}

export function getBacklogByCategory(category: string): BacklogDataset[] {
  return DATASET_BACKLOG.filter((d) => d.category === category);
}

export function getBacklogByPriority(priority: "high" | "medium" | "low"): BacklogDataset[] {
  return DATASET_BACKLOG.filter((d) => d.priority === priority);
}
