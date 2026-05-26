---
name: dashboard-ui
description: Use when implementing or improving the Vue UI for the CEETA dashboard. Triggers on UI changes, component creation, or layout adjustments. The UI must be fast, clean, business-focused and built with PrimeVue. The dashboard consumes already normalized and calculated data from the domain layer. It must not contain business calculations directly in components.
---

# Dashboard UI Skill

## Purpose

Use this skill when implementing or improving the Vue UI for the CEETA dashboard.

The UI must be fast, clean, business-focused and built with PrimeVue.

The dashboard consumes already normalized and calculated data from the domain layer.

It must not contain business calculations directly in components.

---

## Stack

Use:

```txt
Vue 3
Vite
TypeScript
PrimeVue
Pinia
ECharts / vue-echarts
```

Do not use:

```txt
Nuxt
Next.js
SSR
Backend
Custom design system
External APIs
Authentication
Database
```

---

## Core UI rule

Use PrimeVue components whenever possible.

Do not create custom base components if PrimeVue already provides one.

Use PrimeVue for:

```txt
Card
Button
DataTable
Column
Toolbar
FileUpload
Dropdown
MultiSelect
Tag
Dialog
ConfirmDialog
Toast
InputText
Calendar
Tabs
Divider
ProgressSpinner
Message
```

---

## Main UI goal

The user should be able to see at a glance:

```txt
Are we gaining or losing hours?
Which parent requests lose more hours?
Which requests are profitable?
Which users, profiles, activities or applications consume more time?
Are there orphan time entries?
```

---

## Recommended UI structure

Create or use this structure:

```txt
src/
  components/
    csv/
      CsvUploader.vue
      CsvUploadPanel.vue
      CsvValidationSummary.vue
    dashboard/
      DashboardKpis.vue
      DashboardFilters.vue
      ProfitLossChart.vue
      TopLossesChart.vue
      HoursByPersonChart.vue
      HoursByRoleChart.vue
      HoursByApplicationChart.vue
      RequestsTable.vue
      OrphanTimeEntriesPanel.vue
    layout/
      AppLayout.vue
  views/
    DashboardView.vue
  stores/
    dashboard.store.ts
```

Do not create all files at once unless explicitly requested.

Work incrementally.

---

## Main screen layout

The dashboard should have:

```txt
1. App header
2. CSV upload section
3. Validation/warnings section
4. Filter section
5. KPI cards
6. Main charts
7. Requests table
8. Orphan time entries panel
```

Suggested visual order:

```txt
Header
CSV Upload
Warnings
Filters
KPI Cards
Charts
Table
Orphans
```

---

## CSV upload UI

The app must support three CSV uploads:

```txt
1. Peticiones padre
2. Peticiones hijas
3. Tiempo dedicado
```

Use PrimeVue `FileUpload` or a clean custom wrapper around a native file input if simpler.

Rules:

- Make clear which CSV is required.
- Show loaded file name.
- Show number of rows parsed.
- Show errors if the wrong file is loaded.
- Do not upload files to a server.
- Parse everything locally in the browser.
- The CSV separator is usually `;`.

Possible labels:

```txt
Peticiones padre
Peticiones hijas
Tiempo dedicado
```

---

## KPI cards

Create a component:

```txt
DashboardKpis.vue
```

It should show:

```txt
Total horas estimadas
Total horas reales
Diferencia total
Desviación media
Peticiones con ganancia
Peticiones con pérdida
Peticiones neutras
Tiempos huérfanos
```

Rules:

- Use PrimeVue `Card`.
- Use clear labels.
- Format numbers to 2 decimals.
- Highlight losses visually.
- Do not overdesign.
- If no data is loaded, show zero or empty state.

---

## Filters

Create a component:

```txt
DashboardFilters.vue
```

Recommended filters:

```txt
Proyecto
Aplicación
Tracker de peticiones
Estado
Versión prevista
Usuario
Actividad
Perfil
Categoría
Resultado: profit/loss/neutral
Solo pérdidas
Rango de fechas
```

Rules:

- Use PrimeVue `Dropdown`, `MultiSelect`, `Calendar`, `Button`.
- Filters must affect KPIs, charts and table.
- Keep filters simple for MVP.
- Do not implement advanced query language.
- Use computed values from loaded data to populate filter options.

---

## Requests table

Create a component:

```txt
RequestsTable.vue
```

Use PrimeVue `DataTable`.

Columns:

```txt
Código
Asunto
Proyecto
Aplicación
Estado
Estimadas
Reales
Diferencia
Desviación
Resultado
Hijas
Imputaciones
Personas
```

Rules:

- Sortable columns.
- Pagination enabled.
- Global search if easy.
- Use `Tag` for result status.
- Profit should be visually distinct from loss.
- Loss rows should be easy to spot.
- Do not load raw CSV rows directly into the table.
- Table must use `CalculatedRequest[]`.

---

## Orphan time entries panel

Create:

```txt
OrphanTimeEntriesPanel.vue
```

Show only if there are orphan time entries.

Columns:

```txt
Fecha
Usuario
Petición
Tarea padre
Horas
Actividad
Comentario
Motivo
```

Rules:

- Use PrimeVue `Message` or `Card`.
- Orphans are warnings, not fatal errors.
- User should understand that these hours were not assigned to any parent request.

---

## Charts

Use ECharts or vue-echarts.

Recommended charts:

```txt
ProfitLossChart.vue
TopLossesChart.vue
HoursByPersonChart.vue
HoursByRoleChart.vue
HoursByApplicationChart.vue
```

Start with only one or two charts.

Do not create all charts before the table and KPIs work.

### ProfitLossChart

Purpose:

Compare estimated vs actual hours by parent request.

Recommended chart:

```txt
bar chart
x-axis: request code or subject
series:
  estimatedHours
  actualHours
```

### TopLossesChart

Purpose:

Show the worst losses.

Sort by:

```ts
differenceHours ascending
```

Worst losses are the most negative values.

### HoursByPersonChart

Purpose:

Show actual hours by user.

Use time entries if available.

### HoursByRoleChart

Purpose:

Show actual hours by role/profile.

Use:

```txt
profiledRole
cauRole
```

### HoursByApplicationChart

Purpose:

Show actual hours by application.

---

## Empty states

Show clear empty states:

```txt
Carga los tres CSV para empezar el análisis.
```

If only some CSV are loaded:

```txt
Faltan CSV por cargar:
- Peticiones hijas
- Tiempo dedicado
```

If calculations return no data:

```txt
No se han podido calcular peticiones. Revisa las relaciones entre CSV.
```

---

## Error and warning UI

Show warnings for:

```txt
CSV padre sin columna #
CSV hija sin columna #
CSV tiempo dedicado sin columna Petición
CSV tiempo dedicado sin columna Horas
Tiempos huérfanos detectados
Peticiones hijas sin padre existente
Peticiones con estimación 0 y horas reales > 0
```

Use PrimeVue:

```txt
Message
Toast
Card
```

---

## Store usage

Use Pinia for application state.

Suggested store:

```txt
src/stores/dashboard.store.ts
```

State:

```ts
parents: ParentRequest[]
children: ChildRequest[]
timeEntries: TimeEntry[]
calculatedRequests: CalculatedRequest[]
orphanTimeEntries: OrphanTimeEntry[]
summary: DashboardSummary | null
filters: DashboardFilters
loading: boolean
errors: string[]
warnings: string[]
```

Actions:

```ts
loadParentCsv(file: File): Promise<void>
loadChildCsv(file: File): Promise<void>
loadTimeCsv(file: File): Promise<void>
recalculate(): void
clearData(): void
setFilters(filters: Partial<DashboardFilters>): void
```

Getters/computed:

```ts
filteredCalculatedRequests
filteredSummary
hasAllCsvLoaded
hasWarnings
hasOrphans
```

Rules:

- Store can orchestrate parsing and domain functions.
- Store should not contain complex calculation logic.
- Complex logic goes to `src/domain`.

---

## Styling

Use a clean enterprise dashboard style:

```txt
light background
cards with spacing
clear typography
compact but readable table
subtle borders
semantic status colors
```

Do not spend excessive time on custom CSS.

PrimeVue theme is enough for MVP.

---

## Accessibility

Basic requirements:

- Buttons have clear labels.
- Inputs have visible labels.
- Tables have readable headers.
- Do not rely only on color for profit/loss.
- Use text labels like `Ganancia`, `Pérdida`, `Neutro`.

---

## Implementation order

Recommended order:

```txt
1. AppLayout
2. DashboardView
3. CSV upload placeholders
4. Connect CSV upload with store
5. Show validation messages
6. Show KPI cards
7. Show requests table
8. Add basic filters
9. Add first chart
10. Add orphan time entries panel
11. Improve visual polish
```

Do not start with charts.

Start with data loading, KPIs and table.

---

## Important rules for the agent

- No business logic inside Vue components.
- No backend.
- No external upload.
- No custom UI library.
- Use PrimeVue components.
- Keep components small.
- Avoid huge single-file components.
- Do not implement every chart at once.
- First make it useful, then make it beautiful.