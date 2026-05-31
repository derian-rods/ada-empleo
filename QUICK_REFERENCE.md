# CCV Dashboard - Quick Reference Guide

## 1. PROJECT QUICK FACTS

| Item                 | Value                              |
| -------------------- | ---------------------------------- |
| **Project Name**     | CCV Dashboard                      |
| **Type**             | Vue 3 SPA - CSV Analysis Dashboard |
| **Language**         | TypeScript                         |
| **Build Tool**       | Vite                               |
| **State Management** | Pinia                              |
| **UI Framework**     | PrimeVue 4.5.5                     |
| **Charts**           | ECharts                            |
| **CSV Parser**       | PapaParse                          |
| **Deployment**       | Static build (vite build)          |
| **Dev Server Port**  | 5174                               |

---

## 2. FILE DIRECTORY QUICK LOOKUP

### Business Logic (`src/domain/`)

```
types.ts                    → Data interfaces (ParentRequest, ChildRequest, etc)
calculations.ts            → KPI calculations (totals, averages)
relationships.ts           → Parent-child-time entry linking
normalizeCsv.ts           → CSV row → domain object conversion
csvUtils.ts               → Spanish number parsing, ID extraction
chartsData.ts             → Risk matrix & deviation data builders
tableAggregations.ts      → Table row builders (user, parent, child, project)
parentGroupedTable.ts     → Hierarchical table + filtering logic
```

### State Management (`src/stores/`)

```
dashboard.ts              → Main store (data loading, CSV processing)
theme.ts                  → Theme store (light/dark mode)
```

### Components (`src/components/`)

```
AppLayout.vue             → Root layout with toolbar
CsvUploadPanel.vue        → CSV upload interface
TabsView.vue              → 4-tab main container

dashboard/
  tables/
    ParentGroupedRequestsTable.vue    → Main filtered table
    ChildRequestsTable.vue
    ParentRequestsTable.vue
    UsersTable.vue
    ParentProjectGroupTable.vue
  charts/
    ChartRiskMatrix.vue               → Scatter plot
    ChartDeviationDistribution.vue    → Histogram

SummaryTab.vue            → KPI cards
ChartsTab.vue             → Chart container
DashboardKpis.vue         → KPI grid (alternative)
OrphanTimeEntriesPanel.vue → Orphan time entries
```

### Configuration (`src/`)

```
theme/preset.ts           → PrimeVue theme colors (light/dark)
style.css                 → Global CSS
main.ts                   → Vue app setup
router.ts                 → Vue Router (configured but unused)
```

### Tests (`src/tests/`)

```
calculations.test.ts, relationships.test.ts, csvUtils.test.ts,
normalizeCsv.test.ts, tableAggregations.test.ts,
parentGroupedTable.test.ts
```

---

## 3. CORE CONCEPTS AT A GLANCE

### The Three CSV Files

| CSV                  | Purpose                  | Key Column              | Links Via                   |
| -------------------- | ------------------------ | ----------------------- | --------------------------- |
| **Peticiones Padre** | Parent projects/requests | `#` (ID)                | ID field                    |
| **Peticiones Hijas** | Sub-tasks under parents  | `#` (ID), `Tarea padre` | Parent ID                   |
| **Tiempo Dedicado**  | Hours logged by team     | `Horas` (required)      | `Petición` or `Tarea padre` |

### Key Metrics

| Metric              | Formula                                  | Meaning                                         |
| ------------------- | ---------------------------------------- | ----------------------------------------------- |
| **Estimated Hours** | Child sum OR parent value                | How long we thought it would take               |
| **Actual Hours**    | Σ(time entries)                          | How long it actually took                       |
| **Difference**      | Estimated - Actual                       | Positive = under budget, Negative = over        |
| **Deviation %**     | ((Actual - Estimated) / Estimated) × 100 | Percent over/under budget                       |
| **Consumption %**   | (Actual / Estimated) × 100               | Percent of budget used                          |
| **Risk Level**      | Based on Difference                      | high (< -20h), medium (-5 to -20h), low (≥ -5h) |
| **Result Status**   | Based on Difference                      | profit (> 0), loss (< 0), neutral (= 0)         |

### Status Colors

| Status      | Color   | Severity               |
| ----------- | ------- | ---------------------- |
| **Profit**  | Green ✓ | Good - finished early  |
| **Loss**    | Red ✗   | Bad - went over budget |
| **Neutral** | Gray    | Exact match            |

### Risk Levels

| Level      | Color  | Meaning                   |
| ---------- | ------ | ------------------------- |
| **Low**    | Green  | On budget or under budget |
| **Medium** | Orange | 5-20 hours over budget    |
| **High**   | Red    | 20+ hours over budget     |

---

## 4. DATA FLOW CHEAT SHEET

