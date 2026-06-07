# CCV Dashboard - Quick Reference Guide

## Key Files Map

```
src/domain/
├── types.ts                    ← Data interfaces (ParentRequest, CalculatedRequest, etc.)
├── relationships.ts            ← buildCalculatedRequests() - main aggregation
├── calculations.ts             ← calculateDashboardSummary() - totals
├── parentGroupedTable.ts       ← buildParentGroupedTableRows() + filtering
├── tableAggregations.ts        ← 4 table builders (user, child, parent, project)
├── chartsData.ts               ← Chart data transformers
├── hbs.ts                      ← HBS profile and consumption calculations
├── companies.ts                ← Company filtering utilities
├── normalizeCsv.ts             ← CSV parsing
├── collaborators.ts            ← (not extensively used)
├── gpsae.ts                    ← (specialized domain)
└── csvUtils.ts                 ← CSV utilities

src/stores/
└── dashboard.ts                ← Central state + orchestration (useDashboardStore)

src/components/
├── ChartsTab.vue               ← Chart wrapper (renders ChartTotalSummary + ChartDeviationRanges)
├── ChartTopLosses.vue
├── ChartHoursByPerson.vue
├── ChartHoursByApp.vue
└── dashboard/charts/
    ├── ChartTotalSummary.vue    ← Main stats + bar/pie/HBS charts
    ├── ChartDeviationRanges.vue
    ├── ChartRiskMatrix.vue       ← (commented out - scatter chart)
    ├── ChartDeviationDistribution.vue ← (commented out - histogram)
    ├── ChartEstimatedVsDedicated.vue  ← (commented out)
    └── ChartHbsConsumption.vue   ← (commented out)

src/views/
├── DashboardView.vue           ← Main dashboard entry
├── ChartsView.vue              ← Charts page
└── TablesView.vue              ← Tables page
```

---

## Data Structure Cheat Sheet

### CalculatedRequest (Parent-level metrics)

```typescript
{
  parentId: string
  code, subject, project?, tracker?, status?, application?

  // Hours
  estimatedHours: number
  estimatedHoursJp?, Cs?, Af?, Total?
  actualHours: number
  differenceHours: number              // estimated - actual
  deviationPercent: number             // (actual - estimated) / estimated * 100
  resultStatus: "profit" | "loss" | "neutral"

  // HBS
  estimatedHbs: number                 // Always 0
  consumedHbs: number                  // hours * profile ratio
  differenceHbs: number                // consumed - estimated
  deviationPercentHbs: number
  resultStatusHbs: "profit" | "loss" | "neutral"  // Inverted logic

  // Aggregations
  childrenCount, timeEntriesCount, peopleCount
  people[], activities[], roles[], applications[]
  costWithoutVat?
}
```

### ParentGroupedTableRow (CalculatedRequest + hierarchy)

```typescript
{
  // All CalculatedRequest fields

  // Additional fields
  consumptionPercent: number          // actual / estimated * 100
  filteredActualHours?: number        // After applying filters
  riskLevel: "low" | "medium" | "high"

  // Children
  children: ChildRequestGroupedRow[]
    ├── childId, childCode, childSubject
    ├── estimatedHours, actualHours, deviationPercent
    ├── HBS metrics
    ├── users[], roles[], activities[]
    ├── userRoleHours: UserRoleHoursSummary[]
    │   ├── user, role, hours
    │   └── activities[]
    └── timeEntriesCount
}
```

### DashboardSummary (Dashboard totals)

```typescript
{
  // Hours totals
  (totalEstimatedHours, totalActualHours, totalDifferenceHours);
  averageDeviationPercent;

  // HBS totals
  (totalEstimatedHbs, totalConsumedHbs, totalDifferenceHbs);
  averageDeviationPercentHbs;

  // Counts
  (profitableRequests, lossRequests, neutralRequests);
  orphanTimeEntries;
  (totalPeople, totalApplications);
}
```

---

## Common Operations

### Get all data for charts

```typescript
const store = useDashboardStore();

// All calculated requests (unfiltered)
store.calculatedRequests;

// All calculated requests (filtered by company)
store.filteredCalculatedRequests;

// Dashboard totals (filtered by company)
store.filteredSummary;

// Grouped with children and risk
const grouped = buildParentGroupedTableRows(
  store.parents,
  store.children,
  store.filteredTimeEntries, // Use filtered
  store.calculatedRequests,
);
```

### Get specific aggregations

```typescript
// By user
buildUserTableRows(calculated, children, timeEntries);

// By child request
buildChildRequestTableRows(parents, children, calculated, timeEntries);

// By parent request
buildParentRequestTableRows(calculated);

// By project
buildParentProjectGroupTableRows(parents, children, calculated, timeEntries);
```

### Apply filters

