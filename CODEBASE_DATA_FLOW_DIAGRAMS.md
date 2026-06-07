# CCV Dashboard - Data Flow Diagram

## High-Level Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS 3 CSV FILES                     │
│  Parents (peticiones padre) | Children (peticiones hijas)      │
│                          | TimeEntries                          │
└────────────┬──────────────────────────────────────────────────┬─┘
             │                                                    │
             ▼                                                    ▼
    ┌─────────────────────┐                          ┌──────────────────────┐
    │  parseCsvFile()     │                          │  parseCsvFile()      │
    │  (PapaParse)        │                          │  (PapaParse)         │
    └────────┬────────────┘                          └────────┬─────────────┘
             │                                                │
             ▼                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│         NORMALIZE → Extract & Map Columns                        │
│  - normalizeParentRequests()                                    │
│  - normalizeChildRequests()                                     │
│  - normalizeTimeEntries()                                       │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│         DOMAIN STORE STATE (useDashboardStore)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Raw State:                                              │   │
│  │  - parents: ParentRequest[]                            │   │
│  │  - children: ChildRequest[]                            │   │
│  │  - timeEntries: TimeEntry[]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  buildCalculatedRequests(parents, children, timeEntries)         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ For each parent:                                           │ │
│  │  1. resolveParentId(timeEntry)                            │ │
│  │     → petitionId → child → parentId                       │ │
│  │     → petitionId → parent direct                          │ │
│  │     → parentTaskId → parent direct                        │ │
│  │     → parentTaskId → child → parentId                     │ │
│  │     → orphan                                              │ │
│  │                                                            │ │
│  │  2. aggregateMetrics()                                     │ │
│  │     ├─ estimatedHours (children sum OR parent estimate)   │ │
│  │     ├─ actualHours (sum of resolved time entries)         │ │
│  │     ├─ differenceHours = estimated - actual               │ │
│  │     ├─ deviationPercent = (actual - estimated) / est * 100│ │
│  │     ├─ resultStatus: "profit" | "loss" | "neutral"       │ │
│  │     ├─ people[], activities[], roles[], applications[]   │ │
│  │     ├─ consumedHbs (via calculateConsumedHbs)             │ │
│  │     ├─ estimatedHbs = 0 (cannot calculate)                │ │
│  │     └─ childrenCount, timeEntriesCount                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│         CALCULATED STORE STATE                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ calculatedRequests: CalculatedRequest[]                 │   │
│  │ orphanTimeEntries: OrphanTimeEntry[]                    │   │
│  │ summary: DashboardSummary (via calculateDashboardSummary)│  │
│  └─────────────────────────────────────────────────────────┘   │
└────────────┬───────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────┬──────────────┐
             │                                     │              │
             ▼                                     ▼              ▼
    ┌──────────────────┐            ┌──────────────────┐   ┌──────────────┐
    │  COMPANY FILTER  │            │  GROUPING FOR    │   │ CHARTS VIEW  │
    │                  │            │  DETAILED TABLES │   │              │
    │ enrichedTime     │            │                  │   │ ChartTotal   │
    │ Entries (w/     │            │ buildParent      │   │ Summary      │
    │ companyName)    │            │ GroupedTable     │   │              │
    │     ↓           │            │ Rows()           │   │ passes:      │
    │ filtered        │            │     ↓            │   │ Calculated   │
    │ Calculated      │            │ ParentGrouped    │   │ Requests[]   │
    │ Requests[]      │            │ TableRow[] (w/   │   │              │
    │     ↓           │            │ children detail, │   │ aggregates:  │
    │ filtered        │            │ risk level,      │   │ - totals     │
    │ Summary         │            │ user/role        │   │ - counts     │
    │                 │            │ breakdown)       │   │ - by status  │
    │ (cascading      │            │                  │   │ - HBS data   │
    │ recompute)      │            │ filterParent     │   │              │
    │                 │            │ GroupedRows()    │   │ renders:     │
    │                 │            │ (multi-select    │   │ - Stats cards│
    │                 │            │  filters)        │   │ - Charts     │
    │                 │            │                  │   │              │
    └──────────────────┘            └──────────────────┘   └──────────────┘
