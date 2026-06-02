# Índice de Documentación - CCV Dashboard

## Documentos Creados

Este análisis contiene 4 documentos principales:

### 1. **ANALISIS_GRAFICAS_Y_DATOS.md** (Este archivo)

Análisis completo de gráficas, estructura de datos y arquitectura

Secciones:

- 1.  Gráficas actuales (2): RiskMatrix + DeviationDistribution
- 2.  Estructura de datos (TimeEntry, CalculatedRequest, ParentGroupedTableRow)
- 3.  Librería ECharts + arquitectura de componentes
- 4.  Cálculo de datos (estimados, dedicados, HBS)
- 5.  Mapeo de datos y flujo completo
- 6.  Estructura de archivos relevantes
- 7.  Cálculo de riesgo
- 8.  Filtrado por empresa
- 9.  Resumen ejecutivo

### 2. **DIAGRAMAS_ARQUITECTURA.md**

Diagramas visuales de flujos y arquitectura

Contenido:

- Diagrama 1: Flujo general de carga y procesamiento de datos
- Diagrama 2: Cálculo de horas y HBS (con ejemplos)
- Diagrama 3: Estructura de TimeEntry agrupado
- Diagrama 4: Mapeo de HBS Profiles y ratios
- Diagrama 5: Filtrado por empresa
- Diagrama 6: Estado global (Pinia Store)

### 3. **EJEMPLOS_CALCULOS_PRACTICOS.md**

Ejemplos paso a paso de cálculos reales

Ejemplos:

- Ejemplo 1: Cálculo completo de horas y desviación
- Ejemplo 2: Cálculo de RiskLevel
- Ejemplo 3: Distribución de desviación
- Ejemplo 4: Agrupación por usuario + rol
- Ejemplo 5: Cálculo de consumptionPercent
- Ejemplo 6: Filtrado por empresa

### 4. **GUIA_REFERENCIA_RAPIDA.md**

Referencia rápida de funciones, rutas y estructura

Secciones:

- Resumen de 2 gráficas activas (ubicaciones exactas)
- Estructura de datos en jerarquía
- Campos de TimeEntry (con anotaciones)
- Campos de CalculatedRequest (completo con usos)
- Funciones clave (6 funciones con líneas exactas)
- Estado global (Pinia Store)
- Investigación JP, CS, AF
- Comparación Tablas vs Gráficas
- Checklist de comprensión

---

## Respuestas Rápidas a Preguntas

### ¿Cuáles son las 2 gráficas?

1. **ChartRiskMatrix** (Scatter)
   - Ubicación: `src/components/dashboard/charts/ChartRiskMatrix.vue`
   - Eje X: Resultado (-1=loss, 0=neutral, 1=profit)
   - Eje Y: Riesgo (0=low, 1=medium, 2=high)
   - Tamaño: estimatedHours
   - Renderizada en: `ChartsTab.vue:56`

2. **ChartDeviationDistribution** (Bar)
   - Ubicación: `src/components/dashboard/charts/ChartDeviationDistribution.vue`
   - Eje X: Rangos de deviationPercent
   - Eje Y: Cantidad de solicitudes
   - Colores: Rojo→Amarillo→Verde (pérdida→neutral→ganancia)
   - Renderizada en: `ChartsTab.vue:57`

### ¿De dónde salen los estimados?

```typescript
// src/domain/relationships.ts:67-73
const childrenEstimated = parentChildren.reduce(
  (sum, c) => sum + c.estimatedHours,
  0,
);
const estimatedHours =
  childrenEstimated > 0 ? childrenEstimated : parent.estimatedHours;
```

Fuente: Campo `estimatedHours` de:

- `ChildRequest` (CSV de hijos) si existen
- Fallback a `ParentRequest` (CSV de padres)

### ¿De dónde salen los dedicados?

```typescript
// src/domain/relationships.ts:76
const actualHours = entries.reduce((sum, te) => sum + te.hours, 0);
```

Fuente: Campo `hours` de `TimeEntry` (CSV de tiempo)
Sumados todos los registros que se resuelven a ese ParentRequest

### ¿Cómo se calcula HBS?

```typescript
// src/domain/hbs.ts:78-93
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

- Cada `TimeEntry.hours` se multiplica por ratio del usuario
- Ratios: GP=1.69, CD=1.49, ARQ=1.33, AS=1.18, AN=1.16, DE=1.0
- Mapeo usuario→perfil en `COLLABORATORS` (hbs.ts:23-41)

### ¿Qué es JP, CS, AF?

**NO ENCONTRADO en el código**

Probablemente valores en datos CSV (columnas como `application`, `tracker`, `status`)
Necesario investigar los archivos CSV de entrada para confirmar.

### ¿Cuál es el flujo de una hora dedicada?

```
TimeEntry (CSV)
  → petitionId/parentTaskId resuelta
  → Sumada a actualHours
  → Multiplicada por HBS ratio del usuario
  → Agregada a consumedHbs
  → Mostrada en gráficas
