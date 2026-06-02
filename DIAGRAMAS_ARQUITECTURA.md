# Diagrama Detallado de Arquitectura de Datos y Gráficas

## DIAGRAMA 1: Flujo General de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                        CARGA DE DATOS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CSV Parents          CSV Children        CSV TimeEntries      │
│  (*.csv)              (*.csv)             (*.csv)              │
│   └─┬─┘               └─┬─┘               └─┬─┘               │
│     │                   │                   │                   │
│     │ Papa Parse        │ Papa Parse        │ Papa Parse        │
│     │ (delimiter: ;)    │ (delimiter: ;)    │ (delimiter: ;)    │
│     └────────┬──────────┴────────┬──────────┴─────────────────┘
│              │                   │                             │
│              v                   v                             │
│     ┌────────────────┐  ┌───────────────────┐                 │
│     │ normalizeCsv   │  │ normalizeCsv      │ normalizeCsv    │
│     │ Parents        │  │ Children          │ TimeEntries     │
│     └────────┬───────┘  └───────┬───────────┴─────────────────┘
│              │                   │           │                  │
│              v                   v           v                  │
│     ┌─────────────────────┐ ┌────────────────────────────────┐ │
│     │  ParentRequest[]    │ │ ChildRequest[]                 │ │
│     │                     │ │ TimeEntry[]                    │ │
│     │ - id, code, subject │ │                                │ │
│     │ - estimatedHours    │ │ - parentId, estimatedHours     │ │
│     │ - project, status   │ │ - hours (for TimeEntry)        │ │
│     │ - application       │ │ - user, activity, application  │ │
│     └─────────┬───────────┘ │ - profiledRole, cauRole        │ │
│               │              └────────────┬───────────────────┘ │
│               │                           │                     │
│               └───────────────┬───────────┘                     │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                │ store.loadCsv()
                                │
                                v
