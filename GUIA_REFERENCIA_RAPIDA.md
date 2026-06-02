# Guía de Referencia Rápida - Rutas y Funciones Clave

## RESUMEN DE 2 GRÁFICAS ACTIVAS

### Gráfica 1: Risk Matrix (Matriz de Riesgo)

```
Ruta: src/components/dashboard/charts/ChartRiskMatrix.vue
Tipo: ECharts ScatterChart
Renderizada en: src/components/ChartsTab.vue (línea 56)
Inputs: ParentGroupedTableRow[]

Qué muestra:
  - Eje X: Resultado (Pérdida -1 → Neutral 0 → Ganancia +1)
  - Eje Y: Nivel de Riesgo (Bajo 0 → Medio 1 → Alto 2)
  - Tamaño burbuja: estimatedHours
  - Colores: Verde (Bajo), Naranja (Medio), Rojo (Alto)

Campos usados:
  - riskLevel (calculado: diferencia < -20 "high", < -5 "medium", else "low")
  - resultStatus ("profit", "loss", "neutral")
  - estimatedHours (tamaño burbuja)
  - actualHours, differenceHours (información en tooltip)

Función clave:
  buildRiskMatrixData() @ src/domain/chartsData.ts:31
```

### Gráfica 2: Deviation Distribution (Distribución de Desviación)

```
Ruta: src/components/dashboard/charts/ChartDeviationDistribution.vue
Tipo: ECharts BarChart
Renderizada en: src/components/ChartsTab.vue (línea 57)
Inputs: ParentGroupedTableRow[]

Qué muestra:
  - Eje X: Rangos de deviationPercent
    < -50%, -50% a -20%, -20% a 0%, 0% a 20%, 20% a 50%, > 50%
  - Eje Y: Cantidad de solicitudes en cada rango
  - Colores: Rojo (pérdida) → Amarillo (neutral) → Verde (ganancia)

Campos usados:
  - deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100

Función clave:
  buildDeviationDistribution() @ src/domain/chartsData.ts:50
```

---

## ESTRUCTURA DE DATOS - JERARQUÍA

```
CSV FILES
  ↓
  ├─ normalizeParentRequests() → ParentRequest[]
  ├─ normalizeChildRequests() → ChildRequest[]
  └─ normalizeTimeEntries() → TimeEntry[]

    Ubicación: src/domain/normalizeCsv.ts

  ↓

CALCULATED REQUESTS
  buildCalculatedRequests() → CalculatedRequest[]
  Ubicación: src/domain/relationships.ts:20

  Campos clave:
    - estimatedHours: SUM(ChildRequest.estimatedHours) o ParentRequest.estimatedHours
    - actualHours: SUM(TimeEntry.hours)
    - deviationPercent: ((actualHours - estimatedHours) / estimatedHours) * 100
    - consumedHbs: Calculado via calculateConsumedHbs()

  ↓

GROUPED ROWS
  buildParentGroupedTableRows() → ParentGroupedTableRow[]
  Ubicación: src/domain/parentGroupedTable.ts:133

  Campos adicionales:
    - riskLevel: Calculado basado en differenceHours
      * < -20   → "high"
      * < -5    → "medium"
      * else    → "low"
    - resultStatus: "profit" | "loss" | "neutral"
    - users[], roles[], activities[], applications[]
    - children[]: ChildRequestGroupedRow[]
      └─ Agrupación por usuario + rol via userRoleHours[]
```

---

## CAMPOS DE TIMEENTRY

```typescript
interface TimeEntry {
  id: string;
  project?: string;
  date?: string;
  createdAt?: string;
  week?: string;
  author?: string;
  user?: string; // ← CRUCIAL: Nombre usuario
  activity?: string;
  petitionRaw?: string;
  petitionId?: string; // ← Resuelve a ChildRequest
  parentTaskRaw?: string;
  parentTaskId?: string; // ← Resuelve a ParentRequest
  tracker?: string;
  status?: string;
  category?: string;
  version?: string;
  comment?: string;
  hours: number; // ← CRUCIAL: Horas dedicadas
  profiledRole?: string; // ← Rol usuario (de, gp, as, etc.)
  cauRole?: string;
  application?: string; // ← Aplicación
  companyName?: string; // ← Asignada en runtime
}
```

