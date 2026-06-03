<script setup lang="ts">
import { ref } from "vue";
// @ts-expect-error - Used in template
import Card from "primevue/card";
// @ts-expect-error - Used in template
import DashboardSidebar from "../components/dashboard/DashboardSidebar.vue";
import DashboardTablesTabs from "../components/dashboard/tables/DashboardTablesTabs.vue";
// @ts-expect-error - Used in template
import UnestimatedWithIncurredPanel from "../components/dashboard/tables/UnestimatedWithIncurredPanel.vue";
import CollaboratorsTable from "../components/dashboard/tables/CollaboratorsTable.vue";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const activeTab = ref("summary");

// Sidebar items with submenu
// @ts-expect-error - Used in template
const sidebarItems = [
  {
    id: "summary",
    label: "Resumen",
    icon: "pi-chart-bar",
    description: "Panel de control",
    children: [
      { id: "summary-general", label: "General", icon: "pi-chart-line" },
      { id: "summary-financial", label: "Financiero", icon: "pi-dollar" },
      { id: "summary-timeline", label: "Timeline", icon: "pi-calendar" },
    ],
  },
  {
    id: "requests",
    label: "Peticiones",
    icon: "pi-briefcase",
    description: "Gestión",
    children: [
      { id: "parents", label: "Peticiones Padre", icon: "pi-briefcase" },
      { id: "children", label: "Peticiones Hijas", icon: "pi-sitemap" },
    ],
  },
  {
    id: "collaborators",
    label: "Colaboradores",
    icon: "pi-users",
    description: "Equipo",
    children: [
      {
        id: "collaborators-table",
        label: "Tabla de Colaboradores",
        icon: "pi-table",
      },
      { id: "users", label: "Usuarios", icon: "pi-user" },
    ],
  },
  {
    id: "analytics",
    label: "Gráficas",
    icon: "pi-chart-pie",
    description: "Análisis",
    children: [
      {
        id: "analytics-requests",
        label: "Por Peticiones",
        icon: "pi-chart-line",
      },
      {
        id: "analytics-collaborators",
        label: "Por Colaboradores",
        icon: "pi-chart-bar",
      },
      {
        id: "analytics-projects",
        label: "Por Proyectos",
        icon: "pi-chart-pie",
      },
    ],
  },
  {
    id: "orphan-time",
    label: "Tiempo Huérfano",
    icon: "pi-exclamation-triangle",
    description: "Sin estimar",
    children: [
      {
        id: "orphan-overview",
        label: "Overview",
        icon: "pi-eye",
      },
      {
        id: "orphan-unestimated",
        label: "Sin estimar c/ incurrido",
        icon: "pi-alert",
      },
    ],
  },
  {
    id: "projects",
    label: "Proyectos",
    icon: "pi-map",
    description: "Iniciativas",
  },
];

// @ts-expect-error - Used in template
function handleSidebarSelect(itemId: string) {
  activeTab.value = itemId;
}
</script>

<template>
  <div v-if="store.hasData" class="tables-layout">
    <!-- New collapsible sidebar with icons -->
    <DashboardSidebar
      :items="sidebarItems"
      :active-item-id="activeTab"
      @select-item="handleSidebarSelect"
    />

    <!-- Main content area -->
    <div class="main-content">
      <!-- Content Card -->
      <Card class="content-card">
        <template #title>
          <div class="card-title">
            {{ sidebarItems.find((item) => item.id === activeTab)?.label || "Seleccionar opción" }}
          </div>
        </template>
        <template #content>
          <!-- RESUMEN SECTION -->
          
          <!-- Summary: General -->
          <div v-if="activeTab === 'summary-general'" class="content-wrapper">
            <div class="content-placeholder">
              <p>📊 Dashboard General - Resumen de métricas principales</p>
            </div>
          </div>

          <!-- Summary: Financial -->
          <div v-else-if="activeTab === 'summary-financial'" class="content-wrapper">
            <div class="content-placeholder">
              <p>💰 Análisis Financiero - Ganancias, pérdidas y desviaciones</p>
            </div>
          </div>

          <!-- Summary: Timeline -->
          <div v-else-if="activeTab === 'summary-timeline'" class="content-wrapper">
            <div class="content-placeholder">
              <p>📅 Timeline - Evolución temporal de métricas</p>
            </div>
          </div>

          <!-- PETICIONES SECTION -->

          <!-- Peticiones Padre -->
          <div v-else-if="activeTab === 'parents'" class="content-wrapper">
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </div>

          <!-- Peticiones Hijas -->
          <div v-else-if="activeTab === 'children'" class="content-wrapper">
            <p style="color: var(--text-secondary); text-align: center;">
              Tabla de Peticiones Hijas - Derivadas
            </p>
            <!-- TODO: Implement children table -->
          </div>

          <!-- COLABORADORES SECTION -->

          <!-- Usuarios -->
          <div v-else-if="activeTab === 'users'" class="content-wrapper">
            <p style="color: var(--text-secondary); text-align: center;">
              Tabla de Usuarios
            </p>
            <!-- TODO: Implement users table -->
          </div>

          <!-- Colaboradores Table -->
          <div v-else-if="activeTab === 'collaborators-table'" class="content-wrapper">
            <CollaboratorsTable
              :time-entries="store.timeEntries"
              :children="store.children"
              :parents="store.parents"
            />
          </div>

          <!-- ANALYTICS SECTION -->

          <!-- Analytics: Requests -->
          <div v-else-if="activeTab === 'analytics-requests'" class="content-wrapper">
            <div class="content-placeholder">
              <p>📈 Gráficas por Peticiones - Análisis detallado</p>
            </div>
          </div>

          <!-- Analytics: Collaborators -->
          <div v-else-if="activeTab === 'analytics-collaborators'" class="content-wrapper">
            <div class="content-placeholder">
              <p>📊 Gráficas por Colaboradores - Productividad</p>
            </div>
          </div>

          <!-- Analytics: Projects -->
          <div v-else-if="activeTab === 'analytics-projects'" class="content-wrapper">
            <div class="content-placeholder">
              <p>🎯 Gráficas por Proyectos - Performance</p>
            </div>
          </div>

          <!-- ORPHAN TIME SECTION -->

          <!-- Orphan Time Overview -->
          <div v-else-if="activeTab === 'orphan-overview'" class="content-wrapper">
            <div class="content-placeholder">
              <p>⏱️ Tiempo Huérfano - Overview general</p>
            </div>
          </div>

          <!-- Orphan Time Unestimated -->
          <div v-else-if="activeTab === 'orphan-unestimated'" class="content-wrapper">
            <UnestimatedWithIncurredPanel
              :calculated-requests="store.calculatedRequests"
              :children="store.children"
              :time-entries="store.timeEntries"
            />
          </div>

          <!-- PROYECTOS SECTION -->

          <!-- Proyectos -->
          <div v-else-if="activeTab === 'projects'" class="content-wrapper">
            <p style="color: var(--text-secondary); text-align: center;">
              Tabla de Proyectos - Iniciativas
            </p>
            <!-- TODO: Implement projects table -->
          </div>

          <!-- Default -->
          <div v-else class="content-wrapper">
            <div class="content-placeholder">
              <p>👈 Selecciona una opción del menú lateral para ver el contenido</p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="empty-state">
    <Card>
      <template #content>
        <p>Carga los tres CSV en la vista de Dashboard para ver las tablas</p>
      </template>
    </Card>
  </div>