┌─────────────────────────────────────────────────────────────────┐
│                  PROCESAMIENTO Y CÁLCULO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  buildCalculatedRequests()                                      │
│  ├─ Mapea TimeEntry → ParentRequest via petitionId             │
│  ├─ SUM(TimeEntry.hours) → actualHours                         │
│  ├─ SUM(ChildRequest.estimatedHours) → estimatedHours          │
│  ├─ calculateConsumedHbs() para cada TimeEntry                 │
│  └─ Retorna CalculatedRequest[]                                │
│      │                                                          │
│      ├─ code, subject, project, status, application           │
│      ├─ estimatedHours, actualHours                           │
│      ├─ differenceHours = estimatedHours - actualHours        │
│      ├─ deviationPercent = (actualHours - estimatedHours)     │
│      │                     / estimatedHours * 100%            │
│      ├─ resultStatus = "profit" | "loss" | "neutral"          │
│      ├─ consumedHbs, estimatedHbs (siempre 0), differenceHbs  │
│      ├─ people[], activities[], roles[], applications[]       │
│      └─ childrenCount, timeEntriesCount, peopleCount          │
│                                                                 │
│              ↓                                                  │
│                                                                 │
│  buildParentGroupedTableRows()                                 │
│  ├─ Agrupa CalculatedRequest con ParentRequest ↔ ChildRequest │
│  ├─ Calcula RiskLevel basado en differenceHours:              │
│  │  - differenceHours < -20  → "high"   (pérdida > 20h)       │
│  │  - differenceHours < -5   → "medium" (pérdida 5-20h)       │
│  │  - else                   → "low"    (ganancia/< 5h)       │
│  ├─ Agrupa TimeEntry por usuario + rol                        │
│  ├─ Calcula consumptionPercent = actualHours/estimatedHours   │
│  └─ Retorna ParentGroupedTableRow[]                           │
│      │                                                          │
│      ├─ parentCode, parentSubject, project, application       │
│      ├─ estimatedHours, actualHours, consumptionPercent       │
│      ├─ differenceHours, deviationPercent                     │
│      ├─ resultStatus, riskLevel ← CRUCIAL para gráficas      │
│      ├─ users[], roles[], activities[], applications[]        │
│      ├─ consumedHbs, estimatedHbs, differenceHbs, etc.        │
│      └─ children[] (ChildRequestGroupedRow[])                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                v
┌─────────────────────────────────────────────────────────────────┐
│                     RENDERIZADO DE GRÁFICAS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ChartsTab.vue                                                  │
│  ├─ Input: ParentGroupedTableRow[]                            │
│  │                                                              │
│  ├─────────────────────────────────────────────────────────────┤
│  │  GRÁFICA 1: ChartRiskMatrix                                 │
│  │                                                              │
│  │  buildRiskMatrixData()                                      │
│  │  └─ Extrae: parentCode, riskLevel, resultStatus,          │
│  │             estimatedHours, actualHours                    │
│  │                                                              │
│  │  Organiza por riskLevel:                                   │
│  │  ├─ low    (color: Verde)                                 │
│  │  ├─ medium (color: Naranja)                               │
│  │  └─ high   (color: Rojo)                                  │
│  │                                                              │
│  │  ECharts ScatterChart:                                      │
│  │  ├─ Eje X: resultStatus (-1=loss, 0=neutral, 1=profit)   │
│  │  ├─ Eje Y: riskLevel (0=low, 1=medium, 2=high)           │
│  │  ├─ Tamaño burbuja: estimatedHours                        │
│  │  └─ Color: riskLevel                                      │
│  │                                                              │
│  ├─────────────────────────────────────────────────────────────┤
│  │  GRÁFICA 2: ChartDeviationDistribution                     │
│  │                                                              │
│  │  buildDeviationDistribution()                              │
│  │  └─ Agrupa por rangos de deviationPercent:                │
│  │     ├─ < -50%        (Rojo oscuro - pérdida mayor)        │
│  │     ├─ -50% a -20%   (Rojo - pérdida)                    │
│  │     ├─ -20% a 0%     (Amarillo - cerca estimado)          │
│  │     ├─ 0% a 20%      (Verde claro - sobre estimado)       │
│  │     ├─ 20% a 50%     (Verde - sobre estimado)             │
│  │     └─ > 50%         (Verde oscuro - sobre estimado alto)  │
│  │                                                              │
│  │  ECharts BarChart:                                          │
│  │  ├─ Eje X: Rangos de desviación                           │
│  │  ├─ Eje Y: Cantidad de solicitudes                        │
│  │  └─ Color: Según rango (automático)                       │
│  │                                                              │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMA 2: Cálculo de Horas y HBS

