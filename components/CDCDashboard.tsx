"use client";

import HealthDataSection from "./HealthDataSection";

export default function CDCDashboard() {
  return (
    <div className="mt-16 pt-8 border-t" style={{ borderColor: "var(--color-border-default)" }}>
      <h2 className="text-2xl font-bold mb-8">CDC Data Dashboard</h2>

      <HealthDataSection
        title="Infectious Disease Surveillance"
        icon="🦠"
        cards={[
          {
            datasetId: "epidemic-trends",
            title: "Epidemic Trends",
            description: "Disease activity levels across states",
            color: "red",
          },
          {
            datasetId: "nssp-ed-respiratory",
            title: "ED Respiratory Visits",
            description: "Emergency department respiratory visits by state",
            color: "orange",
          },
          {
            datasetId: "ari-activity-level",
            title: "Acute Respiratory Illness",
            description: "ARI activity levels",
            color: "amber",
          },
          {
            datasetId: "flu-deaths",
            title: "Flu Deaths",
            description: "Weekly influenza-associated deaths",
            color: "red",
          },
          {
            datasetId: "covid-test-positivity",
            title: "COVID-19 Test Positivity",
            description: "Percentage of positive COVID-19 tests",
            color: "orange",
          },
          {
            datasetId: "healthcare-surveillance",
            title: "Healthcare Surveillance",
            description: "Hospitalizations and healthcare metrics",
            color: "amber",
          },
        ]}
      />

      <HealthDataSection
        title="Chronic Disease Indicators"
        icon="❤️"
        cards={[
          {
            datasetId: "chronic-disease-indicators",
            title: "CDC CDI Indicators",
            description: "Key chronic disease indicators by state",
            color: "blue",
          },
          {
            datasetId: "brfss-historical",
            title: "BRFSS Data",
            description: "Behavioral Risk Factor Surveillance System",
            color: "green",
          },
        ]}
      />

      <HealthDataSection
        title="Injuries & Mortality"
        icon="⚠️"
        cards={[
          {
            datasetId: "drug-poisoning-mortality",
            title: "Drug Overdose Deaths",
            description: "Drug poisoning mortality rates",
            color: "red",
          },
          {
            datasetId: "tbi-ed-visits",
            title: "Traumatic Brain Injury ED Visits",
            description: "TBI-related emergency department visits",
            color: "orange",
          },
        ]}
      />

      <HealthDataSection
        title="Mental Health"
        icon="🧠"
        cards={[
          {
            datasetId: "anxiety-depression",
            title: "Anxiety & Depression",
            description: "Prevalence of anxiety and depression symptoms",
            color: "purple",
          },
          {
            datasetId: "mental-health-care",
            title: "Mental Health Care Access",
            description: "Access to mental health and substance abuse services",
            color: "blue",
          },
        ]}
      />
    </div>
  );
}