```

---

## CalculatedRequest Internals

```
┌─────────────────────────────────────────────────────────────┐
│            CALCULATED REQUEST (Per Parent)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  IDENTIFICATION:                                            │
│  ├─ parentId (UUID)                                        │
│  ├─ code (e.g., "REQ-001")                                 │
│  ├─ subject (title)                                        │
│  └─ project, tracker, status, application                │
│                                                              │
│  HOURS METRICS:                                             │
│  ├─ estimatedHours (total)                                │
│  │  └─ = SUM(child.estimatedHours) OR parent.estimated    │
│  ├─ estimatedHoursJp, Cs, Af (profile-based)             │
│  ├─ estimatedHoursTotal (= Jp + Cs + Af)                 │
│  ├─ actualHours                                            │
│  │  └─ = SUM(timeEntry.hours where resolved to parent)   │
│  ├─ differenceHours = estimated - actual                  │
│  └─ deviationPercent = (actual - estimated) / est * 100   │
│                                                              │
│  HOURS RESULT:                                              │
│  └─ resultStatus                                            │
│     ├─ "profit"  if differenceHours > 0 (saved time)      │
│     ├─ "loss"    if differenceHours < 0 (overrun)         │
│     └─ "neutral" if differenceHours = 0                   │
│                                                              │
│  HBS METRICS (Billing System - profile-based multipliers): │
│  ├─ estimatedHbs = 0 (cannot calculate from parent data)   │
│  ├─ consumedHbs = SUM(entry.hours * profile.ratio)        │
│  │  ├─ Entry.hours × getHbsRatioByProfile(user)          │
│  │  └─ Profile ratios: GP(1.69) CD(1.49) AS(1.18)...      │
│  ├─ differenceHbs = consumed - estimated                   │
│  └─ deviationPercentHbs = (consumed - estimated) / est*100│
│                                                              │
│  HBS RESULT (inverted logic):                               │
│  └─ resultStatusHbs                                         │
│     ├─ "loss"    if differenceHbs > 0 (overbudget)        │
│     ├─ "profit"  if differenceHbs < 0 (underbudget)       │
│     └─ "neutral" if differenceHbs = 0                     │
│                                                              │
│  AGGREGATIONS (from time entries):                          │
│  ├─ people[]      = UNIQUE(timeEntry.user)                │
│  ├─ activities[]  = UNIQUE(timeEntry.activity)            │
│  ├─ roles[]       = UNIQUE(timeEntry.profiledRole,        │
│  │                         timeEntry.cauRole)             │
│  ├─ applications[]= UNIQUE(timeEntry.application,         │
│  │                         child.application,             │
│  │                         parent.application)            │
│  ├─ peopleCount = people.length                           │
│  ├─ childrenCount                                         │
│  ├─ timeEntriesCount                                      │
│  └─ costWithoutVat (optional, from children)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ParentGroupedTableRow Hierarchy

```
┌─────────────────────────────────────────────────────┐
│         PARENT GROUPED TABLE ROW                     │
│  (CalculatedRequest + children detail + risk)      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [All CalculatedRequest fields]                    │
│                                                      │
│  ADDITIONAL:                                        │
│  ├─ consumptionPercent = actual/estimated * 100    │
│  ├─ filteredActualHours (after applying filters)   │
│  ├─ riskLevel                                       │
│  │  ├─ "high"   if differenceHours < -20          │
│  │  ├─ "medium" if differenceHours < -5           │
│  │  └─ "low"    otherwise                          │
│  │                                                  │
│  └─ children: ChildRequestGroupedRow[]             │
│     ├─ [For each child request]                    │
│     │                                               │
│     ├─ childId, childCode, childSubject            │
│     ├─ estimatedHours, actualHours, difference     │
│     ├─ deviationPercent                            │
│     ├─ HBS metrics (estimated, consumed, etc.)     │
│     ├─ users[], roles[], activities[]              │
│     │                                               │
│     ├─ userRoleHours: UserRoleHoursSummary[]       │
│     │  └─ [Grouped by user + role]                 │
│     │     ├─ user                                  │
│     │     ├─ role                                  │
│     │     ├─ hours                                 │
│     │     └─ activities[] (for this user/role)     │
│     │                                               │
│     └─ timeEntriesCount                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## HBS (Billing Hours System) Flow

```
┌─────────────────────────────────────────────┐
│         TIME ENTRY                          │
│  ┌───────────────────────────────────────┐ │
│  │ user: "Juan Manuel Lineros Fernández"│ │
│  │ hours: 8                              │ │
│  └───────────────────────────────────────┘ │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  getCollaboratorProfile(user)               │
│  ┌───────────────────────────────────────┐ │
│  │ Lookup in COLLABORATORS map:          │ │
│  │ "Juan Manuel Lineros Fernández" → AS │ │
│  │ (Analista de Sistemas)                │ │
│  └───────────────────────────────────────┘ │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  getHbsRatioByProfile(profile)              │
│  ┌───────────────────────────────────────┐ │
│  │ HBS_PROFILES[AS] → ratio = 1.18       │ │
│  └───────────────────────────────────────┘ │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  CONSUMED HBS = hours × ratio               │
│  ┌───────────────────────────────────────┐ │
│  │ consumedHbs = 8 × 1.18 = 9.44         │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  SUM all time entries for parent:           │
│  ┌───────────────────────────────────────┐ │
│  │ totalConsumedHbs = Σ(entry.hours ×   │ │
│  │                     profile.ratio)    │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

