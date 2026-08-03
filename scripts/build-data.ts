// Build-time data pipeline: fetches PopHIVE parquet bundles via DuckDB,
// applies the project's data-quality rules, and writes static JSON consumed
// by the site. Run via `npm run build:data` (also wired as `prebuild`).
import dotenv from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });
import { buildOverviewCard, buildStateSignalSeries } from "../lib/pophive/overallTrends";
import { AVAILABLE_SIGNALS } from "../lib/pophive/signals";
import {
  buildMeaslesOverviewCard,
  buildMeaslesWeeklySeries,
  buildMeaslesCumulativeSeries,
  buildMeaslesCountySeries,
} from "../lib/pophive/measles";
import { buildCountySeries } from "../lib/pophive/countyEdVisits";
import {
  buildMmrHealthmapSeries,
  buildMmrNisSeries,
  buildDtapNisSeries,
  buildPolioNisSeries,
  buildHepbNisSeries,
  buildVaricellaVaxNisSeries,
  buildCombined7SeriesNisSeries,
} from "../lib/pophive/vaccination";
import {
  buildDiabetesSeries,
  buildObesitySeries,
  buildOpioidOverdoseSeries,
  buildFirearmMortalitySeries,
} from "../lib/pophive/chronic";
import { fetchAllBoroughData, type RespiratoryDisease as NycDisease } from "../lib/nycDohmh";
import { fetchAllTier1Datasets, fetchAllBacklogDatasets } from "../lib/cdc";

const OUT_DIR = path.join(__dirname, "..", "data", "generated");