### Origen de petitionId/parentTaskId

Resolvedor ubicado en: `src/domain/relationships.ts:174`

```typescript
function resolveParentId(
  te: TimeEntry,
  parentMap,
  childMap,
): string | undefined {
  // Prioridad 1: petitionId → busca en ChildRequest
  if (te.petitionId) {
    const child = childMap.get(te.petitionId);
    if (child?.parentId) return child.parentId;
    if (parentMap.has(te.petitionId)) return te.petitionId;
  }

  // Prioridad 2: parentTaskId → busca en ParentRequest
  if (te.parentTaskId) {
    if (parentMap.has(te.parentTaskId)) return te.parentTaskId;
    const child = childMap.get(te.parentTaskId);
    if (child?.parentId) return child.parentId;
  }

  return undefined; // → Becomes OrphanTimeEntry
}
```

---

## CAMPOS DE CALCULATEDREQUEST

```typescript
interface CalculatedRequest {
  // IDENTIFICACIÓN
  parentId: string;
  code: string;
  subject: string;
  project?: string;
  tracker?: string;
  status?: string;
  application?: string;

  // HORAS - LOS DATOS QUE APARECEN EN GRÁFICAS
  estimatedHours: number; // SUM(ChildRequest.estimatedHours)
  // o ParentRequest.estimatedHours

  actualHours: number; // SUM(TimeEntry.hours)
  // Este es el dato REAL de dedicación

  differenceHours: number; // estimatedHours - actualHours

  deviationPercent: number; // ((actualHours - estimatedHours)
  //   / estimatedHours) * 100
  // RANGE: -∞ a +∞
  // Usado en ChartDeviationDistribution

  resultStatus: ResultStatus; // "profit" | "loss" | "neutral"
  // profit: differenceHours > 0
  // loss:   differenceHours < 0
  // Mapea a Eje X en ChartRiskMatrix

  // HBS - SISTEMA FACTURACIÓN
  estimatedHbs: number; // Siempre 0 (limitación)

  consumedHbs: number; // SUM(TimeEntry.hours * ratio_usuario)
  // ratio viene de HBS_PROFILES por ProfileCode

  differenceHbs: number; // consumedHbs - estimatedHbs

  deviationPercentHbs: number; // ((consumedHbs - estimatedHbs)
  //   / estimatedHbs) * 100
  // No se calcula (estimatedHbs=0)

  resultStatusHbs: ResultStatus; // Inverted logic

  // AGREGACIONES
  childrenCount: number; // # de ChildRequest bajo este Parent

  timeEntriesCount: number; // # de TimeEntry asignadas

  peopleCount: number; // # de usuarios únicos

  people: string[]; // Nombres de usuarios
  // Usado en ChartHoursByPerson

  activities: string[]; // Actividades realizadas

  roles: string[]; // Roles involucrados (DE, GP, AS, etc.)

  applications: string[]; // Aplicaciones relacionadas
  // Usado en ChartHoursByApp

  costWithoutVat?: number; // Costo (si disponible en ChildRequest)
}
```

---

## FUNCIONES CLAVE

### 1. buildCalculatedRequests()

```
Ubicación: src/domain/relationships.ts:20
Input: ParentRequest[], ChildRequest[], TimeEntry[]
Output: { calculatedRequests: CalculatedRequest[], orphanTimeEntries: OrphanTimeEntry[] }

Responsabilidades:
  ✓ Mapear TimeEntry → ParentRequest (via petitionId/parentTaskId)
  ✓ Sumar hours: SUM(TimeEntry.hours) → actualHours
  ✓ Determinar estimatedHours (suma hijos o fallback padre)
  ✓ Calcular HBS consumido via calculateConsumedHbs()
  ✓ Calcular deviationPercent
  ✓ Determinar resultStatus
  ✓ Agregar usuarios, roles, actividades, aplicaciones
  ✓ Detectar TimeEntry huérfanas

Líneas clave:
  - 33: resolveParentId()
  - 76: actualHours = entries.reduce()
  - 72-73: estimatedHours
  - 118: calculateConsumedHbs()
```

