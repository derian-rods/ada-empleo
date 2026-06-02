# RESUMEN EJECUTIVO - CCV Dashboard Analysis

## 📊 GRÁFICAS ACTIVAS: 2

### 1. MATRIZ DE RIESGO (ChartRiskMatrix)

```
Ubicación: src/components/dashboard/charts/ChartRiskMatrix.vue
Renderizada en: ChartsTab.vue (línea 56)

VISUALIZACIÓN:
┌─────────────────────────────────────────────────────┐
│ Eje Y: Nivel de Riesgo                              │
│ Alto    [Color Rojo]        ●                        │
│ Medio   [Color Naranja]     ●       ●                │
│ Bajo    [Color Verde]       ●    ●      ●            │
│         └──────────────────────────────────          │
│         Pérdida    Neutral    Ganancia               │
│         Eje X: Resultado                             │
│                                                      │
│ Tamaño burbuja: estimatedHours                       │
└─────────────────────────────────────────────────────┘

DATOS USADOS:
  - riskLevel (calculado: <-20="high", <-5="medium", else="low")
  - resultStatus ("profit", "loss", "neutral")
  - estimatedHours (tamaño)
  - actualHours, differenceHours (tooltip)
```

### 2. DISTRIBUCIÓN DE DESVIACIÓN (ChartDeviationDistribution)

```
Ubicación: src/components/dashboard/charts/ChartDeviationDistribution.vue
Renderizada en: ChartsTab.vue (línea 57)

VISUALIZACIÓN:
┌─────────────────────────────────────────────────────┐
│ CANTIDAD DE SOLICITUDES                             │
│  │                                                   │
│5 │ ║    ║                                            │
│  │ ║    ║    ║                                       │
│3 │ ║    ║    ║    ║                                  │
│  │ ║    ║    ║    ║    ║    ║                        │
│1 │ ║    ║    ║    ║    ║    ║    ║                   │
│  └─╫────╫────╫────╫────╫────╫────╫───┘               │
│    <-50% -50 -20  0-20  20-50 >50%                   │
│              a  a   a    a                           │
│            -20%  0%  20%  50%                        │
│                                                      │
│ Colores: Rojo→Naranja→Amarillo→Verde claro→Verde   │
└─────────────────────────────────────────────────────┘

DATOS USADOS:
  - deviationPercent (agrupado en 6 rangos)
  - Cuenta de solicitudes por rango
```

---

## 📁 ESTRUCTURA DE DATOS

### Jerarquía de Transformación

```
CSV FILES (3 archivos)
├─ Parents.csv
│  └─ ParentRequest[] (estimatedHours, código, asunto)
│
├─ Children.csv
│  └─ ChildRequest[] (estimatedHours, parentId, código)
│
└─ TimeEntries.csv
   └─ TimeEntry[] (hours, user, petitionId, activity)

    ↓ NORMALIZACIÓN (normalizeCsv.ts)

CÁLCULO DE RELACIONES (relationships.ts)
├─ Mapea TimeEntry → ParentRequest (via petitionId/parentTaskId)
├─ Suma TimeEntry.hours → actualHours
├─ Elige estimatedHours (suma hijos o padre)
├─ Calcula HBS consumido (hours * usuario_ratio)
└─ Detecta TimeEntry huérfanas

    ↓

CALCULATED REQUESTS (CalculatedRequest[])
├─ estimatedHours: 40
├─ actualHours: 35
├─ deviationPercent: -12.5%
├─ resultStatus: "profit"
├─ consumedHbs: 42.3
├─ people: ["Usuario1", "Usuario2"]
└─ ...

    ↓ AGRUPACIÓN (parentGroupedTable.ts)

GROUPED ROWS (ParentGroupedTableRow[])
├─ Agrupa CalculatedRequest con jerarquía
├─ Calcula riskLevel
├─ Agrupa TimeEntry por usuario+rol
├─ Suma usuarios, roles, actividades
└─ children[] (ChildRequestGroupedRow[])

    ↓ GRÁFICAS

CHARTS
├─ ChartRiskMatrix (scatter: resultado vs riesgo)
└─ ChartDeviationDistribution (bar: rangos desviación)
```

