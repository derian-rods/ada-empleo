# Ejemplos Prácticos de Cálculos

## EJEMPLO 1: Cálculo de Horas y Desviación para una Solicitud

### Datos de entrada (CSV)

**Parents CSV:**

```
id;code;subject;estimatedHours;status;application
P001;REQ-2024-001;Portal de usuarios;40;Open;Portal
```

**Children CSV:**

```
id;parentId;code;subject;estimatedHours;status
C001;P001;SUB-001;Módulo de usuarios;25;Open
C002;P001;SUB-002;Integración con LDAP;15;Open
```

**TimeEntries CSV:**

```
id;petitionId;user;hours;activity;profiledRole;application
T001;C001;Derian Rodriguez;3.5;Desarrollo;DE;Portal
T002;C001;Derian Rodriguez;4;Desarrollo;DE;Portal
T003;C001;Pedro González;5;Testing;AS;Portal
T004;C001;Fátima Elsayed;1.5;Testing;DE;Portal
T005;C002;Derian Rodriguez;8;Desarrollo;DE;Portal
T006;C002;Gerardo García;2;Coordinación;GP;Portal
T007;C002;Gerardo García;3;Coordinación;GP;Portal
```

### Proceso de Cálculo

**Paso 1: Resolver relaciones**

```
T001 (petitionId=C001) → C001.parentId=P001 → Assigned to P001
T002 (petitionId=C001) → C001.parentId=P001 → Assigned to P001
T003 (petitionId=C001) → C001.parentId=P001 → Assigned to P001
T004 (petitionId=C001) → C001.parentId=P001 → Assigned to P001
T005 (petitionId=C002) → C002.parentId=P001 → Assigned to P001
T006 (petitionId=C002) → C002.parentId=P001 → Assigned to P001
T007 (petitionId=C002) → C002.parentId=P001 → Assigned to P001
```

**Paso 2: Calcular actualHours (suma de horas)**

```
actualHours = 3.5 + 4 + 5 + 1.5 + 8 + 2 + 3
            = 27 horas
```

**Paso 3: Calcular estimatedHours**

```
childrenEstimated = 25 + 15 = 40
estimatedHours = 40 (porque childrenEstimated > 0)
```

**Paso 4: Calcular differenceHours**

```
differenceHours = estimatedHours - actualHours
                = 40 - 27
                = 13 horas (ganancia)
```

**Paso 5: Calcular deviationPercent**

```
deviationPercent = ((actualHours - estimatedHours) / estimatedHours) * 100
                 = ((27 - 40) / 40) * 100
                 = (-13 / 40) * 100
                 = -32.5%

Interpretación: Se gastaron 32.5% MENOS horas de lo estimado
```

**Paso 6: Determinar resultStatus**

```
differenceHours = 13 (positivo)
→ resultStatus = "profit"  (ganancia)

Nota: resultStatus es inverso a la intuición:
  - differenceHours > 0 → estimado > actual → GANANCIA
  - differenceHours < 0 → estimado < actual → PÉRDIDA
  - differenceHours = 0 → NEUTRAL
```

**Paso 7: Calcular consumedHbs**

```
Para cada TimeEntry, buscar profile del usuario:

T001: Derian Rodriguez (DE) → ratio 1.0
      HBS = 3.5 * 1.0 = 3.5

T002: Derian Rodriguez (DE) → ratio 1.0
      HBS = 4.0 * 1.0 = 4.0

T003: Pedro González (AS) → ratio 1.18
      HBS = 5.0 * 1.18 = 5.9

T004: Fátima Elsayed (DE) → ratio 1.0
      HBS = 1.5 * 1.0 = 1.5

T005: Derian Rodriguez (DE) → ratio 1.0
      HBS = 8.0 * 1.0 = 8.0

T006: Gerardo García (GP) → ratio 1.69
      HBS = 2.0 * 1.69 = 3.38

T007: Gerardo García (GP) → ratio 1.69
      HBS = 3.0 * 1.69 = 5.07

Total HBS: 3.5 + 4.0 + 5.9 + 1.5 + 8.0 + 3.38 + 5.07 = 31.35
```

