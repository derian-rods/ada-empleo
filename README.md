# CCV Dashboard

Dashboard de análisis de peticiones y tiempo dedicado usando Vue 3, TypeScript y Vite.

## 🎯 Características

- ✅ Carga de CSV con validación automática
- ✅ Procesamiento asincrónico sin congelación de UI
- ✅ Sistema de pestañas intuitivo
- ✅ Tablas interactivas con paginación
- ✅ Gráficos de análisis con ECharts
- ✅ Cálculos automáticos de desviaciones y rentabilidad
- ✅ Identificación de tiempos huérfanos
- ✅ Temas claro y oscuro profesionales
- ✅ Toggle automático de tema (con detección de sistema)

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

### Tests

```bash
npm run test
```

## 📊 Estructura del Proyecto

```
src/
├── components/          # Componentes Vue
│   ├── dashboard/      # Componentes del dashboard
│   └── *.vue           # Componentes principales
├── domain/             # Lógica de negocio
│   ├── calculations.ts # Cálculos de métricas
│   ├── normalizeCsv.ts # Normalización de datos
│   ├── relationships.ts # Relaciones entre datos
│   ├── types.ts        # Tipos TypeScript
│   └── filters.ts      # Lógica de filtros
├── stores/             # Pinia store (estado)
│   ├── dataStore.ts    # Estado de datos
│   ├── uiStore.ts      # Estado de UI
│   └── theme.ts        # Estado de tema
├── theme/              # Configuración de temas
│   └── preset.ts       # PrimeVue preset (light/dark)
├── services/           # Servicios
└── main.ts             # Entry point
```

### Tema Light y Dark

El proyecto usa **PrimeVue 4.5.5 con Design Tokens nativo**:

- **Light Mode**: Fondo azul claro (#f0f7ff), textos oscuros, colores vibrantes
- **Dark Mode**: Fondo negro profundo (#030712), textos blancos, colores claros
- **Toggle**: Botón 🌙/☀️ en la barra superior (persiste en localStorage)
- **Detección automática**: Si no hay preferencia guardada, usa el tema del sistema

Para personalizar colores, edita `src/theme/preset.ts`

## 📁 Carga de CSV

El dashboard requiere 3 CSV con delimitador `;`:

### 1. Peticiones Padre

```
# | Solicitud | Descripción | Horas estimadas | ...
1 | SOL-001   | Crear login | 40              | ...
```

- Debe tener columna `#` (ID)
- Columna `Horas estimadas` para el cálculo de rentabilidad

### 2. Peticiones Hijas

```
# | Petición padre | Descripción | ...
1 | SOL-001        | Pantalla    | ...
```

- Debe tener columna `#` (ID)
- Columna `Petición padre` para relacionar con padre

### 3. Tiempo Dedicado

```
Petición padre | Petición hija | Persona | Horas | Fecha | ...
SOL-001        | TSK-001       | Juan    | 5     | ...   | ...
```

- **Fuente de verdad para horas reales**
- Debe tener columna `Horas`
- Se relaciona vía `Petición padre` y `Petición hija`

## 🔄 Git Workflow

### Ver historial

```bash
git log --oneline
```

### Crear rama

```bash
git checkout -b feature/mi-feature
```

### Hacer commit

```bash
git add .
git commit -m "Descripción clara del cambio"
```

### Ver cambios

```bash
git status
git diff
```

### Cambiar de rama

```bash
git checkout main
```

## 📝 Historial de Cambios

- **f2193ad**: Remove debug code from App.vue
- **31eb2e2**: Initial commit: CCV Dashboard with async CSV processing and tab-based navigation

## 🛠️ Tecnologías

- **Vue 3**: Framework reactivo
- **TypeScript**: Tipado estricto
- **Vite**: Build tool rápido
- **Pinia**: State management
- **PrimeVue 4.5.5**: Componentes UI profesionales con Design Tokens
- **PapaParse**: Parsing de CSV
- **ECharts / vue-echarts**: Gráficos interactivos
- **Vitest**: Testing

## 🎨 Tema y Estilos

El proyecto utiliza el preset personalizado **CCVPreset** basado en Aura:

```typescript
// src/theme/preset.ts
// Configuración de colores para light y dark mode
// Personalizable sin tocar CSS
```

Para cambiar colores:

1. Edita `src/theme/preset.ts`
2. Modifica las secciones `light` o `dark` en `colorScheme`
3. Los cambios se aplican automáticamente en todos los componentes

## 📚 Recursos

- [Vue 3 Docs](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [PrimeVue](https://primevue.org/)

## 📄 Licencia

Propietario - CCV Dashboard