```

---

## Estructura de Carpetas Clave

```
src/
├── domain/                          # Lógica de negocio
│   ├── types.ts                     # Interfaces (ParentRequest, CalculatedRequest, TimeEntry)
│   ├── relationships.ts             # buildCalculatedRequests()
│   ├── parentGroupedTable.ts        # buildParentGroupedTableRows()
│   ├── chartsData.ts                # buildRiskMatrixData(), buildDeviationDistribution()
│   ├── calculations.ts              # calculateDashboardSummary()
│   ├── hbs.ts                       # HBS profiles, calculateConsumedHbs()
│   ├── normalizeCsv.ts              # Parseo de CSV
│   └── csvUtils.ts                  # Utilities
│
├── components/
│   ├── ChartsTab.vue                # CONTENEDOR (renderiza 2 gráficas)
│   ├── dashboard/charts/
│   │   ├── ChartRiskMatrix.vue       # GRÁFICA 1
│   │   └── ChartDeviationDistribution.vue  # GRÁFICA 2
│   └── (otras gráficas no renderizadas aquí)
│
├── stores/
│   └── dashboard.ts                 # Estado global + carga CSV
│
└── views/
    ├── DashboardView.vue            # Vista principal
    └── ChartsView.vue               # Vista alternativa de gráficas
```

---

## Funciones Clave Rápido

| Función                         | Ubicación                   | Input                                      | Output                  |
| ------------------------------- | --------------------------- | ------------------------------------------ | ----------------------- |
| `buildCalculatedRequests()`     | `relationships.ts:20`       | Parents, Children, TimeEntries             | CalculatedRequest[]     |
| `buildParentGroupedTableRows()` | `parentGroupedTable.ts:133` | Parents, Children, TimeEntries, Calculated | ParentGroupedTableRow[] |
| `buildRiskMatrixData()`         | `chartsData.ts:31`          | ParentGroupedTableRow[]                    | RiskMatrixPoint[]       |
| `buildDeviationDistribution()`  | `chartsData.ts:50`          | ParentGroupedTableRow[]                    | DeviationBucket[]       |
| `calculateConsumedHbs()`        | `hbs.ts:78`                 | TimeEntry[]                                | number                  |
| `getCollaboratorProfile()`      | `hbs.ts:49`                 | string (usuario)                           | ProfileCode             |

---

## Cómo Encontrar Cosas

### "¿Dónde se calcula riskLevel?"

→ `parentGroupedTable.ts:114-118` función `calculateRiskLevel()`
→ Reglas: `< -20 = "high"`, `< -5 = "medium"`, `else = "low"`

### "¿Dónde se renderiza ChartRiskMatrix?"

→ `ChartsTab.vue:56`
→ Componente: `src/components/dashboard/charts/ChartRiskMatrix.vue`

### "¿Dónde se cargan los CSV?"

→ `useDashboardStore.loadCsv()` en `stores/dashboard.ts`
→ Parse: `Papa.parse()` con delimitador `;`

### "¿Cómo se filtra por empresa?"

→ `store.selectedCompanyFilter` en `dashboard.ts`
→ Computed: `filteredTimeEntries`, `filteredCalculatedRequests`
→ Función: `filterTimeEntriesByCompany()` en `companies.ts`

### "¿Cómo se mapean usuarios a HBS?"

→ `COLLABORATORS` map en `hbs.ts:23-41`
→ Función: `getCollaboratorProfile()` en `hbs.ts:49`

### "¿Dónde está el consumptionPercent?"

→ Calculado en `parentGroupedTable.ts:367-370`
→ Fórmula: `(actualHours / estimatedHours) * 100`

---

## Checklist: ¿He entendido?

- [ ] Las 2 gráficas que se renderizan en ChartsTab
- [ ] Dónde está ChartsTab.vue
- [ ] Qué es ParentGroupedTableRow
- [ ] Cómo se calcula estimatedHours (suma hijos o padre)
- [ ] Cómo se calcula actualHours (suma TimeEntry.hours)
- [ ] Cómo se calcula deviationPercent
- [ ] Qué es riskLevel y cómo se calcula
- [ ] Qué es consumedHbs
- [ ] Por qué estimatedHbs es siempre 0
- [ ] Cómo se resuelve petitionId/parentTaskId
- [ ] Los 6 ProfileCodes HBS y sus ratios
- [ ] Cómo se filtra por empresa
- [ ] El flujo completo: CSV → Normalize → Calculate → Group → Charts

---

## Próximos Pasos Sugeridos

1. **Investigación de JP, CS, AF**
   - Revisar archivos CSV de entrada
   - Buscar dónde aparecen estos valores
   - Determinar si son aplicaciones, trackers, etc.

2. **Posibles nuevas gráficas**
   - Ya existen: ChartEstimatedVsActual, ChartHoursByPerson, ChartHoursByApp, ChartTopLosses
   - Necesario integrar en ChartsTab o crear nuevos tabs

3. **Validaciones**
   - Confirmar que usuarios en CSV coinciden con COLLABORATORS
   - Verificar manejo de usuarios desconocidos (fallback DE con ratio 1.0)

4. **Pruebas**
   - Crear dataset de prueba
   - Validar cálculos de ejemplo 1
   - Validar visualizaciones de gráficas
