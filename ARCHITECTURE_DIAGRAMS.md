# CCV Dashboard - Visual Diagrams & Architecture

## 1. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS CSV FILES                          │
└──────────────────┬──────────────────┬──────────────────┬────────────────┘
                   │                  │                  │
        ┌──────────▼─┐      ┌────────▼───┐     ┌────────▼──────┐
        │  Parents   │      │  Children  │     │ Time Entries  │
        │   CSV      │      │    CSV     │     │     CSV       │
        └──────────┬─┘      └────────┬───┘     └────────┬──────┘
                   │                 │                   │
                   │   FILE UPLOAD VALIDATION            │
                   └─────────┬───────┴───────────────────┘
                             │
              [CsvUploadPanel.vue] stores in memory
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐         ┌────▼─────┐        ┌────▼──────┐
   │normalizeP │         │normalizeC │        │normalizeT │
   │arentRe   │         │hildRe     │        │imeEntrie  │
   │quests()  │         │quests()   │        │s()        │
   └────┬─────┘         └────┬─────┘        └────┬──────┘
        │                    │                    │
        │   PARSE SPANISH NUMBERS, EXTRACT IDS   │
        │                    │                    │
        ├────────────────────┼────────────────────┤
        │   allowUIUpdate()  (yield to UI)       │
        │
        ▼
    [Store: Raw Normalized Data]
    ├── parents[]
    ├── children[]
    └── timeEntries[]
        │
        │   IF parents && timeEntries loaded:
        │
        ▼
    [buildCalculatedRequests()]
    ├── Create parentMap, childMap
    ├── For each timeEntry:
    │   └── resolveParentId() → 4-step resolution
    │       ├── Check petitionId vs child/parent
    │       ├── Check parentTaskId vs parent/child
    │       └── Mark as orphan if not found
    ├── For each parent:
    │   ├── Link to children
    │   ├── Link to time entries
    │   ├── Calculate:
    │   │   ├── estimatedHours
    │   │   ├── actualHours
    │   │   ├── differenceHours
    │   │   ├── deviationPercent
    │   │   ├── resultStatus
    │   │   └── Aggregations (people, roles, etc)
    │   └── Return CalculatedRequest
    │
    ├── allowUIUpdate()  (yield to UI)
    │
    ▼
    [Store: Computed Results]
    ├── calculatedRequests[]
    ├── orphanTimeEntries[]
    └── summary: DashboardSummary
        ├── totalEstimatedHours
        ├── totalActualHours
        ├── totalDifferenceHours
        ├── averageDeviationPercent
        ├── profitableRequests count
        ├── lossRequests count
        ├── neutralRequests count
        └── orphanTimeEntries count
        │
        │   UI BECOMES REACTIVE
        │
        ▼
    [TabsView - 4 Tabs]
    ├── Tab 1: SummaryTab
    │   └── Displays DashboardKpis from summary
    │
    ├── Tab 2: DashboardTablesTabs
    │   └── ParentGroupedRequestsTable
    │       ├── buildParentGroupedTableRows()
    │       ├── Hierarchical: Parent → Children → UserRoleHours
    │       └── filterParentGroupedRows() on user input
    │
    ├── Tab 3: ChartsTab
    │   ├── buildRiskMatrixData()
    │   │   └── ChartRiskMatrix (scatter plot)
    │   └── buildDeviationDistribution()
    │       └── ChartDeviationDistribution (histogram)
    │
    └── Tab 4: OrphanTimeEntriesPanel
        └── Displays orphanTimeEntries[]
