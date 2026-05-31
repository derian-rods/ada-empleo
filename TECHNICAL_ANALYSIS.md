# CCV Dashboard - Comprehensive Technical Analysis

**Project**: CSV Dashboard for Request and Time Analysis  
**Framework**: Vue 3 + TypeScript + Vite  
**State Management**: Pinia  
**UI Library**: PrimeVue 4.5.5  
**Charts**: ECharts via vue-echarts  
**CSV Parsing**: PapaParse  
**Analysis Date**: May 31, 2026

---

## 1. PROJECT STRUCTURE OVERVIEW

### Directory Layout

```
ccv-dashboard/
├── src/
│   ├── components/              # Vue UI components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── charts/         # Chart components (Risk Matrix, Deviation)
│   │   │   └── tables/         # Table components (grouped, parent, child, user)
│   │   ├── AppLayout.vue       # Main layout with toolbar
│   │   ├── CsvUploadPanel.vue  # CSV file upload interface
│   │   ├── TabsView.vue        # Main tab navigation
│   │   ├── SummaryTab.vue      # KPI summary display
│   │   ├── ChartsTab.vue       # Charts container
│   │   ├── DashboardKpis.vue   # KPI cards
│   │   ├── OrphanTimeEntriesPanel.vue  # Orphan entries display
│   │   └── MainNav.vue         # Navigation
│   ├── domain/                 # Business logic & data processing
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── calculations.ts     # KPI calculations
│   │   ├── relationships.ts    # Parent-child-time entry mapping
│   │   ├── normalizeCsv.ts     # CSV data normalization
│   │   ├── csvUtils.ts         # CSV parsing utilities
│   │   ├── chartsData.ts       # Chart data builders
│   │   ├── tableAggregations.ts # Table row builders
│   │   └── parentGroupedTable.ts # Grouped table logic & filters
│   ├── stores/                 # Pinia state management
│   │   ├── dashboard.ts        # Main dashboard state
│   │   └── theme.ts            # Theme/dark mode state
│   ├── services/               # Service layer
│   │   └── csvWorkerService.ts # Web Worker CSV parsing
│   ├── composables/            # Vue composables
│   │   └── useTheme.ts         # Theme composable (legacy)
│   ├── workers/                # Web Workers
│   │   └── csvWorker.ts        # CSV parsing in background thread
│   ├── theme/                  # Styling & theming
│   │   └── preset.ts           # PrimeVue theme configuration
│   ├── styles/                 # Additional styles
│   ├── views/                  # Page-level components
│   │   ├── DashboardView.vue   # Main dashboard view
│   │   ├── TablesView.vue      # Standalone tables view
│   │   └── ChartsView.vue      # Standalone charts view
│   ├── tests/                  # Unit tests with Vitest
│   ├── App.vue                 # Root component
│   ├── main.ts                 # Entry point
│   ├── router.ts               # Vue Router configuration
│   └── style.css               # Global styles
├── public/                     # Static assets
├── package.json               # Dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── index.html                 # HTML entry point
└── README.md                  # Project documentation
```

---

## 2. DATA FLOW & PIPELINE

### 2.1 CSV Input Requirements

The dashboard requires 3 CSV files with semicolon (`;`) delimiter and UTF-8 encoding:

#### A. **Peticiones Padre (Parent Requests)**

- **Required Column**: `#` (ID)
- **Key Columns**:
  - `Asunto` (Subject/Title)
  - `Horas estimadas` or `Total de Tiempo Estimado` or profile hour columns
  - `Proyecto` (Project)
  - `Aplicación` (Application)
  - `Estado` (Status)
  - `Tracker de peticiones`
- **Profile Hour Columns** (alternatives for estimated hours):
  - `Horas JP`, `Horas CS`, `Horas AF`, `Horas AS / ES`, `Horas AP / TS`, `Horas P`

#### B. **Peticiones Hijas (Child Requests)**

- **Required Column**: `#` (ID)
- **Key Columns**:
  - `Tarea padre` (Parent ID - links to parent)
  - `Asunto` (Subject)
  - `Horas estimadas` / profile hours
  - `Coste sin IVA` (Cost without VAT)
  - `Aplicación` (Application)

#### C. **Tiempo Dedicado (Time Entries)**

- **Required Columns**:
  - `Horas` (Hours - **mandatory** for load success)
  - `Petición` (Child request ID - optional but recommended)
- **Key Columns**:
  - `Tarea padre` (Parent ID)
  - `Usuario` (User)
  - `Actividad` (Activity)
  - `Fecha` (Date)
  - `Perfil (perfilado)` (Profiled Role)
  - `Perfil (CAU in-situ)` (CAU Role)
  - `Aplicación` (Application)

### 2.2 Data Processing Pipeline

```
CSV Files (uploaded)
    ↓
[CsvUploadPanel component triggers]
    ↓
[Dashboard Store - Main Thread]
    ├── parseCsvFile() → PapaParse with UTF-8, `;` delimiter
    ├── Validation checks (# column exists)
    ├── allowUIUpdate() → yield to UI thread
    ↓
[Normalization Functions]
    ├── normalizeParentRequests()
    │   └── Extract & clean parent data, parse estimated hours
    ├── normalizeChildRequests()
    │   └── Extract & clean child data, parse estimated hours & cost
    ├── normalizeTimeEntries()
    │   └── Extract & clean time entry data
    ├── allowUIUpdate() → yield to UI thread
    ↓
[Store: Raw Normalized Data]
    ├── parents: ParentRequest[]
    ├── children: ChildRequest[]
    ├── timeEntries: TimeEntry[]
    ├── allowUIUpdate() → yield to UI thread
    ↓
[Business Logic - Relationships & Calculations]
    ├── buildCalculatedRequests()
    │   ├── Create parent→child mappings
    │   ├── Create parent→timeEntries mappings
    │   ├── For each parent:
    │   │   ├── Calculate estimatedHours (children sum OR parent value)
    │   │   ├── Calculate actualHours (timeEntries sum)
    │   │   ├── Calculate differenceHours & deviationPercent
    │   │   ├── Determine resultStatus (profit/loss/neutral)
    │   │   ├── Aggregate: people, activities, roles, applications
    │   │   └── Return CalculatedRequest[]
    │   └── Identify orphan time entries (not linked to any parent)
    ├── allowUIUpdate() → yield to UI thread
    ↓
[Store: Computed Results]
    ├── calculatedRequests: CalculatedRequest[]
    ├── orphanTimeEntries: OrphanTimeEntry[]
    ├── summary: DashboardSummary (KPI aggregates)
    ├── allowUIUpdate() → yield to UI thread
    ↓
[UI Components Ready]
    ├── TabsView displays 4 tabs:
    │   ├── Resumen (Summary KPIs)
    │   ├── Tabla de Peticiones (Grouped table)
    │   ├── Gráficas (Risk matrix & deviation charts)
    │   └── Tiempos Huérfanos (Orphan entries)
    └── All data reactive & reactive updates
```

