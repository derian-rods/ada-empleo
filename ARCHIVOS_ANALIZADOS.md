# Archivos del Proyecto Analizados

## DOCUMENTACIÓN GENERADA (6 archivos - 87.1 KB)

```
✓ RESUMEN_EJECUTIVO.md                    (14.0 KB)
✓ ANALISIS_GRAFICAS_Y_DATOS.md           (14.4 KB)
✓ DIAGRAMAS_ARQUITECTURA.md              (23.5 KB)
✓ EJEMPLOS_CALCULOS_PRACTICOS.md         (13.3 KB)
✓ GUIA_REFERENCIA_RAPIDA.md              (13.1 KB)
✓ README_ANALISIS_COMPLETO.md             (8.8 KB)
                                          ───────
                                Total: 87.1 KB
```

**Ubicación**: C:\Users\derodriguez\Documents\projects\ccv-dashboard\

---

## ARCHIVOS FUENTE ANALIZADOS DEL PROYECTO

### DOMAIN / LÓGICA DE NEGOCIO

```
src/domain/
├── types.ts                    ✓ Analizado
│   └─ Tipos: ParentRequest, ChildRequest, TimeEntry,
│      CalculatedRequest, DashboardSummary, ResultStatus
│
├── relationships.ts            ✓ Analizado
│   └─ buildCalculatedRequests(): Mapea TimeEntry→Parent
│   └─ resolveParentId(): Resuelve petitionId/parentTaskId
│
├── parentGroupedTable.ts       ✓ Analizado
│   └─ buildParentGroupedTableRows(): Agrupa datos con jerarquía
│   └─ calculateRiskLevel(): Determina nivel de riesgo
│   └─ filterParentGroupedRows(): Aplica filtros
│
├── chartsData.ts               ✓ Analizado
│   └─ buildRiskMatrixData(): Prepara datos scatter
│   └─ buildDeviationDistribution(): Agrupa por rangos
│   └─ getRiskLevelValue(), getResultStatusValue()
│
├── calculations.ts             ✓ Analizado
│   └─ calculateDashboardSummary(): Resumen agregado
│
├── hbs.ts                      ✓ Analizado
│   └─ HBS_PROFILES: Mapeo de ratios por perfil
│   └─ COLLABORATORS: Mapeo usuario → perfil
│   └─ calculateConsumedHbs(): Calcula HBS de TimeEntry
│   └─ getCollaboratorProfile(): Busca perfil usuario
│
├── normalizeCsv.ts             ✓ Analizado
│   └─ normalizeParentRequests()
│   └─ normalizeChildRequests()
│   └─ normalizeTimeEntries()
│
├── csvUtils.ts                 ✓ Analizado
├── companies.ts                ✓ Analizado
├── collaborators.ts            ✓ Referenciado
└── gpsae.ts                    ✓ Referenciado
```

### COMPONENTES / VISTA

```
src/components/
├── ChartsTab.vue               ✓ Analizado (CRÍTICO)
│   └─ Renderiza 2 gráficas principales
│   └─ buildParentGroupedTableRows()
│
├── dashboard/charts/
│   ├── ChartRiskMatrix.vue     ✓ Analizado (GRÁFICA 1)
│   │   └─ ECharts ScatterChart
│   │   └─ buildRiskMatrixData()
│   │
│   └── ChartDeviationDistribution.vue  ✓ Analizado (GRÁFICA 2)
│       └─ ECharts BarChart
│       └─ buildDeviationDistribution()
│
├── ChartEstimatedVsActual.vue  ✓ Analizado
├── ChartHoursByPerson.vue      ✓ Analizado
├── ChartHoursByApp.vue         ✓ Analizado
├── ChartTopLosses.vue          ✓ Analizado
├── SummaryTab.vue              ✓ Analizado
├── DashboardKpis.vue           ✓ Referenciado
│
├── dashboard/tables/
│   ├── DashboardTablesTabs.vue ✓ Referenciado
│   ├── ParentGroupedRequestsTable.vue
│   ├── ParentRequestsTable.vue
│   ├── ChildRequestsTable.vue
│   ├── UsersTable.vue
│   └── (otras tablas)
│
├── TabsView.vue                ✓ Analizado
│   └─ Contenedor principal de tabs
│   └─ Importa ChartsTab
│
├── DashboardView.vue           ✓ Analizado
│   └─ CsvUploadPanel
│   └─ TabsView
│
├── CsvUploadPanel.vue          ✓ Referenciado
├── OrphanTimeEntriesPanel.vue  ✓ Referenciado
├── AppLayout.vue               ✓ Referenciado
├── MainNav.vue                 ✓ Referenciado
└── (componentes menores)
```