const RESPIRATORY_DISEASES = ["flu", "covid", "rsv"] as const;

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Building overview cards...");
  const [flu, covid, rsv, measles] = await Promise.all([
    buildOverviewCard("flu"),
    buildOverviewCard("covid"),
    buildOverviewCard("rsv"),
    buildMeaslesOverviewCard(),
  ]);
  const overview = { flu, covid, rsv, measles, generatedAt: new Date().toISOString() };
  await writeFile(path.join(OUT_DIR, "overview.json"), JSON.stringify(overview, null, 2));
  console.log(
    `  flu: ${flu.value}${flu.unit} (${flu.level}, ${flu.trend}, ${flu.pctOfPeak}% of peak, as of ${flu.asOf})`
  );
  console.log(
    `  covid: ${covid.value}${covid.unit} (${covid.level}, ${covid.trend}, ${covid.pctOfPeak}% of peak, as of ${covid.asOf})`
  );
  console.log(
    `  rsv: ${rsv.value}${rsv.unit} (${rsv.level}, ${rsv.trend}, ${rsv.pctOfPeak}% of peak, as of ${rsv.asOf})`
  );
  console.log(
    `  measles: ${measles.weeklyCasesUS} weekly cases US (${measles.trend}, ${measles.activeStateCount} states active, as of ${measles.asOf})`
  );

  console.log("\nBuilding state-level signal series...");
  const states: Record<string, unknown> = {};
  for (const disease of RESPIRATORY_DISEASES) {
    states[disease] = {};
    for (const signal of AVAILABLE_SIGNALS) {
      const series = await buildStateSignalSeries(disease, signal);
      (states[disease] as Record<string, unknown>)[signal] = series;
      console.log(
        `  ${disease} / ${signal}: ${series.states.length} states, as of ${series.asOf}`
      );
    }
  }
  const [measlesWeekly, measlesCumulative] = await Promise.all([
    buildMeaslesWeeklySeries(),
    buildMeaslesCumulativeSeries(),
  ]);
  states.measles = { weekly: measlesWeekly, cumulative: measlesCumulative };
  console.log(
    `  measles / weekly: ${measlesWeekly.states.length} states, as of ${measlesWeekly.asOf}`
  );
  console.log(
    `  measles / cumulative: ${measlesCumulative.states.length} states, as of ${measlesCumulative.asOf}`
  );
  await writeFile(path.join(OUT_DIR, "states.json"), JSON.stringify(states, null, 2));

  console.log("\nBuilding county-level series (ED visits %)...");

  // NYC DOHMH borough blend (D-008): a secondary source, so its failure
  // must never fail the whole build — fall back to the existing
  // PopHIVE-derived counties (HSA-level + disclosure) for NYC if this
  // doesn't come back.
  let boroughData: Record<NycDisease, Awaited<ReturnType<typeof fetchAllBoroughData>>["flu"]> | null =
    null;
  try {
    boroughData = await fetchAllBoroughData();
    console.log(
      `  NYC DOHMH: fetched borough data for ${Object.keys(boroughData).length} diseases`
    );
  } catch (err) {
    console.warn(
      "  NYC DOHMH fetch failed — NYC boroughs will fall back to PopHIVE HSA-level + disclosure:",
      err
    );
  }

  const counties: Record<string, unknown> = {};
  for (const disease of RESPIRATORY_DISEASES) {
    const series = await buildCountySeries(disease);

    if (boroughData) {
      const byFips = new Map(series.counties.map((c) => [c.countyFips, c]));
      for (const b of boroughData[disease]) {
        byFips.set(b.countyFips, {
          countyFips: b.countyFips,
          value: b.value,
          isStateEstimate: false,
          asOf: b.asOf,
          source: b.source,
        });
      }
      series.counties = Array.from(byFips.values());
    }

    counties[disease] = series;
    const estimated = series.counties.filter((c) => c.isStateEstimate).length;
    const dohmhCount = series.counties.filter((c) => c.source === "NYC DOHMH").length;
    console.log(
      `  ${disease}: ${series.counties.length} counties (${estimated} state-estimate fallback, ${dohmhCount} NYC DOHMH), as of ${series.asOf}`
    );
  }

  // E-009: County-level measles data
  const measlesCounty = await buildMeaslesCountySeries();
  counties.measles = measlesCounty;
  console.log(
    `  measles: ${measlesCounty.counties.length} counties, as of ${measlesCounty.asOf}`
  );

  await writeFile(path.join(OUT_DIR, "counties.json"), JSON.stringify(counties, null, 2));

  console.log("\nBuilding vaccination-coverage series...");
  const [mmrHealthmap, mmrNis, dtapNis, polioNis, hepbNis, varicellaVaxNis, combined7Nis] = await Promise.all([
    buildMmrHealthmapSeries(),
    buildMmrNisSeries(),
    buildDtapNisSeries(),
    buildPolioNisSeries(),
    buildHepbNisSeries(),
    buildVaricellaVaxNisSeries(),
    buildCombined7SeriesNisSeries(),
  ]);
  const vaccination = { mmrHealthmap, mmrNis, dtapNis, polioNis, hepbNis, varicellaVaxNis, combined7Nis };
  console.log(
    `  MMR (HealthMap): ${mmrHealthmap.states.length} states, as of ${mmrHealthmap.asOf}`
  );
  console.log(`  MMR (NIS): ${mmrNis.states.length} states, as of ${mmrNis.asOf}`);
  console.log(`  DTaP (NIS): ${dtapNis.states.length} states, as of ${dtapNis.asOf}`);
  console.log(`  Polio (NIS): ${polioNis.states.length} states, as of ${polioNis.asOf}`);
  console.log(`  Hepatitis B (NIS): ${hepbNis.states.length} states, as of ${hepbNis.asOf}`);
  console.log(`  Varicella (NIS): ${varicellaVaxNis.states.length} states, as of ${varicellaVaxNis.asOf}`);
  console.log(`  Combined 7-series (NIS): ${combined7Nis.states.length} states, as of ${combined7Nis.asOf}`);
  await writeFile(
    path.join(OUT_DIR, "vaccination.json"),
    JSON.stringify(vaccination, null, 2)
  );

  console.log("\nBuilding chronic-disease/behavioral-health series...");
  let chronic = {
    diabetes: null,
    obesity: null,
    opioidOverdose: null,
    firearmMortality: null,
    cdcIndicators: null,
  } as Record<string, unknown>;

  try {
    // Use PopHIVE for chronic disease (CDC CDI accessible via Tier 1 now)
    let diabetes = null;
    let obesity = null;
    try {
      diabetes = await buildDiabetesSeries();
      obesity = await buildObesitySeries();
    } catch (err) {
      console.warn("  PopHIVE chronic disease fetch failed:", err);
    }

    const [opioidOverdose, firearmMortality] = await Promise.all([
      buildOpioidOverdoseSeries(),
      buildFirearmMortalitySeries(),
    ]);

    chronic = { diabetes, obesity, opioidOverdose, firearmMortality };
    if (diabetes) {
      console.log(`  Diabetes: ${diabetes.states.length} states, as of ${diabetes.asOf}`);
    }
    if (obesity) {
      console.log(`  Obesity: ${obesity.states.length} states, as of ${obesity.asOf}`);
    }
    console.log(
      `  Opioid overdose: ${opioidOverdose.states.length} states, as of ${opioidOverdose.asOf}`
    );
    if (firearmMortality) {
      console.log(
        `  Firearm mortality: ${firearmMortality.states.length} states, as of ${firearmMortality.asOf}`
      );
    } else {
      console.log(`  Firearm mortality: unavailable`);
    }
  } catch (err) {
    console.warn(
      "  Chronic-disease data fetch failed — tab will show data unavailable:",
      err
    );
  }
  await writeFile(path.join(OUT_DIR, "chronic.json"), JSON.stringify(chronic, null, 2));

  console.log("\nFetching CDC Tier 1 datasets...");
  const tier1Results = await fetchAllTier1Datasets(30); // Last 30 days
  console.log(`Fetched ${tier1Results.results.filter((r) => r.success).length} / ${tier1Results.results.length} CDC datasets`);

  // Write Tier 1 data to file
  const tier1Summary = {
    fetchedAt: new Date().toISOString(),
    results: tier1Results.results,
    datasetCount: tier1Results.results.length,
    successCount: tier1Results.results.filter((r) => r.success).length,
  };
  await writeFile(path.join(OUT_DIR, "cdc-tier1-summary.json"), JSON.stringify(tier1Summary, null, 2));

  // Write individual dataset files
  for (const [key, data] of Object.entries(tier1Results.data)) {
    const filepath = path.join(OUT_DIR, `cdc-${key}.json`);
    await writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`  Wrote cdc-${key}.json (${data.length} rows)`);
  }

  console.log("\nFetching CDC Backlog datasets...");
  const backlogResults = await fetchAllBacklogDatasets(30);
  console.log(`Fetched ${backlogResults.results.filter((r) => r.success).length} / ${backlogResults.results.length} backlog datasets`);

  // Write backlog data
  const backlogSummary = {
    fetchedAt: new Date().toISOString(),
    results: backlogResults.results,
    datasetCount: backlogResults.results.length,
    successCount: backlogResults.results.filter((r) => r.success).length,
  };
  await writeFile(path.join(OUT_DIR, "cdc-backlog-summary.json"), JSON.stringify(backlogSummary, null, 2));

  for (const [id, data] of Object.entries(backlogResults.data)) {
    const filepath = path.join(OUT_DIR, `cdc-backlog-${id}.json`);
    await writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`  Wrote cdc-backlog-${id}.json (${data.length} rows)`);
  }

  console.log(`\nDone in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Data pipeline failed:", err);
  process.exit(1);
});
