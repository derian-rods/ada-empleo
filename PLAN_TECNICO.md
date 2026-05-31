# Plan Técnico - Análisis del CCV Dashboard

**Fecha**: 31 de mayo de 2026  
**Estado**: Análisis previo a modificaciones

---

## 1. ARCHIVOS RELEVANTES

### Configuración y Entrada

- `index.html` - Define título "CCV Dashboard" (línea 7)
- `src/main.ts` - Punto de entrada de la app
- `src/App.vue` - Componente raíz

### Domain Layer (Lógica de Negocio Pura)

- `src/domain/types.ts` - Interfaces de datos (ParentRequest, ChildRequest, TimeEntry, CalculatedRequest, etc)
- `src/domain/normalizeCsv.ts` - Parseo y normalización de CSVs
- `src/domain/csvUtils.ts` - Utilidades para parseo (parseCsvNumber, extractIssueId, cleanText)
- `src/domain/relationships.ts` - Construcción de relaciones entre datos y cálculos principales
- `src/domain/calculations.ts` - Cálculos de resúmenes (DashboardSummary)
- `src/domain/tableAggregations.ts` - Agregaciones para tablas
- `src/domain/chartsData.ts` - Preparación de datos para gráficos

### Store/State Management

- `src/stores/dashboard.ts` - Pinia store con toda la lógica de carga y procesamiento
- `src/stores/theme.ts` - Store de temas (light/dark)

### Componentes - Layout Principal

- `src/components/AppLayout.vue` - Contenedor principal con header
- `src/components/MainNav.vue` - Navegación
- `src/components/TabsView.vue` - Gestor de pestañas

### Componentes - Panel de Carga

- `src/components/CsvUploadPanel.vue` - Interfaz de carga de los 3 CSVs

### Componentes - Pestaña Summary (Resumen)

- `src/components/SummaryTab.vue` - Pestaña con KPIs principales
- `src/components/DashboardKpis.vue` - Tarjetas de resumen expandidas (10 cards)

### Componentes - Pestaña Tables

- `src/components/dashboard/tables/DashboardTablesTabs.vue` - Gestor de sub-pestañas
- `src/components/dashboard/tables/ParentRequestsTable.vue` - Tabla de peticiones padre
- `src/components/dashboard/tables/ChildRequestsTable.vue` - Tabla de peticiones hijas
- `src/components/dashboard/tables/ParentGroupedRequestsTable.vue` - Tabla agrupada por padre
- `src/components/dashboard/tables/ParentProjectGroupTable.vue` - Tabla agrupada por proyecto
- `src/components/dashboard/tables/UsersTable.vue` - Tabla por usuario

### Componentes - Pestaña Charts (Gráficos)

- `src/components/ChartsTab.vue` - Gestor de gráficos (no usada, sustituida por dashboard/)
- `src/components/dashboard/charts/ChartRiskMatrix.vue` - Matriz de riesgo (EChart)
- `src/components/dashboard/charts/ChartDeviationDistribution.vue` - Histograma de desviación (EChart)
- `src/components/ChartEstimatedVsActual.vue` - Gráfico estimado vs real
- `src/components/ChartHoursByApp.vue` - Horas por aplicación
- `src/components/ChartHoursByPerson.vue` - Horas por persona
- `src/components/ChartTopLosses.vue` - Top pérdidas

### Componentes - Otras

- `src/components/OrphanTimeEntriesPanel.vue` - Tabla de imputaciones huérfanas
- `src/components/RequestsTable.vue` - Tabla antigua (posible duplicado)

### Temas y Estilos

- `src/theme/preset.ts` - Definiciones de tema (colores, variables CSS)
- `src/style.css` - Estilos globales
- `src/composables/useTheme.ts` - Hook para gestión de tema

---

## 2. FLUJO DE DATOS: DESDE CSV AL DASHBOARD

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1: CARGA DE ARCHIVOS                                       │
└─────────────────────────────────────────────────────────────────┘

1. Usuario carga 3 archivos CSV en CsvUploadPanel.vue
   - Peticiones padre (OBLIGATORIO)
   - Peticiones hijas (OPCIONAL)
   - Tiempo dedicado (OBLIGATORIO)

2. Dashboard.ts recibe archivos:
   - onParentSelect() → store.loadParents(file)
   - onChildSelect() → store.loadChildren(file)
   - onTimeSelect() → store.loadTimeEntries(file)