### 2.3 Time Entry Resolution Logic

Time entries link to parents through 4-step resolution in `relationships.ts::resolveParentId()`:

```typescript
1. Check petitionId against childMap
   → If found as child, use child.parentId

2. If not found, check petitionId against parentMap directly
   → Use as direct parent match

3. Check parentTaskId against parentMap directly
   → Use as direct parent match

4. Check parentTaskId against childMap
   → If found as child, use child.parentId

If all fail → Mark as orphan time entry
```

### 2.4 Estimated Hours Resolution

In `normalizeCsv.ts::getEstimatedHours()`:

```typescript
For Children:
  1. Try sum of profile hour columns (Horas JP, CS, AF, etc.)
  2. If sum > 0, return it
  3. Otherwise, try "Total de Tiempo Estimado"
  4. Otherwise, try "Tiempo estimado"
  5. Default: 0

For Parents:
  1. Skip profile hours (useProfiles=false)
  2. Try "Total de Tiempo Estimado"
  3. Otherwise, try "Tiempo estimado"
  4. Default: 0
```

In `relationships.ts::buildCalculatedRequests()`:

```typescript
For each Parent Request:
  estimatedHours = max(
    sum(child.estimatedHours for all children),
    parent.estimatedHours
  )
  // Prefers aggregated child hours over parent estimate
```

---

## 3. CORE DATA MODELS

### 3.1 Type System (`domain/types.ts`)

```typescript
// Main domain entities:

ParentRequest {
  id: string                    // Unique identifier
  code: string                  // Same as ID
  subject: string              // Title/description
  project?: string             // Project name
  application?: string         // Application/module
  status?: string              // Current status
  estimatedHours: number       // Estimated effort
  // ... other metadata fields
}

ChildRequest {
  id: string
  parentId?: string            // Foreign key to parent
  subject: string
  estimatedHours: number
  costWithoutVat?: number      // Cost field
  // ... inherits parent-like fields
}

TimeEntry {
  id: string
  petitionId?: string          // Links to child request
  parentTaskId?: string        // Alternative link to parent/child
  user?: string                // Person who did the work
  hours: number                // Hours spent
  activity?: string            // Type of activity
  profiledRole?: string        // Role applied
  cauRole?: string             // CAU role applied
  application?: string
  date?: string
  // ... other metadata fields
}

OrphanTimeEntry extends TimeEntry {
  orphanReason: string         // Why it couldn't be linked
}

CalculatedRequest {
  parentId: string
  code: string
  subject: string

  // Metrics (core business logic)
  estimatedHours: number       // Calculated from children OR parent
  actualHours: number          // Sum of time entries
  differenceHours: number      // estimated - actual
  deviationPercent: number     // ((actual - estimated) / estimated) * 100
  resultStatus: 'profit' | 'loss' | 'neutral'
    // 'profit'  = differenceHours > 0 (finished under budget)
    // 'loss'    = differenceHours < 0 (went over budget)
    // 'neutral' = differenceHours === 0

  // Aggregations
  childrenCount: number        // Number of child requests
  timeEntriesCount: number     // Number of time entries
  peopleCount: number
  people: string[]             // Unique users who worked on it
  activities: string[]         // Unique activities
  roles: string[]              // Unique roles
  applications: string[]       // Unique applications
  costWithoutVat?: number      // Sum of child costs
}

DashboardSummary {
  totalEstimatedHours: number
  totalActualHours: number
  totalDifferenceHours: number
  averageDeviationPercent: number
  profitableRequests: number   // Count with resultStatus='profit'
  lossRequests: number         // Count with resultStatus='loss'
  neutralRequests: number      // Count with resultStatus='neutral'
  orphanTimeEntries: number
  totalPeople: number
  totalApplications: number
}

// Grouped table structures:

ParentGroupedTableRow {
  parentId: string
  // ... parent metadata

  // Metrics
  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  consumptionPercent: number   // (actual / estimated) * 100
  resultStatus: ResultStatus
  riskLevel: 'high' | 'medium' | 'low'  // Based on differenceHours

  // Children breakdown
  children: ChildRequestGroupedRow[]
  // ... aggregated user/role/activity lists
}

ChildRequestGroupedRow {
  childId: string
  childSubject: string
  // ... child metadata

  estimatedHours: number
  actualHours: number
  deviationPercent: number

  // Time entry breakdown by user + role
  userRoleHours: {
    user: string
    role: string
    hours: number
    activities: string[]
  }[]

  users: string[]
  roles: string[]
  activities: string[]
}
```

### 3.2 Risk Level Calculation

```typescript
// From parentGroupedTable.ts::calculateRiskLevel()

function calculateRiskLevel(differenceHours: number): RiskLevel {
  if (differenceHours < -20) return "high"; // Over 20h over budget
  if (differenceHours < -5) return "medium"; // 5-20h over budget
  return "low"; // On budget or under
}
```

