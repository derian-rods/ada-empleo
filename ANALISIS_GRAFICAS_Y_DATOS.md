# Análisis Completo del Proyecto CCV Dashboard

## 1. GRÁFICAS ACTUALES RENDERIZADAS

El proyecto tiene **2 gráficas principales activas** en la tab "Gráficas", ambas ubicadas en `ChartsTab.vue`:

### 1.1 ChartRiskMatrix (Matriz de Riesgo)

- **Ubicación**: `src/components/dashboard/charts/ChartRiskMatrix.vue`
- **Tipo**: Scatter Chart (Gráfica de dispersión)
- **Renderizado en**: `ChartsTab.vue` línea 56
- **Qué muestra**:
  - Eje X: Resultado (Pérdida -1 → Neutral 0 → Ganancia +1)
  - Eje Y: Nivel de Riesgo (Bajo, Medio, Alto)
  - Tamaño de burbuja: Horas estimadas
  - Colores: Verde (Bajo), Naranja (Medio), Rojo (Alto)
- **Datos que usa**:
  - `ParentGroupedTableRow[]` (desde `buildParentGroupedTableRows()`)
  - Campos: `riskLevel`, `resultStatus`, `estimatedHours`, `actualHours`, `differenceHours`

### 1.2 ChartDeviationDistribution (Distribución de Desviación)

- **Ubicación**: `src/components/dashboard/charts/ChartDeviationDistribution.vue`
- **Tipo**: Bar Chart (Gráfica de barras)
- **Renderizado en**: `ChartsTab.vue` línea 57
- **Qué muestra**:
  - Rangos de desviación: < -50%, -50% a -20%, -20% a 0%, 0% a 20%, 20% a 50%, > 50%
  - Cantidad de solicitudes por rango
  - Colores degradados: Rojo (pérdida) → Amarillo (neutral) → Verde (ganancia)
- **Datos que usa**:
  - `ParentGroupedTableRow[]`
  - Campos: `deviationPercent`

### Gráficas Adicionales (No Renderizadas en ChartsTab)

Existen otras gráficas en el proyecto que NO se renderizan en `ChartsTab.vue`, pero sí en otras vistas:

- **ChartEstimatedVsActual**: Barra doble de Top 20 estimado vs incurrido
- **ChartHoursByPerson**: Barra horizontal de Top 15 personas con más horas
- **ChartHoursByApp**: Gráfica de pastel de distribución por aplicación
- **ChartTopLosses**: Barra de Top 10 pérdidas mayores
- **DashboardKpis**: KPIs resumidas

---

## 2. ESTRUCTURA DE DATOS DISPONIBLES

### 2.1 TimeEntry (Tiempo Dedicado)

**Ubicación**: `src/domain/types.ts` líneas 47-70

Campos disponibles:

```typescript
interface TimeEntry {
  id: string;
  project?: string;
  date?: string;
  createdAt?: string;
  week?: string;
  author?: string;
  user?: string; // Nombre del usuario que registró la hora
  activity?: string; // Tipo de actividad realizada
  petitionRaw?: string; // ID de la petición (texto)
  petitionId?: string; // ID de la petición resuelta
  parentTaskRaw?: string; // ID de la tarea padre (texto)
  parentTaskId?: string; // ID de la tarea padre resuelta
  tracker?: string;
  status?: string;
  category?: string;
  version?: string;
  comment?: string;
  hours: number; // HORAS DEDICADAS - Este es el dato clave
  profiledRole?: string; // Rol del usuario (ej. "DE", "GP", "AS")
  cauRole?: string; // Rol alternativo
  application?: string; // Aplicación donde se registró
  companyName?: string; // Empresa asignada (ej. "Sopra Steria")
}
```

**Origen de datos**: Se cargan de CSV con delimitador `;` en `useDashboardStore`

### 2.2 CalculatedRequest (Estimado + Calculado)

**Ubicación**: `src/domain/types.ts` líneas 76-103

Campos disponibles:

```typescript
interface CalculatedRequest {
  parentId: string;
  code: string;
  subject: string;
  project?: string;
  tracker?: string;
  status?: string;
  application?: string;

  // HORAS
  estimatedHours: number; // Horas estimadas (suma de hijos o padre)
  actualHours: number; // Horas reales (suma de TimeEntry.hours)
  differenceHours: number; // estimatedHours - actualHours
  deviationPercent: number; // ((actualHours - estimatedHours) / estimatedHours) * 100
  resultStatus: ResultStatus; // "profit" | "loss" | "neutral"

  // HBS (Sistema de Facturación de Horas Bilaterales)
  estimatedHbs: number; // Siempre 0 (no se puede calcular sin datos por usuario)
  consumedHbs: number; // Horas * ratio HBS del usuario
  differenceHbs: number; // consumedHbs - estimatedHbs
  deviationPercentHbs: number;
  resultStatusHbs: ResultStatus;

  // AGREGACIONES
  childrenCount: number; // Número de subtareas
  timeEntriesCount: number; // Número de registros de tiempo
  peopleCount: number; // Número de personas que trabajaron
  people: string[]; // Lista de usuarios (nombres)
  activities: string[]; // Lista de actividades realizadas
  roles: string[]; // Lista de roles involucrados
  applications: string[]; // Lista de aplicaciones
  costWithoutVat?: number; // Costo sin IVA (si disponible)
}
```

### 2.3 JP, CS, AF - ¿Qué son?

**RESPUESTA: NO SON CAMPOS, CATEGORÍAS O TIPOS DE REQUESTS**

Búsqueda exhaustiva: Se hizo una búsqueda global de "JP", "CS", "AF" en todo el código y **NO se encontró ninguna referencia**.

Explicación posible:

- Podrían ser referencias a datos específicos de GPSAE (sistema externo)
- Podrían ser valores en campos `application`, `tracker`, o `status` en los datos CSV
- Podrían ser abreviaturas de equipos/proyectos específicos del cliente

**Recomendación**: Verificar en los archivos CSV de entrada qué valores contienen estos campos para confirmar dónde aparecen JP, CS, AF.

---

## 3. COMPONENTES Y ARQUITECTURA DE GRÁFICAS

### 3.1 Librería Utilizada

**ECharts** (versión 6.1.0) + Vue ECharts wrapper

```json
{
  "echarts": "^6.1.0",
  "vue-echarts": "^8.0.1"
}
```

Componentes ECharts utilizados:

- `BarChart`: Gráficas de barras
- `ScatterChart`: Gráficas de dispersión
- `PieChart`: Gráficas de pastel
- Componentes comunes: `GridComponent`, `TooltipComponent`, `LegendComponent`, `TitleComponent`
- `CanvasRenderer`: Motor de renderizado

### 3.2 Estructura de ChartsTab

**Ubicación**: `src/components/ChartsTab.vue`

```typescript
// Props recibidos
interface ChartsTabProps {
  requests: CalculatedRequest[]      // Datos principales
  parents?: ParentRequest[]          // Para contexto
  children?: ChildRequest[]          // Para contexto
  timeEntries?: TimeEntry[]          // Para contexto
}

// Flujo de procesamiento
1. buildParentGroupedTableRows()    // Agrupa datos en filas
   └─> ParentGroupedTableRow[]

2. Pasa a ChartRiskMatrix
   └─> buildRiskMatrixData()
   └─> Renderiza scatter chart

3. Pasa a ChartDeviationDistribution
   └─> buildDeviationDistribution()
   └─> Renderiza bar chart
```

### 3.3 Flujo de Datos para Gráficas

```
CSV Files (3)
  ↓
normalizeCsv.ts
  ├─ normalizeParentRequests() → ParentRequest[]
  ├─ normalizeChildRequests() → ChildRequest[]
  └─ normalizeTimeEntries() → TimeEntry[]
  ↓
relationships.ts :: buildCalculatedRequests()
  ├─ Mapea TimeEntry → ParentRequest
  ├─ Suma TimeEntry.hours → actualHours
  ├─ Suma ChildRequest.estimatedHours → estimatedHours
  ├─ Calcula HBS consumido via calculateConsumedHbs()
  └─ Retorna CalculatedRequest[]
  ↓
parentGroupedTable.ts :: buildParentGroupedTableRows()
  ├─ Agrupa CalculatedRequest con jerarquía
  ├─ Agrupa TimeEntry por usuario/rol
  ├─ Calcula riskLevel (basado en differenceHours)
  └─ Retorna ParentGroupedTableRow[]
  ↓
ChartsTab.vue
  ├─ ChartRiskMatrix
  │  └─ buildRiskMatrixData() → Prepara datos scatter
  └─ ChartDeviationDistribution
     └─ buildDeviationDistribution() → Prepara datos barras
```