```

---

## 2. STATE MANAGEMENT DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│               PINIA STORE: dashboard.ts                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  STATE (ref):                                                │
│  ├── parents: ParentRequest[]                                │
│  ├── children: ChildRequest[]                                │
│  ├── timeEntries: TimeEntry[]                                │
│  ├── calculatedRequests: CalculatedRequest[]                 │
│  ├── orphanTimeEntries: OrphanTimeEntry[]                    │
│  ├── summary: DashboardSummary | null                        │
│  │                                                            │
│  ├── errors: string[]                                        │
│  ├── warnings: string[]                                      │
│  ├── parentsLoaded: boolean                                  │
│  ├── childrenLoaded: boolean                                 │
│  ├── timeEntriesLoaded: boolean                              │
│  ├── isCalculating: boolean                                  │
│  └── csvLoadStatus: {                                        │
│      parents: { status, fileName, rowsCount, error }         │
│      children: { status, fileName, rowsCount, error }        │
│      timeEntries: { status, fileName, rowsCount, error }     │
│  }                                                            │
│                                                               │
│  COMPUTED:                                                    │
│  ├── hasData = parentsLoaded && timeEntriesLoaded            │
│  ├── isProcessingCsv = any CSV in 'loading'                  │
│  ├── isProcessing = isProcessingCsv || isCalculating         │
│  ├── allCsvsValid = all CSVs 'success'                       │
│  └── canCalculate = allCsvsValid                             │
│                                                               │
│  ACTIONS:                                                     │
│  ├── async loadParents(file)    → parseCsv → normalize       │
│  ├── async loadChildren(file)   → parseCsv → normalize       │
│  ├── async loadTimeEntries(file) → parseCsv → normalize      │
│  ├── async recalculate()        → build relationships        │
│  ├── reset()                    → clear all                  │
│  └── helpers: parseCsvFile(), allowUIUpdate()                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ PROVIDES
                           ▼
┌──────────────────────────────────────────────────────────────┐
│               PINIA STORE: theme.ts                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  STATE:                                                       │
│  └── isDark: ref<boolean>                                    │
│                                                               │
│  COMPUTED:                                                    │
│  └── isLight = !isDark                                       │
│                                                               │
│  ACTIONS:                                                     │
│  ├── loadTheme()      → check localStorage + system pref     │
│  ├── applyTheme()     → toggle 'app-dark' class on DOM       │
│  └── toggleTheme()    → toggle isDark                        │
│                                                               │
│  INTEGRATION:                                                │
│  └── main.ts: darkModeSelector: '.app-dark'                  │
│      → PrimeVue auto-applies dark theme when class present   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENT HIERARCHY TREE

```
App.vue
│
└── AppLayout.vue (root layout)
    ├── Toolbar (PrimeVue)
    │   ├── Title: "CCV Dashboard"
    │   └── Toolbar End:
    │       ├── Theme Toggle Button (isDark ? sun : moon)
    │       └── Reset Button (clears data)
    │
    └── Main Content (slot)
        ├── CsvUploadPanel.vue
        │   ├── FileUpload × 3 (parents, children, timeEntries)
        │   ├── Status Tags
        │   ├── Error Messages
        │   ├── Warning Messages
        │   └── Processing Indicator
        │
        └── TabsView.vue (if store.hasData)
            │
            ├── Tab 1: "Resumen" (Summary)
            │   └── SummaryTab.vue
            │       ├── Error Messages
            │       ├── Warning Messages
            │       └── 4 KPI Cards:
            │           ├── Horas estimadas
            │           ├── Horas reales
            │           ├── Diferencia
            │           └── Desviación media %
            │
            ├── Tab 2: "Tabla de Peticiones"
            │   └── DashboardTablesTabs.vue
            │       └── (only 1 sub-tab visible)
            │           └── ParentGroupedRequestsTable.vue
            │               ├── Filters Section:
            │               │   ├── Parent Code input
            │               │   ├── Parent Subject input
            │               │   ├── Project dropdown
            │               │   ├── Application multi-select
            │               │   ├── Status dropdown
            │               │   ├── Child Code input
            │               │   ├── Child Subject input
            │               │   ├── User multi-select
            │               │   ├── Role multi-select
            │               │   ├── Activity multi-select
            │               │   ├── Result Status dropdown
            │               │   ├── Risk Level dropdown
            │               │   └── Clear Filters button
            │               │
            │               └── DataTable (PrimeVue)
            │                   ├── Parent Rows (expandable):
            │                   │   ├── Code
            │                   │   ├── Subject
            │                   │   ├── Project
            │                   │   ├── Status
            │                   │   ├── Est Hours
            │                   │   ├── Act Hours
            │                   │   ├── Diff Hours
            │                   │   ├── Dev %
            │                   │   ├── Consumption %
            │                   │   ├── Risk Level (badge)
            │                   │   └── People count
            │                   │
            │                   └── Expanded Child Rows:
            │                       ├── Child Code
            │                       ├── Child Subject
            │                       ├── Est Hours
            │                       ├── Act Hours
            │                       ├── Diff Hours
            │                       ├── Dev %
            │                       └── User/Role/Hours Table:
            │                           ├── User
            │                           ├── Role
            │                           ├── Hours
            │                           └── Activities
            │
            ├── Tab 3: "Gráficas" (Charts)
            │   └── ChartsTab.vue
            │       ├── ChartRiskMatrix.vue (ECharts)
            │       │   └── ScatterChart
            │       │       ├── X-axis: Result Status (Loss/Neutral/Profit)
            │       │       ├── Y-axis: Risk Level (Low/Medium/High)
            │       │       ├── Bubble size: Estimated Hours
            │       │       └── Tooltip: Detailed info
            │       │
            │       └── ChartDeviationDistribution.vue (ECharts)
            │           └── BarChart (Histogram)
            │               ├── X-axis: Deviation Ranges
            │               ├── Y-axis: Count
            │               ├── Color-coded bars
            │               └── Tooltip: Count & %
            │
            └── Tab 4: "Tiempos Huérfanos (N)"
                └── OrphanTimeEntriesPanel.vue
                    └── DataTable (if orphans.length > 0)
                        ├── ID
                        ├── Date
                        ├── User
                        ├── Activity
                        ├── Petition ID
                        ├── Parent Task ID
                        ├── Hours
                        ├── Reason (why orphan)
                        └── Profile (role)