### 3.3 Result Status Calculation

```typescript
// From relationships.ts::buildCalculatedRequests()

const differenceHours = estimatedHours - actualHours;
const resultStatus: ResultStatus =
  differenceHours > 0
    ? "profit" // Under budget
    : differenceHours < 0
      ? "loss" // Over budget
      : "neutral"; // On budget
```

---

## 4. BUSINESS LOGIC LAYER (`domain/`)

### 4.1 Key Calculations (`calculations.ts`)

```typescript
calculateDashboardSummary(calculatedRequests, orphanTimeEntries)
  ├── Sum of all estimatedHours
  ├── Sum of all actualHours
  ├── Difference: estimated - actual
  ├── Average deviation: mean of all deviationPercent values
  ├── Count profitable/loss/neutral requests
  ├── Collect unique people and applications
  └── Return DashboardSummary object
```

### 4.2 Relationships & Mapping (`relationships.ts`)

**Core Function**: `buildCalculatedRequests(parents, children, timeEntries)`

1. **Create Maps**:
   - parentMap: id → ParentRequest
   - childMap: id → ChildRequest

2. **Group Time Entries by Parent**:
   - For each time entry, resolve parent ID (4-step algorithm)
   - Group by resolved parentId
   - Collect orphans if unresolved

3. **Build Calculated Requests**:
   - For each parent:
     - Get associated children and time entries
     - Calculate metrics
     - Aggregate metadata
   - Return array of CalculatedRequest

### 4.3 Normalization (`normalizeCsv.ts`)

**Three normalization functions**:

```typescript
normalizeParentRequests(csvRows)
  ├── Filter rows with `#` column
  ├── Map CSV columns to ParentRequest properties
  ├── Extract issue IDs from text
  ├── Parse Spanish number format (comma decimals)
  └── Clean and trim text fields

normalizeChildRequests(csvRows)
  ├── Same as above, plus:
  ├── Extract parent ID from "Tarea padre" column
  ├── Use profile hours for estimated (useProfiles=true)
  └── Extract cost without VAT

normalizeTimeEntries(csvRows)
  ├── For each row:
  │   ├── Extract petition & parent IDs
  │   ├── Parse hours (required)
  │   └── Map to TimeEntry
  └── Generate unique IDs for time entries
```

### 4.4 Table Aggregations (`tableAggregations.ts`)

**Four builder functions**:

1. **buildUserTableRows(calculatedRequests, children, timeEntries)**
   - Aggregate time entries by user
   - Calculate total hours per user
   - Count parent/child requests per user
   - Separate profit vs. loss related hours
   - Return UserTableRow[]

2. **buildChildRequestTableRows(parents, children, calculatedRequests, timeEntries)**
   - For each child request:
     - Link to parent
     - Sum time entries
     - Calculate metrics
   - Return ChildRequestTableRow[]

3. **buildParentRequestTableRows(calculatedRequests)**
   - Map CalculatedRequest to table format
   - Return ParentRequestTableRow[]

4. **buildParentProjectGroupTableRows(parents, children, calculatedRequests, timeEntries)**
   - Group by parent.project
   - Aggregate metrics for each project
   - Return ParentProjectGroupTableRow[]

### 4.5 Grouped Table (`parentGroupedTable.ts`)

**Core Logic**: `buildParentGroupedTableRows()`

Creates a hierarchical structure:

- ParentGroupedTableRow (parent level)
  - Contains array of ChildRequestGroupedRow
    - Each child has userRoleHours breakdown (user + role + hours)

**Filtering**: `filterParentGroupedRows(rows, filters)`

Supports:

- Parent level: code, subject, project, application, status, resultStatus, riskLevel
- Child level: code, subject, user, role, activity
- Special filters: onlyLosses, onlyDeviationOver20%, onlyConsumptionOver100%

### 4.6 Chart Data Builders (`chartsData.ts`)

```typescript
buildRiskMatrixData(rows);
// Transform grouped rows to RiskMatrixPoint[] for scatter plot
// Points: (resultStatus, riskLevel) scatter with estimatedHours as size

buildDeviationDistribution(rows);
// Build histogram buckets:
// [< -50%, -50% to -20%, -20% to 0%, 0% to 20%, 20% to 50%, > 50%]
// Count rows in each bucket, calculate percentages
```

### 4.7 CSV Utilities (`csvUtils.ts`)

```typescript
parseCsvNumber(value);
// Spanish format: "1.234,50" → 1234.5
// Replace . with (thousands), , with . (decimal)

extractIssueId(value);
// Extract ID from: "OT #1078795: text" → "1078795"
// Or plain: "1082818.0" → "1082818"

cleanText(value);
// Trim whitespace, return undefined for empty
```

---

## 5. STATE MANAGEMENT (`stores/`)

### 5.1 Dashboard Store (`dashboard.ts`)

**Primary Pinia store** - manages all application data and CSV processing.

#### Raw Data (ref)

```typescript
parents: ParentRequest[]         // Normalized parent data
children: ChildRequest[]         // Normalized child data
timeEntries: TimeEntry[]         // Normalized time entry data
```

#### Computed Results (ref)

```typescript
calculatedRequests: CalculatedRequest[]   // Linked & calculated
orphanTimeEntries: OrphanTimeEntry[]      // Unlinked time entries
summary: DashboardSummary | null          // KPI aggregates
```

#### Status Tracking (ref)

```typescript
errors: string[]
warnings: string[]
parentsLoaded: boolean
childrenLoaded: boolean
timeEntriesLoaded: boolean
isCalculating: boolean

csvLoadStatus: {
  parents: { status, fileName, rowsCount, error }
  children: { status, fileName, rowsCount, error }
  timeEntries: { status, fileName, rowsCount, error }
}
```

#### Computed Flags

```typescript
hasData: boolean;
// true when parentsLoaded && timeEntriesLoaded