**Paso 8: Calcular riskLevel**

```
differenceHours = 13 (positivo, no es pérdida)

calculateRiskLevel(13):
  if (13 < -20) → NO
  if (13 < -5)  → NO
  return "low"  ← RESULTADO

Interpretación: Bajo riesgo (estimado bien hecho)
```

### Resultado Final (CalculatedRequest)

```javascript
{
  parentId: "P001",
  code: "REQ-2024-001",
  subject: "Portal de usuarios",
  project: undefined,
  tracker: undefined,
  status: "Open",
  application: "Portal",

  // HORAS
  estimatedHours: 40,
  actualHours: 27,
  differenceHours: 13,
  deviationPercent: -32.5,
  resultStatus: "profit",

  // HBS
  estimatedHbs: 0,  // Siempre 0 (limitación del sistema)
  consumedHbs: 31.35,
  differenceHbs: 31.35,
  deviationPercentHbs: undefined,  // No se calcula (estimatedHbs=0)
  resultStatusHbs: "loss",  // differenceHbs > 0

  // AGREGACIONES
  childrenCount: 2,
  timeEntriesCount: 7,
  peopleCount: 4,
  people: ["Derian Rodriguez", "Pedro González", "Fátima Elsayed", "Gerardo García"],
  activities: ["Desarrollo", "Testing", "Coordinación"],
  roles: ["DE", "AS", "GP"],
  applications: ["Portal"],
  costWithoutVat: undefined,
}
```

---

## EJEMPLO 2: Cálculo de RiskLevel en ParentGroupedTableRow

### Entrada

```
CalculatedRequest[] (5 solicitudes)
```

### Cálculo para cada solicitud

```
Sol. 1: differenceHours = -25 → riskLevel = "high"   (< -20)
        Gráfica: Eje Y posición 2 (Alto)
        Color: Rojo

Sol. 2: differenceHours = -12 → riskLevel = "medium" (< -5)
        Gráfica: Eje Y posición 1 (Medio)
        Color: Naranja

Sol. 3: differenceHours = -2  → riskLevel = "low"    (> -5)
        Gráfica: Eje Y posición 0 (Bajo)
        Color: Verde

Sol. 4: differenceHours = 15  → riskLevel = "low"    (> -5)
        Gráfica: Eje Y posición 0 (Bajo)
        Color: Verde

Sol. 5: differenceHours = 0   → riskLevel = "low"    (> -5)
        Gráfica: Eje Y posición 0 (Bajo)
        Color: Verde
```

### Visualización en ChartRiskMatrix

```
EJE Y (Nivel de Riesgo)
│
│2 (Alto)     ●(Rojo)
│             Sol. 1
│
│1 (Medio)    ●(Naranja)
│             Sol. 2
│
│0 (Bajo)     ●(Verde) ●(Verde) ●(Verde)
│             Sol. 3   Sol. 4   Sol. 5
│
└──────────────────────────────────────── EJE X (Resultado)
  -1(Loss)  0(Neutral)  1(Profit)
```

---

## EJEMPLO 3: Distribución de Desviación

### Datos de entrada

```
Solicitudes con sus deviationPercent:

1. REQ-001: deviationPercent = -75%  → Rango: < -50%
2. REQ-002: deviationPercent = -45%  → Rango: -50% a -20%
3. REQ-003: deviationPercent = -35%  → Rango: -50% a -20%
4. REQ-004: deviationPercent = -15%  → Rango: -20% a 0%
5. REQ-005: deviationPercent = -8%   → Rango: -20% a 0%
6. REQ-006: deviationPercent = -2%   → Rango: -20% a 0%
7. REQ-007: deviationPercent = 5%    → Rango: 0% a 20%
8. REQ-008: deviationPercent = 12%   → Rango: 0% a 20%
9. REQ-009: deviationPercent = 25%   → Rango: 20% a 50%
10. REQ-010: deviationPercent = 55%  → Rango: > 50%
```

### Agrupación por rangos

