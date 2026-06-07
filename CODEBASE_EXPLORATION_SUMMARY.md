# CCV Dashboard - Codebase Exploration Summary

## Overview

The CCV Dashboard is a Vue 3 + TypeScript application for analyzing project requests and time tracking data. It processes three CSV files (Parents, Children, TimeEntries) and calculates metrics around estimated vs. actual hours, HBS (Billing System) consumption, and request profitability.

---

## 1. Data Structures

### CalculatedRequest

**Location:** `src/domain/types.ts` (lines 85-117)

Represents a parent request with all aggregated metrics:

```typescript
export interface CalculatedRequest {
  parentId: string; // Unique ID
  code: string; // Request code (e.g., "REQ-001")
  subject: string; // Request title
  project?: string; // Project name
  tracker?: string; // Tracker type
  status?: string; // Status
  application?: string; // Application name

  // Hours metrics
  estimatedHours: number; // Total estimated hours
  estimatedHoursJp?: number; // JP profile-based estimate
  estimatedHoursCs?: number; // CS profile-based estimate
  estimatedHoursAf?: number; // AF profile-based estimate
  estimatedHoursTotal?: number; // Sum of JP + CS + AF
  actualHours: number; // Total actual hours from time entries
  differenceHours: number; // Estimated - Actual
  deviationPercent: number; // ((Actual - Estimated) / Estimated) * 100
  resultStatus: ResultStatus; // "profit" | "loss" | "neutral"

  // HBS (Horas de Billing de Sistema) metrics
  estimatedHbs: number; // Estimated HBS (currently always 0)
  consumedHbs: number; // Actual HBS consumed (hours * profile_ratio)
  differenceHbs: number; // Consumed - Estimated
  deviationPercentHbs: number; // ((Consumed - Estimated) / Estimated) * 100
  resultStatusHbs: ResultStatus; // Result status based on HBS

  // Aggregations
  childrenCount: number; // Number of child requests
  timeEntriesCount: number; // Number of time entries
  peopleCount: number; // Number of unique people
  people: string[]; // List of unique users
  activities: string[]; // List of unique activities
  roles: string[]; // List of unique roles
  applications: string[]; // List of unique applications
  costWithoutVat?: number; // Optional cost data
}
```

**Key characteristics:**

- Built from ParentRequest + ChildRequest[] + TimeEntry[]
- All aggregations at the parent level
- HBS calculations apply profile ratios from collaborator database
- `estimatedHbs` is always 0 (cannot be estimated without per-user breakdown)
- `resultStatus` based on hours: profit (diff > 0), loss (diff < 0), neutral
- `resultStatusHbs` inverted logic: loss (diff > 0), profit (diff < 0)

---

### ParentGroupedTableRow

**Location:** `src/domain/parentGroupedTable.ts` (lines 55-88)

Extended version of CalculatedRequest with child details:

```typescript
export interface ParentGroupedTableRow {
  // Parent info (same as CalculatedRequest)
  parentId: string;
  parentCode: string;
  parentSubject: string;
  project?: string;
  application?: string;
  status?: string;

  // Hours metrics (same as CalculatedRequest)
  estimatedHours: number;
  actualHours: number;
  filteredActualHours?: number; // Hours after applying user/role/activity filters
  differenceHours: number;
  deviationPercent: number;
  consumptionPercent: number; // (actualHours / estimatedHours) * 100

  // HBS metrics (same as CalculatedRequest)
  estimatedHbs: number;
  consumedHbs: number;
  differenceHbs: number;
  deviationPercentHbs: number;

  resultStatus: ResultStatus;
  riskLevel: RiskLevel; // "low" | "medium" | "high"

  // Aggregations
  childrenCount: number;
  timeEntriesCount: number;
  users: string[];
  roles: string[];
  activities: string[];
  applications: string[];

  // Nested children with detailed breakdown
  children: ChildRequestGroupedRow[];
}
```

**ChildRequestGroupedRow** includes:

- Per-child hours breakdown (estimated, actual, difference)
- User/Role/Hours summary: `UserRoleHoursSummary[]` mapping user+role to hours spent
- Activities and roles per child
- Time entries count

