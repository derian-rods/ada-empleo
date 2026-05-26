---
name: ceeta-redmine-csv
description: Use when working with CEETA Redmine CSV imports, parsing, normalization, relationships between parent/child requests and time entries, or calculating estimated vs actual hours. Triggers on CSV upload, normalization, time entry resolution, orphan detection, or domain logic in src/domain/.
---

# CEETA Redmine CSV Skill

## Purpose

Use this skill when working with the real CEETA CSV exports for:

1. Peticiones padre
2. Peticiones hijas
3. Tiempo dedicado

The goal is to normalize these CSV files, relate them correctly, calculate estimated vs real dedicated hours, detect orphan time entries, and prepare clean data for the dashboard.

This skill is specific to CSV exports that look like Redmine or a similar ticketing/time-tracking system.

---

## CSV files involved

The app expects three CSV files:

### 1. Peticiones padre

This CSV contains the parent/main requests.

It usually contains the estimated or grouped request information.

### 2. Peticiones hijas

This CSV contains child requests, subtasks, OTs, ARs or technical/functional breakdowns related to parent requests.

This file may contain the useful estimated hours split by profile.

### 3. Tiempo dedicado

This CSV contains the real time entries/imputations.

This file is the source of truth for actual hours.

---

## Real CSV characteristics

The real CSV files use:

- separator: `;`
- decimal comma: `8,00`, `0,50`
- Spanish column names
- many empty columns
- IDs sometimes stored as plain numbers
- IDs sometimes embedded in strings like `OT #1078795: ...`
- possible UTF-8 BOM
- many columns that are not needed for the MVP

When parsing CSV, always use `;` as delimiter unless the user explicitly changes the format.

---

## Important detected columns

### Peticiones padre

Important columns:

```txt
#
Proyecto
Tracker de peticiones
Tarea padre
Asunto de la tarea padre
Estado
Prioridad
Asunto
Autor
Asignado a
Seguidores
Actualizado
Versión prevista
Fecha de inicio
Fecha fin
Tiempo estimado
Estimated remaining time
Total de Tiempo Estimado
Tiempo dedicado
Tiempo total dedicado
% Realizado
Creado
Cerrada
Aplicación
```

### Peticiones hijas

Important columns:

```txt
#
Proyecto
Tracker de peticiones
Tarea padre
Asunto de la tarea padre
Estado
Prioridad
Asunto
Autor
Asignado a
Categoría
Versión prevista
Tiempo estimado
Total de Tiempo Estimado
Tiempo dedicado
Tiempo total dedicado
Aplicación
Horas JP
Horas CS
Horas AF
Horas AS / ES
Horas AP / TS
Horas P
Coste sin IVA
```

### Tiempo dedicado

Important columns:

```txt
Proyecto
Fecha
Creado
Semana
Autor
Usuario
Actividad
Petición
Tracker de peticiones
Tarea padre
Estado
Categoría
Versión prevista
Comentario
Horas
Perfil (perfilado)
Perfil (CAU in-situ)
Aplicación
Horas JP
Horas CS
Horas AF
Horas AS / ES
Horas AP / TS
Horas P
Coste sin IVA
```

---

## TypeScript domain model

Create or update `src/domain/types.ts` with these base types.

```ts
export type ResultStatus = 'profit' | 'loss' | 'neutral'

export interface ParentRequest {
  id: string
  code: string
  project?: string
  tracker?: string
  parentId?: string
  parentSubject?: string
  subject: string
  status?: string
  priority?: string
  author?: string
  assignee?: string
  version?: string
  application?: string
  estimatedHours: number
  dedicatedHoursFromExport?: number
  totalDedicatedHoursFromExport?: number
  createdAt?: string
  updatedAt?: string
}

export interface ChildRequest {
  id: string
  parentId?: string
  code: string
  project?: string
  tracker?: string
  parentSubject?: string
  subject: string
  status?: string
  priority?: string
  author?: string
  assignee?: string
  category?: string
  version?: string
  application?: string
  estimatedHours: number
  dedicatedHoursFromExport?: number
  totalDedicatedHoursFromExport?: number
  costWithoutVat?: number
  createdAt?: string
  updatedAt?: string
}

export interface TimeEntry {
  id: string
  project?: string
  date?: string
  createdAt?: string
  week?: string
  author?: string
  user?: string
  activity?: string
  petitionRaw?: string
  petitionId?: string
  parentTaskRaw?: string
  parentTaskId?: string
  tracker?: string
  status?: string
  category?: string
  version?: string
  comment?: string
  hours: number
  profiledRole?: string
  cauRole?: string
  application?: string
}

export interface OrphanTimeEntry extends TimeEntry {
  orphanReason: string
}

export interface CalculatedRequest {
  parentId: string
  code: string
  subject: string
  project?: string
  tracker?: string
  status?: string
  application?: string
  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  resultStatus: ResultStatus
  childrenCount: number
  timeEntriesCount: number
  peopleCount: number
  people: string[]
  activities: string[]
  roles: string[]
  applications: string[]
  costWithoutVat?: number
}

export interface DashboardSummary {
  totalEstimatedHours: number
  totalActualHours: number
  totalDifferenceHours: number
  averageDeviationPercent: number
  profitableRequests: number
  lossRequests: number
  neutralRequests: number
  orphanTimeEntries: number
  totalPeople: number
  totalApplications: number
}
```

