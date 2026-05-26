---
name: calculation-engine
description: Use this skill when implementing or modifying the business logic for calculating profitability, losses, gains, deviations, aggregations and dashboard summaries.This skill depends on the normalized data produced from the CEETA Redmine CSV files:1. Peticiones padre 2. Peticiones hijas 3. Tiempo dedicado. The source of truth for actual hours is always the CSV `Tiempo dedicado`.
---

# Calculation Engine Skill

## Purpose

Use this skill when implementing or modifying the business logic for calculating profitability, losses, gains, deviations, aggregations and dashboard summaries.

This skill depends on the normalized data produced from the CEETA Redmine CSV files:

1. Peticiones padre
2. Peticiones hijas
3. Tiempo dedicado

The source of truth for actual hours is always the CSV `Tiempo dedicado`.

---

## Main responsibility

The calculation engine must convert normalized domain data into business metrics.

It must answer questions like:

- How many estimated hours were planned?
- How many real hours were dedicated?
- Are we gaining or losing hours?
- Which parent requests are profitable?
- Which parent requests are losing money/time?
- Which people, roles, activities or applications consume more time?
- Which time entries could not be related?

---

## Required files

Work mainly in:

```txt
src/domain/calculations.ts
src/domain/relationships.ts
src/domain/types.ts
```

Tests should go in:

```txt
src/tests/calculations.test.ts
src/tests/relationships.test.ts
```

---

## Core rule

Never calculate business logic inside Vue components.

All business calculations must be pure TypeScript functions.

Vue components should only consume already calculated data.

---

## Input types

The calculation engine receives:

```ts
ParentRequest[]
ChildRequest[]
TimeEntry[]
```

These types should already be normalized.

Do not parse raw CSV inside this skill.

---

## Relationship rules

Each `TimeEntry` must be resolved to a parent request.

Resolve in this order:

### 1. Time entry petitionId matches child id

```ts
timeEntry.petitionId === child.id
```

Then assign the time entry to:

```ts
child.parentId
```

This is expected to be the most common case.

### 2. Time entry petitionId matches parent id

```ts
timeEntry.petitionId === parent.id
```

Then assign directly to that parent.

### 3. Time entry parentTaskId matches parent id

```ts
timeEntry.parentTaskId === parent.id
```

Then assign directly to that parent.

### 4. Time entry parentTaskId matches child id

```ts
timeEntry.parentTaskId === child.id
```

Then assign to:

```ts
child.parentId
```

### 5. Orphan time entry

If no relation can be found, create an orphan entry.

```ts
{
  ...timeEntry,
  orphanReason: 'Could not resolve parent request from petitionId or parentTaskId'
}
```

Orphan time entries must not break the app.

They should be reported as warnings and excluded from parent profitability calculations unless explicitly requested.

---

## Estimated hours calculation

Estimated hours are calculated per parent request.

For each parent:

1. Find its children:

```ts
child.parentId === parent.id
```

2. Sum child estimated hours:

```ts
childrenEstimatedHours = sum(children.estimatedHours)
```

3. If `childrenEstimatedHours > 0`, use it.

4. Otherwise fallback to:

```ts
parent.estimatedHours
```

Reason:

In the real CEETA CSV exports, useful estimated hours may be split in child requests by profile:

```txt
Horas JP
Horas CS
Horas AF
Horas AS / ES
Horas AP / TS
Horas P
```

The parent field `Total de Tiempo Estimado` may be `0,00`.

---

## Actual hours calculation

Actual hours must always come from `TimeEntry.hours`.

```ts
actualHours = sum(resolvedTimeEntries.hours)
```

Do not use these request columns as the source of truth for actual hours:

```txt
Tiempo dedicado
Tiempo total dedicado
```

Those columns can be stored for reference only.

---

## Profit/loss calculation

For each calculated parent request:

```ts
differenceHours = estimatedHours - actualHours
```

Meaning:

```txt
100 estimated, 80 actual  -> +20 profit
100 estimated, 130 actual -> -30 loss
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

Rules:

- Positive `differenceHours` means profit.
- Negative `differenceHours` means loss.
- Zero means neutral.
- Avoid division by zero.
- If estimated hours are 0 and actual hours are greater than 0, deviation should be 0 unless another rule is explicitly requested.

---

## Required output type

Create this output entity if it does not exist:

```ts
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
  resultStatus: 'profit' | 'loss' | 'neutral'
  childrenCount: number
  timeEntriesCount: number
  peopleCount: number
  people: string[]
  activities: string[]
  roles: string[]
  applications: string[]
  costWithoutVat?: number
}
```

---

## Relationship result

Create this result type if it does not exist:

```ts
export interface RelationshipResult {
  calculatedRequests: CalculatedRequest[]
  orphanTimeEntries: OrphanTimeEntry[]
}
```

Main function:

```ts
export function buildCalculatedRequests(
  parents: ParentRequest[],
  children: ChildRequest[],
  timeEntries: TimeEntry[]
): RelationshipResult
```

---

## Aggregated fields

For each calculated parent request, aggregate:

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

- `childrenCount` is the number of child requests linked to the parent.
- `timeEntriesCount` is the number of resolved time entries linked to the parent.
- `people` comes from `TimeEntry.user`.
- `peopleCount` is the unique number of people.
- `activities` comes from `TimeEntry.activity`.
- `roles` comes from `TimeEntry.profiledRole` and `TimeEntry.cauRole`.
- `applications` comes from parent, children and time entries.
- `costWithoutVat` can be summed from child requests if available.
- Remove duplicates from arrays.
- Remove empty values from arrays.

---

## Dashboard summary

Create this function:

```ts
export function calculateDashboardSummary(
  calculatedRequests: CalculatedRequest[],
  orphanTimeEntries: OrphanTimeEntry[]
): DashboardSummary
```

Expected output:

```ts
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

Rules:

```ts
totalEstimatedHours = sum(calculatedRequests.estimatedHours)
totalActualHours = sum(calculatedRequests.actualHours)
totalDifferenceHours = sum(calculatedRequests.differenceHours)
profitableRequests = count(resultStatus === 'profit')
lossRequests = count(resultStatus === 'loss')
neutralRequests = count(resultStatus === 'neutral')
orphanTimeEntries = orphanTimeEntries.length
```

For average deviation:

- Use a simple average for the MVP.
- Ignore NaN and invalid values.
- Return `0` if there are no calculated requests.

---

## Helper functions

Create small pure helpers if useful:

```ts
sumNumbers(values: number[]): number
uniqueValues(values: Array<string | undefined>): string[]
calculateDifferenceHours(estimatedHours: number, actualHours: number): number
calculateDeviationPercent(estimatedHours: number, actualHours: number): number
calculateResultStatus(differenceHours: number): ResultStatus
```

---

## Validation warnings

The calculation engine should help detect these cases:

```txt
Parent request with 0 estimated hours and actual hours > 0
Parent request with estimated hours > 0 and actual hours 0
Child request with parentId that does not exist
Time entry that cannot be related to parent or child
Time entry with 0 hours
```

Do not block execution for these cases.

Return warnings or orphan entries where appropriate.

---

## Minimum tests

Create or update Vitest tests for:

```txt
100 estimated and 80 actual gives +20 profit
100 estimated and 130 actual gives -30 loss
100 estimated and 100 actual gives neutral
0 estimated and 10 actual avoids division by zero
parent with children uses children estimated hours
parent without children uses parent estimated hours
actual hours come only from time entries
time entry resolves by petitionId matching child id
time entry resolves by petitionId matching parent id
time entry resolves by parentTaskId matching parent id
time entry resolves by parentTaskId matching child id
orphan time entry is detected
people are deduplicated
roles are deduplicated
applications are deduplicated
summary totals are correct
```

---

## Implementation rules

- Keep functions pure.
- Avoid mutation when possible.
- Avoid `any`.
- Prefer `unknown` at boundaries and typed data after normalization.
- Do not import Vue.
- Do not import Pinia.
- Do not import PrimeVue.
- Domain layer must work without UI.
- Keep performance reasonable for thousands of rows.
- Use maps for lookup instead of repeated nested loops where possible.
- Do not over-engineer.