```
User Uploads CSV
    ↓
CsvUploadPanel calls: store.loadParents/Children/TimeEntries(file)
    ↓
Store Action: parseCsvFile → normalizeData → updateStatus
    ↓
When all 3 loaded: store.recalculate()
    ├─ buildCalculatedRequests()
    │  └─ Links parents → children → time entries
    │     Calculates metrics for each parent
    │     Identifies orphan time entries
    └─ calculateDashboardSummary()
       └─ Aggregates metrics across all parents
    ↓
Computed Properties Trigger:
    ├─ SummaryTab: Shows DashboardSummary KPIs
    ├─ ParentGroupedRequestsTable: Shows hierarchical data with filters
    ├─ ChartRiskMatrix: Scatter plot of parents
    ├─ ChartDeviationDistribution: Histogram of deviation ranges
    └─ OrphanTimeEntriesPanel: Lists unlinked time entries
```

---

## 5. FILTERING QUICK REFERENCE

### Available Filters (ParentGroupedRequestsTable)

**Parent Level:**

- Code (text search)
- Subject (text search)
- Project (dropdown)
- Application (multi-select)
- Status (dropdown)
- Result Status (profit/loss/neutral)
- Risk Level (low/medium/high)

**Child Level:**

- Code (text search)
- Subject (text search)

**User/Role Level:**

- User (multi-select)
- Role (multi-select)
- Activity (multi-select)

**Special Filters:**

- Only Losses (checkbox)
- Only Deviation > 20% (checkbox)
- Only Consumption > 100% (checkbox)

### Filter Behavior

- Filters are **AND** logic within a level
- Child filters: Must have matching children to show parent
- User/Role/Activity: Aggregate from matching timeEntries
- Clicking "Clear Filters" resets all and collapses expanded rows

---

## 6. THEME CUSTOMIZATION

### Light Mode Colors (Default)

- Background: `#f0f7ff` (light blue)
- Text: Dark
- Primary: Blue 600
- Success: Emerald 500
- Danger: Red 500

### Dark Mode Colors

- Background: `#030712` (very dark)
- Text: Light/White
- Primary: Blue 400
- Success: Emerald 400
- Danger: Red 400

### To Customize Colors

Edit `src/theme/preset.ts`:

```typescript
// Light mode surfaces (line 33-45)
surface: {
  50: "#f0f7ff",  // ← Change here
  // ...
}

// Dark mode surfaces (line 80-92)
surface: {
  950: "#030712", // ← Change here
  // ...
}
```

**No CSS files to edit** - all via PrimeVue design tokens!

---

## 7. COMMON OPERATIONS

### Loading Data

```typescript
// User selects file in UI → triggers:
store.loadParents(file);
store.loadChildren(file);
store.loadTimeEntries(file);

// Each action:
// 1. Sets status to 'loading'
// 2. Parses CSV with PapaParse
// 3. Validates required columns
// 4. Normalizes data
// 5. Sets status to 'success' or 'error'
// 6. Calls recalculate() if all data loaded
```

### Viewing Grouped Table

```typescript
// Automatically builds from computed property:
const groupedRows = computed(() =>
  buildParentGroupedTableRows(
    parents,
    children,
    timeEntries,
    calculatedRequests,
  ),
);

// Then applies user filters:
const filteredRows = computed(() =>
  filterParentGroupedRows(groupedRows.value, filters.value),
);

// DataTable displays filteredRows with:
// - Parent rows (expandable)
// - Child rows (nested)
// - UserRoleHours breakdown
```

### Creating Charts

```typescript
// In ChartsTab.vue:
const groupedRows = computed(() =>
  buildParentGroupedTableRows(...)
)

// Risk Matrix:
const chartData = computed(() =>
  buildRiskMatrixData(groupedRows.value)
)

// Deviation Distribution:
const deviationBuckets = computed(() =>
  buildDeviationDistribution(groupedRows.value)
)

// ECharts renders based on computed data
```

### Clearing Data

```typescript
// User clicks "Vaciar datos" button → triggers:
store.reset();

// This clears:
// - All data arrays
// - All flags and statuses
// - Errors and warnings
// - Hide TabsView
```

---

## 8. COMMAND REFERENCE

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server (localhost:5174)
npm run build           # Production build
npm run preview         # Preview production build

# Testing
npm run test            # Run Vitest

# Type Checking
vue-tsc -b              # Check all TypeScript

# Git Workflow
git log --oneline       # View commits
git status              # Check changes
git diff                # View detailed changes
git add .               # Stage all changes
git commit -m "..."     # Commit with message
git checkout -b feat/... # Create new branch
git push origin feat/... # Push to remote
```

---

## 9. DEBUGGING TIPS

### Browser Console

```javascript
// Check store state:
console.log(store.calculatedRequests)
console.log(store.summary)
console.log(store.orphanTimeEntries)