---

## Utility functions

Create utility functions in `src/domain/csvUtils.ts`.

### parseCsvNumber

Must support Spanish decimal numbers.

Examples:

```txt
8,00 -> 8
0,50 -> 0.5
1.234,50 -> 1234.5
"" -> 0
null -> 0
undefined -> 0
```

Expected function:

```ts
export function parseCsvNumber(value: unknown): number
```

Rules:

- return `0` for empty values
- remove thousand separators
- convert comma decimal to dot decimal
- return `0` if the result is not a valid number

---

### extractIssueId

Must extract issue IDs from raw Redmine-like strings.

Examples:

```txt
1082818 -> 1082818
1082818.0 -> 1082818
OT #1078795: MTTO.EVO... -> 1078795
Tarea #1080770: Texto -> 1080770
OT SFW #1079245: Texto -> 1079245
"" -> undefined
```

Expected function:

```ts
export function extractIssueId(value: unknown): string | undefined
```

Rules:

- if value contains `#123456`, return `123456`
- if value is a number-like string, return the integer part
- trim spaces
- return `undefined` if no ID can be extracted

---

### cleanText

Expected function:

```ts
export function cleanText(value: unknown): string | undefined
```

Rules:

- trim text
- return `undefined` for empty strings
- preserve accents
- do not lowercase by default

---

## Normalization files

Create or update:

```txt
src/domain/normalizeCsv.ts
```

This file should expose:

```ts
export function normalizeParentRequests(rows: Record<string, unknown>[]): ParentRequest[]

export function normalizeChildRequests(rows: Record<string, unknown>[]): ChildRequest[]

export function normalizeTimeEntries(rows: Record<string, unknown>[]): TimeEntry[]
```

---

## ParentRequest normalization

Map columns as follows:

```txt
id: #
code: #
project: Proyecto
tracker: Tracker de peticiones
parentId: extractIssueId(Tarea padre)
parentSubject: Asunto de la tarea padre
subject: Asunto
status: Estado
priority: Prioridad
author: Autor
assignee: Asignado a
version: Versión prevista
application: Aplicación
estimatedHours: Total de Tiempo Estimado | Tiempo estimado
dedicatedHoursFromExport: Tiempo dedicado
totalDedicatedHoursFromExport: Tiempo total dedicado
createdAt: Creado
updatedAt: Actualizado
```

Rules:

- `id` is required.
- `subject` should fallback to empty string if missing.
- `estimatedHours` should use:
  1. `Total de Tiempo Estimado`
  2. fallback to `Tiempo estimado`
  3. fallback to `0`

---

## ChildRequest normalization

Map columns as follows:

```txt
id: #
code: #
project: Proyecto
tracker: Tracker de peticiones
parentId: extractIssueId(Tarea padre)
parentSubject: Asunto de la tarea padre
subject: Asunto
status: Estado
priority: Prioridad
author: Autor
assignee: Asignado a
category: Categoría
version: Versión prevista
application: Aplicación
estimatedHours: sum of profile hour columns, fallback to Total de Tiempo Estimado, fallback to Tiempo estimado
dedicatedHoursFromExport: Tiempo dedicado
totalDedicatedHoursFromExport: Tiempo total dedicado
costWithoutVat: Coste sin IVA
createdAt: Creado
updatedAt: Actualizado
```