**Risk Level** calculation (lines 114-118):

```typescript
- differenceHours < -20 → "high" risk
- differenceHours < -5 → "medium" risk
- otherwise → "low" risk
```

---

## 2. Domain Layer (`src/domain/`)

### Key Files and Responsibilities

#### `types.ts`

Defines core interfaces:

- `ParentRequest` - Parent-level request from CSV
- `ChildRequest` - Child request from CSV
- `TimeEntry` - Time tracking entries from CSV
- `OrphanTimeEntry` - Time entry that couldn't be linked to a parent
- `CalculatedRequest` - Aggregated metrics
- `DashboardSummary` - Top-level dashboard totals

#### `relationships.ts`

**Primary function:** `buildCalculatedRequests(parents, children, timeEntries)`

Responsible for:

1. Resolving time entries to parent requests via `resolveParentId()`
2. Building parent-to-children mappings
3. Calculating estimated hours (prefer children sum, fallback to parent)
4. Calculating actual hours from time entries
5. Computing deviations and result status
6. Aggregating people, activities, roles, applications
7. Detecting orphan time entries
8. Calculating consumed HBS

**Resolution order** (lines 194-217):

1. petitionId → matches child → use child's parentId
2. petitionId → matches parent directly
3. parentTaskId → matches parent directly
4. parentTaskId → matches child → use child's parentId
5. No match → orphan

#### `hbs.ts`

HBS (Horas de Billing de Sistema) system for billing rate calculations.

**Profiles and Ratios:**

```typescript
GP (Gestor de proyecto):           1.69x
CD (Consultor digital):            1.49x
AN (Analista de negocio):          1.16x
ARQ (Arquitecto de sistemas):      1.33x
AS (Analista de sistemas):         1.18x
DE (Desarrollador):                1.0x
```

**Key functions:**

- `calculateConsumedHbs(timeEntries)` - Sum of (hours \* profile_ratio) for each entry
- `getCollaboratorProfile(name)` - Maps collaborator name to profile code
- `getHbsRatioByProfile(profile)` - Returns ratio for profile
- Note: Cannot calculate estimated HBS (would need per-user breakdown)

#### `calculations.ts`

**Function:** `calculateDashboardSummary(calculatedRequests, orphanTimeEntries)`

Aggregates CalculatedRequest data into dashboard totals:

- Total estimated/actual/difference hours
- Average deviation percent
- Total estimated/consumed/difference HBS
- Average HBS deviation percent
- Count of profitable/loss/neutral requests
- Count of orphan time entries
- Total unique people and applications

#### `parentGroupedTable.ts`

**Main function:** `buildParentGroupedTableRows(parents, children, timeEntries, calculatedRequests)`

Builds detailed table rows with child breakdown:

1. Creates parent-to-children map
2. Creates parent-to-time entries map (for orphaned entries detection)
3. Creates child-to-time entries map
4. For each calculated request:
   - Groups child requests
   - For each child: aggregates user+role breakdown
   - Calculates consumption percent and risk level
   - Aggregates applications across parent+children

**Related function:** `filterParentGroupedRows(rows, filters)`

- Supports parent-level filters (code, subject, project, application, status, resultStatus, riskLevel)
- Supports child-level filters (code, subject, user, role, activity)
- Calculates filteredActualHours based on active filters
- Only returns rows with matching children (if child filters applied)

#### `tableAggregations.ts`

Provides table row builders for different views:

1. **buildUserTableRows()** - Groups by user
   - Total hours per user
   - Parent/child counts
   - Projects, applications, activities, roles
   - Profit/loss hours buckets
   - Sorted by total hours

2. **buildChildRequestTableRows()** - One row per child
   - Child and parent info
   - Estimated/actual/difference hours
   - People, activities, roles
   - Result status

3. **buildParentRequestTableRows()** - One row per parent
   - Maps CalculatedRequest directly to table row
   - Includes children count, time entries count
   - People, activities, roles

4. **buildParentProjectGroupTableRows()** - Groups by parent project
   - Aggregates across all requests in a project
   - Combines people, roles, activities, applications
   - Calculates project-level metrics