```
TimeEntry (CSV)
│
├─ [1] RESOLUCIÓN DE PARENTESCO
│  ├─ Si petitionId existe:
│  │  ├─ Busca en ChildRequest
│  │  │  └─ Usa child.parentId ← ESTE ES EL PARENT
│  │  └─ Si no existe en children, busca en ParentRequest
│  │     └─ Usa directamente como parentId
│  │
│  └─ Si parentTaskId existe:
│     ├─ Busca en ParentRequest
│     │  └─ Usa directamente como parentId
│     └─ Si no existe, busca en ChildRequest
│        └─ Usa child.parentId ← ESTE ES EL PARENT
│
│  [SI NO SE RESUELVE → OrphanTimeEntry]
│
├─ [2] AGREGACIÓN POR PARENT
│  └─ parentTimeEntries: Map<parentId, TimeEntry[]>
│
├─ [3] CÁLCULO DE actualHours
│  │
│  ├─ Para cada Parent:
│  │  ├─ entries = parentTimeEntries.get(parentId) ?? []
│  │  ├─ actualHours = SUM(entries[].hours)
│  │  │
│  │  └─ Ejemplo:
│  │     entrada 1: 3.5 horas
│  │     entrada 2: 2.0 horas
│  │     entrada 3: 1.5 horas
│  │     ────────────────────
│  │     actualHours = 7.0 horas
│  │
│  └─ RETORNA: CalculatedRequest.actualHours = 7.0
│
├─ [4] CÁLCULO DE consumedHbs
│  │
│  ├─ Para cada TimeEntry:
│  │  ├─ user = entry.user (ej. "Derian Rodriguez Salazar")
│  │  ├─ profile = COLLABORATORS[user] (ej. "DE")
│  │  ├─ ratio = HBS_PROFILES[profile].ratio
│  │  │  └─ "DE" → ratio = 1.0
│  │  │  └─ "GP" → ratio = 1.69
│  │  │  └─ "AS" → ratio = 1.18
│  │  │  └─ etc.
│  │  │
│  │  ├─ hbs_entry = entry.hours * ratio
│  │  │
│  │  └─ consumedHbs += hbs_entry
│  │
│  └─ Ejemplo con DIFERENTES usuarios:
│     ┌─────────────────────────────────────┐
│     │ TimeEntry 1                         │
│     │ user: "Derian Rodriguez" (DE: 1.0x) │
│     │ hours: 3.5                          │
│     │ HBS: 3.5 * 1.0 = 3.5                │
│     └─────────────────────────────────────┘
│     ┌─────────────────────────────────────┐
│     │ TimeEntry 2                         │
│     │ user: "Gerardo García" (GP: 1.69x)  │
│     │ hours: 2.0                          │
│     │ HBS: 2.0 * 1.69 = 3.38              │
│     └─────────────────────────────────────┘
│     ┌─────────────────────────────────────┐
│     │ TimeEntry 3                         │
│     │ user: "Pedro González" (AS: 1.18x)  │
│     │ hours: 1.5                          │
│     │ HBS: 1.5 * 1.18 = 1.77              │
│     └─────────────────────────────────────┘
│     ────────────────────────────────────────
│     TOTAL:
│     - actualHours: 3.5 + 2.0 + 1.5 = 7.0
│     - consumedHbs: 3.5 + 3.38 + 1.77 = 8.65
│
└─ RETORNA:
   ├─ CalculatedRequest.actualHours = 7.0
   └─ CalculatedRequest.consumedHbs = 8.65

NOTA IMPORTANTE:
─────────────────────────────────────────────────────────────────
estimatedHbs SIEMPRE = 0

Motivo: Las horas estimadas (ParentRequest.estimatedHours)
NO están asociadas a un usuario específico, por lo que es
imposible aplicar los ratios HBS individuales.

Es un limitation del sistema: los estimados son a nivel de
solicitud, no por persona.
```

---

## DIAGRAMA 3: Estructura de TimeEntry Agrupado

