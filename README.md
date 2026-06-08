# CEETA Dashboard - ADA Empleo

Dashboard de control de estimaciones, incurridos y HBS para demandas, órdenes de trabajo y tiempo dedicado.

**Versión**: 1.0.0 | **Estado**: Producción ✅

## 🎯 Características

- ✅ **Carga de CSV** con validación automática (Demandas, Órdenes de Trabajo, Tiempo dedicado)
- ✅ **Tab Colaboradores** - Visualización de tiempo dedicado agrupado por colaborador
- ✅ **Tablas Scrollables** - Headers sticky con scroll nativo de PrimeVue
- ✅ **Gráficos Interactivos** - Análisis visual con ECharts
- ✅ **Cálculos Automáticos** - Desviaciones, rentabilidad, horas incurridas
- ✅ **Panel de Huérfanos** - Identificación de tiempos sin estimación
- ✅ **Temas Profesionales** - Light/Dark mode con toggle automático
- ✅ **Filtros Dinámicos** - Por fecha, colaborador, código de petición
- ✅ **Links GPSAE** - Integración con sistema externo de peticiones

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La app abrirá en `http://localhost:5174`

### Build Producción

```bash
npm run build
```

### Preview Producción

```bash
npm run preview
```

## 📊 Estructura del Proyecto

```
src/
├── components/
│   ├── dashboard/
│   │   ├── tables/                     # Tablas principales
│   │   │   ├── CollaboratorsTable.vue  # 🆕 Tab Colaboradores
│   │   │   ├── ParentRequestsTable.vue
│   │   │   ├── ChildRequestsTable.vue
│   │   │   └── ...
│   │   ├── DashboardKpis.vue           # Métricas principales
│   │   └── ChartsPanel.vue             # Gráficos ECharts
│   ├── GpsaeRequestLink.vue            # Links a peticiones GPSAE
│   ├── TabsView.vue                    # Gestor de pestañas
│   └── ...
├── domain/
│   ├── types.ts                        # Tipos TypeScript
│   ├── normalizeCsv.ts                 # Normalización de CSVs
│   ├── tableAggregations.ts            # Agregaciones de tablas
│   ├── calculations.ts                 # Cálculos de métricas
│   ├── collaborators.ts                # 🆕 Lógica de colaboradores
│   ├── gpsae.ts                        # 🆕 URL builder GPSAE
│   └── ...
├── stores/
│   ├── dashboard.ts                    # Estado del dashboard
│   └── theme.ts                        # Estado del tema
├── theme/
│   └── preset.ts                       # Configuración de temas PrimeVue
└── main.ts
```

## 📁 Carga de CSV

El dashboard requiere 3 CSVs con delimitador `;`:

### 1. Peticiones Padre

```
# | Solicitud | Descripción | Horas estimadas | Proyecto | Aplicación | ...
1 | SOL-001   | Crear login | 40              | Proyecto A | App X | ...
```

**Requerimientos:**

- Columna `#` (ID único)
- Columna `Horas estimadas` para cálculos

### 2. Peticiones Hijas

```
# | Petición padre | Descripción | ...
1 | SOL-001        | Pantalla    | ...
```

**Requerimientos:**

- Columna `#` (ID único)
- Columna `Petición padre` para relación

### 3. Tiempo Dedicado (FUENTE DE VERDAD)

```
Petición padre | Petición hija | Usuario | Horas | Fecha | Actividad | ...
SOL-001        | TSK-001       | Juan    | 5     | ...   | Desarrollo| ...
```

**Requerimientos:**

- Columna `Usuario` o `Autor` (colaborador)
- Columna `Horas` (horas imputadas)
- Columna `Fecha` (fecha de imputación)
- Debe relacionarse vía `Petición padre` y `Petición hija`

## ⚙️ Configuración GPSAE

Para integrar links a peticiones GPSAE:

1. **Crear archivo `.env`:**

   ```bash
   cp .env.example .env
   ```

2. **Configurar URL base:**
   ```env
   VITE_GPSAE_BASE_URL=https://your-gpsae-instance.com/peticion
   ```

Ver [GPSAE_CONFIGURATION.md](./GPSAE_CONFIGURATION.md) para detalles completos.

## 🎨 Temas

El proyecto incluye temas Light y Dark profesionales:

- **Light Mode**: Fondo azul claro (#f0f7ff), textos oscuros
- **Dark Mode**: Fondo negro (#030712), textos blancos
- **Toggle**: Botón 🌙/☀️ en la barra superior
- **Detección automática**: Usa tema del sistema si no hay preferencia guardada

Personalizar en `src/theme/preset.ts`

## 🛠️ Tecnologías

| Tecnología | Versión | Propósito             |
| ---------- | ------- | --------------------- |
| Vue        | 3.5.34  | Framework reactivo    |
| TypeScript | 6.0.2   | Tipado estricto       |
| Vite       | 8.0.12  | Build tool rápido     |
| Pinia      | 3.0.4   | State management      |
| PrimeVue   | 4.5.5   | Componentes UI        |
| ECharts    | 6.1.0   | Gráficos interactivos |
| PapaParse  | 5.5.3   | Parsing CSV           |

## 📋 Pestañas Principales

1. **Resumen** - Métricas KPI y gráficos de overview
2. **Tabla de Peticiones** - Vista completa de peticiones padre e hijas
3. **Gráficas** - Análisis visual con ECharts
4. **Tabla Agrupada por Padre** - Vista jerárquica expandible
5. **Colaboradores** 🆕 - Tiempo dedicado agrupado por colaborador
6. **Sin Estimar con Incurrido** - Peticiones sin estimación pero con horas imputadas
7. **Tiempos Huérfanos** - Tiempo dedicado sin relación a peticiones

## 🔗 APIs y Integraciones

### GpsaeRequestLink Component

```vue
<template>
  <GpsaeRequestLink :code="requestCode" />
</template>

<script setup>
import GpsaeRequestLink from "@/components/GpsaeRequestLink.vue";
const requestCode = "1234";
</script>
```

Genera automáticamente links a GPSAE basados en la configuración de `.env`

## 📊 Cálculos Principales

Resumen simple para negocio:

| Métrica              | Cómo se obtiene                                                                                                                                                     | Fuente                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Horas estimadas**  | Se suman las estimaciones de las órdenes de trabajo de cada demanda. Si una demanda no tiene órdenes, se usa la estimación de la propia demanda.                    | Demandas + Órdenes de Trabajo           |
| **Horas incurridas** | Se suman exclusivamente las horas imputadas reales.                                                                                                                 | Tiempo dedicado, columna `Horas`        |
| **Diferencia horas** | `horas estimadas - horas incurridas`. Positivo = ahorro/margen. Negativo = sobreconsumo.                                                                            | Cálculo interno                         |
| **Desviación %**     | `(horas incurridas - horas estimadas) / horas estimadas * 100`.                                                                                                     | Cálculo interno                         |
| **HBS estimadas**    | Se calculan desde las horas estimadas por perfil en órdenes de trabajo: `Horas JP`, `Horas CS`, `Horas AF`, `Horas AS / ES`, `Horas AP / TS`, `Horas P`.            | Órdenes de Trabajo                      |
| **HBS incurridas**   | Cada imputación se convierte a HBS con `horas * ratio del perfil`. El perfil sale de `Perfil (perfilado)`, `Perfil (CAU in-situ)` o de la gestión de colaboradores. | Tiempo dedicado + Gestión colaboradores |
| **Diferencia HBS**   | `HBS consumidas - HBS estimadas`. Positivo = sobreconsumo HBS. Negativo = ahorro HBS.                                                                               | Cálculo interno                         |

Reglas importantes:

- La fuente de verdad para horas reales es siempre el CSV **Tiempo dedicado**.
- No se usan las columnas `Tiempo dedicado` ni `Tiempo total dedicado` de demandas/órdenes para calcular incurridas.
- Si las órdenes no traen horas por perfil, las HBS estimadas no se pueden calcular de forma fiable.
- Para columnas agrupadas, `Horas AS / ES` usa ratio AS y `Horas AP / TS` usa ratio AP.

## 🔐 Seguridad

- Links GPSAE abren con `target="_blank"` y `rel="noopener noreferrer"`
- Nunca hardcodear URLs sensibles (usar `.env`)
- CSVs procesados localmente, sin envío a servidores externos
- Validación automática de datos de entrada

## 📚 Documentación Adicional

- [GPSAE_CONFIGURATION.md](./GPSAE_CONFIGURATION.md) - Configuración de integración GPSAE
- [.env.example](./.env.example) - Variables de entorno requeridas

## 🌐 Recursos

- [Vue 3 Docs](https://vuejs.org/)
- [PrimeVue Docs](https://primevue.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)

## 📄 Licencia

**Propietario** - Control de Estimaciones e Incurridos ADA