Estimated hours priority:

1. Sum these columns:

```txt
Horas JP
Horas CS
Horas AF
Horas AS / ES
Horas AP / TS
Horas P
```

2. If the sum is greater than 0, use that sum.
3. Otherwise use `Total de Tiempo Estimado`.
4. Otherwise use `Tiempo estimado`.
5. Otherwise use `0`.

This is important because in the real CSV exports, `Total de Tiempo Estimado` may be `0,00`, while the useful estimation is split by profile.

---

## TimeEntry normalization

Map columns as follows:

```txt
id: generated stable id from row index + Petición + Fecha + Usuario + Horas
project: Proyecto
date: Fecha
createdAt: Creado
week: Semana
author: Autor
user: Usuario
activity: Actividad
petitionRaw: Petición
petitionId: extractIssueId(Petición)
parentTaskRaw: Tarea padre
parentTaskId: extractIssueId(Tarea padre)
tracker: Tracker de peticiones
status: Estado
category: Categoría
version: Versión prevista
comment: Comentario
hours: Horas
profiledRole: Perfil (perfilado)
cauRole: Perfil (CAU in-situ)
application: Aplicación
```

Rules:

- `Horas` is required for useful calculations.
- If `Horas` is empty or invalid, normalize it to `0`.
- `petitionId` should be extracted from `Petición`.
- `parentTaskId` should be extracted from `Tarea padre`.
- Do not use `Tiempo dedicado` from request CSVs as actual hours.
- The real actual hours come from `Tiempo dedicado.csv` column `Horas`.

---

## Relationship rules

Create or update:

```txt
src/domain/relationships.ts
```

Expose:

```ts
export interface RelationshipResult {
  calculatedRequests: CalculatedRequest[]
  orphanTimeEntries: OrphanTimeEntry[]
}

export function buildCalculatedRequests(
  parents: ParentRequest[],
  children: ChildRequest[],
  timeEntries: TimeEntry[]
): RelationshipResult
```

---

## How to resolve time entries

For each `TimeEntry`, resolve its parent request in this order:

### 1. By petitionId matching child id

If:

```ts
timeEntry.petitionId === child.id
```

Then assign the time entry to:

```ts
child.parentId
```

This is the most common case.

### 2. By petitionId matching parent id

If:

```ts
timeEntry.petitionId === parent.id
```

Then assign the time entry directly to that parent.

### 3. By parentTaskId matching parent id

If:

```ts
timeEntry.parentTaskId === parent.id
```

Then assign the time entry directly to that parent.

### 4. By parentTaskId matching child id

If:

```ts
timeEntry.parentTaskId === child.id
```

Then assign the time entry to:

```ts
child.parentId
```

### 5. Orphan

If no relation can be found, mark it as an orphan time entry:

```ts
{
  ...timeEntry,
  orphanReason: 'Could not resolve parent request from petitionId or parentTaskId'
}
```

---

## Estimated hours calculation

For each parent request:

1. Find its child requests:

```ts
child.parentId === parent.id
```

2. Sum estimated hours from children:

```ts
childrenEstimatedHours = sum(children.estimatedHours)
```

3. If `childrenEstimatedHours > 0`, use it.

4. Otherwise fallback to:

```ts
parent.estimatedHours
```

This is important because the real useful estimation may live in child requests by profile.

---

## Actual hours calculation

Actual hours must always come from the time entries CSV:

```ts
actualHours = sum(resolvedTimeEntries.hours)
```

Do not use these request columns as the source of truth for actual hours:

```txt
Tiempo dedicado
Tiempo total dedicado
```

Those columns can be kept for reference only.

---

## Profit/loss calculation

For each calculated parent request:

```ts
differenceHours = estimatedHours - actualHours
```

Status:

```ts
resultStatus =
  differenceHours > 0 ? 'profit' :
  differenceHours < 0 ? 'loss' :
  'neutral'
```

Deviation:

```ts
deviationPercent = estimatedHours > 0
  ? ((actualHours - estimatedHours) / estimatedHours) * 100
  : 0
```

Meaning:

```txt
100 estimated, 80 actual  -> +20 profit
100 estimated, 130 actual -> -30 loss
```

---

## Aggregated fields

For each calculated request, aggregate:

```txt
childrenCount
timeEntriesCount
peopleCount
people
activities
roles
applications
costWithoutVat
```