// Check what filters are applied:
console.log(filters.value)

// Check grouped rows before filtering:
console.log(buildParentGroupedTableRows(...))
```

### Vue DevTools

- Inspect component state (props, data, computed)
- Watch computed property updates
- Track event emissions
- Check Pinia store mutations

### Network Tab

- Check CSV files being uploaded
- File size and upload time
- Response status codes

### Performance Tab

- Monitor UI freezing during CSV processing
- Check computation time for large datasets
- Verify async operations yielding to UI

---

## 10. ARCHITECTURE PATTERNS

### Pinia Store Actions

```typescript
async loadParents(file: File) {
  updateCsvStatus('parents', { status: 'loading' })
  await allowUIUpdate()  // Yield to UI
  try {
    const rows = await parseCsvFile(file)
    // Validate, normalize, store
    await recalculate()
  } catch (e) {
    // Handle error
  }
}
```

### Computed Derived Data

```typescript
// Computed properties automatically:
// - Track dependencies
// - Memoize results
// - Update on dependency change

const groupedRows = computed(() =>
  buildParentGroupedTableRows(
    parents, // dependency 1
    children, // dependency 2
    timeEntries, // dependency 3
    calculatedRequests, // dependency 4
  ),
);
// If any dependency changes → recomputes automatically
```

### Reactive Filter Application

```typescript
// User interacts with filter UI
filters.value.parentCode = "SOL-";

// Computed instantly re-runs:
const filtered = computed(() =>
  filterParentGroupedRows(groupedRows.value, filters.value),
);

// Table reactively updates with new filtered data
```

### TypeScript Type Safety

```typescript
// Store, components, and domain logic all typed:
const calculatedRequests: CalculatedRequest[] = [];
const orphanTimeEntries: OrphanTimeEntry[] = [];
const summary: DashboardSummary | null = null;

// Compile-time errors for type mismatches
// IDE autocomplete and type hints everywhere
```

---

## 11. KEY FORMULAS

```typescript
// DEVIATION %
deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100;

// CONSUMPTION %
consumptionPercent = (actualHours / estimatedHours) * 100;

// DIFFERENCE
differenceHours = estimatedHours - actualHours;

// RESULT STATUS
if (differenceHours > 0) resultStatus = "profit";
else if (differenceHours < 0) resultStatus = "loss";
else resultStatus = "neutral";

// RISK LEVEL
if (differenceHours < -20) riskLevel = "high";
else if (differenceHours < -5) riskLevel = "medium";
else riskLevel = "low";

// DASHBOARD TOTALS
totalEstimatedHours = Σ(parent.estimatedHours);
totalActualHours = Σ(parent.actualHours);
totalDifferenceHours = totalEstimatedHours - totalActualHours;
averageDeviationPercent = mean(parent.deviationPercent);
```

---

## 12. COMMON ISSUES & SOLUTIONS

| Issue                 | Cause                      | Solution                             |
| --------------------- | -------------------------- | ------------------------------------ |
| CSV not loading       | Wrong delimiter (not `;`)  | Check CSV file format                |
| Missing column error  | Column not in CSV          | Verify CSV structure                 |
| No data appears       | Time entries not loading   | Check "Horas" column exists          |
| Orphan time entries   | Can't link to parent/child | Check Petición/Tarea padre values    |
| UI freezes            | Processing large dataset   | Already handled by `allowUIUpdate()` |
| Wrong theme on reload | Theme not persisted        | Check localStorage in DevTools       |
| Filters not working   | Filter value type mismatch | Check filter.value types             |
| Charts not rendering  | Tab not mounted yet        | Charts lazy-render on tab click      |

---

## 13. CSV COLUMN MAPPING

### Peticiones Padre CSV

```
# → ParentRequest.id / .code
Proyecto → .project
Tracker de peticiones → .tracker
Asunto → .subject
Horas estimadas / Total de Tiempo Estimado / Tiempo estimado → .estimatedHours
Estado → .status
Prioridad → .priority
Autor → .author
Asignado a → .assignee
Versión prevista → .version
Aplicación → .application
```

### Peticiones Hijas CSV

```
# → ChildRequest.id / .code
Tarea padre → .parentId
Proyecto → .project
Tracker de peticiones → .tracker
Asunto → .subject
Horas estimadas / profile hours → .estimatedHours
Coste sin IVA → .costWithoutVat
Categoría → .category
Estado → .status
Aplicación → .application
(+ other parent-like columns)
```

### Tiempo Dedicado CSV

```
Petición → TimeEntry.petitionId / .petitionRaw
Tarea padre → TimeEntry.parentTaskId / .parentTaskRaw
Horas → .hours (REQUIRED)
Usuario → .user
Actividad → .activity
Fecha → .date
Semana → .week
Proyecto → .project
Perfil (perfilado) → .profiledRole
Perfil (CAU in-situ) → .cauRole
Aplicación → .application
Estado → .status
Categoría → .category
Versión prevista → .version
Comentario → .comment
```

---

## 14. ENTITY RELATIONSHIP SUMMARY

```
ParentRequest
├─ id (unique)
├─ code (same as id)
├─ subject
├─ estimatedHours (aggregated from children)
├─ ...
└─ 1:Many → ChildRequest via ChildRequest.parentId

