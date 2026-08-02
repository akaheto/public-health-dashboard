// CDC Data Integration
// Central module for all CDC data sources and datasets

// Data Sources Registry
export { CDC_SOURCES, getSource, getSourcesByCategory, getSourcesByHierarchyLevel } from "./sources";
export type { CDCSource } from "./sources";

// CDC Chronic Disease Indicators (deprecated - use Tier 1 instead)
export { buildCDIIndicator, buildMultipleCDIIndicators, CDI_INDICATORS } from "./cdc-cdi";
export type { CDIIndicatorId } from "./cdc-cdi";

// FHIR Client (placeholder for future)
export { queryFhir } from "./fhir-client";

// Socrata API Client
export { querySODA, querySODAAll, querySODARecent } from "./soda-client";
export type { SODAQueryOptions, SODAResponse } from "./soda-client";

// Tier 1 Datasets (primary focus)
export { TIER1_DATASETS, getDatasetsByCategory, getAllDatasetIds } from "./tier1-datasets";
export type { DatasetConfig } from "./tier1-datasets";

// Data Fetching
export { fetchAllTier1Datasets, fetchSingleDataset, fetchDatasets } from "./fetch-tier1";
export type { FetchResult } from "./fetch-tier1";

export { fetchAllBacklogDatasets, fetchBacklogDataset } from "./fetch-backlog";
export type { BacklogFetchResult } from "./fetch-backlog";

// Data Archive/Library
export { archiveDataset, getLatestArchive, getArchiveStats } from "./data-archive";
export type { ArchivedDataset, ArchiveIndex } from "./data-archive";

// Dataset Backlog
export { DATASET_BACKLOG, addToBacklog, getBacklogByCategory, getBacklogByPriority } from "./dataset-backlog";
export type { BacklogDataset } from "./dataset-backlog";