isProcessingCsv: boolean;
// true when any CSV is in 'loading' status

isProcessing: boolean;
// true when isProcessingCsv || isCalculating

allCsvsValid: boolean;
// true when all CSVs have 'success' status

canCalculate: boolean;
// Alias for allCsvsValid
```

#### Actions

**CSV Loading Actions**:

```typescript
async loadParents(file: File)
  ├── Update status to 'loading'
  ├── Parse CSV file with PapaParse
  ├── Validate: '#' column must exist
  ├── Normalize with normalizeParentRequests()
  ├── Update status to 'success'
  ├── Call recalculate()

async loadChildren(file: File)
  ├── Similar to loadParents()
  ├── Uses normalizeChildRequests()
  └── Calls recalculate()

async loadTimeEntries(file: File)
  ├── Similar to above
  ├── Validates 'Horas' column (required)
  ├── Warns if 'Petición' column missing
  ├── Uses normalizeTimeEntries()
  └── Calls recalculate()
```

**Calculation Action**:

```typescript
async recalculate()
  ├── Check if parents && timeEntries loaded
  ├── Set isCalculating = true
  ├── Build CalculatedRequest[] via buildCalculatedRequests()
  ├── Collect orphan time entries
  ├── Calculate DashboardSummary
  ├── Generate warnings (orphans, zero estimated but hours > 0)
  └── Set isCalculating = false
```

**Reset Action**:

```typescript
reset()
  ├── Clear all data arrays
  ├── Reset all flags and statuses
  ├── Clear errors and warnings
```

**Helper Methods**:

```typescript
parseCsvFile(file: File)
  // Promise-based wrapper around PapaParse
  // Delimiter: ';'
  // Encoding: UTF-8
  // Skips empty lines

allowUIUpdate()
  // Returns Promise that resolves after setTimeout(0)
  // Allows browser to update UI between processing steps

updateCsvStatus(kind, updates)
  // Helper to update csvLoadStatus without deprecation warnings
```

### 5.2 Theme Store (`theme.ts`)

**Pinia store** - manages light/dark mode.

#### State

```typescript
isDark: ref<boolean>; // Current theme
```

#### Computed

```typescript
isLight: computed; // !isDark
```

#### Actions

```typescript
loadTheme()
  ├── Check localStorage for saved theme
  ├── If saved ('dark' or 'light'), use it
  ├── Otherwise, detect system preference
  ├── Apply theme

applyTheme()
  ├── Add/remove 'app-dark' class on document.documentElement
  ├── Save preference to localStorage

toggleTheme()
  ├── Toggle isDark
  ├── Call applyTheme()
```

**PrimeVue Integration**:

- `main.ts` configures PrimeVue with `darkModeSelector: '.app-dark'`
- When 'app-dark' class exists, PrimeVue applies dark theme

---

## 6. STORE/STATE FLOW

```
App.vue (Root)
  ├── onMounted() → themeStore.loadTheme()
  │
  ├── AppLayout (Layout wrapper)
  │   ├── Toolbar (theme toggle, reset button)
  │   ├── CsvUploadPanel
  │   │   ├── FileUpload (3x) → store.load*()
  │   │   ├── Error/Warning messages
  │   │   └── Processing indicator
  │   │
  │   └── TabsView (if store.hasData)
  │       ├── SummaryTab
  │       │   └── DashboardKpis (displays store.summary)
  │       │
  │       ├── DashboardTablesTabs
  │       │   └── ParentGroupedRequestsTable
  │       │       ├── Builds: buildParentGroupedTableRows()
  │       │       ├── Filters: filterParentGroupedRows()
  │       │       └── Displays: hierarchical table with nested children
  │       │
  │       ├── ChartsTab
  │       │   ├── Builds: buildParentGroupedTableRows()
  │       │   ├── ChartRiskMatrix (scatter + bar)
  │       │   └── ChartDeviationDistribution (histogram)
  │       │
  │       └── OrphanTimeEntriesPanel
  │           └── Displays: store.orphanTimeEntries

All components reactively update when:
  ├── CSV loaded → store.parents/children/timeEntries updated
  ├── Calculation complete → store.calculatedRequests updated
  └── Summary generated → store.summary updated