#### `chartsData.ts`

Chart data builders:

1. **buildRiskMatrixData()** - Converts ParentGroupedTableRow[] to RiskMatrixPoint[]
   - Used for Risk Matrix visualization
   - Maps risk level and result status to scatter chart data
   - Bubble size = estimated hours

2. **buildDeviationDistribution()** - Creates deviation buckets
   - 6 ranges: < -50%, -50% to -20%, -20% to 0%, 0% to 20%, 20% to 50%, > 50%
   - Counts requests in each range
   - Color-coded (red → green)

#### `companies.ts`

Company/collaborator management:

1. **SOPRA_STERIA_COLLABORATORS** - Hardcoded list with profile mappings
2. **assignCompanyToTimeEntries()** - Enriches time entries with company name
3. **filterTimeEntriesByCompany()** - Filters by company
4. **getUniqueCompaniesFromTimeEntries()** - Extracts unique companies
5. **buildCollaboratorMap()** - Fast lookup map for collaborators

#### `normalizeCsv.ts`

CSV parsing and normalization:

- `normalizeParentRequests()` - Parses parent CSV
- `normalizeChildRequests()` - Parses child CSV
- `normalizeTimeEntries()` - Parses time entries CSV
- Handles column mapping and data type conversions

---

## 3. Data Flow & Processing Pipeline

### 1. Initial Load (Store: `useDashboardStore`)

```
User uploads 3 CSV files
        ↓
parseCsvFile() → CSV rows parsed with PapaParse
        ↓
normalizeParentRequests() → ParentRequest[]
normalizeChildRequests() → ChildRequest[]
normalizeTimeEntries() → TimeEntry[] (enriched with companyName)
        ↓
State updated: parents, children, timeEntries refs
```

### 2. Calculation Phase

```
All 3 CSVs loaded
        ↓
buildCalculatedRequests(parents, children, timeEntries)
        ↓
For each parent:
  ├─ Find children via childrenByParent map
  ├─ Find time entries via parentTimeEntries map
  ├─ Resolve orphans
  ├─ Calculate metrics:
  │  ├─ estimatedHours (from children or parent)
  │  ├─ actualHours (sum of time entries)
  │  ├─ differenceHours, deviationPercent
  │  ├─ consumedHbs (from HBS calculation)
  │  ├─ aggregatepeople, activities, roles, applications
  │  └─ Calculate result status
  └─ Return CalculatedRequest
        ↓
calculatedRequests: CalculatedRequest[]
orphanTimeEntries: OrphanTimeEntry[]
        ↓
calculateDashboardSummary()
        ↓
summary: DashboardSummary
```

### 3. Company Filtering

```
timeEntries (raw)
        ↓
assignCompanyToTimeEntries(timeEntries, SOPRA_STERIA_COLLABORATORS)
        ↓
enrichedTimeEntries (with companyName)
        ↓
filterTimeEntriesByCompany(enrichedTimeEntries, selectedCompanyFilter)
        ↓
filteredTimeEntries
        ↓
Used to recalculate: filteredCalculatedRequests, filteredSummary
```

### 4. View Rendering

#### ChartsView → ChartsTab

```
ChartsTab receives: requests (CalculatedRequest[])
        ↓
Renders:
  ├─ ChartTotalSummary
  │  └─ Aggregates from CalculatedRequest[]
  │     ├─ Total estimated/actual/difference
  │     ├─ Result status pie chart
  │     ├─ HBS chart
  │     └─ Stats cards (people, applications, etc.)
  │
  └─ ChartDeviationRanges
     └─ Aggregates from CalculatedRequest[]
        └─ Bucketing by deviationPercent
```

#### ParentGroupedTable (in Tables view)

```
tableData: ParentGroupedTableRow[] = buildParentGroupedTableRows(
  parents, children, timeEntries, calculatedRequests
)
        ↓
Displayed with:
  ├─ Parent-level metrics
  ├─ Collapsible children
  ├─ Child breakdown with user/role/hours
  └─ Inline filtering applied via filterParentGroupedRows()
```

---

## 4. Currently Available Charts & Aggregations

### Charts Currently Rendered