### 2. buildParentGroupedTableRows()

```
Ubicación: src/domain/parentGroupedTable.ts:133
Input: ParentRequest[], ChildRequest[], TimeEntry[], CalculatedRequest[]
Output: ParentGroupedTableRow[]

Responsabilidades:
  ✓ Agrupar ChildRequest por ParentRequest
  ✓ Agrupar TimeEntry por ChildRequest
  ✓ Agrupar TimeEntry por usuario + rol (userRoleHours)
  ✓ Calcular riskLevel (basado en differenceHours)
  ✓ Calcular consumptionPercent
  ✓ Agregar usuarios, roles, actividades únicos

Línea clave:
  - 114-118: calculateRiskLevel(differenceHours)
    * < -20   → "high"
    * < -5    → "medium"
    * else    → "low"
```

### 3. buildRiskMatrixData()

```
Ubicación: src/domain/chartsData.ts:31
Input: ParentGroupedTableRow[]
Output: RiskMatrixPoint[]

Transformación simple:
  ✓ Extrae campos relevantes para gráfica
  ✓ Prepara estructura para ECharts
```

### 4. buildDeviationDistribution()

```
Ubicación: src/domain/chartsData.ts:50
Input: ParentGroupedTableRow[]
Output: DeviationBucket[]

Responsabilidades:
  ✓ Agrupar por rangos de deviationPercent
  ✓ Contar solicitudes en cada rango
  ✓ Calcular porcentaje
  ✓ Asignar colores

Rangos codificados (líneas 53-60):
  < -50%        #dc2626 (rojo oscuro)
  -50% a -20%   #f97316 (naranja)
  -20% a 0%     #facc15 (amarillo)
  0% a 20%      #86efac (verde claro)
  20% a 50%     #22c55e (verde)
  > 50%         #16a34a (verde oscuro)
```

### 5. calculateConsumedHbs()

```
Ubicación: src/domain/hbs.ts:78
Input: Array<{ user?: string; hours: number }>
Output: number (HBS total)

Algoritmo:
  FOR EACH timeEntry:
    profile = getCollaboratorProfile(entry.user)
    ratio = HBS_PROFILES[profile].ratio
    hbs += entry.hours * ratio

HBS_PROFILES:
  GP  → 1.69  (Gestor de proyecto)
  CD  → 1.49  (Consultor digital)
  ARQ → 1.33  (Arquitecto de sistemas)
  AS  → 1.18  (Analista de sistemas)
  AN  → 1.16  (Analista de negocio)
  DE  → 1.0   (Desarrollador)
```

### 6. getCollaboratorProfile()

```
Ubicación: src/domain/hbs.ts:49
Input: collaboratorName (string)
Output: ProfileCode | undefined

Busca en COLLABORATORS map (líneas 23-41)

Ejemplo:
  getCollaboratorProfile("Derian Rodriguez") → "DE"
  getCollaboratorProfile("Gerardo García") → "GP"
```

---

## ESTADO GLOBAL (PINIA STORE)

### Ubicación: src/stores/dashboard.ts

```typescript
const useDashboardStore = defineStore("dashboard", () => {
  // Raw data from CSV
  const parents: Ref<ParentRequest[]>;
  const children: Ref<ChildRequest[]>;
  const timeEntries: Ref<TimeEntry[]>;

  // Calculated data
  const calculatedRequests: Ref<CalculatedRequest[]>;
  const orphanTimeEntries: Ref<OrphanTimeEntry[]>;
  const summary: Ref<DashboardSummary | null>;

  // Company filtering
  const selectedCompanyFilter: Ref<string | null>; // "Sopra Steria" por defecto
  const enrichedTimeEntries: Computed; // con companyName asignado
  const filteredTimeEntries: Computed; // filtrado por selectedCompanyFilter
  const filteredCalculatedRequests: Computed; // recalculado
  const filteredSummary: Computed; // recalculado

  // Methods
  function parseCsvFile(file: File): Promise<Record<string, unknown>[]>;
  function loadCsv(kind: CsvKind, file: File): Promise<void>;
  function setSelectedCompanyFilter(company: string | null): void;

  // Computed
  const hasData: Computed; // parentsLoaded && timeEntriesLoaded
  const isProcessing: Computed;
  const canCalculate: Computed;
});
```