---

## 🔢 FÓRMULAS CLAVE

### Estimado

```
estimatedHours = (sum de ChildRequest.estimatedHours)
                 OR
                 ParentRequest.estimatedHours
```

### Dedicado (Real)

```
actualHours = SUM(TimeEntry.hours)
```

### Desviación Porcentual

```
deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100

Rango: -∞% a +∞%
Negativo: Se gastó menos de lo estimado (ganancia)
Positivo: Se gastó más de lo estimado (pérdida)
```

### HBS Consumido

```
FOR EACH TimeEntry:
  ratio = HBS_PROFILES[usuario_profile].ratio
  hbs += TimeEntry.hours * ratio

PERFILES:
  GP (Gestor proyecto): 1.69x
  CD (Consultor digital): 1.49x
  ARQ (Arquitecto): 1.33x
  AS (Analista sistemas): 1.18x
  AN (Analista negocio): 1.16x
  DE (Desarrollador): 1.0x
```

### Risk Level

```
riskLevel = calculateRiskLevel(differenceHours)

Reglas:
  if differenceHours < -20  → "high"   (pérdida > 20h)
  if differenceHours < -5   → "medium" (pérdida 5-20h)
  else                      → "low"    (ganancia o < 5h)
```

---

## 🔍 CAMPOS IMPORTANTES

### TimeEntry (Tiempo Dedicado)

```
CRÍTICOS:
  hours: number           ← HORAS DEDICADAS
  user: string            ← Usuario que registró
  petitionId/parentTaskId ← Resolución a request
  profiledRole: string    ← Rol usuario (de, gp, as...)

ADICIONALES:
  activity: string
  application: string
  date, week, status, category
  companyName (asignado en runtime)
```

### CalculatedRequest

```
PARA GRÁFICAS:
  estimatedHours: number     ← Horas estimadas
  actualHours: number        ← Suma TimeEntry.hours
  deviationPercent: number   ← ((actual - estimado) / estimado) * 100
  resultStatus: string       ← "profit" | "loss" | "neutral"
  riskLevel: string          ← "low" | "medium" | "high"
  consumedHbs: number        ← Horas * ratio HBS

AGREGACIONES:
  people: string[]           ← Usuarios involucrados
  activities: string[]       ← Actividades realizadas
  roles: string[]            ← Roles (de, gp, as...)
  applications: string[]     ← Aplicaciones usadas
```

---

## 🏗️ ARQUITECTURA DE COMPONENTES

### ChartsTab.vue (Contenedor Principal)

```typescript
┌─────────────────────────────────────────┐
│ ChartsTab.vue                           │
│ input: CalculatedRequest[]              │
│                                         │
│ ┌───────────────┐  ┌────────────────┐  │
│ │ ChartRiskMatrix  │ │ ChartDeviation │  │
│ │                │  │ Distribution   │  │
│ │ buildRiskMatrix  │ │ buildDeviation │  │
│ │ Data()         │  │ Distribution()│  │
│ └───────────────┘  └────────────────┘  │
│                                         │
│ ECharts: ScatterChart  │ BarChart       │
└─────────────────────────────────────────┘
```

### Funciones Clave

| Función                         | Ubicación                 | Responsabilidad                           |
| ------------------------------- | ------------------------- | ----------------------------------------- |
| `buildCalculatedRequests()`     | relationships.ts:20       | Mapear TimeEntry→Parent, calcular horas   |
| `buildParentGroupedTableRows()` | parentGroupedTable.ts:133 | Agrupar con jerarquía, calcular riskLevel |
| `buildRiskMatrixData()`         | chartsData.ts:31          | Preparar datos para scatter chart         |
| `buildDeviationDistribution()`  | chartsData.ts:50          | Agrupar por rangos desviación             |
| `calculateConsumedHbs()`        | hbs.ts:78                 | Calcular HBS (horas \* ratio usuario)     |

---

## ❓ JP, CS, AF - INVESTIGACIÓN

### Búsqueda Realizada

- Grep en archivos .ts/.vue: **NO ENCONTRADO**
- Grep en archivos .json: **NO ENCONTRADO**
- Referencias globales: **CERO**