---

## 4. CÁLCULO DE DATOS PARA GRÁFICAS

### 4.1 ESTIMADOS

**Origen**: `CalculatedRequest.estimatedHours`

Cálculo (en `relationships.ts` líneas 67-73):

```typescript
// Prefer sum of children, fallback to parent
const childrenEstimated = parentChildren.reduce(
  (sum, c) => sum + c.estimatedHours,
  0,
);
const estimatedHours =
  childrenEstimated > 0 ? childrenEstimated : parent.estimatedHours;
```

**Fuente**: Campo `estimatedHours` en:

- `ParentRequest.estimatedHours` (tabla padre)
- `ChildRequest.estimatedHours` (tabla hijo)

### 4.2 DEDICADOS (INCURRIDOS)

**Origen**: `CalculatedRequest.actualHours`

Cálculo (en `relationships.ts` línea 76):

```typescript
// Actual hours: always from time entries
const actualHours = entries.reduce((sum, te) => sum + te.hours, 0);
```

**Fuente**: Suma de `TimeEntry.hours` para todos los registros de tiempo asociados

### 4.3 HBS (Sistema de Facturación Bilateral)

**ESTIMADO HBS**: Siempre 0 (línea 125 de `relationships.ts`)

```typescript
const estimatedHbs = 0; // Cannot be calculated from request-level data
```

Motivo: Las horas estimadas no están asociadas a un usuario específico, por lo que no se puede aplicar el ratio HBS.

**CONSUMIDO HBS**: Cálculo en `hbs.ts` (líneas 78-93)

```typescript
function calculateConsumedHbs(
  timeEntries: Array<{ user?: string; hours: number }>,
): number {
  return timeEntries.reduce((total, entry) => {
    const profile = getCollaboratorProfile(entry.user);
    const ratio = getHbsRatioByProfile(profile);
    const hbs = entry.hours * ratio;
    return total + hbs;
  }, 0);
}
```

**Perfiles HBS** (`hbs.ts` líneas 11-18):

```typescript
GP:  Gestor de proyecto      → ratio 1.69
CD:  Consultor digital       → ratio 1.49
AN:  Analista de negocio     → ratio 1.16
ARQ: Arquitecto de sistemas  → ratio 1.33
AS:  Analista de sistemas    → ratio 1.18
DE:  Desarrollador           → ratio 1.0
```

**DIFERENCIA**: `consumedHbs - estimatedHbs` (siempre negativa cuando estimatedHbs=0)

---

## 5. MAPEO DE DATOS UTILIZADOS

### 5.1 Flujo Completo de una Hora Dedicada

```
TimeEntry (CSV)
│
├─ petitionId o parentTaskId
│  └─ Resuelve a ChildRequest o ParentRequest
│
├─ Suma de hours → actualHours
│
├─ user + hours → calculateConsumedHbs()
│  ├─ Busca profile del usuario en COLLABORATORS
│  └─ multiplica hours * HBS_PROFILES[profile].ratio
│
└─ Agregación en CalculatedRequest
   └─ Renderizado en gráficas
```

### 5.2 Campos Clave en Gráficas

| Campo              | Origen                                                   | Uso en Gráficas                                          |
| ------------------ | -------------------------------------------------------- | -------------------------------------------------------- |
| `estimatedHours`   | ParentRequest/ChildRequest                               | ChartRiskMatrix (tamaño burbuja), ChartEstimatedVsActual |
| `actualHours`      | SUM(TimeEntry.hours)                                     | Comparación vs estimado                                  |
| `differenceHours`  | estimatedHours - actualHours                             | ChartRiskMatrix (eje X), ChartDeviationDistribution      |
| `deviationPercent` | ((actualHours - estimatedHours) / estimatedHours) \* 100 | ChartDeviationDistribution (rangos)                      |
| `riskLevel`        | Basado en differenceHours                                | ChartRiskMatrix (eje Y)                                  |
| `resultStatus`     | "profit"/"loss"/"neutral"                                | Colores en gráficas                                      |
| `people[]`         | Usuarios de TimeEntry                                    | ChartHoursByPerson                                       |
| `applications[]`   | Aplicaciones de TimeEntry                                | ChartHoursByApp                                          |