```
buildDeviationDistribution():

buckets = [
  { range: '< -50%',        min: -∞,  max: -50,  count: 0, color: '#dc2626' },
  { range: '-50% a -20%',   min: -50, max: -20,  count: 0, color: '#f97316' },
  { range: '-20% a 0%',     min: -20, max: 0,    count: 0, color: '#facc15' },
  { range: '0% a 20%',      min: 0,   max: 20,   count: 0, color: '#86efac' },
  { range: '20% a 50%',     min: 20,  max: 50,   count: 0, color: '#22c55e' },
  { range: '> 50%',         min: 50,  max: ∞,    count: 0, color: '#16a34a' },
]

Contar solicitudes en cada bucket:

< -50%:       REQ-001            → count: 1
-50% a -20%:  REQ-002, REQ-003   → count: 2
-20% a 0%:    REQ-004, REQ-005, REQ-006 → count: 3
0% a 20%:     REQ-007, REQ-008   → count: 2
20% a 50%:    REQ-009            → count: 1
> 50%:        REQ-010            → count: 1

Total: 10 solicitudes
```

### Cálculo de porcentajes

```
percentage = (count / total) * 100

< -50%:       (1 / 10) * 100 = 10%
-50% a -20%:  (2 / 10) * 100 = 20%
-20% a 0%:    (3 / 10) * 100 = 30%
0% a 20%:     (2 / 10) * 100 = 20%
20% a 50%:    (1 / 10) * 100 = 10%
> 50%:        (1 / 10) * 100 = 10%
                              ─────
                               100%
```

### Visualización en ChartDeviationDistribution

```
CANTIDAD DE SOLICITUDES
│
│5 ┤
│  ├─ ─ ─ ─
│4 ├─       ─
│  ├─ ─ ─   ─
│3 ├─ ┌─┐   ─
│  ├─ │ │   ─ ─
│2 ├─ │ │ ┌─┐ ─
│  ├─ │ │ │ │ ─ ─
│1 ├─ │ │ │ │ ─ ┌─┐
│  └──┴─┴─┴─┴─┴─┴─┴───────────
│    Rango de Desviación
│    < -50% | -50-20% | -20-0% | 0-20% | 20-50% | > 50%
│
└─────────────────────────────────────────────────────────
  Colores:
  Rojo oscuro → Naranja → Amarillo → Verde claro → Verde → Verde oscuro
```

---

## EJEMPLO 4: Agrupación por Usuario + Rol

### Datos de entrada (TimeEntries para una subtarea)

```
T001: user="Derian Rodriguez", role="DE", hours=3.0, activity="Desarrollo"
T002: user="Derian Rodriguez", role="DE", hours=2.5, activity="Desarrollo"
T003: user="Derian Rodriguez", role="DE", hours=1.5, activity="Deploy"
T004: user="Pedro González",   role="AS", hours=4.0, activity="Testing"
T005: user="Pedro González",   role="AS", hours=1.0, activity="Testing"
```

### Creación de Map key = "user|role"

```
Clave = "Derian Rodriguez|DE"
  └─ T001, T002, T003
     hours: 3.0 + 2.5 + 1.5 = 7.0
     activities: {"Desarrollo", "Deploy"}

Clave = "Pedro González|AS"
  └─ T004, T005
     hours: 4.0 + 1.0 = 5.0
     activities: {"Testing"}
```

### Conversión a UserRoleHoursSummary

```javascript
userRoleHours = [
  {
    user: "Derian Rodriguez",
    role: "DE",
    hours: 7.0,
    activities: ["Desarrollo", "Deploy"],
  },
  {
    user: "Pedro González",
    role: "AS",
    hours: 5.0,
    activities: ["Testing"],
  },
];
```

### En tabla de subtareas

```
ChildRequestGroupedRow {
  childCode: "SUB-001",
  childSubject: "Módulo de usuarios",
  actualHours: 12.0,  // 7.0 + 5.0
  users: ["Derian Rodriguez", "Pedro González"],
  roles: ["DE", "AS"],
  activities: ["Desarrollo", "Deploy", "Testing"],
  userRoleHours: [...]
}
```