```

---

## 4. DATA MODEL RELATIONSHIPS

```
PARENT REQUEST LINKING:

┌────────────────┐         ┌─────────────────┐
│ ParentRequest  │◄────────┤ ChildRequest    │
│                │  1 : M  │                 │
│ id             │         │ parentId ──────►│
│ code           │         │                 │
│ subject        │         │ id              │
│ estimatedHours │         │ code            │
│ ...            │         │ subject         │
│                │         │ estimatedHours  │
└──────────┬─────┘         │ ...             │
           │               └────────┬────────┘
           │                        │
           │ 1 : M                  │ M : 1
           │                        │
           │                  ┌─────▼──────────────┐
           ├─────────────────►│ TimeEntry          │
           │                  │                    │
           │ (via resolved ID)│ petitionId ──────┘│
           │                  │   (alt: child ID) │
           │                  │ parentTaskId ──┐  │
           │                  │   (alt: parent)│  │
           │                  │ user           │  │
           │                  │ hours          │  │
           │                  │ activity       │  │
           │                  │ role           │  │
           │                  │ application    │  │
           │                  │ date           │  │
           └──────────────────└────────────────┘


TIME ENTRY RESOLUTION:

TimeEntry
  ├─ petitionId?
  │  ├─→ Look in ChildRequest (by id)
  │  │   ├─→ Found? Use child.parentId
  │  │   └─→ Not found? Check ParentRequest
  │  │       ├─→ Found? Use as direct parent
  │  │       └─→ Not found? Continue...
  │  └─ Not set? Continue...
  │
  ├─ parentTaskId?
  │  ├─→ Look in ParentRequest (by id)
  │  │   ├─→ Found? Use as direct parent
  │  │   └─→ Not found? Check ChildRequest
  │  │       ├─→ Found? Use child.parentId
  │  │       └─→ Not found? ORPHAN
  │  └─ Not set? ORPHAN
  │
  └─→ ORPHAN TIME ENTRY (if no path found)
