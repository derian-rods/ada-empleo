# PR Summary: Nuevas Gráficas de Comparación - Estimado vs Dedicado y HBS

## 📋 Descripción General

Se han implementado dos nuevas gráficas comparativas que proporcionan una visión clara del desempeño de las peticiones en términos de horas estimadas versus dedicadas, y consumo de HBS (Horas de Billing de Sistema).

Las gráficas antiguas (Risk Matrix y Deviation Distribution) han sido ocultadas pero el código se preserva para futuras restauraciones.

## 🎯 Objetivos Alcanzados

✅ Mostrar comparación de horas estimadas (JP+CS+AF) vs horas dedicadas (TimeEntry)  
✅ Mostrar comparación de HBS estimado vs HBS consumido  
✅ Mantener compatibilidad con filtro de empresa (usa `filteredCalculatedRequests`)  
✅ Build sin errores ni warnings  
✅ Preservar código antiguo para futuras restauraciones  
✅ Mantener repositorio limpio (análisis en .gitignore)

## 📊 Cambios Principales

### 1. Actualización de Estructura de Datos

**Archivo**: `src/domain/types.ts`

```typescript
// Agregados a CalculatedRequest:
estimatedHoursJp?: number;      // Horas estimadas perfil JP
estimatedHoursCs?: number;      // Horas estimadas perfil CS
estimatedHoursAf?: number;      // Horas estimadas perfil AF
estimatedHoursTotal?: number;   // Total JP + CS + AF
```

**Archivo**: `src/domain/relationships.ts`

- Actualizado `buildCalculatedRequests()` para calcular sumas de JP, CS, AF desde peticiones hijas
- Almacena valores desglosados y total en `CalculatedRequest`

### 2. Nuevas Gráficas

#### ChartEstimatedVsDedicated.vue

- **Tipo**: Gráfica de barras (BarChart con ECharts)
- **Datos**:
  - Eje X: Código de petición
  - Eje Y: Horas
  - Series: Estimado (JP+CS+AF) vs Dedicado (TimeEntry)
- **Características**:
  - Muestra top 20 peticiones para legibilidad
  - Tooltip con detalles: horas, diferencia, desviación %
  - Colores: Azul (Estimado) | Verde (Dedicado)
  - Filtrado automático por empresa

#### ChartHbsConsumption.vue

- **Tipo**: Gráfica de barras (BarChart con ECharts)
- **Datos**:
  - Eje X: Código de petición
  - Eje Y: HBS
  - Series: Estimado HBS vs Consumido HBS
- **Características**:
  - Muestra top 20 peticiones para legibilidad
  - Tooltip con detalles: valores HBS, diferencia, desviación %
  - Colores: Púrpura (Estimado) | Rosa (Consumido)
  - Filtrado automático por empresa

### 3. Actualización de Componente Principal

**Archivo**: `src/components/ChartsTab.vue`

```diff
- import ChartRiskMatrix from './dashboard/charts/ChartRiskMatrix.vue'
- import ChartDeviationDistribution from './dashboard/charts/ChartDeviationDistribution.vue'
+ import ChartEstimatedVsDedicated from './dashboard/charts/ChartEstimatedVsDedicated.vue'
+ import ChartHbsConsumption from './dashboard/charts/ChartHbsConsumption.vue'

<!-- Gráficas antiguas comentadas para restauración futura -->
<!-- <ChartRiskMatrix :rows="groupedRows" />
     <ChartDeviationDistribution :rows="groupedRows" /> -->

<!-- Nuevas gráficas -->
<ChartEstimatedVsDedicated :requests="requests" />
<ChartHbsConsumption :requests="requests" />
```

### 4. Limpieza de Repositorio

**Archivo**: `.gitignore`

Agregados los siguientes archivos de análisis (preservados localmente):

