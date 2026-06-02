# CONCLUSIONES DEL ANÁLISIS

## ✅ ANÁLISIS COMPLETADO

Se ha realizado un análisis exhaustivo del proyecto **CCV Dashboard**, generando **7 documentos** (97 KB) con información completa sobre:

1. Gráficas activas
2. Estructura de datos
3. Flujos de procesamiento
4. Cálculos y fórmulas
5. Ejemplos prácticos

---

## 📊 RESPUESTAS A TUS PREGUNTAS

### 1. ¿Cuáles son las 2 gráficas que están renderizadas ahora?

**RESPUESTA:**

1. **ChartRiskMatrix** (Matriz de Riesgo)
   - Ubicación: `src/components/dashboard/charts/ChartRiskMatrix.vue`
   - Tipo: ECharts ScatterChart (gráfica de dispersión)
   - Eje X: Resultado (Pérdida -1 → Neutral 0 → Ganancia +1)
   - Eje Y: Nivel de Riesgo (Bajo → Medio → Alto)
   - Tamaño burbuja: estimatedHours
   - Colores: Verde (Bajo), Naranja (Medio), Rojo (Alto)

2. **ChartDeviationDistribution** (Distribución de Desviación)
   - Ubicación: `src/components/dashboard/charts/ChartDeviationDistribution.vue`
   - Tipo: ECharts BarChart (gráfica de barras)
   - Eje X: Rangos de desviación porcentual (6 buckets)
   - Eje Y: Cantidad de solicitudes
   - Colores: Gradiente Rojo (pérdida) → Verde (ganancia)

**Ambas se renderizan en**: `src/components/ChartsTab.vue`

---

### 2. ¿Estructura de datos disponibles?

#### **TimeEntry (Tiempo Dedicado)**

Campos más importantes:

```typescript
{
  id: string;
  user: string; // Nombre usuario
  hours: number; // HORAS DEDICADAS
  petitionId: string; // ID solicitud (resuelve a ChildRequest)
  parentTaskId: string; // ID tarea padre (resuelve a ParentRequest)
  profiledRole: string; // Rol usuario (GP, CD, AS, DE, etc.)
  activity: string; // Tipo de actividad
  application: string; // Aplicación usada
  companyName: string; // Asignada en runtime (ej. "Sopra Steria")
}
```

#### **CalculatedRequest (Estimado + Calculado)**

Campos para gráficas:

```typescript
{
  code: string
  subject: string

  // HORAS
  estimatedHours: number     // Suma de hijos o padre
  actualHours: number        // SUM(TimeEntry.hours)
  differenceHours: number    // estimatedHours - actualHours
  deviationPercent: number   // ((actual - estimado) / estimado) * 100
  resultStatus: string       // "profit" | "loss" | "neutral"

  // HBS
  estimatedHbs: number       // Siempre 0 (limitación)
  consumedHbs: number        // SUM(hours * ratio_usuario)

  // AGREGACIONES
  people: string[]           // Usuarios involucrados
  activities: string[]       // Actividades
  roles: string[]            // Roles involucrados
  applications: string[]     // Aplicaciones usadas
}
```

#### **JP, CS, AF**

❌ **NO ENCONTRADOS en el código**

Estos valores probablemente se encuentran en los datos CSV bajo columnas como:

- `application`
- `tracker`
- `status`
- `project`
- `category`

**Necesario investigar con los datos reales.**

---

### 3. ¿Componentes de gráficas?

#### **Librería**: ECharts 6.1.0 + Vue ECharts 8.0.1

#### **Componentes Vue**:

- `ChartRiskMatrix.vue` - Scatter Chart
- `ChartDeviationDistribution.vue` - Bar Chart

#### **Ubicación de ChartsTab**: `src/components/ChartsTab.vue`

#### **Estructura de código de gráficas**:

```
ChartsTab.vue (input: ParentGroupedTableRow[])
  ├─ ChartRiskMatrix
  │   └─ buildRiskMatrixData() (chartsData.ts:31)
  │   └─ ECharts renderizado
  │
  └─ ChartDeviationDistribution
      └─ buildDeviationDistribution() (chartsData.ts:50)
      └─ ECharts renderizado
```

---

### 4. ¿De dónde se sacan los datos?

#### **Estimados** (estimatedHours):

```typescript
// src/domain/relationships.ts:67-73
const childrenEstimated = parentChildren.reduce(
  (sum, c) => sum + c.estimatedHours,
  0,
);
const estimatedHours =
  childrenEstimated > 0 ? childrenEstimated : parent.estimatedHours;
```

Fuente: Campos `estimatedHours` de:

- `ChildRequest` (CSV de hijos)
- Fallback a `ParentRequest` (CSV de padres)

#### **Dedicados** (actualHours):

```typescript
// src/domain/relationships.ts:76
const actualHours = entries.reduce((sum, te) => sum + te.hours, 0);
```

Fuente: Suma de `TimeEntry.hours` para todos los registros asociados

#### **HBS** (consumedHbs):

```typescript
// src/domain/hbs.ts:78-93
FOR EACH TimeEntry:
  profile = COLLABORATORS[user]  // ej. "DE", "GP", "AS"
  ratio = HBS_PROFILES[profile].ratio
  hbs += hours * ratio
```

Perfiles y ratios:

- GP (Gestor de proyecto): 1.69
- CD (Consultor digital): 1.49
- ARQ (Arquitecto de sistemas): 1.33
- AS (Analista de sistemas): 1.18
- AN (Analista de negocio): 1.16
- DE (Desarrollador): 1.0

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
├── domain/
│   ├── types.ts                    # Interfaces
│   ├── relationships.ts            # buildCalculatedRequests()
│   ├── parentGroupedTable.ts       # buildParentGroupedTableRows()
│   ├── chartsData.ts               # Preparación de datos para gráficas
│   └── hbs.ts                      # Cálculos HBS
│
├── components/
│   ├── ChartsTab.vue               # CONTENEDOR (renderiza 2 gráficas)
│   └── dashboard/charts/
│       ├── ChartRiskMatrix.vue      # GRÁFICA 1
│       └── ChartDeviationDistribution.vue  # GRÁFICA 2
│
└── stores/
    └── dashboard.ts                # Estado global (Pinia)
```

---

## 🔄 FLUJO DE DATOS COMPLETO

```
CSV FILES (3)
  ↓
normalizeParentRequests()
normalizeChildRequests()
normalizeTimeEntries()
  ↓
buildCalculatedRequests()
  ├─ Mapea TimeEntry → ParentRequest (via petitionId/parentTaskId)
  ├─ Suma TimeEntry.hours → actualHours
  ├─ Calcula HBS consumido
  └─ CalculatedRequest[]
  ↓
buildParentGroupedTableRows()
  ├─ Agrupa datos con jerarquía
  ├─ Calcula riskLevel
  ├─ Agrupa TimeEntry por usuario+rol
  └─ ParentGroupedTableRow[]
  ↓
buildRiskMatrixData()
buildDeviationDistribution()
  ↓
GRÁFICAS (ECharts)
  ├─ ChartRiskMatrix (scatter)
  └─ ChartDeviationDistribution (bar)
```

---

## 📋 CÁLCULOS IMPORTANTES

### Desviación Porcentual (Usado en ChartDeviationDistribution)

```
deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100

Rango: -∞% a +∞%
Negativo: Se gastó menos (ganancia)
Positivo: Se gastó más (pérdida)
```

### Risk Level (Usado en ChartRiskMatrix - Eje Y)

```
if differenceHours < -20  → "high"   (pérdida > 20h)
if differenceHours < -5   → "medium" (pérdida 5-20h)
else                      → "low"    (ganancia o < 5h)
```

### Consumption Percent

```
consumptionPercent = (actualHours / estimatedHours) * 100
```

### HBS Consumido

```
consumedHbs = SUM(TimeEntry.hours * HBS_PROFILES[profile].ratio)
```

---

## 🎯 MAPEO DE DATOS

| Origen            | Campo            | Destino                    | Uso en Gráficas       |
| ----------------- | ---------------- | -------------------------- | --------------------- |
| CSV Parent        | estimatedHours   | CalculatedRequest          | Base para comparación |
| CSV Child         | estimatedHours   | CalculatedRequest          | Suma de estimado      |
| CSV TimeEntry     | hours            | actualHours                | Base para consumo     |
| CalculatedRequest | deviationPercent | ChartDeviationDistribution | Agrupación en buckets |
| CalculatedRequest | differenceHours  | riskLevel                  | ChartRiskMatrix Eje Y |
| CalculatedRequest | resultStatus     | ChartRiskMatrix Eje X      | Posición horizontal   |
| CalculatedRequest | estimatedHours   | ChartRiskMatrix            | Tamaño burbuja        |

---

## 📚 DOCUMENTACIÓN DISPONIBLE

He generado 7 documentos detallados (97 KB):

1. **RESUMEN_EJECUTIVO.md** (14 KB)
   - Resumen visual de gráficas y flujos

2. **ANALISIS_GRAFICAS_Y_DATOS.md** (14 KB)
   - Análisis completo del proyecto

3. **DIAGRAMAS_ARQUITECTURA.md** (24 KB)
   - 6 diagramas visuales

4. **EJEMPLOS_CALCULOS_PRACTICOS.md** (13 KB)
   - 6 ejemplos reales paso a paso

5. **GUIA_REFERENCIA_RAPIDA.md** (13 KB)
   - Referencia rápida de funciones

6. **README_ANALISIS_COMPLETO.md** (9 KB)
   - Índice y navegación

7. **ARCHIVOS_ANALIZADOS.md** (9 KB)
   - Lista de todos los archivos analizados

---

## ✨ CONCLUSIONES

### Lo que SÍ está claro:

- ✅ 2 gráficas activas bien identificadas
- ✅ Flujo completo de datos documentado
- ✅ Cálculos de estimado, dedicado y HBS explicados
- ✅ Estructura de datos completa
- ✅ Todas las funciones clave localizadas

### Lo que REQUIERE investigación:

- ❓ JP, CS, AF: No encontrados en código (probablemente en datos CSV)
- ❓ Confirmación de mapeo usuario ↔ perfil HBS con datos reales

### Próximas acciones:

1. Verificar JP, CS, AF en archivos CSV
2. Validar cálculos con dataset real
3. Considerar agregar nuevas gráficas (las otras 4 ya existen)
4. Documentación de equipo

---

## 🚀 RECOMENDACIONES

1. **Para entender rápido**: Leer RESUMEN_EJECUTIVO.md (5 min)
2. **Para visualizar**: Ver DIAGRAMAS_ARQUITECTURA.md (10 min)
3. **Para aprender**: Estudiar EJEMPLOS_CALCULOS_PRACTICOS.md (15 min)
4. **Para referencia**: Usar GUIA_REFERENCIA_RAPIDA.md (búsqueda)
5. **Para profundizar**: Leer ANALISIS_GRAFICAS_Y_DATOS.md (30 min)

---

## 📞 INFORMACIÓN

**Análisis realizado**: 2 de junio de 2026
**Proyecto**: CCV Dashboard
**Ambiente**: Windows 11, Node.js, Vue 3.5
**Documentación generada**: 97 KB (7 archivos)

Todos los documentos están disponibles en la raíz del proyecto.
