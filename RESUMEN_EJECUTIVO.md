# Análisis del Proyecto - RESUMEN EJECUTIVO

**Proyecto**: CCV Dashboard - Control de Peticiones ADA-Empleo  
**Fecha**: 31 de mayo de 2026  
**Estado**: Análisis previo a cambios

---

## 📋 LISTA DE ARCHIVOS RELEVANTES

### Interfaz y Presentación

```
index.html                                    ← TÍTULO "CCV Dashboard" está aquí
src/components/
  ├─ DashboardKpis.vue                       ← KPIs (10 cards, incluye "Horas reales" L:28)
  ├─ SummaryTab.vue                          ← Resumen simplificado ("Horas reales" L:48)
  ├─ AppLayout.vue                           ← Estructura principal
  ├─ CsvUploadPanel.vue                      ← Carga de los 3 CSVs
  ├─ TabsView.vue                            ← Gestor de pestañas
  └─ dashboard/
      ├─ tables/
      │  ├─ ParentRequestsTable.vue          ← Tabla padres (header "Reales" L:85)
      │  ├─ ChildRequestsTable.vue
      │  ├─ ParentGroupedRequestsTable.vue
      │  ├─ ParentProjectGroupTable.vue
      │  └─ UsersTable.vue
      └─ charts/
         ├─ ChartRiskMatrix.vue
         └─ ChartDeviationDistribution.vue
```

### Lógica de Negocio (Domain Layer)

```
src/domain/
  ├─ types.ts                                 ← Interfaces (ParentRequest, CalculatedRequest, etc)
  ├─ normalizeCsv.ts                         ← Parseo CSV + conversión números
  ├─ csvUtils.ts                             ← Helpers (parseCsvNumber, cleanText)
  ├─ relationships.ts                         ← ALGORITMO CENTRAL: calcula estimated/actual/deviation
  ├─ calculations.ts                         ← Resumen agregado (DashboardSummary)
  ├─ tableAggregations.ts                    ← Formatea datos para tablas
  └─ chartsData.ts                           ← Formatea datos para gráficos
```

### State Management

```
src/stores/
  ├─ dashboard.ts                            ← Pinia store (carga, normalización, cálculos)
  └─ theme.ts                                ← Tema claro/oscuro
```

---

## 🔄 FLUJO DE DATOS (Resumido)

```
1. CARGA
   Usuario selecciona 3 CSVs (padres, hijas, tiempo) en CsvUploadPanel.vue

2. PARSEO
   Store.dashboard.ts usa PapaParse (delimitador `;`, UTF-8)

3. NORMALIZACIÓN
   normalizeCsv.ts → ParentRequest[], ChildRequest[], TimeEntry[]
   - Números en formato español (comas como decimales)
   - Horas estimadas: Profile → Total → Fallback

4. RELACIONES
   relationships.ts::buildCalculatedRequests() → CalculatedRequest[]
   - Mapea TimeEntry a ParentRequest
   - Calcula: estimatedHours, actualHours, differenceHours, deviationPercent, resultStatus
   - Genera orphanTimeEntries (entries sin padre)

5. RESUMEN
   calculations.ts → DashboardSummary
   - Totales, promedios, conteos

6. RENDIZADO
   Componentes leen desde store y muestran datos
```

---

## 🎯 RESPUESTAS A TUS PREGUNTAS

### 1️⃣ ¿Dónde está el título "CCV Dashboard"?

- **Archivo**: `index.html` línea 7
- **Ubicación**: `<title>CCV Dashboard</title>`

### 2️⃣ ¿Dónde aparecen "horas reales", "Horas reales", "reales", "tiempo real"?

| Texto          | Archivo                 | Línea | Contexto           |
| -------------- | ----------------------- | ----- | ------------------ |
| "Horas reales" | DashboardKpis.vue       | 28    | Card title         |
| "Horas reales" | SummaryTab.vue          | 48    | Card title         |
| "Reales"       | ParentRequestsTable.vue | 85    | Column header      |
| "Horas reales" | dashboard.ts            | 276   | Validation message |

### 3️⃣ ¿Dónde se calculan estimadas/incurridas/diferencia/desviación?

**Estimadas** (`estimatedHours`)

- `relationships.ts:66-72` - Prioridad: SUM(children) si > 0, sino parent.estimatedHours

**Incurridas/Reales** (`actualHours`)

- `relationships.ts:75` - SUM(timeEntries.hours) para este padre

**Diferencia** (`differenceHours`)

- `relationships.ts:77` - estimatedHours - actualHours

**Desviación %** (`deviationPercent`)

- `relationships.ts:78-81` - ((actualHours - estimatedHours) / estimatedHours) \* 100

**Resumen Dashboard**

- `calculations.ts:7-52` - Agregación de todos los requests

### 4️⃣ ¿Dónde se renderizan cards/pestañas/tablas/gráficos?

**Cards de resumen**

- DashboardKpis.vue (10 cards expandidas)
- SummaryTab.vue (4 cards simplificadas)

**Pestañas principales**

- TabsView.vue gestiona:
  - Summary (SummaryTab.vue)
  - Tables (DashboardTablesTabs.vue)
  - Charts (ChartsTab.vue)
  - Orphans (OrphanTimeEntriesPanel.vue)

**Tablas de peticiones**

- ParentRequestsTable.vue
- ChildRequestsTable.vue
- ParentGroupedRequestsTable.vue
- ParentProjectGroupTable.vue
- UsersTable.vue

**Tabla de orphans**

- OrphanTimeEntriesPanel.vue

**Gráficos**