3. Parseo con PapaParse:
   - Delimitador: `;`
   - Encoding: UTF-8
   - Detecta headers automáticamente

┌─────────────────────────────────────────────────────────────────┐
│ FASE 2: NORMALIZACIÓN                                           │
└─────────────────────────────────────────────────────────────────┘

normalizeParentRequests() → ParentRequest[]
  - Lee columnas: #, Proyecto, Tracker, Asunto, Estado, etc.
  - Horas estimadas: intenta ProfileHours (JP, CS, AF, etc) →
                    Total de Tiempo Estimado →
                    Tiempo estimado (fallback)
  - Convierte números con locale ES (comas como decimales)

normalizeChildRequests() → ChildRequest[]
  - Similar a padre, incluye referencia a Tarea padre
  - Soporta columnas de perfiles para estimadas
  - Incluye Coste sin IVA

normalizeTimeEntries() → TimeEntry[]
  - Extrae: Usuario, Proyecto, Horas, Petición, Tarea padre
  - Genera IDs basados en índice + petición + fecha + usuario + horas
  - Almacena roles: profiledRole, cauRole
  - Almacena actividades

┌─────────────────────────────────────────────────────────────────┐
│ FASE 3: CONSTRUCCIÓN DE RELACIONES                              │
└─────────────────────────────────────────────────────────────────┘

buildCalculatedRequests(parents, children, timeEntries)
  └─ Ejecuta algoritmo de 4 pasos:

  PASO 1: Mapeo de time entries a padres
    - Intenta resolver parentId desde:
      a) TimeEntry.parentTaskId (ID de tarea padre en CSV tiempo)
      b) TimeEntry.petitionId → busca child.parentId
      c) Si no encuentra: HUÉRFANA
    - Agrupa entries por parentId

  PASO 2: Construcción de relaciones hijo-padre
    - Mapea todos los hijos a su padre

  PASO 3: Cálculo de horas estimadas por padre
    - SI suma_hijos_estimadas > 0: usa suma_hijos
    - SI NO: usa parent.estimatedHours
    - RACIONAL: Es más preciso de qué estimó realmente

  PASO 4: Cálculos finales
    - actualHours = SUM(timeEntries.hours) para este padre
    - differenceHours = estimatedHours - actualHours
    - deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100
      * Positivo = gastó más tiempo (pérdida)
      * Negativo = gastó menos (ganancia)
    - resultStatus = ('profit' si diff>0, 'loss' si diff<0, 'neutral' si diff==0)

  PASO 5: Agregaciones
    - people: usuarios únicos que imputaron tiempo
    - activities: actividades ejecutadas
    - roles: perfiles únicos (profiledRole + cauRole)
    - applications: aplicaciones involucradas

┌─────────────────────────────────────────────────────────────────┐
│ FASE 4: CÁLCULO DE RESUMEN DASHBOARD                            │
└─────────────────────────────────────────────────────────────────┘

calculateDashboardSummary(calculatedRequests, orphanTimeEntries)
  - totalEstimatedHours = SUM(all estimated)
  - totalActualHours = SUM(all actual)
  - totalDifferenceHours = estimated - actual
  - averageDeviationPercent = AVG(deviation % de requests con est>0)
  - profitableRequests = COUNT(resultStatus == 'profit')
  - lossRequests = COUNT(resultStatus == 'loss')
  - neutralRequests = COUNT(resultStatus == 'neutral')
  - orphanTimeEntries = COUNT(entries sin padre)
  - totalPeople = COUNT(users únicos)
  - totalApplications = COUNT(apps únicas)

┌─────────────────────────────────────────────────────────────────┐
│ FASE 5: RENDERIZADO EN UI                                       │
└─────────────────────────────────────────────────────────────────┘

DashboardKpis.vue + SummaryTab.vue
  - Muestran 4 KPIs principales: Est., Reales, Diferencia, Desviación
  - Colores: ganancia=verde (success), pérdida=rojo (danger)

ParentRequestsTable.vue + demás tablas
  - Renderizan CalculatedRequest[] o agregaciones
  - Columnnas: código, asunto, estimadas, REALES, diferencia, desviación%, etc.

Gráficos
  - Matriz de riesgo (scatter: desviación % vs difference hours)
  - Distribución desviaciones (histograma)

OrphanTimeEntriesPanel.vue
  - Tabla de TimeEntry sin padre detectado
