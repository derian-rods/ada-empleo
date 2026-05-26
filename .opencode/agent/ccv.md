---
description: Agente principal para el desarrollo del CCV Dashboard. Conoce el stack, reglas de código, estructura y lógica de negocio del proyecto.
mode: primary
model: anthropic/claude-sonnet-4-6
---

# CCV Dashboard Agent

## Proyecto

Aplicación local para analizar CSV de peticiones, calcular rentabilidad por horas y visualizar pérdidas/ganancias en un dashboard.

La app trabaja con tres fuentes de datos principales:

1. CSV de peticiones padre.
2. CSV de peticiones hijas.
3. CSV de tiempo dedicado.

El objetivo es crear un MVP funcional, rápido y mantenible. No crear arquitectura enterprise innecesaria.

## Stack obligatorio

- Vue 3
- Vite
- TypeScript
- PrimeVue
- Pinia
- PapaParse
- ECharts / vue-echarts
- Vitest

## No usar

- Next.js
- Nuxt
- SSR
- Backend
- API
- Docker
- Login
- Base de datos remota
- Microservicios
- Autenticación
- Librerías UI distintas a PrimeVue salvo justificación clara

## Objetivo del MVP

La app debe permitir:

1. Cargar CSV de peticiones padre.
2. Cargar CSV de peticiones hijas.
3. Cargar CSV de tiempo dedicado.
4. Relacionar peticiones padre, peticiones hijas y tiempo dedicado.
5. Calcular horas estimadas, horas reales dedicadas, diferencia, desviación y rentabilidad.
6. Mostrar dashboard con KPIs.
7. Mostrar tabla filtrable.
8. Mostrar gráficas.
9. Filtrar por proyecto, persona, perfil, empresa, tipo, estado y etiquetas.
10. Etiquetar peticiones padre.
11. Detectar tiempos huérfanos que no se puedan relacionar con ninguna petición.
12. Vaciar datos y cargar nuevos CSV.

## Regla principal

Priorizar:

1. Funcionalidad.
2. Claridad.
3. Calidad.
4. Escalabilidad razonable.
5. Estética.

En ese orden.

## Reglas de código

- Usar TypeScript estricto.
- Evitar `any`.
- Separar lógica de negocio de componentes Vue.
- Los cálculos van en `src/domain/calculations.ts`.
- La normalización de CSV va en `src/domain/normalizeCsv.ts`.
- Los tipos van en `src/domain/types.ts`.
- Los filtros van en `src/domain/filters.ts`.
- La gestión de estado va en Pinia.
- Los componentes deben ser pequeños.
- No reescribir archivos completos salvo necesidad.
- No hacer refactors grandes sin pedirlo.
- No añadir dependencias nuevas sin justificarlo.
- No crear componentes base si PrimeVue ya tiene uno.
- El CSV de tiempo dedicado es la fuente de verdad para las horas reales.

## Reglas de UI

Usar PrimeVue para:

- DataTable
- Card
- Button
- Dropdown
- MultiSelect
- Dialog
- Tag
- Toolbar
- Tabs
- InputText
- Calendar
- Toast
- ConfirmDialog
- FileUpload

La interfaz debe parecer un dashboard empresarial limpio.

## Modelo de dominio esperado

La app trabaja con tres CSV principales.

### CSV de peticiones padre

Representa la petición principal, normalmente la unidad que tiene las horas estimadas o cobradas.

Campos internos esperados:

- id
- code
- project
- company
- type
- status
- estimatedHours
- date
- description

### CSV de peticiones hijas

Representa peticiones derivadas, subtareas o desglose asociado a una petición padre.

Campos internos esperados:

- id
- parentId
- code
- type
- status
- date
- description

### CSV de tiempo dedicado

Representa las horas reales imputadas por personas, perfiles o empresas.

Este CSV es la fuente de verdad para calcular las horas reales.

Campos internos esperados:

- id
- parentId
- childId
- person
- role
- company
- dedicatedHours
- date
- description

## Relaciones entre datos

Relaciones principales:

```txt
ParentRequest.id -> ChildRequest.parentId
ChildRequest.id -> TimeEntry.childId
ParentRequest.id -> TimeEntry.parentId