```typescript
const filtered = filterParentGroupedRows(groupedRows, {
  resultStatus: "loss", // Only losses
  riskLevel: "high", // Only high risk
  onlyDeviationOver20: true, // Only >20% deviation
  user: ["Juan", "Pedro"], // Only specific users
  role: ["Desarrollador"], // Only specific roles
});
```

### Calculate HBS for an entry

```typescript
const profile = getCollaboratorProfile("Juan Manuel Lineros Fernández");
// profile = "AS"

const ratio = getHbsRatioByProfile(profile);
// ratio = 1.18

const consumedHbs = 8 * ratio;
// consumedHbs = 9.44
```

### Get company-filtered data

```typescript
// Enrich time entries with company
const enriched = assignCompanyToTimeEntries(
  timeEntries,
  SOPRA_STERIA_COLLABORATORS,
);

// Filter by company
const filtered = filterTimeEntriesByCompany(enriched, "Sopra Steria");

// Get available companies
const companies = getUniqueCompaniesFromTimeEntries(enriched);
```

---

## State Management Pattern

### Store Architecture

```typescript
// 1. Raw state (from CSV)
parents: ParentRequest[]
children: ChildRequest[]
timeEntries: TimeEntry[]

// 2. Calculated state
calculatedRequests: CalculatedRequest[]
orphanTimeEntries: OrphanTimeEntry[]
summary: DashboardSummary

// 3. Company filtering
selectedCompanyFilter: string | null

// 4. Computed (auto-updates)
enrichedTimeEntries         // timeEntries + companyName
filteredTimeEntries         // filtered by company
filteredCalculatedRequests  // filtered results
filteredSummary             // filtered totals
```

### Data Load Sequence

```
1. User uploads parent CSV → loadParents()
   └─ normalize → store.parents ✓
   └─ recalculate() ← called

2. User uploads child CSV → loadChildren()
   └─ normalize → store.children ✓
   └─ recalculate() ← called

3. User uploads time entries CSV → loadTimeEntries()
   └─ normalize → store.timeEntries ✓
   └─ enrichCompany() ← automatic
   └─ recalculate() ← called
   └─ buildCalculatedRequests() ✓
   └─ calculateDashboardSummary() ✓

4. User changes company filter → setCompanyFilter()
   └─ filteredTimeEntries ← automatic recompute
   └─ filteredCalculatedRequests ← automatic recompute
   └─ filteredSummary ← automatic recompute
```

---

## Risk Level & Result Status Definitions

### Risk Level (based on differenceHours)

```typescript
HIGH:    differenceHours < -20    (severe overrun: >20h over budget)
MEDIUM:  differenceHours < -5     (moderate overrun: 5-20h over budget)
LOW:     otherwise                (acceptable)
```

### Result Status (based on differenceHours)

```typescript
PROFIT:  differenceHours > 0      (finished under budget)
LOSS:    differenceHours < 0      (overran budget)
NEUTRAL: differenceHours = 0      (exactly on budget)
```

### HBS Result Status (inverted - based on differenceHbs)

```typescript
LOSS:    differenceHbs > 0        (consumed more than estimated)
PROFIT:  differenceHbs < 0        (consumed less than estimated)
NEUTRAL: differenceHbs = 0        (exactly matching)
```

---

## HBS Profile Ratios

| Profile | Name                   | Ratio |
| ------- | ---------------------- | ----- |
| GP      | Gestor de proyecto     | 1.69  |
| CD      | Consultor digital      | 1.49  |
| AN      | Analista de negocio    | 1.16  |
| ARQ     | Arquitecto de sistemas | 1.33  |
| AS      | Analista de sistemas   | 1.18  |
| DE      | Desarrollador          | 1.0   |

---

## Chart Components Quick Reference

| Component                  | Input                   | Output                  | Status          |
| -------------------------- | ----------------------- | ----------------------- | --------------- |
| ChartTotalSummary          | CalculatedRequest[]     | Stats cards + 3 charts  | ✓ Rendered      |
| ChartDeviationRanges       | CalculatedRequest[]     | Bar chart by ranges     | ✓ Rendered      |
| ChartRiskMatrix            | ParentGroupedTableRow[] | Scatter/bubble chart    | ⚠ Commented out |
| ChartDeviationDistribution | ParentGroupedTableRow[] | Histogram               | ⚠ Commented out |
| ChartEstimatedVsDedicated  | ?                       | Bar chart               | ⚠ Commented out |
| ChartHbsConsumption        | ?                       | HBS comparison          | ⚠ Commented out |
| ChartTopLosses             | CalculatedRequest[]     | Top 10 losses bar chart | ✓ Available     |
| ChartHoursByPerson         | TimeEntry[]             | Hours by person         | ✓ Available     |
| ChartHoursByApp            | TimeEntry[]             | Hours by application    | ✓ Available     |

---

## Debugging Tips

### To check raw data

```typescript
console.log(store.parents); // Raw parents
console.log(store.children); // Raw children
console.log(store.timeEntries); // Raw time entries
```

### To check calculations