### Hipótesis

Probablemente valores en datos CSV bajo columnas como:

- `application`
- `tracker`
- `status`
- `project`
- `category`

### Recomendación

Revisar archivos CSV de entrada para localizar estos valores

---

## 📊 FLUJO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CARGA                                                    │
│    CSV → Papa.parse() → Normalización                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│ 2. CÁLCULO DE REQUESTS                                      │
│    Mapea TimeEntry → ParentRequest                          │
│    actualHours = SUM(TimeEntry.hours)                       │
│    consumedHbs = SUM(TimeEntry.hours * ratio)               │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│ 3. AGRUPACIÓN                                               │
│    buildParentGroupedTableRows()                            │
│    Calcula riskLevel, consumptionPercent                    │
│    Agrupa TimeEntry por usuario+rol                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│ 4. ALMACENAMIENTO EN STORE                                  │
│    Pinia: useDashboardStore()                               │
│    filteredCalculatedRequests (computed)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│ 5. GRÁFICAS (CHARTSTAB)                                     │
│                                                             │
│    ChartRiskMatrix:        buildRiskMatrixData()            │
│    ├─ Eje X: resultStatus                                   │
│    ├─ Eje Y: riskLevel                                      │
│    └─ Tamaño: estimatedHours                                │
│                                                             │
│    ChartDeviationDistribution: buildDeviationDistribution() │
│    ├─ Eje X: Rangos deviationPercent                        │
│    ├─ Eje Y: Cantidad solicitudes                           │
│    └─ Color: Según rango                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST DE COMPRENSIÓN

- [x] 2 gráficas: ChartRiskMatrix (scatter) + ChartDeviationDistribution (bar)
- [x] Ubicación: src/components/dashboard/charts/
- [x] Renderizadas en: ChartsTab.vue
- [x] Estimados: suma ChildRequest.estimatedHours o ParentRequest.estimatedHours
- [x] Dedicados: SUM(TimeEntry.hours)
- [x] HBS: horas \* ratio_usuario (GP=1.69, DE=1.0, etc.)
- [x] RiskLevel: basado en differenceHours (<-20=high, <-5=med)
- [x] Desviación: ((actual - estimado) / estimado) \* 100
- [x] JP, CS, AF: No encontrado (probablemente en datos CSV)

---

## 📚 DOCUMENTACIÓN GENERADA

Este análisis incluye 5 documentos detallados:

1. **ANALISIS_GRAFICAS_Y_DATOS.md** (14.7 KB)
   - Análisis completo de gráficas y estructura de datos
   - Arquitectura de componentes
   - Cálculos y mapeo de datos

2. **DIAGRAMAS_ARQUITECTURA.md** (24.1 KB)
   - 6 diagramas visuales de flujos
   - Arquitectura de datos
   - Cálculos paso a paso
   - Estados y filtrados

3. **EJEMPLOS_CALCULOS_PRACTICOS.md** (13.6 KB)
   - 6 ejemplos reales con datasets
   - Cálculos paso a paso
   - Visualizaciones de resultados

4. **GUIA_REFERENCIA_RAPIDA.md** (13.4 KB)
   - Referencia rápida de funciones
   - Rutas exactas de archivos
   - Estructura de datos completa
   - Checklist de comprensión

5. **README_ANALISIS_COMPLETO.md** (8.9 KB)
   - Índice de documentación
   - Respuestas rápidas
   - Estructura de carpetas
   - Próximos pasos

---

## 🚀 PRÓXIMOS PASOS

1. **Verificar JP, CS, AF**
   - Revisar archivos CSV
   - Identificar dónde aparecen estos valores
   - Documentar su uso

2. **Nuevas Gráficas**
   - Integrar ChartEstimatedVsActual, ChartHoursByPerson, etc.
   - En ChartsTab o nuevo tab

3. **Validaciones**
   - Confirmar mapeo usuarios ↔ perfiles HBS
   - Probar con dataset real

4. **Pruebas**
   - Usar Ejemplo 1 (ANALISIS_CALCULOS_PRACTICOS.md) como test case
   - Validar visualizaciones