```

---

## 7. COMPONENTS HIERARCHY

### 7.1 Layout Components

**AppLayout.vue** (Root container)

- Toolbar with theme toggle and reset button
- Main content area (slot-based)
- Toast notifications

**CsvUploadPanel.vue** (CSV upload interface)

- 3 file upload inputs (parents, children, timeEntries)
- Status tags (OK/Loading/Error)
- Error/warning message display
- Processing indicator

### 7.2 Main View Components

**TabsView.vue** (Tab container - 4 tabs)

1. **SummaryTab** → Displays DashboardKpis
2. **DashboardTablesTabs** → Contains ParentGroupedRequestsTable
3. **ChartsTab** → Contains Risk Matrix & Deviation Distribution charts
4. **OrphanTimeEntriesPanel** → Shows orphan time entries

### 7.3 Dashboard Tables

**ParentGroupedRequestsTable.vue**

- Main data table with advanced filtering
- Filter options:
  - Parent: code, subject, project, application, status
  - Child: code, subject
  - User, role, activity (multi-select)
  - Result status, risk level
  - Special: only losses, only high deviations (>20%), only over-consumption (>100%)
- Expandable rows showing child requests
- Each child row shows userRoleHours breakdown (user, role, hours, activities)
- Columns: code, subject, project, status, estimated, actual, difference, deviation%, consumption%, risk, people count

**Child Tables** (not currently visible in main UI):

- **ChildRequestsTable.vue** - List of all child requests
- **ParentRequestsTable.vue** - List of parent requests
- **UsersTable.vue** - Aggregated by user
- **ParentProjectGroupTable.vue** - Aggregated by parent project

### 7.4 Chart Components

**ChartRiskMatrix.vue**

- ECharts ScatterChart
- X-axis: Result status (Loss, Neutral, Profit)
- Y-axis: Risk level (Low, Medium, High)
- Bubble size: Estimated hours
- Color: Result status
- Tooltip: Detailed info on hover
- Uses: buildRiskMatrixData() + ECharts configuration

**ChartDeviationDistribution.vue**

- ECharts BarChart (histogram)
- X-axis: Deviation ranges (< -50%, -50% to -20%, etc.)
- Y-axis: Count of requests
- Color-coded by deviation range
- Tooltip: Count and percentage
- Uses: buildDeviationDistribution()

### 7.5 KPI Components

**DashboardKpis.vue** (Legacy - not used in main flow)

- Displays 10 KPI cards in grid

**SummaryTab.vue** (Current)

- Displays 4 main KPI cards
- Error/warning messages above KPIs
- Cards: Estimated hours, actual hours, difference, average deviation%

### 7.6 Other Components

**OrphanTimeEntriesPanel.vue**

- Shows time entries that couldn't be linked
- Lists: date, user, activity, petition ID, hours, reason
- Paginated table (15 per page)

**MainNav.vue** (Navigation - may be unused)

**HelloWorld.vue** (Demo component - likely unused)

---

## 8. STYLING & THEMES

### 8.1 Theme System

**Architecture**: PrimeVue 4.5.5 Design Tokens + CSS variables

**Theme Store** (`theme.ts`):

- Manages `isDark` boolean state
- Saves to localStorage
- Detects system preference on first load
- Adds/removes `app-dark` class on `document.documentElement`

**PrimeVue Integration** (`main.ts`):

```typescript
app.use(PrimeVue, {
  theme: {
    preset: CCVPreset,
    options: {
      darkModeSelector: ".app-dark", // Selector for dark mode
      cssLayer: false,
      prefix: "p",
    },
  },
});
```

### 8.2 Custom Theme Preset (`theme/preset.ts`)

**Base**: Aura theme from PrimeVue

**Light Mode**:

- Surface colors: Blue-tinted grays (f0f7ff = light blue background)
- Primary: Blue 600
- Success: Emerald 500
- Warning: Amber 500
- Danger: Red 500
- Text: Dark colors

**Dark Mode**:

- Surface colors: Dark grays/blacks (030712 = very dark)
- Primary: Blue 400
- Success: Emerald 400
- Warning: Amber 400
- Danger: Red 400
- Text: Light colors with high contrast

**CSS Variable Usage**:
Components use semantic CSS variables like:

- `var(--bg-primary)` → Main background
- `var(--bg-secondary)` → Secondary background
- `var(--text-primary)` → Main text color
- `var(--text-secondary)` → Secondary text color
- `var(--color-primary)` → Primary brand color
- `var(--color-success)` → Success color
- `var(--color-danger)` → Danger/error color
- `var(--border-color)` → Border colors
- `var(--shadow-lg)` → Large shadow

### 8.3 Global Styles (`style.css`)

```css
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", etc.
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
}
```

### 8.4 Component-Level Styling

**Scoped Styles**:
Each Vue component uses `<style scoped>` for encapsulated styles.

**Color Classes**:

```css
.profit   → var(--color-success)  /* Green */
.loss     → var(--color-danger)   /* Red */
.neutral  → default color
```

**Status Indicators**:

```typescript
// In ParentGroupedRequestsTable.vue
severityFor(status: string): 'success' | 'danger' | 'secondary'
  profit  → 'success' (green PrimeVue tag)
  loss    → 'danger'  (red PrimeVue tag)
  neutral → 'secondary' (gray PrimeVue tag)
```

**Risk Level Coloring**:

```typescript
riskBadge(level: string): 'success' | 'warning' | 'danger'
  low     → 'success'  (green)
  medium  → 'warning'  (orange)
  high    → 'danger'   (red)
```

---

## 9. DATA STRUCTURES & RELATIONSHIPS

### 9.1 Entity Relationship Diagram

```
ParentRequest (1) ─── (Many) ChildRequest
      ↑                           ↑
      │                           │
      └─────────────┬─────────────┘
                    │
            TimeEntry (Many)


Legend:
(1) = One-to-Many relationship
ParentRequest.id ← ChildRequest.parentId
ChildRequest.id ← TimeEntry.petitionId (or parent link via parentTaskId)
ParentRequest.id ← TimeEntry.parentTaskId (direct link)
```

### 9.2 Resolution Chain for Time Entries

```
TimeEntry
  ├── petitionId?
  │   ├── Lookup in childMap
  │   │   ├── Found → use child.parentId
  │   │   └── Not found → check parentMap
  │   │       ├── Found → use as direct parent
  │   │       └── Not found → continue
  │   └── Not set → continue
  │
  └── parentTaskId?
      ├── Lookup in parentMap
      │   ├── Found → use as direct parent
      │   └── Not found → check childMap
      │       ├── Found → use child.parentId
      │       └── Not found → ORPHAN
      └── Not set → ORPHAN
```

### 9.3 Aggregation Hierarchy

```
Dashboard (Summary Level)
  ├── totalEstimatedHours = Σ(parent.estimatedHours)
  ├── totalActualHours = Σ(parent.actualHours)
  ├── totalDifferenceHours = total_estimated - total_actual
  ├── averageDeviationPercent = mean(parent.deviationPercent)
  ├── Count: profitable/loss/neutral/orphan requests
  ├── totalPeople = distinct users across all time entries
  └── totalApplications = distinct applications

Parent Request (Calculated Level)
  ├── estimatedHours = max(Σ(child.estimatedHours), parent.estimatedHours)
  ├── actualHours = Σ(timeEntry.hours for this parent)
  ├── differenceHours = estimated - actual
  ├── deviationPercent = ((actual - estimated) / estimated) * 100
  ├── resultStatus = determined by differenceHours sign
  ├── people = distinct users in time entries
  ├── activities = distinct activities
  ├── roles = distinct roles
  └── applications = parent + children + time entries