- ChartRiskMatrix.vue (scatter plot: desviación vs diferencia)
- ChartDeviationDistribution.vue (histograma)
- ChartEstimatedVsActual.vue
- ChartHoursByApp.vue
- ChartHoursByPerson.vue
- ChartTopLosses.vue

### 5️⃣ ¿Estructura de datos después de CSV?

**Raw Data**

- parents: ParentRequest[]
- children: ChildRequest[]
- timeEntries: TimeEntry[]

**Calculated Data**

- calculatedRequests: CalculatedRequest[]
- orphanTimeEntries: OrphanTimeEntry[]
- summary: DashboardSummary

**Para Tablas**

- ParentRequestTableRow[] (de tableAggregations.ts)
- UserTableRow[]
- ChildRequestTableRow[]

### 6️⃣ ¿Horas estimadas asociadas a colaborador/perfil/rol?

**❌ NO**

- Estimadas están **SOLO a nivel de petición** (parent o child)
- No hay "Juan estimó 40h", solo "Petición X = 40h estimadas"
- Roles/perfiles aparecen en TimeEntry (profiledRole, cauRole) como contexto de la imputación

### 7️⃣ ¿Horas incurridas asociadas a usuario/colaborador?

**✅ SÍ**

- TimeEntry.user = usuario que imputó
- Cada hora está 100% asociada a un usuario
- Se agrupa en CalculatedRequest.people (usuarios únicos)
- Se visualiza en UsersTable.vue y gráficos

### 8️⃣ ¿Componentes reutilizables vs duplicados?

**Reutilizable**

- ParentRequestsTable.vue (props-based, genérico)
- Domain functions (normalizeCsv, relationships, calculations)

**DUPLICADO (⚠️)**

- DashboardKpis.vue + SummaryTab.vue hacen lo MISMO (10 vs 4 cards)
- RequestsTable.vue (viejo, no se usa)
- ChartsTab.vue (posible redundancia)

---

## ⚠️ RIESGOS DETECTADOS

| Severidad   | Riesgo                                                         | Ubicación              |
| ----------- | -------------------------------------------------------------- | ---------------------- |
| 🔴 CRÍTICO  | Sin validación en orphan detection (puede perder imputaciones) | relationships.ts:31-46 |
| 🔴 CRÍTICO  | Horas estimadas de perfiles sin validación                     | normalizeCsv.ts:6-21   |
| 🔴 CRÍTICO  | Sin tests en domain layer                                      | src/domain/\*          |
| 🟡 MODERADO | Duplicación DashboardKpis vs SummaryTab                        | src/components/\*      |
| 🟡 MODERADO | Inconsistencia: "reales" vs "incurridas" vs "actualHours"      | Múltiples archivos     |
| 🟢 MENOR    | Componentes viejos sin limpiar (RequestsTable, HelloWorld)     | src/components/\*      |

---

## ❓ DUDAS FUNCIONALES SIN RESPUESTA

1. **¿Costo por petición?**
   - ChildRequest tiene `costWithoutVat`
   - ParentRequest NO tiene costo
   - ¿Se debe calcular costo total = SUM(children.cost)?

2. **¿Horas son laborales o de calendario?**
   - Afecta validación de realismo

3. **¿Roles tienen tarifa diferente?**
   - profiledRole vs cauRole en TimeEntry
   - ¿Diferentes costes por rol?

4. **¿Catálogo de actividades?**
   - Activities es libre en TimeEntry
   - ¿Predefinidas o cualquier valor?

5. **¿Validar coherencia temporal?**
   - ¿Detectar imputaciones antes de fecha de inicio de petición?

---

## 📊 ESTRUCTURA DEL PROYECTO

```
ccv-dashboard/
├── index.html                          ← TÍTULO aquí
├── src/
│   ├── App.vue                         ← Componente raíz
│   ├── main.ts                         ← Punto entrada
│   ├── style.css                       ← Estilos globales
│   ├── domain/                         ← LÓGICA PURA (sin UI)
│   │   ├── types.ts
│   │   ├── normalizeCsv.ts
│   │   ├── relationships.ts            ← **ALGORITMO CENTRAL**
│   │   ├── calculations.ts
│   │   ├── tableAggregations.ts
│   │   └── chartsData.ts
│   ├── stores/                         ← ESTADO (Pinia)
│   │   ├── dashboard.ts
│   │   └── theme.ts
│   ├── components/                     ← COMPONENTES VUE
│   │   ├── AppLayout.vue
│   │   ├── DashboardKpis.vue           ← **10 CARDS**
│   │   ├── SummaryTab.vue              ← **4 CARDS (DUPLICADO)**
│   │   ├── CsvUploadPanel.vue
│   │   └── dashboard/
│   │       ├── tables/
│   │       └── charts/
│   ├── theme/                          ← Temas (colores, variables CSS)
│   ├── composables/                    ← Hooks reutilizables
│   ├── services/                       ← Servicios
│   └── views/                          ← Vistas principales
├── public/                             ← Assets estáticos
└── package.json

**TOTAL**: 60+ archivos, estructura LIMPIA y bien organizada
```

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. **Proporciona el documento de cambios** que el cliente requiere
2. **Confirma dudas funcionales** (puntos 1-5 arriba)
3. **Valida que datos de test** estén disponibles para verificación
4. **Planificaremos fases específicas** basadas en cambios reales

Una vez hayas proporcionado esa info, podremos hacer un **Plan de Implementación Detallado** sin riesgo.

---

**ANÁLISIS COMPLETADO - LISTO PARA CAMBIOS**