```

---

## 5. CALCULATION PIPELINE

```
RAW DATA:
├── ParentRequest: estimatedHours (from parent level)
├── ChildRequest: estimatedHours (detailed per child)
└── TimeEntry: hours (actual time spent)


STEP 1: DETERMINE ESTIMATED HOURS FOR EACH PARENT

for each ParentRequest:
  childrenEstimated = Σ(child.estimatedHours)

  if childrenEstimated > 0:
    parentRequest.estimatedHours = childrenEstimated  [USE CHILDREN SUM]
  else:
    parentRequest.estimatedHours = parentRequest.estimatedHours  [FALLBACK TO PARENT]


STEP 2: AGGREGATE ACTUAL HOURS

for each ParentRequest:
  actualHours = Σ(timeEntry.hours for timeEntry.parentId == this parent)


STEP 3: CALCULATE METRICS

for each ParentRequest:
  differenceHours = estimatedHours - actualHours

  deviationPercent = (actualHours - estimatedHours) / estimatedHours * 100
    Examples:
    • Estimated: 100h, Actual: 80h  → Deviation: -20% (20% under budget)
    • Estimated: 100h, Actual: 100h → Deviation: 0% (on budget)
    • Estimated: 100h, Actual: 120h → Deviation: +20% (20% over budget)

  resultStatus:
    if differenceHours > 0  → "profit"   (finished early)
    if differenceHours < 0  → "loss"     (went over budget)
    if differenceHours == 0 → "neutral"  (exact match)

  riskLevel = f(differenceHours):
    if differenceHours < -20  → "high"     (40+ hours over budget)
    if differenceHours < -5   → "medium"   (5-20 hours over)
    else                       → "low"      (on/under budget)

  consumptionPercent = (actualHours / estimatedHours) * 100
    Examples:
    • 80% consumption = finished in 80% of estimated time
    • 100% consumption = used exactly estimated time
    • 150% consumption = used 50% more than estimated


STEP 4: AGGREGATE METADATA

for each ParentRequest:
  people = distinct(timeEntry.user)
  activities = distinct(timeEntry.activity)
  roles = distinct(timeEntry.profiledRole, timeEntry.cauRole)
  applications = distinct(parent.application, children.application, timeEntry.application)


STEP 5: DASHBOARD SUMMARY

Aggregate across all parents:
  totalEstimatedHours = Σ(parent.estimatedHours)
  totalActualHours = Σ(parent.actualHours)
  totalDifferenceHours = totalEstimatedHours - totalActualHours
  averageDeviationPercent = mean(parent.deviationPercent)

  profitableRequests = count(parent.resultStatus == "profit")
  lossRequests = count(parent.resultStatus == "loss")
  neutralRequests = count(parent.resultStatus == "neutral")

  orphanTimeEntries = count(unlinked time entries)
  totalPeople = count(distinct users across all time entries)
  totalApplications = count(distinct applications)
```

---

## 6. FILTER LOGIC FLOW

```
USER INTERACTION:
  input filter values
    ↓
filters.value object updated
    ↓
Computed: groupedRows triggers recalculation
    ↓
filterParentGroupedRows(rows, filters)
    ↓