```

---

## 3. DÓNDE ESTÁN LOS TEXTOS ACTUALES

### "Horas reales" / "Horas estimadas" / "Desviación media"

- **DashboardKpis.vue:28** - `<template #title>Horas reales</template>`
- **SummaryTab.vue:48** - `<template #title>Horas reales</template>`
- **ParentRequestsTable.vue:85** - Column header `header="Reales"`
- **Dashboard.ts:276** - Mensaje de validación: incluye "Horas reales"

### Título de la app

- **index.html:7** - `<title>CCV Dashboard</title>`

---

## 4. ESTRUCTURA DE DATOS DESPUÉS DE CSV

### ParentRequest (de CSV padres)

```typescript
{
  id: string              // # del CSV
  code: string            // # del CSV
  project?: string
  tracker?: string
  subject: string         // Asunto
  status?: string         // Estado
  estimatedHours: number  // Del profile/Total/Tiempo estimado
  ... más campos opcionales
}
```

### ChildRequest (de CSV hijas)

```typescript
{
  id: string              // # del CSV
  code: string
  parentId?: string       // ID del padre (extraído de "Tarea padre")
  subject: string
  estimatedHours: number  // Del profile (soporta perfiles en hijas)
  ... similar a padre
}
```

### TimeEntry (de CSV tiempo dedicado)

```typescript
{
  id: string              // Generado: te-index-petition-date-user-hours
  user?: string           // Usuario que imputó
  hours: number           // Horas imputadas
  petitionId?: string     // ID de petición (extraído)
  parentTaskId?: string   // ID de tarea padre (extraído)
  activity?: string       // Actividad
  profiledRole?: string   // Perfil
  cauRole?: string        // Rol CAU
  application?: string    // Aplicación
  ... más campos
}
```

### CalculatedRequest (resultado de cálculos)

```typescript
{
  parentId: string
  code: string
  subject: string
  estimatedHours: number      // Prioridad: sum(children) > parent.est
  actualHours: number         // SUM(timeEntries.hours)
  differenceHours: number     // estimated - actual
  deviationPercent: number    // ((actual - estimated) / estimated) * 100
  resultStatus: 'profit' | 'loss' | 'neutral'

  // Agregaciones
  people: string[]            // Usuarios únicos
  activities: string[]
  roles: string[]
  applications: string[]
  childrenCount: number
  timeEntriesCount: number
  peopleCount: number
}
```

### DashboardSummary (KPIs principales)

```typescript
{
  totalEstimatedHours: number;
  totalActualHours: number;
  totalDifferenceHours: number;
  averageDeviationPercent: number;
  profitableRequests: number;
  lossRequests: number;
  neutralRequests: number;
  orphanTimeEntries: number;
  totalPeople: number;
  totalApplications: number;
}
```

---

## 5. ¿ESTÁN HORAS ESTIMADAS ASOCIADAS A COLABORADOR/PERFIL/ROL?

**RESPUESTA: NO**

- Las horas **estimadas** están **SOLO asociadas a peticiones** (parent o child)
- No hay estimación por usuario/colaborador
- Los usuarios aparecen solo en las **horas imputadas** (tiempo dedicado)
- Los roles/perfiles aparecen en:
  - Time entries: `profiledRole` y `cauRole`
  - Agregados en CalculatedRequest.roles (desde time entries)

**IMPLICACIÓN**: No se puede calcular "estimado por perfil de Juan" porque las estimaciones no tienen usuario.

---

## 6. ¿ESTÁN HORAS INCURRIDAS ASOCIADAS A USUARIO/COLABORADOR?

**RESPUESTA: SÍ**

- TimeEntry tiene campo `user` (usuario que imputó)
- Cada entrada de tiempo está 100% asociada a un usuario específico
- Se agrega por usuario en:
  - CalculatedRequest.people (lista de usuarios únicos)
  - UsersTable.vue (tabla pivotada por usuario)
  - ChartHoursByPerson.vue (gráfico de horas por persona)

**IMPLICACIÓN**: Puedes analizar qué usuario imputó cuánto tiempo a cada petición.

---

## 7. COMPONENTES REUTILIZABLES vs LÓGICA DUPLICADA

### ✅ BIEN REUTILIZADO

- **DashboardKpis.vue** - Se usa en DashboardView (puede importarse en múltiples vistas)
- **ParentRequestsTable.vue** - Componente genérico, se pasa `rows` como prop
- **Domain layer** - Funciones puras, reutilizables desde cualquier lugar

