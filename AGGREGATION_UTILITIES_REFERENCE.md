# CCV Dashboard - Aggregation Utilities Reference

## Available Aggregation Functions

### 1. Core Relationship Building

#### `buildCalculatedRequests(parents, children, timeEntries)`

**Location:** `src/domain/relationships.ts`

**Purpose:** Main aggregation engine - converts raw data into calculated metrics

**Input:**

- `parents: ParentRequest[]`
- `children: ChildRequest[]`
- `timeEntries: TimeEntry[]`

**Output:**

```typescript
{
  calculatedRequests: CalculatedRequest[]
  orphanTimeEntries: OrphanTimeEntry[]
}
```

**What it does:**

- Resolves each time entry to a parent request
- Groups time entries by parent
- For each parent, calculates:
  - Estimated hours (from children or parent)
  - Actual hours (sum of resolved time entries)
  - Profile-based hours (Jp, Cs, Af from children)
  - Deviation metrics
  - Result status (profit/loss/neutral)
  - HBS consumption
  - Unique aggregations (people, activities, roles, apps)
  - Counts (children, time entries)

**Complexity:** O(n + m + k) where n=parents, m=children, k=timeEntries

---

### 2. Dashboard-Level Aggregation

#### `calculateDashboardSummary(calculatedRequests, orphanTimeEntries)`

**Location:** `src/domain/calculations.ts`

**Purpose:** Top-level totals and statistics

**Input:**

- `calculatedRequests: CalculatedRequest[]`
- `orphanTimeEntries: OrphanTimeEntry[]`

**Output:**

```typescript
{
  totalEstimatedHours: number;
  totalActualHours: number;
  totalDifferenceHours: number;
  averageDeviationPercent: number;

  totalEstimatedHbs: number;
  totalConsumedHbs: number;
  totalDifferenceHbs: number;
  averageDeviationPercentHbs: number;

  profitableRequests: number;
  lossRequests: number;
  neutralRequests: number;
  orphanTimeEntries: number;
  totalPeople: number;
  totalApplications: number;
}
```

**Key calculations:**

```typescript
- Average deviation only from requests with estimatedHours > 0
- Result status counts: filter by resultStatus
- Unique sets: people[], applications[]
```

**Used by:** Dashboard KPIs, Summary cards

---

### 3. Hierarchical Grouping

#### `buildParentGroupedTableRows(parents, children, timeEntries, calculatedRequests)`

**Location:** `src/domain/parentGroupedTable.ts`

**Purpose:** Detailed parent-to-children hierarchy with filtering support

**Input:**

- `parents: ParentRequest[]`
- `children: ChildRequest[]`
- `timeEntries: TimeEntry[]`
- `calculatedRequests: CalculatedRequest[]` (for time entry resolution)

**Output:** `ParentGroupedTableRow[]`

**Each row contains:**

- Parent metrics (inherited from CalculatedRequest)
- Risk level (based on differenceHours)
- Consumption percent
- Children array with detailed breakdown:
  - Each child's estimated/actual metrics
  - User/role/hours summary (`UserRoleHoursSummary[]`)
  - Per-child unique aggregations

**Key features:**

```typescript
// Risk Level Calculation
- differenceHours < -20 → "high"
- differenceHours < -5 → "medium"
- otherwise → "low"

// Consumption Percent
consumptionPercent = (actualHours / estimatedHours) * 100

// User/Role Summary (per child)
Grouped by: user + role combination
Aggregates: total hours + activities for that user/role
```

**Complexity:** O(n \* m + k) where n=parents, m=avg children per parent, k=timeEntries

---

#### `filterParentGroupedRows(rows, filters)`

**Location:** `src/domain/parentGroupedTable.ts`

**Purpose:** Apply multi-level filtering to grouped rows

**Input:**

- `rows: ParentGroupedTableRow[]`
- `filters: ParentGroupedTableFilters`

**Filter types:**

```typescript
{
  // Parent-level string filters
  parentCode?: string
  parentSubject?: string

  // Child-level string filters
  childCode?: string
  childSubject?: string

  // Parent-level select filters
  project?: string
  application?: string[]
  status?: string

  // User/role/activity filters (apply to children)
  user?: string[]
  role?: string[]
  activity?: string[]

  // Metric-based filters
  resultStatus?: ResultStatus
  riskLevel?: RiskLevel
  onlyLosses?: boolean
  onlyDeviationOver20?: boolean
  onlyConsumptionOver100?: boolean
}
```

**How it works:**

1. Filter children based on child-level criteria
2. Calculate `filteredActualHours` if user/role/activity filters active
3. Filter parent rows based on parent-level criteria
4. Only return rows that have matching children

**Output:**

- Updated rows with filtered children
- `filteredActualHours` field populated if applicable
- Empty result if no children match filters