Rules:

- `people` comes from `TimeEntry.user`.
- `activities` comes from `TimeEntry.activity`.
- `roles` comes from `TimeEntry.profiledRole` and/or `TimeEntry.cauRole`.
- `applications` comes from parent, children and time entries.
- `costWithoutVat` can be summed from child requests if available.

Remove duplicates from arrays.

---

## Dashboard summary

Create or update:

```txt
src/domain/calculations.ts
```

Expose:

```ts
export function calculateDashboardSummary(
  calculatedRequests: CalculatedRequest[],
  orphanTimeEntries: OrphanTimeEntry[]
): DashboardSummary
```

The summary should calculate:

```txt
totalEstimatedHours
totalActualHours
totalDifferenceHours
averageDeviationPercent
profitableRequests
lossRequests
neutralRequests
orphanTimeEntries
totalPeople
totalApplications
```

---

## Recommended dashboard KPIs

The UI should eventually show:

```txt
Total horas estimadas
Total horas reales
Diferencia total
Desviación media
Peticiones con ganancia
Peticiones con pérdida
Peticiones neutras
Top 10 pérdidas
Top 10 ganancias
Horas por persona
Horas por actividad
Horas por aplicación
Horas por perfil
Horas por proyecto
Entradas de tiempo huérfanas
```

---

## Recommended filters

The UI should eventually support:

```txt
Proyecto
Aplicación
Tracker de peticiones
Estado
Versión prevista
Usuario
Autor
Actividad
Perfil
Categoría
Rango de fechas
Resultado: profit/loss/neutral
Solo con pérdidas
Solo con tiempos huérfanos
```

---

## Validations

Create validation helpers where useful.

The app should warn if:

```txt
Peticiones padre is missing column #
Peticiones hijas is missing column #
Tiempo dedicado is missing column Petición
Tiempo dedicado is missing column Horas
A time entry has no petitionId and no parentTaskId
A time entry cannot be related to parent or child
A child request has parentId but the parent does not exist
A parent request has estimated hours 0 but actual hours > 0
A parent request has estimated hours > 0 but actual hours 0
```

Do not block the whole app for orphan time entries. Show them as warnings.

---

## Tests to create

Create or update tests using Vitest.

Recommended files:

```txt
src/tests/csvUtils.test.ts
src/tests/normalizeCsv.test.ts
src/tests/relationships.test.ts
src/tests/calculations.test.ts
```

Minimum tests:

### Number parsing

```txt
parse 8,00 as 8
parse 0,50 as 0.5
parse 1.234,50 as 1234.5
parse empty as 0
parse invalid as 0
```

### ID extraction

```txt
extract 1078795 from OT #1078795: text
extract 1080770 from Tarea #1080770: text
extract 1082818 from 1082818
extract 1082818 from 1082818.0
return undefined for empty string
```

### Normalization

```txt
normalize parent request with #
normalize child parentId from Tarea padre
normalize child estimated hours from profile columns
normalize time entry petitionId from Petición
normalize time entry parentTaskId from Tarea padre
normalize time entry hours from Horas
```

### Relationships

```txt
relate time to child using petitionId
relate time to parent using petitionId
relate time to parent using parentTaskId
relate time to child using parentTaskId
mark orphan time entry
```

### Calculations

```txt
100 estimated and 80 actual gives +20 profit
100 estimated and 130 actual gives -30 loss
100 estimated and 100 actual gives neutral
0 estimated and 10 actual avoids division by zero
parent with children uses children estimated hours
parent without children uses parent estimated hours
actual hours come only from time entries
```

---

## Implementation order

When implementing this skill, follow this order:

1. Create TypeScript types.
2. Create CSV utility functions.
3. Create normalization functions.
4. Create relationship builder.
5. Create calculation summary.
6. Add tests.
7. Only after domain logic works, connect it to UI.

Do not implement charts before the domain layer is reliable.

---

## Important rules for the agent

- Keep functions pure and testable.
- Do not put calculation logic inside Vue components.
- Do not assume all CSV columns are always present.
- Do not use `any` unless absolutely necessary.
- Prefer `unknown` and explicit parsing.
- Keep Spanish column names in mapping constants.
- Do not send CSV data to external services.
- All processing must happen locally in the browser.
- Do not over-engineer.
- Prioritize a working MVP.