PROFILE RATIOS (Billing Multipliers):
┌──────────────────────────────────────┐
│ GP (Gestor de proyecto)      × 1.69 │
│ CD (Consultor digital)       × 1.49 │
│ AN (Analista de negocio)     × 1.16 │
│ ARQ (Arquitecto de sistemas) × 1.33 │
│ AS (Analista de sistemas)    × 1.18 │
│ DE (Desarrollador)           × 1.0  │
└──────────────────────────────────────┘
```

---

## Resolution Flow (TimeEntry → Parent)

```
┌─────────────────────────────┐
│   TIME ENTRY                │
│  ┌───────────────────────┐ │
│  │ petitionId?           │ │
│  │ parentTaskId?         │ │
│  └───────────────────────┘ │
└────────────┬────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Is petitionId│
      │ defined?     │
      └──┬────────┬──┘
         │        │
        YES      NO
         │        │
         ▼        ▼
    ┌─────────────────┐  ┌─────────────────┐
    │ Check childMap  │  │ Is parentTaskId │
    │ .has(id)?       │  │ defined?        │
    └┬────────────┬───┘  └────────┬────────┘
     │            │               │
    YES          NO              YES
     │            │               │
     ▼            ▼               ▼
  Return     ┌────────────┐   ┌─────────────────┐
  child's    │Check       │   │ Check parentMap │
  parentId   │parentMap   │   │ .has(id)?       │
             │.has(id)?   │   └────────┬────────┘
             └┬────────┬──┘             │
              │        │               YES
             YES      NO               │
              │        │               ▼
              ▼        ▼           Return
         Return   ┌──────────┐    parentTaskId
         petition │ Check
             Id   │ childMap │
                  │.has(id)? │
                  └┬────────┬┘
                   │        │
                  YES      NO
                   │        │
                   ▼        ▼
                Return   ORPHAN
              child's   time entry
              parentId
```

---

## Company Filtering Pipeline

```
RAW timeEntries (no company info)
        ↓
┌─────────────────────────────────────────────┐
│ assignCompanyToTimeEntries()                 │
│                                              │
│ For each timeEntry:                         │
│  ├─ Get collaboratorMap from config         │
│  ├─ Find user in map by normalized name     │
│  └─ Attach: companyName = collaborator.co  │
│                                              │
└────────────┬────────────────────────────────┘
             │
             ▼
enrichedTimeEntries (with companyName field)
        ↓
┌─────────────────────────────────────────────┐
│ filterTimeEntriesByCompany()                 │
│                                              │
│ Filter based on: selectedCompanyFilter      │
│  ├─ null → ALL entries                       │
│  └─ "Sopra Steria" → entries where          │
│     companyName === "Sopra Steria"          │
│                                              │
└────────────┬────────────────────────────────┘
             │
             ▼
filteredTimeEntries
        ↓
┌─────────────────────────────────────────────┐
│ RECALCULATE:                                │
│  ├─ buildCalculatedRequests(                │
│  │   parents,                               │
│  │   children,                              │
│  │   filteredTimeEntries ← FILTERED         │
│  │ )                                        │
│  │                                          │
│  ├─ filteredCalculatedRequests[]            │
│  │                                          │
│  ├─ calculateDashboardSummary(              │
│  │   filteredCalculatedRequests             │
│  │ )                                        │
│  │                                          │
│  └─ filteredSummary ← RECOMPUTED            │
│                                              │
└─────────────────────────────────────────────┘

NOTE: Parents and children NOT filtered
      Only time entries filtered
      Cascading effect on all metrics