**Complexity:** O(n _ m _ f) where n=parents, m=children, f=filter count

---

### 4. Table-Specific Aggregations

#### `buildUserTableRows(calculatedRequests, children, timeEntries)`

**Location:** `src/domain/tableAggregations.ts`

**Purpose:** User-centric view aggregation

**Input:**

- `calculatedRequests: CalculatedRequest[]`
- `children: ChildRequest[]`
- `timeEntries: TimeEntry[]`

**Output:** `UserTableRow[]` (sorted by totalHours DESC)

**Each row aggregates:**

```typescript
{
  user: string
  totalHours: number                      // Sum of all hours
  parentRequestsCount: number             // Unique parents worked on
  childRequestsCount: number              // Unique children worked on
  projects: string[]                      // Unique projects
  parentProjects: string[]                // Unique parent projects
  applications: string[]                  // Unique applications
  activities: string[]                    // Unique activities
  roles: string[]                         // Unique roles
  profitRelatedHours: number              // Hours on profitable requests
  lossRelatedHours: number                // Hours on loss-making requests
}
```

**Profitability bucketing:**

- Resolves parent via petitionId/parentTaskId
- Checks parent's resultStatus in calculatedRequests
- Adds hours to appropriate bucket

**Sorting:** totalHours DESC (top contributors first)

---

#### `buildChildRequestTableRows(parents, children, calculatedRequests, timeEntries)`

**Location:** `src/domain/tableAggregations.ts`

**Purpose:** Child request-centric view

**Input:**

- `parents: ParentRequest[]`
- `children: ChildRequest[]`
- `calculatedRequests: CalculatedRequest[]` (unused in current impl)
- `timeEntries: TimeEntry[]`

**Output:** `ChildRequestTableRow[]`

**Each row contains:**

```typescript
{
  childId: string
  childCode?: string
  childSubject: string
  parentId?: string
  parentCode?: string
  parentSubject?: string
  project?: string
  parentProject?: string
  application?: string
  status?: string

  estimatedHours: number
  actualHours: number                     // Sum of time entries
  differenceHours: number
  deviationPercent: number
  resultStatus: 'profit' | 'loss' | 'neutral'

  people: string[]                        // Unique users
  peopleCount: number
  activities: string[]
  roles: string[]
}
```

**Result status logic:**

```typescript
- differenceHours > 0 → "profit"
- differenceHours < 0 → "loss"
- otherwise → "neutral"
```

---

#### `buildParentRequestTableRows(calculatedRequests)`

**Location:** `src/domain/tableAggregations.ts`

**Purpose:** Parent request-centric view

**Input:**

- `calculatedRequests: CalculatedRequest[]`

**Output:** `ParentRequestTableRow[]`

**Mapping:** Direct 1:1 mapping from CalculatedRequest

**Each row includes:**

```typescript
{
  parentId: string
  parentCode: string
  parentSubject: string
  project?: string
  application?: string
  status?: string

  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  resultStatus: ResultStatus

  childrenCount: number
  timeEntriesCount: number

  people: string[]
  peopleCount: number
  activities: string[]
  roles: string[]
}
```

---

#### `buildParentProjectGroupTableRows(parents, children, calculatedRequests, timeEntries)`

**Location:** `src/domain/tableAggregations.ts`

**Purpose:** Project-level aggregation

**Input:**

- `parents: ParentRequest[]`
- `children: ChildRequest[]`
- `calculatedRequests: CalculatedRequest[]`
- `timeEntries: TimeEntry[]` (unused)

**Output:** `ParentProjectGroupTableRow[]` (sorted by differenceHours ASC)

**Aggregation process:**

1. Group calculatedRequests by `parent.project`
2. For each project, aggregate:
   - Sum: estimatedHours, actualHours, timeEntriesCount
   - Count: parentRequestsCount
   - Unique: people, roles, activities, applications
3. Count children: filter children by project's parent IDs
4. Calculate: differenceHours, deviationPercent, resultStatus

**Each row contains:**

```typescript
{
  parentProject: string
  parentRequestsCount: number
  childRequestsCount: number
  timeEntriesCount: number

  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  resultStatus: 'profit' | 'loss' | 'neutral'

  people: string[]
  peopleCount: number
  roles: string[]
  activities: string[]
  applications: string[]
}
```

**Sorting:** differenceHours ASC (most unprofitable first)

---

### 5. Chart Data Builders

#### `buildRiskMatrixData(parentGroupedTableRows)`

**Location:** `src/domain/chartsData.ts`

**Purpose:** Transform grouped rows to risk matrix visualization format

**Input:** `ParentGroupedTableRow[]`

**Output:** `RiskMatrixPoint[]`

**Each point contains:**