### Uso en ChartsTab

```typescript
// src/components/ChartsTab.vue

const props = withDefaults(defineProps<ChartsTabProps>(), {
  requests: () => [],
  parents: () => [],
  children: () => [],
  timeEntries: () => [],
});

// Props pasados desde TabsView:
// :requests="store.filteredCalculatedRequests"
// :parents="store.parents"
// :children="store.children"
// :time-entries="store.filteredTimeEntries"
```

---

## JP, CS, AF - INVESTIGACIÓN

### Búsqueda realizada

```
Grep en todo el código fuente:
  - Archivos .ts: NO ENCONTRADO
  - Archivos .vue: NO ENCONTRADO
  - Archivos .json: NO ENCONTRADO
```

### Hipótesis

Son probablemente valores específicos en los datos CSV en campos como:

- `application`
- `tracker`
- `status`
- `project`
- `category`

### Cómo verificar

1. Inspeccionar archivos CSV de entrada
2. Buscar en la columna de datos que podría contener "JP", "CS", "AF"
3. Si aparecen, estarán en:
   - `CalculatedRequest.application[]`
   - `CalculatedRequest.tracker`
   - `CalculatedRequest.status`
   - O similar

### Uso potencial

Probablemente necesarios para:

- Filtrado adicional en tablas
- Categorización de solicitudes
- Análisis por proyecto/aplicación

---

## TABLAS VS GRÁFICAS

### En TabsView hay 5 tabs principales:

1. **Resumen** → SummaryTab.vue
   - KPIs (no gráficas)
   - Horas estimadas, incurridas, diferencia HBS
2. **Tabla de Peticiones** → DashboardTablesTabs.vue
   - Múltiples subtabs con tablas
   - NO gráficas
3. **Colaboradores** → CollaboratorsTable.vue
   - Tabla de personal
   - NO gráficas
4. **Gráficas** → **ChartsTab.vue** ← AQUÍ ESTÁN LAS 2 GRÁFICAS
   - ChartRiskMatrix (scatter)
   - ChartDeviationDistribution (bar)
5. **Tiempos Huérfanos** → OrphanTimeEntriesPanel.vue
   - Tabla de TimeEntry sin resolver
   - NO gráficas

### Gráficas Adicionales (NO EN CHARTAB)

```
ChartEstimatedVsActual.vue   (Barra - Top 20)
ChartHoursByPerson.vue       (Barra horizontal - Top 15)
ChartHoursByApp.vue          (Pastel - Aplicaciones)
ChartTopLosses.vue           (Barra - Top 10 pérdidas)
```

Estas se renderizarían en otros componentes (ej. SummaryTab, vistas alternativas)

---

## CHECKLIST PARA IMPLEMENTACIONES FUTURAS

- [ ] ¿Entiendo qué es estimatedHours? (suma hijos o fallback padre)
- [ ] ¿Entiendo qué es actualHours? (suma timeEntry.hours)
- [ ] ¿Entiendo deviationPercent? ((actual - estimado) / estimado \* 100)
- [ ] ¿Entiendo riskLevel? (basado en differenceHours: <-20=high, <-5=med, else=low)
- [ ] ¿Entiendo consumedHbs? (horas \* ratio del usuario)
- [ ] ¿Entiendo que estimatedHbs=0 siempre? (limitación del sistema)
- [ ] ¿Sé dónde está ChartsTab.vue? (src/components/)
- [ ] ¿Sé las 2 gráficas que renderiza? (RiskMatrix + DeviationDistribution)
- [ ] ¿Sé qué es buildParentGroupedTableRows()? (agrupa y calcula campos)
- [ ] ¿Sé dónde resolver petitionId/parentTaskId? (relationships.ts:174)
- [ ] ¿Sé los ProfileCodes HBS? (GP, CD, ARQ, AS, AN, DE)
- [ ] ¿Sé cómo filtrar por empresa? (selectedCompanyFilter en store)