```

---

## Chart Data Flow Examples

```
EXAMPLE 1: ChartTotalSummary
┌────────────────────────────────────────┐
│ Input: CalculatedRequest[]             │
│                                        │
│ Computed Processing:                  │
│ ├─ totalEstimated = Σ(r.estimated)    │
│ ├─ totalActual = Σ(r.actual)          │
│ ├─ totalDifference = estimated-actual │
│ ├─ profitCount = filter(loss)         │
│ ├─ lossCount = filter(loss)           │
│ ├─ uniqueApplications = SET(all apps) │
│ ├─ uniquePeople = SET(all people)     │
│ └─ HBS totals                         │
│                                        │
│ Output to eCharts:                    │
│ ├─ Bar: [estimated, actual, diff]     │
│ ├─ Pie: [profit%, loss%, neutral%]    │
│ ├─ Bar: HBS comparison                │
│ └─ Stats cards: 12 KPI values         │
└────────────────────────────────────────┘

EXAMPLE 2: ChartRiskMatrix (commented out)
┌────────────────────────────────────────┐
│ Input: ParentGroupedTableRow[]         │
│                                        │
│ Processing:                           │
│ ├─ buildRiskMatrixData() →            │
│ │  RiskMatrixPoint[]                  │
│ ├─ Group by riskLevel                 │
│ │  ├─ low[], medium[], high[]         │
│ ├─ Map to scatter data:               │
│ │  ├─ x = resultStatusValue(-1,0,1)   │
│ │  ├─ y = riskLevelIndex(0,1,2)       │
│ │  ├─ size = estimated hours          │
│ │  └─ tooltip = full data             │
│                                        │
│ Output to eCharts:                    │
│ ├─ Scatter (bubble) chart             │
│ ├─ 3 series (low, medium, high)       │
│ └─ Tooltip with details               │
└────────────────────────────────────────┘

EXAMPLE 3: ParentGroupedTable (not chart)
┌────────────────────────────────────────┐
│ Input: ParentGroupedTableRow[]         │
│                                        │
│ Apply Filtering:                      │
│ ├─ filterParentGroupedRows()          │
│ │  ├─ Parent filters (code, proj...)  │
│ │  ├─ Child filters (code, subj...)   │
│ │  ├─ User/role/activity filters      │
│ │  └─ Calculate filteredActualHours   │
│                                        │
│ Output to Table Component:            │
│ ├─ Parent row per request             │
│ ├─ Expand → child rows                │
│ ├─ User/role breakdown per child      │
│ └─ All metrics visible                │
└────────────────────────────────────────┘
```

---

## Store Computed Properties

```
STORE (useDashboardStore)
├─ Raw State
│  ├─ parents: ParentRequest[]
│  ├─ children: ChildRequest[]
│  ├─ timeEntries: TimeEntry[]
│  ├─ selectedCompanyFilter: string | null
│  └─ companyCollaborators: CompanyCollaborator[]
│
├─ Calculated State
│  ├─ calculatedRequests: CalculatedRequest[]
│  ├─ orphanTimeEntries: OrphanTimeEntry[]
│  └─ summary: DashboardSummary
│
└─ Computed (Derived)
   ├─ COMPANY FILTERING PIPELINE:
   │  ├─ enrichedTimeEntries
   │  │  = assignCompanyToTimeEntries(
   │  │     timeEntries,
   │  │     companyCollaborators
   │  │   )
   │  │
   │  ├─ filteredTimeEntries
   │  │  = filterTimeEntriesByCompany(
   │  │     enrichedTimeEntries,
   │  │     selectedCompanyFilter
   │  │   )
   │  │
   │  ├─ filteredCalculatedRequests
   │  │  = calculatedRequests filtered by
   │  │    entries in filteredTimeEntries
   │  │
   │  ├─ filteredSummary
   │  │  = calculateDashboardSummary(
   │  │     filteredCalculatedRequests,
   │  │     orphans filtered by company
   │  │   )
   │  │
   │  └─ availableCompanies
   │     = getUniqueCompaniesFromTimeEntries(
   │       enrichedTimeEntries
   │     )
   │
   ├─ LOAD STATUS:
   │  ├─ hasData = parentsLoaded && timeEntriesLoaded
   │  ├─ isProcessing = isProcessingCsv || isCalculating
   │  ├─ canCalculate = allCsvsValid
   │  └─ csvLoadStatus[kind].status = "loading"|"success"|"error"
   │
   └─ ACTIONS:
      ├─ loadParents(file)
      ├─ loadChildren(file)
      ├─ loadTimeEntries(file)
      ├─ recalculate()
      ├─ setCompanyFilter(company)
      ├─ setCompanyCollaborators(collaborators)
      └─ reset()
```