```
ParentGroupedTableRow
│
├─ parentId: "P001"
├─ parentCode: "REQ-2024-001"
├─ parentSubject: "Sistema de reportes"
├─ estimatedHours: 40
├─ actualHours: 45
├─ riskLevel: "high"  ← porque diferencia < -20
├─ resultStatus: "loss"  ← porque actualHours > estimatedHours
├─ consumptionPercent: 112.5% ← 45/40 * 100
│
├─ users: ["Derian Rodriguez", "Gerardo García", "Pedro González"]
├─ roles: ["DE", "GP", "AS"]
├─ activities: ["Desarrollo", "Coordinación", "Análisis"]
├─ applications: ["Portal", "Sistema Reportes"]
│
└─ children: ChildRequestGroupedRow[]
   │
   ├─ ChildRequestGroupedRow {
   │  ├─ childCode: "SUB-001"
   │  ├─ childSubject: "Módulo de usuarios"
   │  ├─ estimatedHours: 20
   │  ├─ actualHours: 22
   │  ├─ userRoleHours: [
   │  │  {
   │  │    user: "Derian Rodriguez",
   │  │    role: "DE",
   │  │    hours: 15,
   │  │    activities: ["Desarrollo"]
   │  │  },
   │  │  {
   │  │    user: "Pedro González",
   │  │    role: "AS",
   │  │    hours: 7,
   │  │    activities: ["Testing"]
   │  │  }
   │  ]
   │  └─ timeEntriesCount: 8  ← registros individuales
   │
   └─ ChildRequestGroupedRow {
      ├─ childCode: "SUB-002"
      ├─ childSubject: "API de integración"
      ├─ estimatedHours: 20
      ├─ actualHours: 23
      ├─ userRoleHours: [
      │  {
      │    user: "Derian Rodriguez",
      │    role: "DE",
      │    hours: 18,
      │    activities: ["Desarrollo", "Deploy"]
      │  },
      │  {
      │    user: "Gerardo García",
      │    role: "GP",
      │    hours: 5,
      │    activities: ["Coordinación"]
      │  }
      │]
      └─ timeEntriesCount: 6  ← registros individuales

FLUJO DE AGRUPACIÓN:
─────────────────────────────────────────────────────────────────

TimeEntry[] (múltiples registros para la misma persona/rol)
│
├─ T1: user="DR", role="DE", hours=3, activity="Dev"
├─ T2: user="DR", role="DE", hours=4, activity="Dev"
├─ T3: user="DR", role="DE", hours=5, activity="Dev"
├─ T4: user="DR", role="DE", hours=3, activity="Deploy"
├─ T5: user="GG", role="GP", hours=2, activity="Coord"
├─ T6: user="GG", role="GP", hours=3, activity="Coord"
└─ T7: user="PG", role="AS", hours=7, activity="Testing"
│
v
Agrupa por user + role:
│
├─ "DR|DE": {hours: 15, activities: ["Dev", "Deploy"]}
├─ "GG|GP": {hours: 5, activities: ["Coord"]}
└─ "PG|AS": {hours: 7, activities: ["Testing"]}
│
v
Convierte a UserRoleHoursSummary[]:
│
├─ {user: "DR", role: "DE", hours: 15, activities: [...]}
├─ {user: "GG", role: "GP", hours: 5, activities: [...]}
└─ {user: "PG", role: "AS", hours: 7, activities: [...]}
│
v
ChildRequestGroupedRow.userRoleHours = [...]
```

---

## DIAGRAMA 4: HBS Profiles Mapping

```
COLLABORATORS MAPPING
─────────────────────────────────────────────────────────────────

Nombre Usuario                          → Código → Ratio
────────────────────────────────────────────────────────────
Gerardo Manuel García Guillén           → GP     → 1.69
Cristina Domínguez Quirós               → CD     → 1.49
Enriqueta González Pérez                → CD     → 1.49
Diego Manovel Alamillo                  → CD     → 1.49
José Miguel Morales Ortíz               → CD     → 1.49
Pedro González Mora                     → AS     → 1.18
Juan Manuel Lineros Fernández           → AS     → 1.18
Cándido Iglesias Morato                 → AS     → 1.18
Gabriel Díaz Gavira                     → AS     → 1.18
Julián Fernández Corimayo               → DE     → 1.0
Jose Maria Serrano Sáez                 → DE     → 1.0
Fátima Elsayed Torres                   → DE     → 1.0
Francisco Rodríguez Espinosa            → DE     → 1.0
Alfonso Trigueros Benitez               → DE     → 1.0
Laia Benavent Ribelles                  → DE     → 1.0
Derian Rodriguez Salazar                → DE     → 1.0
Kevin Rosales Martínez                  → DE     → 1.0

PERFILES HBS (HBS_PROFILES)
─────────────────────────────────────────────────────────────────

Código   Descripción                         Ratio
─────────────────────────────────────────────────────────────────
GP       Gestor de proyecto                  1.69  ← Mayor coste
CD       Consultor digital                   1.49
ARQ      Arquitecto de sistemas              1.33
AS       Analista de sistemas                1.18
AN       Analista de negocio                 1.16
DE       Desarrollador                       1.0   ← Base


CÁLCULO DEL RATIO
─────────────────────────────────────────────────────────────────

Si TimeEntry tiene:
  - user = "Gerardo Manuel García Guillén"
  - hours = 8.0

Proceso:
  1. COLLABORATORS["Gerardo Manuel García Guillén"] → "GP"
  2. HBS_PROFILES["GP"].ratio → 1.69
  3. HBS = 8.0 * 1.69 = 13.52

Interpretación:
  - Una hora de un GP (project manager) "vale" 1.69 horas en HBS
  - Una hora de un DE (developer) "vale" 1.0 hora en HBS
  - Esto refleja que los roles de mayor responsabilidad cuestan más

FALLBACK:
  Si usuario NO está en COLLABORATORS:
    → Log warning
    → Usa ratio 1.0 (como si fuera DE)
```

