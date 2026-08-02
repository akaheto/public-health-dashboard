// Alerts API
// Check health metrics for statistically significant increases

import { readFile } from "node:fs/promises";
import path from "node:path";
import { AlertEngine, type DataPoint, type AlertResult } from "@/lib/alerts/alert-engine";
import { ALERT_RULES, getMonitoredDatasetIds } from "@/lib/alerts/alert-rules";

export const runtime = "nodejs";

interface AlertsResponse {
  success: boolean;
  alerts: AlertResult[];
  timestamp: string;
  activeAlerts: AlertResult[];
  warningCount: number;
  criticalCount: number;
  error?: string;
}

async function loadDataset(datasetId: string): Promise<DataPoint[] | null> {
  try {
    // Map dataset IDs to filenames
    const filenameMap: Record<string, string> = {
      "epidemic-trends": "cdc-epidemic-trends.json",
      "nssp-ed-respiratory": "cdc-nssp-ed-respiratory.json",
      "ari-activity-level": "cdc-ari-activity-level.json",
      "nndss-weekly": "cdc-nndss-weekly.json",
      "influenza-pneumonia-deaths": "cdc-influenza-pneumonia-deaths.json",
      "chronic-disease-indicators": "cdc-chronic-disease-indicators.json",
      "brfss-historical": "cdc-brfss-historical.json",
      "drug-poisoning-mortality": "cdc-drug-poisoning-mortality.json",
      "tbi-ed-visits": "cdc-tbi-ed-visits.json",
      "anxiety-depression": "cdc-anxiety-depression.json",
      "mental-health-care": "cdc-mental-health-care.json",
      "covid-test-positivity": "cdc-backlog-seuz-s2cv.json",
      "healthcare-surveillance": "cdc-backlog-v58w-vynu.json",
    };

    const filename = filenameMap[datasetId];
    if (!filename) return null;

    const filepath = path.join(process.cwd(), "data", "generated", filename);
    const data = await readFile(filepath, "utf-8");
    const rows = JSON.parse(data);

    if (!Array.isArray(rows)) return null;

    // Extract date and value pairs
    const dataPoints: DataPoint[] = [];
    const dateFields = ["date", "time_period_start_date", "year_start", "week_ending_date", "week_end"];
    const valueFields = ["value", "percent_visits", "data_value", "rate_per_100000"];

    rows.forEach((row) => {
      let date: string | undefined;
      let value: number | undefined;

      // Find date field
      for (const field of dateFields) {
        if (field in row && row[field]) {
          date = String(row[field]);
          break;
        }
      }

      // Find value field
      for (const field of valueFields) {
        if (field in row && row[field] !== undefined && !isNaN(Number(row[field]))) {
          value = Number(row[field]);
          break;
        }
      }

      if (date && value !== undefined) {
        dataPoints.push({ date, value });
      }
    });

    // Sort by date
    dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return dataPoints.length > 0 ? dataPoints : null;
  } catch (err) {
    console.error(`Failed to load dataset ${datasetId}:`, err);
    return null;
  }
}

export async function GET(): Promise<Response> {
  try {
    // Load all monitored datasets
    const monitoredIds = getMonitoredDatasetIds();
    const datasetMap: Record<string, DataPoint[]> = {};

    for (const datasetId of monitoredIds) {
      const dataPoints = await loadDataset(datasetId);
      if (dataPoints) {
        datasetMap[datasetId] = dataPoints;
      }
    }

    // Check alerts for all rules
    const allAlerts = AlertEngine.checkMultipleAlerts(datasetMap, ALERT_RULES);

    // Filter triggered alerts and sort by severity
    const activeAlerts = allAlerts
      .filter((alert) => alert.triggered)
      .sort((a, b) => {
        if (a.severity === "critical" && b.severity !== "critical") return -1;
        if (a.severity !== "critical" && b.severity === "critical") return 1;
        return 0;
      });

    const response: AlertsResponse = {
      success: true,
      alerts: allAlerts,
      timestamp: new Date().toISOString(),
      activeAlerts,
      warningCount: activeAlerts.filter((a) => a.severity === "warning").length,
      criticalCount: activeAlerts.filter((a) => a.severity === "critical").length,
    };

    return Response.json(response);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        success: false,
        alerts: [],
        timestamp: new Date().toISOString(),
        activeAlerts: [],
        warningCount: 0,
        criticalCount: 0,
        error,
      },
      { status: 500 }
    );
  }
}