Parent Project Group (Project Level)
  ├── parentRequestsCount = count of parents in project
  ├── Σ(estimatedHours, actualHours, etc.)
  ├── Aggregated people, roles, activities, applications
  └── Same metrics as parent level

Child Request (Optional Detail Level)
  ├── estimatedHours = from child data
  ├── actualHours = Σ(timeEntry.hours for this child)
  ├── Aggregated people, activities, roles
  └── userRoleHours[] breakdown
```

---

## 10. KEY BUSINESS LOGIC

### 10.1 Deviation Calculation

```typescript
deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100

Interpretation:
  < -50%     : Massively under budget (large profit)
  -50% to 0% : Under budget (profit)
  0%         : Perfect (neutral)
  0% to +50% : Over budget (loss)
  > +50%     : Massively over budget (large loss)
```

### 10.2 Consumption Calculation

```typescript
consumptionPercent = (actualHours / estimatedHours) * 100

Interpretation:
  50%   : Used only half estimated time
  100%  : Used exactly estimated time
  150%  : Used 1.5x estimated time (50% over budget)
  200%  : Doubled the budget
```

### 10.3 Risk Level Determination

```typescript
riskLevel is based on differenceHours (not %)

if differenceHours < -20  → HIGH RISK
  Meaning: Used more than 20 extra hours (serious overrun)

else if differenceHours < -5  → MEDIUM RISK
  Meaning: 5-20 hours over budget (moderate overrun)

else  → LOW RISK
  Meaning: On budget or under (good)
```

### 10.4 Result Status Determination

```typescript
if differenceHours > 0  → PROFIT
  Meaning: Finished in less time than estimated

else if differenceHours < 0  → LOSS
  Meaning: Took longer than estimated

else  → NEUTRAL
  Meaning: Finished exactly on budget
```

---

## 11. KEY FILES & PURPOSES

### Core Business Logic

| File                           | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `domain/types.ts`              | TypeScript interfaces for all data models                     |
| `domain/calculations.ts`       | KPI summary calculations                                      |
| `domain/relationships.ts`      | Parent-child-time entry linking, `CalculatedRequest` building |
| `domain/normalizeCsv.ts`       | CSV row normalization to domain objects                       |
| `domain/csvUtils.ts`           | Parsing utilities (Spanish numbers, issue IDs)                |
| `domain/chartsData.ts`         | Risk matrix & deviation histogram builders                    |
| `domain/tableAggregations.ts`  | Table row builders (user, parent, child, project)             |
| `domain/parentGroupedTable.ts` | Hierarchical table building & filtering logic                 |

### State Management

| File                  | Purpose                               |
| --------------------- | ------------------------------------- |
| `stores/dashboard.ts` | Main Pinia store - data & CSV loading |
| `stores/theme.ts`     | Theme/dark mode Pinia store           |

### Vue Components

| File                                                         | Purpose                        |
| ------------------------------------------------------------ | ------------------------------ |
| `App.vue`                                                    | Root component                 |
| `components/AppLayout.vue`                                   | Main layout wrapper            |
| `components/CsvUploadPanel.vue`                              | CSV upload interface           |
| `components/TabsView.vue`                                    | 4-tab main container           |
| `components/SummaryTab.vue`                                  | KPI display                    |
| `components/ChartsTab.vue`                                   | Chart container                |
| `components/dashboard/tables/ParentGroupedRequestsTable.vue` | Main data table with filtering |
| `components/dashboard/charts/ChartRiskMatrix.vue`            | Risk matrix chart              |
| `components/dashboard/charts/ChartDeviationDistribution.vue` | Deviation histogram            |
| `components/OrphanTimeEntriesPanel.vue`                      | Orphan time entries display    |

### Configuration

| File              | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `theme/preset.ts` | PrimeVue theme configuration (light/dark) |
| `main.ts`         | Vue app initialization & plugin setup     |
| `router.ts`       | Vue Router configuration (unused)         |
| `style.css`       | Global styles                             |
| `vite.config.ts`  | Vite build config                         |

### Testing

| File                               | Purpose                       |
| ---------------------------------- | ----------------------------- |
| `tests/calculations.test.ts`       | Tests for KPI calculations    |
| `tests/relationships.test.ts`      | Tests for linking logic       |
| `tests/csvUtils.test.ts`           | Tests for CSV utilities       |
| `tests/normalizeCsv.test.ts`       | Tests for data normalization  |
| `tests/tableAggregations.test.ts`  | Tests for table builders      |
| `tests/parentGroupedTable.test.ts` | Tests for grouped table logic |

---

## 12. DATA FLOW EXAMPLES

### Example 1: Loading Parent Requests CSV

```
User selects file: "parents.csv"
  ↓
CsvUploadPanel.onParentSelect() → store.loadParents(file)
  ↓
Dashboard Store:
  ├── updateCsvStatus('parents', { status: 'loading' })
  ├── allowUIUpdate() [yields to UI thread]
  ├── parseCsvFile(file) → PapaParse with `;` delimiter
  ├── Check '#' column exists → validate
  ├── normalizeParentRequests(rows)
  │   └── Map CSV columns to ParentRequest fields
  │       Extract estimated hours (profile columns, total, or time estimado)
  ├── Store in: parents.value = [...]
  ├── updateCsvStatus('parents', { status: 'success', rowsCount: X })
  ├── parentsLoaded.value = true
  ├── allowUIUpdate()
  └── recalculate()
       ├── Check if parents && timeEntries loaded
       ├── buildCalculatedRequests()
       │   └── Link parents to time entries, calculate metrics
       ├── allowUIUpdate()
       ├── Store results in: calculatedRequests.value, summary.value
       └── allowUIUpdate()

