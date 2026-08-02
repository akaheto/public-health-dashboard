# Public Health Surveillance Dashboard

A comprehensive CDC health monitoring dashboard with real-time data integration, statistical analysis, alerting, and geographic visualization capabilities.

**Live:** https://surveillance-dashboard.vercel.app

## Project Overview

This dashboard aggregates CDC public health data across 13 datasets covering:
- **Infectious Disease:** Healthcare surveillance, respiratory illness, COVID-19
- **Chronic Disease:** Anxiety, depression, mental health care access
- **Injuries & Mortality:** Drug poisoning, influenza
- **Mental Health:** Behavioral health metrics

## Features

### ✅ Phase 1-7: Complete Implementation

**Phase 1:** Dashboard Visualization
- Interactive cards showing 4 health categories (Infectious, Chronic, Injuries, Mental Health)
- Real-time data fetching from `/api/health-data`

**Phase 2:** Data Query API
- RESTful endpoints with filtering (dataset, state, date range, limit)
- Metadata endpoints for data source information

**Phase 3:** Data Source Monitoring
- Freshness dashboard showing update frequency and lag
- Interactive data preview for most recent records
- Single-line display sorted by update frequency

**Phase 4:** Trending Analysis
- 8 trending datasets with ASCII time-series charts
- Statistics (min, avg, max) and multi-year data

**Phase 5:** Statistical Alerting
- Z-score anomaly detection
- 7 monitored datasets with configurable thresholds
- Real-time alert dashboard with summary cards

**Phase 6:** Enhanced Visualizations
- Interactive charts with Recharts library
- Date range selection (30d, 90d, 180d, All)
- 7-day and 14-day moving averages
- Multi-source comparison charts (3 pre-built)
- CSV export functionality

**Phase 7:** Geographic Analysis
- State-level aggregation for all 50 US states
- Regional grouping (7 US regions)
- Interactive state heatmaps with drill-down
- Dual color schemes (warning=red, neutral=blue)
- 6 health metric visualizations by state

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view the dashboard.

### Environment Setup

Create a `.env.local` file with CDC API credentials:
```
NEXT_PUBLIC_SODA_APP_TOKEN=your_app_token
NEXT_PUBLIC_SODA_API_KEY=your_api_key
```

## Navigation

- `/` - Main dashboard
- `/data-sources` - Data freshness monitoring
- `/trends` - Trending analysis
- `/alerts` - Statistical alerting and monitoring
- `/visualizations` - Enhanced interactive charts
- `/geographic` - State-level geographic analysis

## Data Sources

**13 CDC Datasets:**

**Tier 1 (Socrata SODA API):**
1. Healthcare Syndromic Surveillance
2. NSSP ED Respiratory Visits
3. COVID-19 Test Positivity
4. Anxiety & Depression Prevalence
5. Mental Health Care Access
6. Drug Poisoning Mortality
7. Influenza & Pneumonia Deaths
8. Wastewater Surveillance
9. COVID-19 Vaccination Rates
10. Respiratory Illness (RSV/Flu)
11. Telehealth Utilization

**Backlog (PopHIVE Data):**
- Injury Overdose Bundle
- Additional mental health indicators

**Update Frequency:** Daily (3), Weekly (5), Annual (5)

**Data Range:** 2020-2026 (4+ years)

**Ingestion:** ~1.7M rows across all datasets (capped at 100k per dataset due to memory constraints)

## Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Visualization:** ASCII charts (Phase 4), Interactive heatmaps (Phase 7)
- **Data Integration:** Socrata SODA3 API, PopHIVE
- **Deployment:** Vercel

## Architecture

### Data Fetching
- `/api/health-data` - Main dataset query endpoint with pagination (10k chunks, 100k limit)
- `/api/data-sources` - Metadata endpoint with freshness indicators
- `/api/alerts` - Alert detection with statistical thresholds

### Components
- `HealthDataCard` - Individual metric display
- `HealthDataSection` - Grouped card layouts
- `CDCDashboard` - Main dashboard container
- `DataSourceStatus` - Freshness monitoring grid
- `TrendingChart` - ASCII trend visualization
- `AlertsDashboard` - Alert summary and active alerts
- `InteractiveTrendChart` - Recharts line chart with statistics
- `MultiSourceComparison` - Multi-dataset comparison charts
- `StateHeatmap` - Interactive state-level heatmap

### Libraries
- `lib/cdc/soda-client.ts` - Generic Socrata SODA3 API client
- `lib/cdc/fetch-tier1.ts` - Batch fetcher for 11 datasets
- `lib/cdc/fetch-backlog.ts` - Backlog dataset fetcher
- `lib/alerts/alert-engine.ts` - Z-score and trend detection
- `lib/geo/state-aggregator.ts` - State and region aggregation

## Limitations

- **NNDSS Dataset (x9gk-5huc):** Exceeds Node.js string size limits; requires database approach
- **Large Datasets:** Capped at 100k rows per dataset due to memory constraints
- **CDC API Access:** Some datasets require special account permissions (403 errors possible)

## Future Enhancements

**Phase 8:** Predictive Analytics
- 2-4 week forecasting with confidence intervals
- Time-series decomposition and ARIMA modeling

**Phase 9:** County-Level Analysis
- County drill-down from state view
- County hotspot detection
- Population-normalized metrics

**Phase 10:** Advanced Analytics
- Correlation analysis between datasets
- Demographic factor analysis
- Intervention impact measurement

## Deployment

Deployed on Vercel with automatic deployments from main branch:
```bash
git push origin main
```

Production URL: https://surveillance-dashboard.vercel.app

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/docs)
- [CDC SODA API](https://dev.socrata.com/)
- [Recharts Documentation](https://recharts.org/)