### ⚠️ POSIBLE DUPLICADO/REDUNDANCIA

- **SummaryTab.vue** - Renderiza los MISMOS 4 KPIs que DashboardKpis.vue
  - DashboardKpis tiene 10 cards
  - SummaryTab tiene 4 cards (subset)
  - Se podría consolidar en un solo componente configurable

- **ChartEstimatedVsActual.vue** vs **ChartsTab.vue**
  - Posible redundancia en gestión de gráficos
  - ParentGroupedRequestsTable.vue agrupa datos que otros gráficos usan

- **RequestsTable.vue** vs **ParentRequestsTable.vue**
  - RequestsTable parece antigua, no se usa en rutas actuales
  - Podría ser técnica deuda o backup

### 📋 FUNCIONES PURAS (REUTILIZABLES)

- `normalizeCsv.ts` - normalizeParentRequests, normalizeChildRequests, normalizeTimeEntries
- `relationships.ts` - buildCalculatedRequests (el algoritmo central)
- `calculations.ts` - calculateDashboardSummary
- `tableAggregations.ts` - buildParentRequestTableRows, buildUserTableRows, etc
- `chartsData.ts` - Preparación de datos para gráficos

---

## 8. RIESGOS DETECTADOS

### 🔴 CRÍTICO

1. **Validación incompleta de time entries**
   - Si un time entry no resuelve su parentId, se marca como huérfana
   - Pero no se valida si el usuario/petición tiene inconsistencias
   - **Riesgo**: Perder imputaciones valiosas si el mapeo falla

2. **Horas estimadas de perfiles sin validación**
   - Si el CSV tiene columnas "Horas JP", "Horas CS", etc con valores inconsistentes
   - El algoritmo suma todas sin validar coherencia
   - **Riesgo**: Sobre/subestimar si hay datos corruptos

3. **Sin tests en domain layer**
   - La lógica de cálculos está sin cobertura visible
   - **Riesgo**: Cambios en normalizeCsv o relationships pueden romper silenciosamente

### 🟡 MODERADO

4. **Duplicación de lógica en componentes**
   - DashboardKpis vs SummaryTab hacen lo mismo
   - Dos versiones del mismo cálculo de formatos
   - **Riesgo**: Desincronización si se cambian labels

5. **Nomenclatura inconsistente**
   - "Horas reales" vs "Horas incurridas" vs "actualHours"
   - "Desviación media" pero es promedio, no mediana
   - **Riesgo**: Confusión al cambiar textos

6. **Sin internacionalización (i18n)**
   - Todos los textos hardcodeados en español
   - **Riesgo**: Difícil agregar soporte multiidioma

### 🟢 MENOR

7. **Componentes viejos sin limpiar**
   - RequestsTable.vue, ChartsTab.vue no se usan
   - HelloWorld.vue aún existe
   - **Riesgo**: Deuda técnica visual

8. **Performance con datasets grandes**
   - Sin paginación en agregaciones (aunque ParentRequestsTable tiene paginator)
   - Mapeos repetidos en relationships.ts
   - **Riesgo**: Lentitud con >10k time entries

---

## 9. DUDAS FUNCIONALES

### ❓ CAMPOS NECESARIOS QUE PODRÍAN FALTAR

1. **Costo/Presupuesto**
   - ChildRequest tiene `costWithoutVat`
   - ParentRequest NO tiene costo
   - **Pregunta**: ¿Se debe calcular costo total = SUM(children.cost)?
   - **Impacto**: No puedes calcular P&L real (ganancia/pérdida en dinero)

2. **Horas de ingeniería/laborales**
   - TimeEntry tiene horas simples
   - **Pregunta**: ¿Las horas son laborales (6h = 1 día) o de calendario?
   - **Impacto**: Afecta validación de "esto es poco realista"

3. **Roles en estimación**
   - Los roles vienen de las imputaciones (profiledRole, cauRole)
   - **Pregunta**: ¿Cada rol tiene un coste/tarifa diferente?
   - **Impacto**: Para calcular valor real del trabajo

4. **Categorización de actividades**
   - Activities es un string libre de TimeEntry
   - **Pregunta**: ¿Hay un catálogo predefinido de actividades?
   - **Impacto**: Para agrupar/filtrar mejor