UI Updates:
  ├── CsvUploadPanel shows "OK" tag
  ├── If all 3 loaded → TabsView becomes visible
  └── Tabs auto-populate with data
```

### Example 2: Viewing Grouped Table

```
User clicks "Tabla de Peticiones" tab
  ↓
TabsView → DashboardTablesTabs → ParentGroupedRequestsTable
  ↓
Component mounts:
  ├── Computed: groupedRows = buildParentGroupedTableRows(
  │     parents,
  │     children,
  │     timeEntries,
  │     calculatedRequests
  │   )
  │   └── For each parent:
  │       ├── Create mapping of children
  │       ├── Create mapping of time entries
  │       ├── For each child:
  │       │   ├── Group time entries by user+role
  │       │   ├── Calculate metrics (est, actual, diff, dev%)
  │       │   └── Create ChildRequestGroupedRow
  │       └── Aggregate child data to parent level
  │
  ├── Computed: uniqueUsers = distinct users from groupedRows
  ├── Computed: uniqueRoles = distinct roles
  ├── Computed: uniqueApplications = distinct applications
  └── Render: <DataTable :value="groupedRows">
       ├── Parent rows expandable
       ├── Expandable children rows
       └── Each child shows userRoleHours array
```

### Example 3: Applying Filters

```
User enters "SOL-" in parent code filter
  ↓
filters.value.parentCode = "SOL-"
  ↓
Computed: groupedRows recalculates
  ├── filterParentGroupedRows(buildParentGroupedTableRows(...), filters)
  │   └── For each parent row:
  │       ├── Check if parentCode includes "SOL-"
  │       ├── Filter children by child-level criteria
  │       ├── Exclude if no matching children
  │       └── Keep if matches
  └── Return filtered rows

User also selects "Juan" from user filter (multi-select)
  ↓
filters.value.user = ["Juan"]
  ↓
Computed: groupedRows recalculates
  ├── filterParentGroupedRows() for each parent:
  │   └── For each child:
  │       ├── Check if any userRoleHour.user = "Juan"
  │       └── Keep only if matches
  │   └── Exclude parent if no children match
  └── Return filtered rows

Table UI updates reactively
  ├── Shows only parents with code including "SOL-"
  ├── And have at least one child with "Juan" working on it
```

### Example 4: Chart Generation

```
User clicks "Gráficas" tab
  ↓
ChartsTab mounts:
  ├── Computed: groupedRows = buildParentGroupedTableRows(...)
  └── renderCharts = true [after onMounted]
  ↓
ChartRiskMatrix renders:
  ├── Computed: chartData from buildRiskMatrixData(groupedRows)
  │   └── Map each row to (resultStatus, riskLevel) point
  │       with estimatedHours as bubble size
  │
  ├── Configure ECharts option
  │   ├── X-axis: resultStatus (Loss, Neutral, Profit)
  │   ├── Y-axis: riskLevel (Low, Medium, High)
  │   ├── Scatter series for each risk level
  │   └── Custom tooltip formatter
  │
  └── Render VChart component (vue-echarts wrapper)
     └── Displays interactive scatter plot

ChartDeviationDistribution renders:
  ├── Computed: data from buildDeviationDistribution(groupedRows)
  │   └── Group rows into deviation buckets:
  │       [< -50%, -50% to -20%, -20% to 0%, etc.]
  │
  ├── Configure ECharts BarChart
  │   ├── X-axis: deviation ranges
  │   ├── Y-axis: count
  │   ├── Color-coded bars by range
  │   └── Custom tooltip
  │
  └── Render VChart
```

---

## 13. PERFORMANCE CONSIDERATIONS

### 13.1 Async Processing

**Problem**: Processing large CSVs freezes the UI

**Solution**: `allowUIUpdate()` helper function

```typescript
// In store actions:
await allowUIUpdate(); // Returns Promise<void>
// Equivalent to: await new Promise(resolve => setTimeout(resolve, 0))
// Yields control back to browser for UI updates
```

**Usage**: Called between major processing steps:

- After CSV parsing
- After normalization
- After relationship building
- After calculations

### 13.2 Computed Properties

All table data uses Vue `computed()` which:

- Re-runs only when dependencies change
- Memoizes results
- Prevents unnecessary rebuilds

```typescript
const groupedRows = computed(() => {
  // Re-runs only when parents/children/timeEntries/calculatedRequests change
  return buildParentGroupedTableRows(...)
})
```

### 13.3 Chunking & Pagination

- DataTable components: 25 rows per page by default
- Orphan entries table: 15 rows per page
- Charts: Lazy rendered on tab activation

---

## 14. ERROR HANDLING & VALIDATION

### 14.1 CSV Validation

```typescript
// In store.loadParents():
if (!rows.length || !("#" in rows[0])) {
  error: "Peticiones padre: falta columna #";
  status: "error";
  return early;
}

