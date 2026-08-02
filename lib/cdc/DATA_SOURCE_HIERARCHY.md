# Data Source Hierarchy & Conflict Resolution

When multiple data sources report the same metric for a state/region/time period, use this hierarchy to determine which is the "source of truth."

## Hierarchy Levels

### **Level 1: CDC Official Surveillance Systems** (Authoritative)
Primary source for U.S. public health data. These are the systems health departments report to.

- **CDC WONDER** (Vital Statistics) - All-cause and disease-specific mortality
  - Includes: Deaths from diabetes, heart disease, stroke, COPD, cancer, etc.
  - Data source: NCHS (National Center for Health Statistics)
  - Authority level: Highest
  - Lag: 1-2 years

- **CDC Chronic Disease Indicators (CDI)** - Prevalence of chronic conditions
  - Includes: Diabetes, heart disease, stroke, asthma, arthritis, hypertension
  - Data source: BRFSS and other CDC surveillance systems
  - Authority level: Highest
  - Lag: 1-2 years

- **CDC/SAMHSA NSDUH** - Substance use and mental health
  - Includes: Opioid use disorder, substance abuse, depression
  - Authority level: Highest
  - Lag: 1-2 years

- **CDC FHIR API & FluSight** - Real-time infectious disease surveillance
  - Includes: COVID-19, influenza, RSV hospitalizations
  - Authority level: Highest
  - Lag: 1-2 weeks

### **Level 2: CDC-Affiliated or Validated Data** (Very reliable)
Data collected or validated by CDC but may be reported via partner systems.

- **NCHS Vital Statistics** - Death certificates, birth certificates
  - Authority level: Very high
  - Used by: CDC WONDER, opioid overdose tracking

- **BRFSS (Behavioral Risk Factor Surveillance System)** - Self-reported health behaviors
  - Includes: Diabetes prevalence, obesity, smoking
  - Authority level: Very high
  - Lag: 1-2 years

- **CDC's National Immunization Survey (NIS)** - Vaccination coverage
  - Authority level: Very high

### **Level 3: HHS/NIDA/NIH Data** (Reliable but specialized)
Government health agencies with specific expertise areas.

- **NIDA (National Institute on Drug Abuse)** - Opioid-specific data
  - May differ from CDC SAMHSA on opioid metrics
  - Use CDC when available; use NIDA as supplement

- **NIMH (National Institute of Mental Health)** - Mental health prevalence
  - Supplements CDC CDI depression/anxiety data

### **Level 4: Academic & Research Institutions** (Validated but external)
Peer-reviewed research and university surveillance systems.

- **Johns Hopkins COVID-19 Dashboard** (for COVID-19)
- **Yale PopHIVE** (for respiratory/measles)
- University hospital networks

### **Level 5: Commercial/Industry Data** (Use with caution)
Third-party health data aggregators.

- **HealthMap** (for disease surveillance, epidemic tracking)
- **Kinsa** (for illness trends)

## Conflict Resolution Rules

### **When Two Sources Disagree**

1. **Same CDC system, different time period**: Use most recent data. Document lag.
   
2. **Two Level 1 sources disagree** (e.g., CDC WONDER vs CDC CDI for diabetes):
   - **WONDER (mortality data)** > CDI (prevalence)
     - Mortality is more objective (death certificates)
     - Prevalence is self-reported (BRFSS)
   - **Real-time CDC data** (COVID, flu) > Year-old CDI
   - Show both with clear labeling if >5% difference

3. **Level 1 vs Level 2**: Use Level 1. Note the discrepancy.
   
4. **Level 2 vs Level 3+**: Use Level 2. Can show alternate data as secondary.

5. **Different metrics for same condition** (e.g., "diabetes prevalence" vs "diabetes mortality"):
   - Use both but keep separate
   - Example: Show both CDC CDI prevalence AND CDC WONDER mortality for diabetes
   - Don't conflate prevalence with incidence or mortality

### **Special Cases**

#### **Opioid Overdose Deaths**
- **Primary source**: CDC WONDER (most comprehensive, official death certificate data)
- **Secondary**: CDC/SAMHSA NSDUH (for substance use disorder prevalence)
- **Tertiary**: NIDA estimates (for opioid-specific trends)
- **Handle**: Show CDC WONDER as main metric; note NIDA estimates separately if significantly different

#### **COVID-19**
- **Primary source**: CDC FHIR API / CDC COVID Data Tracker
- **Secondary**: Johns Hopkins (for historical context)
- **Handle**: Always use CDC as primary; Johns Hopkins for comparison only if requested

#### **Influenza/RSV**
- **Primary source**: CDC FluSight / CDC RSV Surveillance
- **Secondary**: PopHIVE (for NSSP ED visits data)
- **Handle**: Use CDC surveillance data; PopHIVE ED visits are proxy signals, not official cases

#### **Diabetes Prevalence**
- **Primary source**: CDC CDI (prevalence from BRFSS)
- **Secondary**: CDC WONDER (mortality from death certificates)
- **Tertiary**: PopHIVE (Epic Cosmos claims data)
- **Handle**: Show CDI prevalence; WONDER mortality; note PopHIVE as alternative prevalence source

## Implementation

### **Data Record Format**
Each data point should include:
```typescript
{
  value: number,
  unit: string,
  asOf: string,
  source: string,           // e.g., "CDC WONDER"
  sourceUrl: string,        // Link to data source
  hierarchy_level: 1-5,     // Used for conflict resolution
  confidence_interval?: string,  // If available
  note?: string,            // Any caveats (e.g., "Y-o-Y lag", "Preliminary data")
  alternate_sources?: [{    // Only if significant discrepancy
    source: string,
    value: number,
    difference_percent: number,
    reason: string
  }]
}
```

### **Dashboard Display**
- Show primary source prominently
- Flag if data is preliminary/lag is >6 months
- Show alternate sources only if:
  - Difference > 5%
  - User hovers/clicks "more info"
  - Explicitly different metrics (prevalence vs. mortality)

## Updates Required When Sources Conflict

When you discover a conflict:
1. Document it in this file under "Known Discrepancies"
2. Check if it's a metric difference (prevalence vs. mortality) or real disagreement
3. Update code to explicitly use Level 1 source
4. Add note to the data if discrepancy is >5%

---

## Known Discrepancies (To Be Updated)

| Metric | Source 1 | Source 2 | Difference | Resolution |
|--------|----------|----------|------------|------------|
| Opioid overdose deaths 2025 | CDC WONDER | NIDA | TBD | Use CDC WONDER as primary |
| Diabetes prevalence | CDC CDI | PopHIVE Epic Cosmos | TBD | Use CDC CDI (official BRFSS) |