### VISTAS / PÁGINAS

```
src/views/
├── DashboardView.vue           ✓ Analizado
│   └─ Vista principal
│   └─ Carga CSV y renderiza TabsView
│
├── ChartsView.vue              ✓ Analizado
│   └─ Vista alternativa de gráficas
│   └─ Usa ChartsTab
│
└── TablesView.vue              ✓ Referenciado
```

### ALMACENAMIENTO / ESTADO

```
src/stores/
└── dashboard.ts                ✓ Analizado (CRÍTICO)
    ├─ Pinia store: useDashboardStore()
    ├─ State:
    │  ├─ parents, children, timeEntries
    │  ├─ calculatedRequests, orphanTimeEntries
    │  ├─ selectedCompanyFilter
    │
    ├─ Computed:
    │  ├─ enrichedTimeEntries
    │  ├─ filteredTimeEntries
    │  ├─ filteredCalculatedRequests
    │  ├─ filteredSummary
    │  └─ hasData, isProcessing, canCalculate
    │
    └─ Methods:
       ├─ loadCsv()
       ├─ parseCsvFile()
       └─ setSelectedCompanyFilter()
```

### ENRUTAMIENTO

```
src/
├── router.ts                   ✓ Referenciado
│   └─ Define rutas de vistas
│
└── App.vue                     ✓ Referenciado
    └─ Componente raíz
```

### ESTILOS Y CONFIGURACIÓN

```
src/
├── style.css                   ✓ Referenciado
├── styles/                     ✓ Referenciado
├── theme/
│   ├── preset.ts               ✓ Referenciado
│   └─ Temas de PrimeVue
│
└── composables/
    └── useTheme.ts             ✓ Referenciado
```

### TESTING

```
src/tests/
├── calculations.test.ts        ✓ Referenciado
├── tableAggregations.test.ts   ✓ Referenciado
├── parentGroupedTable.test.ts  ✓ Referenciado
├── relationships.test.ts       ✓ Referenciado
├── normalizeCsv.test.ts        ✓ Referenciado
└── csvUtils.test.ts            ✓ Referenciado
```

### WORKERS

```
src/workers/
└── csvWorker.ts                ✓ Referenciado

src/services/
└── csvWorkerService.ts         ✓ Referenciado
```

---

## CONFIGURACIÓN DEL PROYECTO

```
/
├── package.json                ✓ Analizado
│   └─ echarts: ^6.1.0
│   └─ vue-echarts: ^8.0.1
│   └─ primevue: ^4.5.5
│   └─ pinia: ^3.0.4
│   └─ vue: ^3.5.34
│
├── vite.config.ts              ✓ Referenciado
├── tsconfig.json               ✓ Referenciado
└── .env files                  ✓ Referenciado
```

---

## ESTADÍSTICAS DEL ANÁLISIS

### Archivos Analizados Profundamente

```
✓ 7 archivos de lógica de negocio (domain/)
✓ 12 archivos de componentes/vistas
✓ 1 archivo de store (estado global)
✓ 1 archivo de configuración (package.json)
─────────────────────────────────
Total: 21 archivos analizados en profundidad
```

### Gráficas Identificadas

```
RENDERIZADAS EN CHARTAB:
  1. ChartRiskMatrix (scatter)
  2. ChartDeviationDistribution (bar)

IDENTIFICADAS PERO NO RENDERIZADAS EN CHARTAB:
  3. ChartEstimatedVsActual (bar)
  4. ChartHoursByPerson (bar horizontal)
  5. ChartHoursByApp (pie)
  6. ChartTopLosses (bar)
  7. DashboardKpis (cards)

Total: 7 gráficas/componentes visuales
```