</template>
        <template #content>
          <!-- Summary: General -->
          <div
            v-if="activeTab === 'summary-general'"
            class="content-placeholder"
          >
            <p>📊 Dashboard General - Resumen de métricas principales</p>
          </div>

          <!-- Summary: Financial -->
          <div
            v-else-if="activeTab === 'summary-financial'"
            class="content-placeholder"
          >
            <p>💰 Análisis Financiero - Ganancias, pérdidas y desviaciones</p>
          </div>

          <!-- Summary: Timeline -->
          <div
            v-else-if="activeTab === 'summary-timeline'"
            class="content-placeholder"
          >
            <p>📅 Timeline - Evolución temporal de métricas</p>
          </div>

          <!-- Peticiones Padre -->
          <div v-else-if="activeTab === 'parents'" class="content-placeholder">
            <p>📋 Tabla de Peticiones Padre - Principales</p>
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </div>

          <!-- Peticiones Hijas -->
          <div v-else-if="activeTab === 'children'" class="content-placeholder">
            <p>🔗 Tabla de Peticiones Hijas - Derivadas</p>
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </div>

          <!-- Usuarios -->
          <div v-else-if="activeTab === 'users'" class="content-placeholder">
            <p>👥 Tabla de Usuarios</p>
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </div>

          <!-- Colaboradores Table -->
          <div
            v-else-if="activeTab === 'collaborators-table'"
            class="content-placeholder"
          >
            <p>👨‍💼 Tabla de Colaboradores - Equipo</p>
            <CollaboratorsTable
              :time-entries="store.timeEntries"
              :children="store.children"
              :parents="store.parents"
            />
          </div>

          <!-- Proyectos -->
          <div v-else-if="activeTab === 'projects'" class="content-placeholder">
            <p>🗺️ Tabla de Proyectos - Iniciativas</p>
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </div>

          <!-- Analytics: Requests -->
          <div
            v-else-if="activeTab === 'analytics-requests'"
            class="content-placeholder"
          >
            <p>📈 Gráficas por Peticiones - Análisis detallado</p>
          </div>

          <!-- Analytics: Collaborators -->
          <div
            v-else-if="activeTab === 'analytics-collaborators'"
            class="content-placeholder"
          >
            <p>📊 Gráficas por Colaboradores - Productividad</p>
          </div>

          <!-- Analytics: Projects -->
          <div
            v-else-if="activeTab === 'analytics-projects'"
            class="content-placeholder"
          >
            <p>🎯 Gráficas por Proyectos - Performance</p>
          </div>

          <!-- Orphan Time Overview -->
          <div
            v-else-if="activeTab === 'orphan-overview'"
            class="content-placeholder"
          >
            <p>⏱️ Tiempo Huérfano - Overview general</p>
          </div>

          <!-- Orphan Time Unestimated -->
          <div
            v-else-if="activeTab === 'orphan-unestimated'"
            class="content-placeholder"
          >
            <p>⚠️ Sin Estimar con Incurrido - Detalle</p>
          </div>

          <!-- Default summary -->
          <div v-else class="content-placeholder">
            <p>Selecciona una opción del menú lateral para ver el contenido</p>
          </div>
        </template>
      </Card>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="empty-state">
    <Card>
      <template #content>
        <p>Carga los tres CSV en la vista de Dashboard para ver las tablas</p>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.tables-layout {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.5rem;
}

.content-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-card :deep(.p-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-card :deep(.p-card-body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.content-card :deep(.p-card-content) {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-placeholder {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-align: center;
  flex: 1;
}

.content-placeholder p {
  font-size: 1rem;
  opacity: 0.7;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 2rem;
}

.empty-state :deep(.p-card) {
  max-width: 500px;
}

/* Responsive */
@media (max-width: 768px) {
  .tables-layout {
    flex-direction: column;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