// In store.loadTimeEntries():
if (rows.length && !("Horas" in rows[0])) {
  error: "Tiempo dedicado: falta columna Horas";
  hasError: true;
  return early;
}
```

### 14.2 Error Messages

All errors stored in `store.errors[]` and displayed in:

- CsvUploadPanel (during upload)
- SummaryTab (persistent until next upload)

### 14.3 Warnings

Non-fatal issues stored in `store.warnings[]`:

- "X entradas de tiempo huérfanas"
- "X peticiones con 0h estimadas pero horas reales > 0"

---

## 15. TESTING STRUCTURE

**Test Framework**: Vitest (configured in vite.config.ts)

**Test Files**:

1. `calculations.test.ts` - KPI calculations
2. `relationships.test.ts` - Parent-child linking logic
3. `csvUtils.test.ts` - Spanish number parsing, ID extraction
4. `normalizeCsv.test.ts` - CSV data normalization
5. `tableAggregations.test.ts` - Table row builders
6. `parentGroupedTable.test.ts` - Grouped table building & filtering

**Run Tests**:

```bash
npm run test
```

---

## 16. DEPENDENCIES

### Production Dependencies

```json
{
  "@primevue/themes": "^4.5.4", // PrimeVue theme system
  "echarts": "^6.1.0", // Charts library
  "papaparse": "^5.5.3", // CSV parsing
  "pinia": "^3.0.4", // State management
  "primeicons": "^7.0.0", // Icon library
  "primevue": "^4.5.5", // UI component library
  "vue": "^3.5.34", // Vue framework
  "vue-echarts": "^8.0.1", // Vue wrapper for ECharts
  "vue-router": "^5.0.7" // Routing (configured but unused)
}
```

### Key Dev Dependencies

```json
{
  "@vue/test-utils": "^2.4.10", // Vue testing utility
  "vitest": "^4.1.7", // Test runner
  "typescript": "~6.0.2", // TypeScript compiler
  "vite": "^8.0.12", // Build tool
  "vue-tsc": "^3.2.8" // Vue TypeScript checker
}
```

---

## 17. PROJECT WORKFLOWS

### 17.1 Development Workflow

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
# Opens at http://localhost:5174

# Run tests
npm run test

# Type check
vue-tsc -b

# Build for production
npm run build

# Preview production build
npm run preview
```

### 17.2 Data Loading Workflow

1. User uploads `peticiones_padre.csv`
   - Parents loaded & normalized
   - Status shows "OK"

2. User uploads `peticiones_hijas.csv`
   - Children loaded & normalized
   - Status shows "OK"

3. User uploads `tiempo_dedicado.csv`
   - Time entries loaded & normalized
   - Relationships calculated
   - Summary generated
   - UI tabs become active
   - All calculations displayed

4. Data can be cleared with "Vaciar datos" button

### 17.3 Filtering Workflow

1. User interacts with filter inputs/multi-selects
2. `filters.value` updates reactively
3. `groupedRows` computed recomputes with `filterParentGroupedRows()`
4. Table updates with filtered results
5. Expanded rows maintained if still visible

---

## 18. FUTURE ENHANCEMENT OPPORTUNITIES

### Potential Improvements

1. **Export Data**: Add CSV/Excel export for filtered results
2. **Charts Interactivity**: Click chart points to filter table
3. **Trend Analysis**: Track metrics over time
4. **Drill-down Reports**: Detailed view for individual time entries
5. **Custom Calculations**: User-configurable metrics
6. **API Integration**: Load CSVs from backend
7. **Real-time Sync**: WebSocket updates
8. **Permission System**: Role-based data access
9. **Audit Trail**: Track who viewed/modified what
10. **Mobile Responsive**: Better mobile UI

---

## 19. CONFIGURATION POINTS

### Key Configuration Files

**Theme** (`theme/preset.ts`):

- Light/dark color palettes
- Color scheme semantics
- Focus ring styling

**PrimeVue Setup** (`main.ts`):

- Dark mode selector: `.app-dark`
- Theme preset: `CCVPreset`
- CSS layer: false

**CSV Parsing** (`stores/dashboard.ts`):

- Delimiter: `;` (semicolon)
- Encoding: UTF-8
- Skip empty lines: true
- Header: true (first row)

**Table Defaults** (`components/dashboard/tables/ParentGroupedRequestsTable.vue`):

- Rows per page: 25 (configurable: 10, 25, 50, 100)

**Orphan Table** (`components/OrphanTimeEntriesPanel.vue`):

- Rows per page: 15 (configurable: 10, 15, 25)

---

## 20. TECHNICAL NOTES

### 20.1 Why allowUIUpdate() is Needed

In `dashboard.ts`, `allowUIUpdate()` is called between processing steps:

```typescript
// Without this, the browser can't render UI updates
// because JavaScript is continuously executing

await allowUIUpdate(); // Let browser handle rendering
// Then continue processing
```

This is necessary because:

- CSV parsing can take significant time (large files)
- Data normalization loops through thousands of rows
- Building relationships is O(n²) worst case
- Calculations add up when done synchronously

### 20.2 Orphan Time Entry Detection

A time entry becomes orphan if:

```
petitionId NOT IN (childMap + parentMap) AND
parentTaskId NOT IN (parentMap)
```

Orphans are not necessarily errors - they could be:

- Time logged to an archived/deleted request
- Manual logging without proper reference
- Data entry errors

### 20.3 Estimated Hours Priority

When linking parent to children:

```
if (children.sum > 0)
  use children.sum
else
  use parent.estimatedHours
```

This allows:

- Detailed estimation at child level
- Fallback to parent-level estimate if no children estimated
- Mixed scenarios (some children estimated, parent has total)

### 20.4 Profile Roles Aggregation

Roles come from two sources:

- `profiledRole`: Formal profiled role
- `cauRole`: CAU in-situ role

Both are collected in `roles[]` array for complete picture of who was involved and their roles.

### 20.5 Spanish Number Format

Spanish locale uses:

- `,` as decimal separator: `"8,50"` = 8.5
- `.` as thousands separator: `"1.234,50"` = 1234.5

Parser handles this:

```typescript
"1.234,50"
  → remove dots: "1234,50"
  → replace comma with dot: "1234.50"
  → parseFloat: 1234.5
```

---

## 21. CONCLUSION

The CCV Dashboard is a comprehensive Vue 3 application for analyzing project requests and time tracking data. It:

1. **Processes CSV data** asynchronously without UI freezing
2. **Links entities** (parents, children, time entries) through multi-step resolution
3. **Calculates metrics** (estimated vs actual hours, deviations, profitability)
4. **Visualizes insights** through interactive charts and tables
5. **Manages state** reactively through Pinia
6. **Supports themes** with light/dark modes using PrimeVue design tokens
7. **Provides filtering** on grouped table data
8. **Handles errors** gracefully with validation and messages

The architecture is clean, well-tested, and scalable, with clear separation of concerns between UI, state management, and business logic.