### Funciones Clave Analizadas

```
✓ buildCalculatedRequests()          (relationships.ts:20)
✓ buildParentGroupedTableRows()      (parentGroupedTable.ts:133)
✓ buildRiskMatrixData()              (chartsData.ts:31)
✓ buildDeviationDistribution()       (chartsData.ts:50)
✓ calculateConsumedHbs()             (hbs.ts:78)
✓ getCollaboratorProfile()           (hbs.ts:49)
✓ calculateDashboardSummary()        (calculations.ts:7)
✓ calculateRiskLevel()               (parentGroupedTable.ts:114)
✓ resolveParentId()                  (relationships.ts:174)

Total: 9 funciones clave documentadas
```

### Tipos Analizados

```
✓ ParentRequest
✓ ChildRequest
✓ TimeEntry
✓ CalculatedRequest
✓ ParentGroupedTableRow
✓ ChildRequestGroupedRow
✓ RiskMatrixPoint
✓ DeviationBucket
✓ DashboardSummary
✓ OrphanTimeEntry

Total: 10 interfaces/tipos principales
```

---

## CÓMO USAR ESTA DOCUMENTACIÓN

### Para Entender Rápidamente

→ Leer: **RESUMEN_EJECUTIVO.md** (5 minutos)

### Para Visualizar Arquitectura

→ Leer: **DIAGRAMAS_ARQUITECTURA.md** (10 minutos)

### Para Aprender Cálculos

→ Leer: **EJEMPLOS_CALCULOS_PRACTICOS.md** (15 minutos)

### Para Referencia Técnica

→ Usar: **GUIA_REFERENCIA_RAPIDA.md** (búsqueda rápida)

### Para Análisis Completo

→ Leer: **ANALISIS_GRAFICAS_Y_DATOS.md** (30 minutos)

### Para Índice y Navegación

→ Consultar: **README_ANALISIS_COMPLETO.md**

---

## DATOS NO ENCONTRADOS

### JP, CS, AF

```
✗ No encontrado en código TypeScript/Vue
✗ No encontrado en configuración
✗ No encontrado en tipos

Posibles ubicaciones:
  - Valores en datos CSV de entrada
  - Columnas: application, tracker, status, project, category
  - Necesario investigar con datos reales
```

---

## PRÓXIMAS ACCIONES RECOMENDADAS

1. **Investigación de JP, CS, AF**
   - [ ] Revisar archivos CSV
   - [ ] Buscar patrones de valores
   - [ ] Documentar hallazgos

2. **Validación con Datos Reales**
   - [ ] Cargar dataset de prueba
   - [ ] Ejecutar Ejemplo 1 (EJEMPLOS_CALCULOS_PRACTICOS.md)
   - [ ] Verificar visualizaciones

3. **Nuevas Gráficas**
   - [ ] Integrar ChartEstimatedVsActual
   - [ ] Integrar ChartHoursByPerson
   - [ ] Integrar ChartHoursByApp

4. **Documentación de Equipo**
   - [ ] Compartir esta análisis
   - [ ] Realizar sesión de Q&A
   - [ ] Crear wiki del proyecto

---

## CONTACTO Y PREGUNTAS

Si tienes preguntas sobre:

- **Las 2 gráficas activas**: Ver RESUMEN_EJECUTIVO.md sección "GRÁFICAS ACTIVAS"
- **Cálculo de horas**: Ver EJEMPLOS_CALCULOS_PRACTICOS.md Ejemplo 1
- **Cálculo de HBS**: Ver DIAGRAMAS_ARQUITECTURA.md Diagrama 2
- **Rutas de archivos**: Ver GUIA_REFERENCIA_RAPIDA.md
- **Flujo completo**: Ver ANALISIS_GRAFICAS_Y_DATOS.md sección 5

---

## FECHA DEL ANÁLISIS

**Generado**: 2 de junio de 2026
**Proyecto**: CCV Dashboard
**Rama**: Master
**Estado**: Análisis completo