ChildRequest
├─ id (unique)
├─ code
├─ parentId → ParentRequest.id
├─ subject
├─ estimatedHours
├─ costWithoutVat
├─ ...
└─ 1:Many → TimeEntry via TimeEntry.petitionId

TimeEntry
├─ id (unique per time entry)
├─ petitionId (→ ChildRequest.id)
├─ parentTaskId (→ ParentRequest.id or ChildRequest.id)
├─ hours
├─ user
├─ activity
├─ profiledRole / cauRole
├─ application
└─ → ParentRequest (resolved via 4-step algorithm)
```

---

## 15. KEY IMPORTS BY COMPONENT

### Components Using Store

```typescript
import { useDashboardStore } from "../stores/dashboard";
import { useThemeStore } from "../stores/theme";

const store = useDashboardStore();
const themeStore = useThemeStore();
```

### Domain Functions

```typescript
import { buildCalculatedRequests } from "../domain/relationships";
import { calculateDashboardSummary } from "../domain/calculations";
import {
  buildParentGroupedTableRows,
  filterParentGroupedRows,
} from "../domain/parentGroupedTable";
import {
  buildRiskMatrixData,
  buildDeviationDistribution,
} from "../domain/chartsData";
```

### Types

```typescript
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
  OrphanTimeEntry,
  DashboardSummary,
} from "../domain/types";
```

---

## 16. PERFORMANCE GUIDELINES

### Do's ✓

- Use `computed()` for derived data
- Use `ref()` for mutable state
- Call `allowUIUpdate()` between processing steps
- Use DataTable pagination (not large DOM)
- Lazy-render charts on tab activation

### Don'ts ✗

- Don't do expensive calculations in templates
- Don't create large DOM trees without pagination
- Don't block the main thread for extended periods
- Don't re-parse CSV unnecessarily
- Don't re-build grouped data on every filter change (use computed)

---

## 17. QUICK SETUP CHECKLIST

- [ ] `npm install` - Install dependencies
- [ ] `npm run dev` - Start dev server
- [ ] Open http://localhost:5174
- [ ] Prepare 3 CSV files with correct structure
- [ ] Upload parents CSV → see "OK" tag
- [ ] Upload children CSV → see "OK" tag
- [ ] Upload time entries CSV → UI tabs activate
- [ ] Click "Tabla de Peticiones" to see grouped data
- [ ] Click "Gráficas" to see charts
- [ ] Test filters by clicking "Código padre" filter
- [ ] Click theme toggle (moon/sun) to test dark mode

---

## 18. RESOURCES

- **Vue 3 Docs**: https://vuejs.org/
- **TypeScript Docs**: https://www.typescriptlang.org/
- **Vite Docs**: https://vitejs.dev/
- **Pinia Docs**: https://pinia.vuejs.org/
- **PrimeVue Docs**: https://primevue.org/
- **ECharts Docs**: https://echarts.apache.org/
- **PapaParse Docs**: https://www.papaparse.com/

---

## 19. GIT WORKFLOW BASICS

```bash
# View history
git log --oneline -10

# Check status
git status

# View changes
git diff

# Stage & commit
git add .
git commit -m "Feature: Add new metric calculation"

# Create feature branch
git checkout -b feature/my-feature

# Switch branch
git checkout main

# Push to remote
git push origin feature/my-feature

# Pull latest
git pull origin main
```

---

## 20. QUICK LINKS IN CODEBASE

| Need                  | Go To                                                |
| --------------------- | ---------------------------------------------------- |
| Add calculation logic | `src/domain/calculations.ts`                         |
| Add new table column  | `src/domain/tableAggregations.ts` or table component |
| Change colors         | `src/theme/preset.ts`                                |
| Add filter option     | `src/domain/parentGroupedTable.ts`                   |
| Debug data            | `src/stores/dashboard.ts` (inspect state)            |
| Fix chart             | `src/components/dashboard/charts/*.vue`              |
| Add validation        | `src/domain/normalizeCsv.ts`                         |
| Test logic            | `src/tests/*.test.ts`                                |

---

**Last Updated**: May 31, 2026  
**Version**: 1.0  
**Status**: ✓ Complete & Ready for Development