```typescript
console.log(store.calculatedRequests); // Individual request metrics
console.log(store.filteredSummary); // Dashboard totals
console.log(store.orphanTimeEntries); // Unresolved entries
```

### To check company filtering

```typescript
console.log(store.enrichedTimeEntries); // With company field
console.log(store.filteredTimeEntries); // Filtered
console.log(store.availableCompanies); // Unique companies
console.log(store.selectedCompanyFilter); // Current filter
```

### To debug aggregations

```typescript
// Trace user resolution
const te = store.timeEntries[0]
const parent = resolveParentId(te, parentMap, childMap)

// Trace HBS calculation
const profile = getCollaboratorProfile(te.user)
const ratio = getHbsRatioByProfile(profile)
const hbs = te.hours * ratio

// Trace grouping
const grouped = buildParentGroupedTableRows(...)
console.log(grouped[0].children)  // See child breakdown
console.log(grouped[0].children[0].userRoleHours)  // See user/role summary
```

---

## Common Issues & Solutions

### Issue: "Cannot read property 'xxx' of undefined"

**Likely cause:** Data not loaded yet
**Solution:** Check `store.hasData` before rendering; guard with `v-if`

### Issue: Orphan time entries appearing

**Likely cause:** petitionId/parentTaskId not matching any parent/child
**Solution:** Check time entry references; verify parent/child IDs are correct

### Issue: HBS values all 0

**Likely cause:** User names don't match COLLABORATORS map exactly
**Solution:** Check for spelling/capitalization; add users to hbs.ts COLLABORATORS

### Issue: Company filter not working

**Likely cause:** User not in SOPRA_STERIA_COLLABORATORS list
**Solution:** Add user to companies.ts SOPRA_STERIA_COLLABORATORS

### Issue: Charts not rendering

**Likely cause:** Empty data array or render flag not set
**Solution:** Check `requests.length > 0`; check `renderCharts` ref

### Issue: Performance slow with large datasets

**Likely cause:** Recalculating too frequently or inefficient re-renders
**Solution:** Use memoization; batch CSV loads; limit filter recomputes

---

## Performance Benchmarks

| Operation                   | Data Size           | Time (est.) |
| --------------------------- | ------------------- | ----------- |
| Parse 1000 parents          | 1000 rows           | ~50ms       |
| Parse 2000 children         | 2000 rows           | ~100ms      |
| Parse 5000 time entries     | 5000 rows           | ~200ms      |
| buildCalculatedRequests     | 1000/2000/5000      | ~300ms      |
| calculateDashboardSummary   | 1000 requests       | ~10ms       |
| buildParentGroupedTableRows | 1000 requests       | ~400ms      |
| filterParentGroupedRows     | 1000 rows + filters | ~50ms       |

---

## Version Info

- **Vue**: 3.x with `<script setup>`
- **TypeScript**: Strict mode
- **State**: Pinia (useDashboardStore)
- **CSV parsing**: PapaParse
- **Charts**: ECharts with Vue-ECharts
- **UI**: PrimeVue
- **Package manager**: npm

---

## Links to Key Sections

| Need                            | Location                               |
| ------------------------------- | -------------------------------------- |
| Data structure overview         | CODEBASE_EXPLORATION_SUMMARY.md § 1    |
| Data flow diagram               | CODEBASE_DATA_FLOW_DIAGRAMS.md         |
| Aggregation functions reference | AGGREGATION_UTILITIES_REFERENCE.md     |
| Chart implementation            | src/components/dashboard/charts/\*.vue |
| Store logic                     | src/stores/dashboard.ts                |
| Domain logic                    | src/domain/\*.ts                       |

---

## Next Steps

### To add a new chart:

1. Create builder in `src/domain/chartsData.ts` or `src/domain/tableAggregations.ts`
2. Create Vue component in `src/components/dashboard/charts/`
3. Import and render in `src/components/ChartsTab.vue`
4. Pass data from store

### To add a new table view:

1. Create builder function in `src/domain/tableAggregations.ts`
2. Create table component or use PrimeVue DataTable
3. Add to appropriate view (TablesView.vue)

### To modify filtering:

1. Update `ParentGroupedTableFilters` interface in `src/domain/parentGroupedTable.ts`
2. Add filter logic in `filterParentGroupedRows()`
3. Update table UI to expose new filter option

### To add company support:

1. Add collaborators to `src/domain/companies.ts` SOPRA_STERIA_COLLABORATORS
2. Add profiles to `src/domain/hbs.ts` HBS_PROFILES if needed
3. Filter logic automatically cascades

---

## Files Created from This Analysis

1. **CODEBASE_EXPLORATION_SUMMARY.md** - Comprehensive overview
2. **CODEBASE_DATA_FLOW_DIAGRAMS.md** - Visual diagrams of data flow
3. **AGGREGATION_UTILITIES_REFERENCE.md** - Detailed aggregation function docs
4. **QUICK_REFERENCE.md** (this file) - Quick lookup guide