```typescript
{
  parentCode: string
  parentSubject: string
  riskLevel: 'low' | 'medium' | 'high'
  resultStatus: 'profit' | 'loss' | 'neutral'

  estimatedHours: number
  actualHours: number
  differenceHours: number

  project?: string
  application?: string
}
```

**Used by:** ChartRiskMatrix component (transforms to scatter plot)

---

#### `buildDeviationDistribution(parentGroupedTableRows)`

**Location:** `src/domain/chartsData.ts`

**Purpose:** Create deviation distribution buckets for histogram

**Input:** `ParentGroupedTableRow[]`

**Output:** `DeviationBucket[]`

**Buckets:**

```typescript
[
  { range: "< -50%", color: "#dc2626", count: n, percentage: p },
  { range: "-50% a -20%", color: "#f97316", count: n, percentage: p },
  { range: "-20% a 0%", color: "#facc15", count: n, percentage: p },
  { range: "0% a 20%", color: "#86efac", count: n, percentage: p },
  { range: "20% a 50%", color: "#22c55e", count: n, percentage: p },
  { range: "> 50%", color: "#16a34a", count: n, percentage: p },
];
```

**Logic:**

1. For each row, check `deviationPercent`
2. Find matching bucket range
3. Increment count
4. Calculate percentage = count / total \* 100

**Color scheme:** Red (negative) → Green (positive)

**Used by:** ChartDeviationDistribution component

---

### 6. Helper Functions for Aggregations

#### HBS Calculations (`src/domain/hbs.ts`)

**`calculateConsumedHbs(timeEntries)`**

```typescript
// For each time entry:
// 1. Get collaborator profile
// 2. Get HBS ratio for profile
// 3. Multiply hours × ratio
// 4. Sum all entries

const consumedHbs = timeEntries.reduce((total, entry) => {
  const profile = getCollaboratorProfile(entry.user);
  const ratio = getHbsRatioByProfile(profile); // 1.0 - 1.69
  return total + entry.hours * ratio;
}, 0);
```

**`getCollaboratorProfile(name)`**

```typescript
// Lookup in COLLABORATORS map
// Returns: "GP" | "CD" | "AS" | "DE" | etc.
```

**`getHbsRatioByProfile(profile)`**

```typescript
// Return ratio from HBS_PROFILES[profile]
// Fallback to 1.0 if unknown
```

---

#### Company Filtering (`src/domain/companies.ts`)

**`assignCompanyToTimeEntries(timeEntries, collaborators)`**

```typescript
// For each time entry:
// 1. Find collaborator in map (by normalized name)
// 2. Attach: companyName = collaborator.company
// 3. Return enriched array
```

**`filterTimeEntriesByCompany(timeEntries, companyFilter)`**

```typescript
// If companyFilter is null: return all
// Otherwise: filter entries where companyName === companyFilter
```

**`getUniqueCompaniesFromTimeEntries(timeEntries)`**

```typescript
// Create Set from companyName values
// Return sorted array
```

---

## Aggregation Usage Patterns

### Pattern 1: Recalculation Cascade

```typescript
// When data changes, recalculate in order:
1. buildCalculatedRequests()          // Base metrics
2. calculateDashboardSummary()        // Dashboard totals
3. buildParentGroupedTableRows()      // Detailed hierarchy
4. filterParentGroupedRows()          // Apply view filters
5. [buildUserTableRows() OR buildParentProjectGroupTableRows()] // Alternative views
```

### Pattern 2: Company Filtering

```typescript
// Filter at time entry level, cascade to metrics
1. enrichedTimeEntries = assignCompanyToTimeEntries()
2. filteredTimeEntries = filterTimeEntriesByCompany()
3. // Recalculate with filteredTimeEntries:
   filteredCalculatedRequests = buildCalculatedRequests(
     parents,
     children,
     filteredTimeEntries  // ← Filtered
   )
4. filteredSummary = calculateDashboardSummary(filteredCalculatedRequests)
```

### Pattern 3: Multi-Level Filtering

```typescript
// Apply filters at multiple levels
1. rows = buildParentGroupedTableRows()
2. filtered = filterParentGroupedRows(rows, {
     resultStatus: 'loss',
     onlyDeviationOver20: true,
     user: ['Juan Manuel Lineros Fernández'],
     role: ['Desarrollador']
   })
// Returns only loss-making requests with high deviation,
// filtered to specific user/role, showing matched children
```

### Pattern 4: Alternative Views from Same Data

```typescript
// Same CalculatedRequest[] → different views
const calculated = buildCalculatedRequests(parents, children, timeEntries);

// User view
const users = buildUserTableRows(calculated, children, timeEntries);

// Project view
const projects = buildParentProjectGroupTableRows(
  parents,
  children,
  calculated,
);

// Child view
const childRows = buildChildRequestTableRows(
  parents,
  children,
  calculated,
  timeEntries,
);

// Parent view (simple)
const parentRows = buildParentRequestTableRows(calculated);
```

