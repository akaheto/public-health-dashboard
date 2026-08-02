// Alert Rules Configuration
// Define thresholds for each monitored dataset

import type { AlertThreshold } from "./alert-engine";

export const ALERT_RULES: AlertThreshold[] = [
  // Daily Updated Datasets
  {
    datasetId: "healthcare-surveillance",
    severity: "warning",
    zScoreThreshold: 2.0,
    minTrendDays: 2, // 2 consecutive days of increase
    changePercentage: 10, // At least 10% increase
  },
  {
    datasetId: "healthcare-surveillance",
    severity: "critical",
    zScoreThreshold: 2.5,
    minTrendDays: 3,
    changePercentage: 15,
  },
  {
    datasetId: "nssp-ed-respiratory",
    severity: "warning",
    zScoreThreshold: 2.0,
    minTrendDays: 2,
    changePercentage: 10,
  },
  {
    datasetId: "nssp-ed-respiratory",
    severity: "critical",
    zScoreThreshold: 2.5,
    minTrendDays: 3,
    changePercentage: 15,
  },

  // Weekly Updated Datasets
  {
    datasetId: "covid-test-positivity",
    severity: "warning",
    zScoreThreshold: 2.0,
    minTrendDays: 2,
    changePercentage: 15,
  },
  {
    datasetId: "covid-test-positivity",
    severity: "critical",
    zScoreThreshold: 2.5,
    minTrendDays: 3,
    changePercentage: 25,
  },
  {
    datasetId: "influenza-pneumonia-deaths",
    severity: "warning",
    zScoreThreshold: 2.0,
    minTrendDays: 2,
    changePercentage: 20,
  },
  {
    datasetId: "influenza-pneumonia-deaths",
    severity: "critical",
    zScoreThreshold: 2.5,
    minTrendDays: 3,
    changePercentage: 30,
  },
  {
    datasetId: "anxiety-depression",
    severity: "warning",
    zScoreThreshold: 2.0,
    minTrendDays: 2,
    changePercentage: 5,
  },
  {
    datasetId: "anxiety-depression",
    severity: "critical",
    zScoreThreshold: 2.5,
    minTrendDays: 3,
    changePercentage: 10,
  },
  {
    datasetId: "mental-health-care",
    severity: "warning",
    zScoreThreshold: 2.0,
    minTrendDays: 2,
    changePercentage: 5,
  },

  // Annual Updated Datasets (lower thresholds, longer baselines)
  {
    datasetId: "drug-poisoning-mortality",
    severity: "critical",
    zScoreThreshold: 1.5,
    minTrendDays: 1,
    changePercentage: 5,
  },
];

// Dataset-specific configuration
export const MONITORED_DATASETS = {
  "healthcare-surveillance": {
    name: "Healthcare Syndromic Surveillance",
    category: "infectious-disease",
    updateFrequency: "daily",
    description: "ED visits for respiratory, GI, and other conditions by age group",
    alertReason: "Rapid increases in ED visits can signal disease outbreaks",
  },
  "nssp-ed-respiratory": {
    name: "NSSP ED Respiratory",
    category: "infectious-disease",
    updateFrequency: "daily",
    description: "Percentage of ED visits for respiratory illnesses",
    alertReason: "Early indicator of respiratory illness waves (flu, RSV, COVID)",
  },
  "covid-test-positivity": {
    name: "COVID-19 Test Positivity",
    category: "infectious-disease",
    updateFrequency: "weekly",
    description: "Percentage of positive COVID-19 tests",
    alertReason: "Rising positivity indicates increasing transmission",
  },
  "influenza-pneumonia-deaths": {
    name: "Influenza/Pneumonia Deaths",
    category: "infectious-disease",
    updateFrequency: "weekly",
    description: "Weekly provisional death counts",
    alertReason: "Sharp increases in mortality indicate severity escalation",
  },
  "anxiety-depression": {
    name: "Anxiety & Depression",
    category: "mental-health",
    updateFrequency: "weekly",
    description: "Prevalence of anxiety and depression symptoms",
    alertReason: "Rising mental health crisis indicators",
  },
  "mental-health-care": {
    name: "Mental Health Care Access",
    category: "mental-health",
    updateFrequency: "weekly",
    description: "Access to mental health and substance abuse services",
    alertReason: "Declining access may indicate resource strain",
  },
  "drug-poisoning-mortality": {
    name: "Drug Poisoning Mortality",
    category: "injury",
    updateFrequency: "annual",
    description: "Drug overdose death rates",
    alertReason: "Escalating overdose crisis indicator",
  },
};

export type MonitoredDatasetId = keyof typeof MONITORED_DATASETS;

/**
 * Get alert configuration for a specific dataset
 */
export function getAlertRulesForDataset(datasetId: string): AlertThreshold[] {
  return ALERT_RULES.filter((rule) => rule.datasetId === datasetId);
}

/**
 * Get all monitored dataset IDs
 */
export function getMonitoredDatasetIds(): MonitoredDatasetId[] {
  return Object.keys(MONITORED_DATASETS) as MonitoredDatasetId[];
}

/**
 * Get dataset info for alerts page
 */
export function getDatasetInfo(datasetId: string) {
  return MONITORED_DATASETS[datasetId as MonitoredDatasetId];
}