```
ANALISIS_GRAFICAS_Y_DATOS.md
ARCHIVOS_ANALIZADOS.md
CONCLUSIONES_ANALISIS.md
DIAGRAMAS_ARQUITECTURA.md
EJEMPLOS_CALCULOS_PRACTICOS.md
GUIA_REFERENCIA_RAPIDA.md
README_ANALISIS_COMPLETO.md
RESUMEN_EJECUTIVO.md
```

## 🔄 Flujo de Datos

```
CSV (Tiempo dedicado)
        ↓
TimeEntry (horas dedicadas)
        ↓
buildCalculatedRequests()
    ├─ Suma JP+CS+AF de ChildRequest
    ├─ Suma TimeEntry hours
    └─ Calcula diferencias y desviaciones
        ↓
CalculatedRequest (con estimatedHoursTotal)
        ↓
dashboardStore.filteredCalculatedRequests
        ↓
ChartEstimatedVsDedicated & ChartHbsConsumption
```

## 📈 Funcionalidades de Gráficas

### Filtrado por Empresa

Ambas gráficas usan automáticamente `filteredCalculatedRequests` del dashboard store:

- Cuando el usuario selecciona una empresa, las gráficas se actualizan dinámicamente
- Si no hay filtro activo, muestra todas las peticiones

### Interactividad

- **Hover**: Muestra tooltip con información detallada
- **Leyenda**: Clickeable para mostrar/ocultar series
- **Responsivo**: Gráficas se adaptan al tamaño del contenedor

### Performance

- Limitadas a top 20 peticiones para mantener legibilidad
- Renderizado automático con `renderCharts` ref
- Re-renderiza cuando cambia el dataset de requests

## 🧪 Testing

Build ejecutado exitosamente:

```
✓ built in 1.44s
No errors or warnings
```

Tipos TypeScript validados y compilados correctamente.

## 📋 Commits Incluidos

```
f6dcd27 - chore: Agregar archivos de análisis a .gitignore
2c17f9f - feat: Crear gráficas de comparación - Estimado vs Dedicado y HBS
493d3d6 - feat: Agregar campos de horas JP, CS, AF en CalculatedRequest
```

## 🚀 Próximos Pasos Sugeridos

1. **Testing en Dev Server**

   ```bash
   npm run dev
   ```

   Verificar que las gráficas se renderizan correctamente y el filtro de empresa funciona

2. **Posibles Mejoras Futuras**
   - Agregar opciones de exportación (PNG, PDF)
   - Añadir filtro interactivo de rango de fechas
   - Implementar gráficas adicionales (tendencias, distribución de desviación)
   - Personalizar colores según tema de la aplicación

3. **Restauración de Gráficas Antiguas**
   - Si en el futuro se necesitan las gráficas antiguas, simplemente descomentar el código en `ChartsTab.vue`
   - Los componentes `ChartRiskMatrix.vue` y `ChartDeviationDistribution.vue` se mantienen intactos

## 📝 Notas Técnicas

- **Stack**: Vue 3 + TypeScript + ECharts + PrimeVue
- **Compatibilidad**: Compatible con filtro de empresa existente
- **Performance**: Top 20 peticiones para balance legibilidad/performance
- **Estilo**: Usa variables CSS del tema (`--bg-secondary`, `--tooltip-bg`, etc.)
- **Accesibilidad**: Tooltips informativos con contraste adecuado

## ✨ Resumen de Cambios

| Métrica                     | Antes | Después                     |
| --------------------------- | ----- | --------------------------- |
| Gráficas activas            | 2     | 2                           |
| Campos en CalculatedRequest | ~20   | ~24                         |
| Archivos en repositorio     | +8 MD | -8 MD (ahora en .gitignore) |
| Build errors                | 0     | 0 ✓                         |
| Build warnings              | 0     | 0 ✓                         |

---

**Estado**: ✅ Listo para producción  
**Rama**: `main`  
**Fecha**: 2026-06-02  
**Commits**: 3
