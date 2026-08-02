#!/usr/bin/env node
/**
 * Add datasets to the CDC backlog from URLs
 * Usage: npx ts-node lib/cdc/add-to-backlog.ts <url> [<name>] [<category>] [<priority>]
 *
 * Examples:
 *   npx ts-node lib/cdc/add-to-backlog.ts "https://data.cdc.gov/resource/abc123.json" "Dataset Name"
 *   npx ts-node lib/cdc/add-to-backlog.ts "https://data.cdc.gov/resource/abc123.json" "Dataset Name" "infectious-disease" "high"
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BACKLOG_FILE = path.join(__dirname, "dataset-backlog.ts");

interface BacklogDataset {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  priority: "high" | "medium" | "low";
  notes: string;
  addedAt: string;
}

// Extract dataset ID from URL
function extractDatasetId(url: string): string {
  // From: https://data.cdc.gov/resource/abc123.json or /api/v3/views/abc123/query.json
  const match = url.match(/(?:resource|views)\/([a-z0-9-]+)/i);
  if (!match) throw new Error(`Could not extract dataset ID from URL: ${url}`);
  return match[1];
}

// Extract category from URL or prompt
function normalizeCategory(
  category?: string
): "infectious-disease" | "chronic-disease" | "injury" | "mental-health" | "maternal-child" {
  const normalized = (category || "infectious-disease").toLowerCase();
  const valid = [
    "infectious-disease",
    "chronic-disease",
    "injury",
    "mental-health",
    "maternal-child",
  ];
  return (
    (valid.find((v) => v === normalized) as any) ||
    ("infectious-disease" as const)
  );
}

async function addToBacklog(
  url: string,
  name?: string,
  category?: string,
  priority?: "high" | "medium" | "low"
): Promise<void> {
  try {
    // Parse inputs
    const id = extractDatasetId(url);
    const datasetName = name || `Dataset ${id}`;
    const datasetCategory = normalizeCategory(category);
    const datasetPriority = priority || "medium";

    const newDataset: BacklogDataset = {
      id,
      name: datasetName,
      category: datasetCategory,
      endpoint: url,
      priority: datasetPriority,
      notes: `Added from URL: ${url}`,
      addedAt: new Date().toISOString(),
    };

    // Read current backlog
    const currentContent = await readFile(BACKLOG_FILE, "utf-8");

    // Find the DATASET_BACKLOG array and insert new entry
    const arrayStart = currentContent.indexOf("export const DATASET_BACKLOG: BacklogDataset[] = [");
    if (arrayStart === -1) {
      throw new Error("Could not find DATASET_BACKLOG array in file");
    }

    const insertPoint = currentContent.indexOf("];", arrayStart) - 2;
    if (insertPoint === -1) {
      throw new Error("Could not find end of DATASET_BACKLOG array");
    }

    // Format new dataset entry
    const newEntry = `,\n  {\n    id: "${newDataset.id}",\n    name: "${newDataset.name.replace(/"/g, '\\"')}",\n    category: "${newDataset.category}",\n    endpoint: "${newDataset.endpoint}",\n    priority: "${newDataset.priority}",\n    notes: "${newDataset.notes}",\n    addedAt: "${newDataset.addedAt}",\n  }`;

    const updatedContent = currentContent.slice(0, insertPoint) + newEntry + currentContent.slice(insertPoint);

    // Write back
    await writeFile(BACKLOG_FILE, updatedContent);

    console.log(`✅ Added to backlog:`);
    console.log(`   ID: ${id}`);
    console.log(`   Name: ${datasetName}`);
    console.log(`   Category: ${datasetCategory}`);
    console.log(`   Priority: ${datasetPriority}`);
    console.log(`\n   Run: npm run build`);
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// CLI
const args = process.argv.slice(2);
if (!args[0]) {
  console.log("Usage: npx ts-node lib/cdc/add-to-backlog.ts <url> [<name>] [<category>] [<priority>]");
  console.log("\nExample:");
  console.log(
    '  npx ts-node lib/cdc/add-to-backlog.ts "https://data.cdc.gov/resource/abc123.json" "My Dataset"'
  );
  process.exit(0);
}

addToBacklog(args[0], args[1], args[2], args[3] as any);