1. **ChartTotalSummary**
   - Bar chart: Estimated vs Actual vs Difference hours
   - Pie chart: Request status distribution (Profit/Loss/Neutral)
   - Bar chart: HBS Estimated vs Consumed
   - Stats cards: Requests, People, Applications, Children, Hours, Deviation %, etc.

2. **ChartDeviationRanges**
   - Bar chart showing distribution of requests by deviation percentage ranges
   - 6 buckets with color gradient (red → green)

3. **ChartRiskMatrix** (commented out in ChartsTab)
   - Scatter chart: Result Status (x-axis) vs Risk Level (y-axis)
   - Bubble size = estimated hours
   - Requires: ParentGroupedTableRow[]

4. **ChartDeviationDistribution** (commented out in ChartsTab)
   - Bar chart: Deviation ranges with percentages
   - Requires: ParentGroupedTableRow[]

### Commented Out Charts (Available but not rendered)

- ChartRiskMatrix.vue
- ChartDeviationDistribution.vue
- ChartEstimatedVsDedicated.vue
- ChartHbsConsumption.vue

### Table Aggregations Available

1. **UserTableRow[]** - User-centric view
   - Total hours per user
   - Parent/child counts
   - Profit/loss hour buckets
   - Sorted by hours DESC

2. **ChildRequestTableRow[]** - Child-centric view
   - Estimated/actual/difference
   - People, activities, roles count
   - Result status

3. **ParentRequestTableRow[]** - Parent-centric view
   - Direct mapping from CalculatedRequest
   - Includes children and time entries counts

4. **ParentProjectGroupTableRow[]** - Project-centric view
   - Aggregated across projects
   - Project-level metrics
   - Sorted by differenceHours ASC

5. **ParentGroupedTableRow[]** - Hierarchical view
   - Parent + nested children
   - User/role breakdown per child
   - Risk level calculations
   - Supports complex filtering

---

## 5. How Charts Are Called

### Current Implementation

```typescript
// ChartsView.vue
const store = useDashboardStore()

// Passes raw CalculatedRequest array
<ChartsTab :requests="store.calculatedRequests" />
```

```typescript
// ChartsTab.vue
interface ChartsTabProps {
  requests: CalculatedRequest[];
  parents?: ParentRequest[];
  children?: ChildRequest[];
  timeEntries?: TimeEntry[];
}

// Renders
<ChartTotalSummary :requests="requests" />
<ChartDeviationRanges :requests="requests" />
```

### How ChartTotalSummary processes data

```typescript
// Computes aggregations directly from CalculatedRequest[]
const totals = computed(() => {
  const totalEstimated = props.requests.reduce(
    (sum, r) => sum + (r.estimatedHoursTotal || r.estimatedHours || 0),
    0,
  );
  const totalActual = props.requests.reduce(
    (sum, r) => sum + (r.actualHours || 0),
    0,
  );
  // ... more aggregations

  // Counts
  const profitCount = props.requests.filter(
    (r) => r.resultStatus === "profit",
  ).length;

  // Unique sets
  const uniqueApplications = new Set<string>();
  props.requests.forEach((r) => {
    if (r.applications)
      r.applications.forEach((a) => uniqueApplications.add(a));
  });
});
```

### How ChartRiskMatrix processes data

```typescript
// Would receive ParentGroupedTableRow[]
const chartData = computed(() => {
  const points = buildRiskMatrixData(props.rows);

  // Organize by risk level
  const byRisk = {
    low: points.filter((p) => p.riskLevel === "low"),
    medium: points.filter((p) => p.riskLevel === "medium"),
    high: points.filter((p) => p.riskLevel === "high"),
  };

  // Transform to scatter data: [resultStatusValue, riskLevelValue, estimatedHours, fullData]
  return {
    low: byRisk.low.map((p) => [
      getResultStatusValue(p.resultStatus),
      0,
      p.estimatedHours,
      p,
    ]),
    // ...
  };
});
```

---

## 6. Store State & Computed Properties

### Raw State

```typescript
parents: ParentRequest[]
children: ChildRequest[]
timeEntries: TimeEntry[]
calculatedRequests: CalculatedRequest[]
orphanTimeEntries: OrphanTimeEntry[]
summary: DashboardSummary
selectedCompanyFilter: string | null
```