5. **Validación de coherencia temporal**
   - No hay validación de "estas horas se imputaron antes de la fecha de inicio de la petición"
   - **Pregunta**: ¿Necesitas detectar imputaciones con fechas inconsistentes?
   - **Impacto**: Calidad de datos

---

## 10. PROPUESTA DE IMPLEMENTACIÓN POR FASES

### FASE 0: Preparación (antes de tocar código)

- ✅ Revisar documento de cambios solicitados
- ✅ Confirmar dudas funcionales con stakeholders
- ✅ Validar que nombres de columnas CSV son correctos
- ✅ Hacer backup de datos de prueba

### FASE 1: Cambios Locales Seguros (sin romper lógica)

**Archivos a tocar**: Solo UI

- [ ] Cambiar título en index.html: "CCV Dashboard" → nuevo título
- [ ] Actualizar labels en DashboardKpis.vue: "Horas reales" → nuevo label
- [ ] Actualizar labels en SummaryTab.vue: "Horas reales" → nuevo label
- [ ] Actualizar columnas en ParentRequestsTable.vue: "Reales" → nuevo label
- [ ] Consolidar SummaryTab + DashboardKpis en un solo componente reutilizable

**Verificación**:

- Las UI se ven diferente pero funcionan igual
- Cálculos sin cambiar
- Datos siguen siendo correctos

### FASE 2: Refactor de Componentes (deuda técnica)

- [ ] Consolidar DashboardKpis + SummaryTab
- [ ] Limpiar componentes viejos (RequestsTable.vue, HelloWorld.vue)
- [ ] Extraer i18n básico (translations object)
- [ ] Crear composable reutilizable para formatos

**Riesgo**: BAJO si solo es refactor

### FASE 3: Cambios en Domain Layer (si aplica)

- [ ] Si requieres nuevos cálculos, agregar en calculations.ts
- [ ] Si cambia estructura de datos, actualizar types.ts
- [ ] SI CAMBIAS COLUMNAS CSV: revisar normalizeCsv.ts + testing exhaustivo

**Riesgo**: ALTO - esto afecta todo

### FASE 4: Testing y Validación

- [ ] Cargar datos de prueba
- [ ] Verificar que orphans se detectan correctamente
- [ ] Comparar totales calculados vs manualmente
- [ ] Test de regresión en cálculos

---

## 11. CHECKLIST ANTES DE MODIFICACIONES

- [ ] Revisé el documento de cambios del cliente
- [ ] Confirmé si los cambios afectan cálculos o solo UI
- [ ] Identifiqué todos los archivos que tocaré
- [ ] Hice backup de datos de test
- [ ] Planeo tests después de cambios
- [ ] No voy a cambiar nombres de columnas CSV sin triple verificación
- [ ] No voy a modificar domain/relationships.ts sin tests unitarios
- [ ] No voy a eliminar componentes sin verificar que no se usan

---

## 12. MATRIZ DE IMPACTO DE CAMBIOS

| Cambio                           | Archivos                          | Complejidad | Riesgo   | Tests                       |
| -------------------------------- | --------------------------------- | ----------- | -------- | --------------------------- |
| Título app                       | index.html                        | Trivial     | Muy Bajo | Visual                      |
| Labels en cards                  | DashboardKpis.vue, SummaryTab.vue | Bajo        | Muy Bajo | Visual                      |
| Headers tablas                   | ParentRequestsTable.vue, etc      | Bajo        | Muy Bajo | Visual                      |
| Nueva fórmula cálculo            | relationships.ts, calculations.ts | Alto        | Alto     | Unit + E2E                  |
| Nueva columna CSV                | normalizeCsv.ts                   | Muy Alto    | Alto     | Unit + Integración          |
| Nuevo campo en CalculatedRequest | types.ts                          | Medio       | Medio    | Actualizar todas las tablas |
| Consolidar KPI components        | DashboardKpis.vue, SummaryTab.vue | Medio       | Bajo     | Unit + Visual               |

---

## RECOMENDACIÓN INMEDIATA

**Antes de empezar CUALQUIER cambio**, proporciona:

1. **Documento de cambios** del cliente (menciones específicas de qué textos, columnas, cálculos)
2. **Datos de test** para verificar que no rompemos cálculos
3. **Confirmación de** si es solo cosmético (UI) o hay cambios funcionales (lógica)

Esto permitirá darle una **plan de implementación específico y seguro**.

---

**FIN DEL ANÁLISIS PREVIO**