---

## DIAGRAMA 5: Filtrado por Empresa

```
Entrada:
TimeEntry[] (todas las personas)
│
v
assignCompanyToTimeEntries()
│
├─ Busca cada user en SOPRA_STERIA_COLLABORATORS
├─ Si está en la lista → asigna companyName = "Sopra Steria"
├─ Si no está → companyName = null o vacío
│
v
enrichedTimeEntries = TimeEntry[] + companyName
│
v
USUARIO SELECCIONA FILTRO:
selectedCompanyFilter = "Sopra Steria"
│
v
filterTimeEntriesByCompany()
│
├─ Filtra por companyName === "Sopra Steria"
│
v
filteredTimeEntries = TimeEntry[]
│ (solo de Sopra Steria)
│
v
buildCalculatedRequests()
│ (usa filteredTimeEntries)
│
v
filteredCalculatedRequests = CalculatedRequest[]
│ (solo con horas de Sopra Steria)
│
v
buildParentGroupedTableRows()
│ (agrupa)
│
v
GRÁFICAS SE ACTUALIZAN
│ (automáticamente via computed property)
```

---

## DIAGRAMA 6: Estado Global (Pinia Store)

```
useDashboardStore()
│
├─ RAW DATA (cargados de CSV):
│  ├─ parents: ParentRequest[]
│  ├─ children: ChildRequest[]
│  └─ timeEntries: TimeEntry[]
│
├─ CALCULATED DATA:
│  ├─ calculatedRequests: CalculatedRequest[]
│  ├─ orphanTimeEntries: OrphanTimeEntry[]
│  └─ summary: DashboardSummary
│
├─ COMPANY FILTERING:
│  ├─ companyCollaborators: CompanyCollaborator[]
│  ├─ selectedCompanyFilter: string | null
│  └─ enrichedTimeEntries: TimeEntry[] (computed)
│
├─ FILTERED DATA (computed):
│  ├─ filteredTimeEntries: TimeEntry[]
│  ├─ filteredCalculatedRequests: CalculatedRequest[]
│  ├─ filteredSummary: DashboardSummary
│  └─ availableCompanies: string[]
│
├─ LOAD STATUS:
│  ├─ csvLoadStatus: {parents, children, timeEntries}
│  ├─ parentsLoaded: boolean
│  ├─ childrenLoaded: boolean
│  ├─ timeEntriesLoaded: boolean
│  ├─ isCalculating: boolean
│  └─ hasData: computed boolean
│
└─ ERROR HANDLING:
   ├─ errors: string[]
   └─ warnings: string[]

MÉTODOS:
─────────────────────────────────────────────────────────────────
loadCsv(kind, file)
  → Parsea CSV
  → Normaliza datos
  → Construye CalculatedRequests
  → Actualiza store

setSelectedCompanyFilter(company)
  → filteredTimeEntries se recalcula (computed)
  → filteredCalculatedRequests se recalcula
  → Gráficas se actualizan automáticamente
```