### Computed Derived State

```typescript
// Company filtering pipeline
enrichedTimeEntries = assignCompanyToTimeEntries(timeEntries, collaborators)

filteredTimeEntries = filterTimeEntriesByCompany(enrichedTimeEntries, selectedCompanyFilter)

filteredCalculatedRequests = recalculate from filtered time entries

filteredSummary = calculateDashboardSummary(filteredCalculatedRequests, ...)

availableCompanies = getUniqueCompaniesFromTimeEntries(enrichedTimeEntries)
```

### Load Status

```typescript
csvLoadStatus: {
  parents: {
    (status, rowsCount, error, fileName);
  }
  children: {
    (status, rowsCount, error, fileName);
  }
  timeEntries: {
    (status, rowsCount, error, fileName);
  }
}

hasData = parentsLoaded && timeEntriesLoaded;
canCalculate = allCsvsValid;
isProcessing = isProcessingCsv || isCalculating;
```

---

## 7. Key Insights & Architecture Patterns

### 1. Layered Architecture

- **Domain Layer** (`src/domain/`): Pure functions, no side effects
  - Types, relationships, calculations, aggregations
  - Reusable across components
- **Store Layer** (`src/stores/`): State management
  - Orchestrates domain functions
  - Handles CSV parsing and loading
  - Manages company filtering
- **UI Layer** (`src/components/`, `src/views/`):
  - Consumes store data
  - Renders charts and tables
  - Handles user interactions

### 2. Data Transformation Pipeline

Each request flows through:

```
Raw CSV → Normalized Data → Relationships Resolved → Calculated Metrics → Grouped Tables → Charts
```

### 3. Aggregation Patterns

**Bottom-up aggregation:**

- Time entries → per-child hours
- Children → per-parent hours
- Parents → dashboard totals
- Totals filtered by company

**Horizontal aggregation:**

- Unique set operations for people, roles, activities, applications
- Bucketing for distributions and ranges
- Grouping for table views

### 4. HBS System

- Based on collaborator profiles with fixed multipliers
- Consumed HBS = accurately calculated from time entries
- Estimated HBS = cannot be calculated (need per-user estimates)
- Result status logic inverted from regular hours

### 5. Risk Calculation

```
Risk Level = based on differenceHours
├─ High:   differenceHours < -20 (severe overrun)
├─ Medium: differenceHours < -5  (moderate overrun)
└─ Low:    otherwise (acceptable)

Result Status = based on differenceHours direction
├─ Profit:  differenceHours > 0  (estimated > actual)
├─ Loss:    differenceHours < 0  (estimated < actual)
└─ Neutral: differenceHours = 0  (exact match)
```

### 6. Filtering Strategy

- Company filtering at time entries level
- Cascades to recalculate all dependent metrics
- Parent/child/user/role/activity filters at table level
- Supports multi-select for user/role/activity filters

---

## 8. Data Available for New Aggregations

### From CalculatedRequest

```typescript
✓ Estimated hours (total and by profile)
✓ Actual hours
✓ Deviation percentage
✓ Result status (profit/loss/neutral)
✓ HBS metrics (consumed, difference, deviation)
✓ Count of children, time entries
✓ List of people, activities, roles, applications
✓ Cost without VAT
✓ Project, tracker, status, application
```

### From ParentGroupedTableRow

```typescript
✓ All CalculatedRequest data (inherited)
✓ Risk level
✓ Consumption percentage
✓ Filtered actual hours (after applying filters)
✓ Child-level detail (ChildRequestGroupedRow[])
✓ Per-child user/role/hours breakdown (UserRoleHoursSummary[])
```

### From TimeEntry

```typescript
✓ Hours
✓ User (collaborator name)
✓ Activity
✓ Profile/role
✓ Company (after enrichment)
✓ Project
✓ Status
✓ Application
✓ Week/date
✓ Petition/parent task reference
```

### Potential New Aggregations