---

## 6. ESTRUCTURA DE ARCHIVOS RELEVANTES

```
src/
├── domain/
│   ├── types.ts                    # Definiciones de tipos
│   ├── relationships.ts            # buildCalculatedRequests()
│   ├── parentGroupedTable.ts       # buildParentGroupedTableRows()
│   ├── chartsData.ts              # buildRiskMatrixData(), buildDeviationDistribution()
│   ├── calculations.ts            # calculateDashboardSummary()
│   ├── hbs.ts                     # HBS calculations & profiles
│   ├── normalizeCsv.ts            # CSV parsing
│   └── csvUtils.ts                # CSV utilities
│
├── components/
│   ├── ChartsTab.vue              # Contenedor de gráficas (2 gráficas)
│   │
│   ├── dashboard/charts/
│   │   ├── ChartRiskMatrix.vue     # Gráfica 1: Matriz de Riesgo
│   │   └── ChartDeviationDistribution.vue  # Gráfica 2: Distribución Desviación
│   │
│   ├── ChartEstimatedVsActual.vue  # (Adicional) Comparativa Top 20
│   ├── ChartHoursByPerson.vue      # (Adicional) Top 15 personas
│   ├── ChartHoursByApp.vue         # (Adicional) Pastel de aplicaciones
│   ├── ChartTopLosses.vue          # (Adicional) Top 10 pérdidas
│   └── SummaryTab.vue              # KPIs (no es gráfica)
│
├── stores/
│   └── dashboard.ts                # Estado global + carga CSV
│
└── views/
    ├── DashboardView.vue           # Vista principal
    └── ChartsView.vue              # Vista alternativa de gráficas
```

---

## 7. CÁLCULO DEL RIESGO (Risk Level)

Ubicación: `parentGroupedTable.ts` líneas 114-118

```typescript
function calculateRiskLevel(differenceHours: number): RiskLevel {
  if (differenceHours < -20) return "high"; // Pérdida mayor a 20h
  if (differenceHours < -5) return "medium"; // Pérdida entre 5-20h
  return "low"; // Ganancia o pérdida menor a 5h
}
```

Este valor se usa en `ChartRiskMatrix` para la posición en eje Y y color.

---

## 8. FILTRADO POR EMPRESA

El sistema soporta filtrado por empresa a través de:

```typescript
// Mapeo de usuarios a empresas (hbs.ts)
COLLABORATORS: Record<string, ProfileCode>
  └─ Mapa de: nombre usuario → perfil HBS

// Asignación dinámica (companies.ts)
assignCompanyToTimeEntries()
filterTimeEntriesByCompany()
getUniqueCompaniesFromTimeEntries()

// En store (dashboard.ts)
selectedCompanyFilter.value = "Sopra Steria"  // Default
↓
filteredTimeEntries (computed)
↓
filteredCalculatedRequests (computed)
↓
Gráficas se actualizan automáticamente
```

---

## 9. RESUMEN EJECUTIVO

### Gráficas Activas en ChartsTab (2)

1. **ChartRiskMatrix**: Scatter plot - Resultado vs Riesgo
2. **ChartDeviationDistribution**: Bar chart - Distribución de desviación porcentual

### Flujo de Datos

```
CSV → Normalize → Calculate Requests → Group Rows → Charts
```

### Fuentes de Datos

- **Estimado**: Campo `estimatedHours` de ParentRequest/ChildRequest
- **Dedicado**: Suma de `TimeEntry.hours` (campo `hours`)
- **HBS**: Cálculo dinámico usando `COLLABORATORS` y `HBS_PROFILES`

### Perfiles (Códigos de Usuario)

- GP: Gestor de proyecto (1.69x)
- CD: Consultor digital (1.49x)
- AN: Analista de negocio (1.16x)
- ARQ: Arquitecto de sistemas (1.33x)
- AS: Analista de sistemas (1.18x)
- DE: Desarrollador (1.0x)

### JP, CS, AF

No encontrados en el código. Probablemente valores en los datos CSV de entrada (fields como `application`, `tracker`, `status`, etc.)
