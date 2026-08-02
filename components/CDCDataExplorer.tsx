"use client";

import HealthDataCard from "./HealthDataCard";

export default function CDCDataExplorer() {
  const datasets = [
    {
      id: "epidemic-trends",
      title: "Epidemic Trends",
      description: "Disease activity levels across states",
      color: "red" as const,
    },
    {
      id: "nssp-ed-respiratory",
      title: "ED Respiratory Visits",
      description: "Emergency department respiratory visits by state",
      color: "orange" as const,
    },
    {
      id: "ari-activity-level",
      title: "Acute Respiratory Illness",
      description: "ARI activity levels",
      color: "amber" as const,
    },
    {
      id: "drug-poisoning-mortality",
      title: "Drug Overdose Deaths",
      description: "Drug poisoning mortality rates",
      color: "red" as const,
    },
    {
      id: "tbi-ed-visits",
      title: "Traumatic Brain Injury ED Visits",
      description: "TBI-related emergency department visits",
      color: "orange" as const,
    },
    {
      id: "covid-test-positivity",
      title: "COVID-19 Test Positivity",
      description: "Percentage of positive COVID-19 tests",
      color: "orange" as const,
    },
    {
      id: "healthcare-surveillance",
      title: "Healthcare Surveillance",
      description: "Hospitalizations and healthcare metrics",
      color: "amber" as const,
    },
    {
      id: "chronic-disease-indicators",
      title: "CDC CDI Indicators",
      description: "Key chronic disease indicators by state",
      color: "blue" as const,
    },
    {
      id: "brfss-historical",
      title: "BRFSS Data",
      description: "Behavioral Risk Factor Surveillance System",
      color: "green" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Infectious Disease Surveillance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.slice(0, 3).map((dataset) => (
            <HealthDataCard
              key={dataset.id}
              datasetId={dataset.id}
              title={dataset.title}
              description={dataset.description}
              color={dataset.color}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Injuries & Mortality</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.slice(3, 5).map((dataset) => (
            <HealthDataCard
              key={dataset.id}
              datasetId={dataset.id}
              title={dataset.title}
              description={dataset.description}
              color={dataset.color}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Surveillance & Other Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.slice(5).map((dataset) => (
            <HealthDataCard
              key={dataset.id}
              datasetId={dataset.id}
              title={dataset.title}
              description={dataset.description}
              color={dataset.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
