# CCV Dashboard

Dashboard de análisis de peticiones y tiempo dedicado usando Vue 3, TypeScript y Vite.

## 🎯 Características

- ✅ Carga de CSV con validación automática
- ✅ Procesamiento asincrónico sin congelación de UI
- ✅ Sistema de pestañas intuitivo
- ✅ Tablas interactivas con paginación
- ✅ Gráficos de análisis
- ✅ Cálculos automáticos de desviaciones
- ✅ Identificación de tiempos huérfanos

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
│   └── relationships.ts # Relaciones entre datos
├── stores/             # Pinia store (estado)
├── services/           # Servicios
└── main.ts             # Entry point
```

## 📁 Carga de CSV

El dashboard requiere 3 CSV con delimitador `;`:

### 1. Peticiones Padre
```
# | Solicitud | Descripción | ...
1 | SOL-001   | Crear login | ...
```
- Debe tener columna `#`

### 2. Peticiones Hijas
```
# | Petición padre | Descripción | ...
1 | SOL-001        | Pantalla    | ...
```
- Debe tener columna `#`

### 3. Tiempo Dedicado
```
Petición | Persona | Horas | Fecha | ...
SOL-001  | Juan    | 5     | ...   | ...
```
- Debe tener columna `Horas`

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

- Vue 3
- TypeScript
- Vite
- Pinia (State Management)
- PrimeVue (UI Components)
- PapaParse (CSV Parsing)
- ECharts (Charts)
- Vitest (Testing)

## 📚 Recursos

- [Vue 3 Docs](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [PrimeVue](https://primevue.org/)

## 📄 Licencia

Propietario - CCV Dashboard