---

## Performance Considerations

### Time Complexity Summary

```
buildCalculatedRequests:          O(parents + children + timeEntries)
calculateDashboardSummary:        O(calculatedRequests)
buildParentGroupedTableRows:      O(parents * children + timeEntries)
filterParentGroupedRows:          O(rows * children * filters)
buildUserTableRows:               O(timeEntries)
buildChildRequestTableRows:       O(children + timeEntries)
buildParentRequestTableRows:      O(calculatedRequests)
buildParentProjectGroupTableRows: O(calculatedRequests + children)
buildRiskMatrixData:              O(rows)
buildDeviationDistribution:       O(rows)
```

### Optimization Tips

1. **Cache** CalculatedRequest[] to avoid repeated recalculation
2. **Memoize** computed properties in Vue
3. **Filter at source**: Use `filteredTimeEntries` in buildCalculatedRequests
4. **Batch operations**: Call recalculate() once after all CSV loads
5. **Lazy rendering**: Only build requested views (user vs project vs children)

---

## Common Aggregation Queries

### Query: "Total hours by person"

```typescript
const userRows = buildUserTableRows(calculated, children, timeEntries);
const person = userRows.find((u) => u.user === "Juan Manuel");
console.log(person.totalHours);
```

### Query: "Most unprofitable projects"

```typescript
const projects = buildParentProjectGroupTableRows(
  parents,
  children,
  calculated,
);
const sorted = projects.sort((a, b) => a.differenceHours - b.differenceHours);
const losers = sorted.slice(0, 5);
```

### Query: "High-risk requests that are making losses"

```typescript
const grouped = buildParentGroupedTableRows(
  parents,
  children,
  timeEntries,
  calculated,
);
const filtered = filterParentGroupedRows(grouped, {
  riskLevel: "high",
  resultStatus: "loss",
});
```

### Query: "Hours spent on activities for a user"

```typescript
const userRows = buildUserTableRows(calculated, children, timeEntries);
const user = userRows.find((u) => u.user === "Name");
console.log(user.activities); // List of activities
```

### Query: "Profit vs loss distribution"

```typescript
const summary = calculateDashboardSummary(calculated, orphans);
console.log({
  profit: summary.profitableRequests,
  loss: summary.lossRequests,
  neutral: summary.neutralRequests,
});
```

### Query: "HBS consumption analysis"

```typescript
const summary = calculateDashboardSummary(calculated, orphans);
const hbsOverrun = summary.totalConsumedHbs - summary.totalEstimatedHbs;
const hbsPercent = (hbsOverrun / summary.totalEstimatedHbs) * 100;
console.log(
  `${hbsOverrun.toFixed(1)} HBS hours over (${hbsPercent.toFixed(1)}%)`,
);
```

---

## Data Validation Notes

### Assumptions Made

1. **Parent ID uniqueness**: Each parent.id is globally unique
2. **Child parent linkage**: Each child.parentId matches a parent.id
3. **Time entry resolution**: Resolved via petitionId OR parentTaskId
4. **User names**: Must match exactly (case-sensitive) for HBS profile lookup
5. **Company collaborators**: Must be pre-configured in SOPRA_STERIA_COLLABORATORS

### Data Quality Issues

1. **Orphan time entries**: Time entries that cannot be resolved to a parent
   - Logged in `orphanTimeEntries: OrphanTimeEntry[]`
   - Included in summary count

2. **Zero estimates with actual hours**: Requests with estimatedHours=0 but actualHours>0
   - Results in deviationPercent = 0 (not calculated)
   - Marked as warning in store

3. **Unknown user profiles**: Time entries with users not in HBS database
   - Fallback: HBS ratio = 1.0
   - Warning logged to console

---

## Extensibility

### Adding a New Aggregation

```typescript
// 1. Create new builder in src/domain/
export function buildNewAggregation(
  calculatedRequests: CalculatedRequest[],
): NewAggregationType[] {
  // Implement aggregation logic
  return result;
}

// 2. Export from domain index if desired
export { buildNewAggregation } from "./newAggregation";

// 3. Use in store or component
const newData = buildNewAggregation(store.calculatedRequests);

// 4. Add computed property if needs company filtering
const filteredNewData = computed(() => {
  if (!selectedCompanyFilter.value) return newData.value;
  // Filter logic...
});
```

### Adding a New Filter Type

```typescript
// 1. Update ParentGroupedTableFilters interface
export interface ParentGroupedTableFilters {
  // ... existing filters
  myNewFilter?: string; // or string[], or custom type
}

// 2. Add filter logic in filterParentGroupedRows()
if (filters.myNewFilter && row.someField !== filters.myNewFilter) {
  return false;
}
```