1. **By week/month** - temporal trends
2. **By activity type** - activity profitability
3. **By team/company** - resource allocation
4. **By status** - status-based metrics
5. **By application** - application portfolio view
6. **Risk-weighted metrics** - weighted by risk level
7. **Margin analysis** - cost vs hours
8. **Trend charts** - historical comparison
9. **Resource utilization** - hours per FTE
10. **Debt tracking** - accumulated losses over time

---

## 9. File Summary

### Core Domain Files

| File                    | Purpose          | Key Functions                                                |
| ----------------------- | ---------------- | ------------------------------------------------------------ |
| `types.ts`              | Type definitions | Interfaces for all data structures                           |
| `relationships.ts`      | Link resolution  | `buildCalculatedRequests()`                                  |
| `calculations.ts`       | Aggregation      | `calculateDashboardSummary()`                                |
| `hbs.ts`                | HBS system       | HBS calculations and profiles                                |
| `parentGroupedTable.ts` | Grouped rows     | `buildParentGroupedTableRows()`, `filterParentGroupedRows()` |
| `tableAggregations.ts`  | Table builders   | 4 different table row builders                               |
| `chartsData.ts`         | Chart adapters   | `buildRiskMatrixData()`, `buildDeviationDistribution()`      |
| `companies.ts`          | Company mgmt     | Company filtering and enrichment                             |
| `normalizeCsv.ts`       | CSV parsing      | CSV normalization functions                                  |

### Store

| File           | Purpose                    |
| -------------- | -------------------------- |
| `dashboard.ts` | Main state + orchestration |

### UI Components

| File                             | Purpose           | Data Input                 |
| -------------------------------- | ----------------- | -------------------------- |
| `ChartsView.vue`                 | Chart container   | `store.calculatedRequests` |
| `ChartsTab.vue`                  | Chart wrapper     | `CalculatedRequest[]`      |
| `ChartTotalSummary.vue`          | Stats & charts    | `CalculatedRequest[]`      |
| `ChartDeviationRanges.vue`       | Deviation bars    | `CalculatedRequest[]`      |
| `ChartRiskMatrix.vue`            | Risk scatter      | `ParentGroupedTableRow[]`  |
| `ChartDeviationDistribution.vue` | Distribution bars | `ParentGroupedTableRow[]`  |
| `ChartTopLosses.vue`             | Top losses        | `CalculatedRequest[]`      |

---

## 10. Recommended Next Steps for Enhancement

### To add new aggregations/charts:

1. **Create data builder** in `src/domain/` (e.g., `timeSeriesAggregations.ts`)
   - Accept raw data (parents, children, timeEntries) or CalculatedRequest[]
   - Return typed array of aggregation data
   - Follow pattern of existing builders

2. **Create Vue component** in `src/components/dashboard/charts/`
   - Accept data as prop
   - Use computed() to transform data to chart format
   - Use VChart with eCharts

3. **Add to ChartsTab.vue**
   - Import component
   - Add conditional render
   - Pass data (CalculatedRequest[] or ParentGroupedTableRow[])

4. **Add to store if needed**
   - Compute new data if it needs company filtering
   - Expose via computed property

### Example: New aggregation by time period

```typescript
// src/domain/timeSeriesAggregations.ts
export function buildTimeSeriesByWeek(
  calculatedRequests: CalculatedRequest[],
  timeEntries: TimeEntry[],
): WeeklyAggregation[] {
  // Group by week, aggregate metrics
  // Return sorted by date
}

// src/components/dashboard/charts/ChartTimeSeriesView.vue
// Render line chart showing trends over time
```

---

## Summary

The CCV Dashboard uses a **clean three-layer architecture**:

1. **Domain Layer** - Pure, reusable functions for data transformation
2. **Store Layer** - Centralized state with computed derived data
3. **UI Layer** - Components that consume and visualize data

**Data flows**: CSV → Normalize → Resolve → Calculate → Group/Filter → Chart

**Key aggregations available**:

- Total metrics (hours, HBS, people, applications)
- Risk-based grouping (low/medium/high)
- Hierarchical parent/child detail
- Company-filtered views
- User/role/activity breakdowns

**Extensible patterns** make it straightforward to add new charts, tables, and aggregations.