FOR EACH PARENT ROW:

  1. CHILD-LEVEL FILTERS:
     If any child filter is set:
       ├─ Filter by childCode (substring match)
       ├─ Filter by childSubject (substring match)
       ├─ Filter by user (in userRoleHours)
       ├─ Filter by role (in userRoleHours)
       └─ Filter by activity (in activities)

     childRows = [children that match]

     IF childRows.length == 0:
       Skip this parent (no matching children)
       EXCLUDE

  2. PARENT-LEVEL FILTERS:
     Check each parent filter:
       ├─ parentCode substring match?
       ├─ parentSubject substring match?
       ├─ project exact match?
       ├─ application in list?
       ├─ status exact match?
       ├─ resultStatus exact match?
       ├─ riskLevel exact match?
       └─ Special filters:
           ├─ onlyLosses: resultStatus == "loss"?
           ├─ onlyDeviationOver20: |deviationPercent| > 20?
           └─ onlyConsumptionOver100: consumptionPercent > 100?

     IF any filter fails:
       EXCLUDE

  3. POST-FILTER CALCULATIONS:
     If user/role/activity filters active:
       Calculate filteredActualHours based on matching userRoleHours

  4. INCLUDE PARENT IF:
     • Passes all parent-level filters
     • Has matching children (if child filters set)
     • OR has no child filters and passes parent filters
    ↓
FILTERED ROWS = parents that passed all checks
    ↓
TABLE UPDATES with filtered rows
```

---

## 7. THEME IMPLEMENTATION

```
THEME SELECTION:

  App Mount
    ↓
  themeStore.loadTheme()
    ├─ Check localStorage['theme']
    │  ├─ If 'dark' or 'light' → use saved
    │  └─ Else: check window.matchMedia('(prefers-color-scheme: dark)')
    │
    └─ Apply theme
       ├─ isDark = true/false
       └─ applyTheme()
           ├─ Add/remove 'app-dark' class to document.documentElement
           └─ Save to localStorage


PRIMEVUE DETECTION:

  PrimeVue config in main.ts:
    theme: {
      preset: CCVPreset,        ← Custom preset based on Aura
      options: {
        darkModeSelector: '.app-dark'  ← PrimeVue watches this
      }
    }

  When 'app-dark' class present:
    ├─ PrimeVue applies dark color scheme
    ├─ Component CSS variables update
    └─ All components re-render with new colors


CSS VARIABLE USAGE:

  Components use semantic vars:
    var(--bg-primary)        ← Background color
    var(--text-primary)      ← Text color
    var(--color-primary)     ← Accent color
    var(--color-success)     ← Success color (green)
    var(--color-danger)      ← Danger color (red)
    var(--border-color)      ← Border color

  Light Mode:
    ├── --bg-primary: #f0f7ff (light blue)
    ├── --text-primary: dark gray/black
    ├── --color-success: emerald 500
    └── --color-danger: red 500

  Dark Mode (when .app-dark):
    ├── --bg-primary: #030712 (very dark)
    ├── --text-primary: light gray/white
    ├── --color-success: emerald 400
    └── --color-danger: red 400


THEME TOGGLE:

  User clicks moon/sun button
    ↓
  themeStore.toggleTheme()
    ├─ isDark = !isDark
    └─ applyTheme()
        ├─ Toggle 'app-dark' class
        ├─ Save to localStorage
        └─ PrimeVue detects change
            └─ Re-render all components with new theme
```

---

## 8. ERROR HANDLING FLOW

```
CSV LOADING ERROR SCENARIOS:

Scenario 1: Missing '#' column
  ├─ parseCsvFile() succeeds
  ├─ Validation: !('#' in rows[0])
  ├─ Add error: "Peticiones padre: falta columna #"
  ├─ Set status: 'error'
  ├─ Set rowsCount: 0
  ├─ Set parentsLoaded: false
  └─ Return early (don't normalize)

Scenario 2: Missing 'Horas' column in time entries
  ├─ parseCsvFile() succeeds
  ├─ Validation: !('Horas' in rows[0])
  ├─ Set hasError = true
  ├─ Add error: "Tiempo dedicado: falta columna Horas"
  ├─ Set status: 'error'
  ├─ Set rowsCount: 0
  ├─ Set timeEntriesLoaded: false
  └─ Return early (don't normalize)

Scenario 3: Missing 'Petición' column in time entries (WARNING)
  ├─ Not an error, but add warning
  ├─ Continue processing (soft validation)
  ├─ Add warning: "Tiempo dedicado: falta columna Petición"
  └─ Set status: 'success'

Scenario 4: PapaParse error
  ├─ Promise rejection caught
  ├─ Add error: "Error al cargar tiempo dedicado: [error message]"
  ├─ Set status: 'error'
  ├─ Set rowsCount: 0
  └─ Set timeEntriesLoaded: false

Scenario 5: Time entries can't be linked
  ├─ Processing succeeds
  ├─ buildCalculatedRequests() identifies orphans
  ├─ Add warning: "X entradas de tiempo huérfanas"
  ├─ Set status: 'success'
  └─ Display orphans in Tab 4


ERROR DISPLAY:

CsvUploadPanel:
  ├─ Shows error messages in red boxes
  ├─ Updates status tags: "OK" | "Loading..." | "Error"
  └─ Disables upload buttons during processing

SummaryTab:
  ├─ Displays errors persistently (until next upload)
  └─ Displays warnings in orange

OrphanTimeEntriesPanel:
  ├─ Shows count in tab header
  ├─ Lists orphans with reason
  └─ "Success" message if no orphans
```

---

## 9. PERFORMANCE OPTIMIZATION TECHNIQUES

```
ASYNC PROCESSING:

Problem: CSV parsing and calculations block UI
Solution: allowUIUpdate() helper

  const allowUIUpdate = () => new Promise(resolve => setTimeout(resolve, 0))

Usage in store actions:

  async loadParents(file) {
    await allowUIUpdate()  ← Yield to browser
    const rows = parseCsvFile(file)
    await allowUIUpdate()  ← Yield to browser
    parents.value = normalizeParentRequests(rows)
    await allowUIUpdate()  ← Yield to browser
    await recalculate()
  }

Effect:
  ├─ Browser can update UI between steps
  ├─ No visual freezing even with large datasets
  └─ User sees progress indicators update


COMPUTED PROPERTIES:

  const groupedRows = computed(() => {
    // Only runs when dependencies change
    // Result memoized
    return buildParentGroupedTableRows(...)
  })

Benefits:
  ├─ Automatic dependency tracking
  ├─ Efficient re-calculation
  ├─ Prevents unnecessary rebuilds
  └─ Reactive updates when data changes


PAGINATION:

DataTable: 25 rows per page by default
  ├─ Reduces DOM nodes
  ├─ Faster rendering
  └─ Adjustable: 10, 25, 50, 100

Orphan Table: 15 rows per page
  ├─ Similar benefits
  └─ Adjustable: 10, 15, 25


CHART LAZY RENDERING:

  const renderCharts = ref(false)

  onMounted(() => {
    renderCharts.value = true  // Render after component mounts
  })

  watch(() => props.requests, () => {
    renderCharts.value = false
    setTimeout(() => { renderCharts.value = true }, 0)  // Re-render data
  })

Benefit:
  ├─ Charts don't block initial page load
  ├─ Smooth transitions when data updates
  └─ ECharts has time to initialize properly
```

---

## 10. WORKFLOW SEQUENCE DIAGRAM

```
USER              UPLOAD              STORE              DOMAIN             UI
 │                 PANEL             (Pinia)            (Logic)          (Vue)
 │                  │                   │                  │                │
 │ Select parents.csv                   │                  │                │
 ├─────────────────►│                   │                  │                │
 │                  │ loadParents(file) │                  │                │
 │                  ├──────────────────►│                  │                │
 │                  │                   │ parseCsvFile()   │                │
 │                  │                   ├─────────────────►│                │
 │                  │                   │◄─────────────────┤                │
 │                  │                   │                  │                │
 │                  │ (loading)         │                  │                │
 │                  │                   │ allowUIUpdate()  │                │
 │                  │                   ├─────────────────►│                │
 │                  │                   │                  │                │
 │                  │◄──────────────────┤                  │                │
 │                  │ status='loading'  │                  │                │
 │                  ├───────────────────────────────────────────────────────►│
 │                  │                   │                  │                │ Show
 │                  │                   │ normalize()      │ status
 │                  │                   ├─────────────────►│ loading
 │                  │                   │◄─────────────────┤                │
 │                  │                   │                  │                │
 │                  │ (success)         │ recalculate()    │                │
 │                  │                   ├─────────────────►│                │
 │                  │                   │                  │ Calculate metrics
 │                  │                   │◄─────────────────┤                │
 │                  │◄──────────────────┤                  │                │
 │                  │ status='success'  │                  │                │
 │                  ├───────────────────────────────────────────────────────►│
 │                  │ rowsCount=X       │                  │                │ Show
 │                  │ OK tag            │                  │                │ "OK" tag
 │
 │ Select children.csv, timeEntries.csv... (same flow)
 │
 │ [After all 3 loaded]
 │                  │                   │ store.hasData=true
 │                  │◄──────────────────┤
 │                  ├───────────────────────────────────────────────────────►│
 │                  │                   │                  │                │ Show
 │                  │                   │                  │                │ TabsView
 │                  │                   │                  │                │
 │ Click "Tabla de Peticiones" tab
 ├───────────────────────────────────────────────────────────────────────────►│
 │                  │                   │                  │                │
 │                  │                   │                  │ buildParentGrouped()
 │                  │                   │◄─────────────────┤
 │                  │                   │                  │ filterParent()
 │                  │                   │◄─────────────────┤
 │                  │◄──────────────────┤                  │
 │                  │ groupedRows[]     │                  │
 │                  ├───────────────────────────────────────────────────────►│
 │                  │                   │                  │                │ Render
 │                  │                   │                  │                │ table
 │
 │ Type in filter (e.g., "SOL-")
 ├───────────────────────────────────────────────────────────────────────────►│
 │                  │                   │                  │                │
 │                  │                   │                  │ filterParent()
 │                  │                   │◄─────────────────┤
 │                  │                   │                  │ (recompute)
 │                  │◄──────────────────┤                  │
 │                  │ filtered rows[]   │                  │
 │                  ├───────────────────────────────────────────────────────►│
 │                  │                   │                  │                │ Update
 │                  │                   │                  │                │ table
 │
 │ Click "Vaciar datos" button
 ├──────────────────────────────────────────────────────────────────────────►│
 │                  │ reset()           │                  │                │
 │                  ├──────────────────►│                  │                │
 │                  │                   │ Clear all state  │                │
 │                  │◄──────────────────┤                  │                │
 │                  ├───────────────────────────────────────────────────────►│
 │                  │                   │                  │                │ Hide
 │                  │                   │                  │                │ TabsView
```

---

## 11. SUMMARY TABLE

| Aspect              | Details                                              |
| ------------------- | ---------------------------------------------------- |
| **Framework**       | Vue 3 + TypeScript + Vite                            |
| **State Mgmt**      | Pinia (dashboard, theme stores)                      |
| **CSV Parsing**     | PapaParse (`;` delimiter, UTF-8)                     |
| **Charts**          | ECharts via vue-echarts                              |
| **UI Components**   | PrimeVue 4.5.5                                       |
| **Theming**         | PrimeVue Design Tokens (light/dark)                  |
| **Main Data Flow**  | CSV → Parse → Normalize → Link → Calculate → Display |
| **Key Calculation** | Estimated vs Actual hours → Deviation % → Risk Level |
| **Primary Entity**  | ParentRequest (with children & time entries)         |
| **Filtering**       | Multi-level (parent, child, user, role, activity)    |
| **Error Handling**  | CSV validation + orphan detection                    |
| **Performance**     | Async processing + computed properties + pagination  |