### Visualización en tabla

```
┌─────────────────────────────────────────────────────────┐
│ SUB-001: Módulo de usuarios                             │
├──────────────────┬──────────────┬──────────┬─────────────┤
│ Usuario          │ Rol          │ Horas    │ Actividades │
├──────────────────┼──────────────┼──────────┼─────────────┤
│ Derian Rodriguez │ DE           │ 7.0h     │ Desarrollo  │
│                  │              │          │ Deploy      │
├──────────────────┼──────────────┼──────────┼─────────────┤
│ Pedro González   │ AS           │ 5.0h     │ Testing     │
├──────────────────┴──────────────┴──────────┴─────────────┤
│ TOTAL: 12.0h (3 actividades diferentes)                 │
└─────────────────────────────────────────────────────────┘
```

---

## EJEMPLO 5: Cálculo de consumptionPercent

### Fórmula

```
consumptionPercent = (actualHours / estimatedHours) * 100
```

### Casos de uso

```
Caso 1: BIEN ESTIMADO
  estimatedHours: 40
  actualHours: 38
  consumptionPercent = (38 / 40) * 100 = 95%
  Interpretación: Se consumió 95% de lo estimado (BUENO)

Caso 2: SOBRE-ESTIMADO (ganancia)
  estimatedHours: 40
  actualHours: 30
  consumptionPercent = (30 / 40) * 100 = 75%
  Interpretación: Se consumió 75% de lo estimado (GANANCIA)

Caso 3: SUB-ESTIMADO (pérdida)
  estimatedHours: 40
  actualHours: 55
  consumptionPercent = (55 / 40) * 100 = 137.5%
  Interpretación: Se consumió 137.5% de lo estimado (PÉRDIDA)

Caso 4: SIN ESTIMACIÓN
  estimatedHours: 0
  actualHours: 10
  consumptionPercent = (10 / 0) * 100 = ∞ (pero retorna 0 por validación)
  Interpretación: No se puede calcular
```

### Uso en ChartRiskMatrix

```
El tamaño de la burbuja se basa en estimatedHours, NO en consumption

symbolSize: (val: any) => Math.sqrt(val[2] ?? 20) * 1.5
                                       ^^^^^^^^
                                    estimatedHours
```

---

## EJEMPLO 6: Filtrado por Empresa

### Datos iniciales

```
TimeEntries CSV (después de enrichment):

T001: user="Derian Rodriguez"  → Sopra Steria (en COLLABORATORS)
T002: user="Juan Carlos López" → null (no en COLLABORATORS)
T003: user="Gerardo García"    → Sopra Steria
T004: user="Cristina Quirós"   → Sopra Steria
T005: user="Externo Consultora X" → null
```

### Sin filtro (todos los datos)

```
store.selectedCompanyFilter = null
↓
filteredTimeEntries = [T001, T002, T003, T004, T005]
↓
Gráficas muestran TODO
```

### Con filtro "Sopra Steria"

```
store.selectedCompanyFilter = "Sopra Steria"
↓
filterTimeEntriesByCompany(enrichedTimeEntries, "Sopra Steria")
↓
filteredTimeEntries = [T001, T003, T004]  (solo Sopra Steria)
↓
buildCalculatedRequests(filteredTimeEntries)
↓
filteredCalculatedRequests recalcula:
  - actualHours (solo de Sopra Steria)
  - consumedHbs (solo de Sopra Steria)
  - people[] (solo usuarios Sopra Steria)
↓
Gráficas se actualizan automáticamente (via computed property)
```

### Impacto en métricas

```
Sin filtro:
  └─ REQ-001: actualHours = 100h (de todo el mundo)

Con filtro Sopra Steria:
  └─ REQ-001: actualHours = 75h (solo Sopra Steria)

REQ-001 puede:
  - Desaparecer si 0h de Sopra Steria
  - Cambiar de riskLevel
  - Cambiar de resultStatus
  - Afectar su visualización en gráficas
```
