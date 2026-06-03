<script setup lang="ts">
import { ref } from "vue";
import Sidebar from "primevue/sidebar";
import Button from "primevue/button";
import Card from "primevue/card";
import DashboardTablesTabs from "../components/dashboard/tables/DashboardTablesTabs.vue";
import CollaboratorsTable from "../components/dashboard/tables/CollaboratorsTable.vue";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const activeTab = ref("parents");
const showSidebar = ref(true);

// Tab configuration
const tabs = [
  {
    id: "parents",
    label: "Peticiones Padre",
    icon: "pi pi-briefcase",
    description: "Principales",
  },
  {
    id: "children",
    label: "Peticiones Hijas",
    icon: "pi pi-sitemap",
    description: "Derivadas",
  },
  {
    id: "users",
    label: "Usuarios",
    icon: "pi pi-users",
    description: "Colaboradores",
  },
  {
    id: "projects",
    label: "Proyectos",
    icon: "pi pi-map",
    description: "Iniciativas",
  },
  {
    id: "collaborators",
    label: "Colaboradores",
    icon: "pi pi-user-group",
    description: "Equipo",
  },
];

function selectTab(tabId: string) {
  activeTab.value = tabId;
  showSidebar.value = false; // Auto-close sidebar on mobile
}
</script>

<template>
  <div v-if="store.hasData" class="tables-layout">
    <!-- Sidebar with tabs -->
    <Sidebar
      v-model:visible="showSidebar"
      position="left"
      class="tabs-sidebar"
      header="Tablas"
    >
      <div class="tabs-menu">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click="selectTab(tab.id)"
        >
          <div class="tab-icon">
            <i :class="`pi ${tab.icon}`"></i>
          </div>
          <div class="tab-label">
            <div class="tab-title">{{ tab.label }}</div>
            <div class="tab-description">{{ tab.description }}</div>
          </div>
          <div v-if="activeTab === tab.id" class="tab-indicator"></div>
        </div>
      </div>
    </Sidebar>

    <!-- Main content -->
    <div class="tables-container">
      <!-- Toggle button (visible on mobile/small screens) -->
      <div class="toggle-button">
        <Button
          icon="pi pi-bars"
          severity="secondary"
          text
          rounded
          size="small"
          @click="showSidebar = true"
          v-tooltip="'Mostrar menú'"
        />
      </div>

      <!-- Content Card -->
      <Card>
        <template #title>
          {{ tabs.find((t) => t.id === activeTab)?.label }}
        </template>
        <template #content>
          <!-- Peticiones Padre -->
          <DashboardTablesTabs
            v-if="activeTab === 'parents'"
            :parents="store.parents"
            :children="store.children"
            :time-entries="store.timeEntries"
            :calculated-requests="store.calculatedRequests"
            :rows-per-page="25"
          />

          <!-- Peticiones Hijas -->
          <DashboardTablesTabs
            v-else-if="activeTab === 'children'"
            :parents="store.parents"
            :children="store.children"
            :time-entries="store.timeEntries"
            :calculated-requests="store.calculatedRequests"
            :rows-per-page="25"
          />

          <!-- Usuarios -->
          <DashboardTablesTabs
            v-else-if="activeTab === 'users'"
            :parents="store.parents"
            :children="store.children"
            :time-entries="store.timeEntries"
            :calculated-requests="store.calculatedRequests"
            :rows-per-page="25"
          />

          <!-- Proyectos -->
          <DashboardTablesTabs
            v-else-if="activeTab === 'projects'"
            :parents="store.parents"
            :children="store.children"
            :time-entries="store.timeEntries"
            :calculated-requests="store.calculatedRequests"
            :rows-per-page="25"
          />

          <!-- Colaboradores -->
          <CollaboratorsTable
            v-else-if="activeTab === 'collaborators'"
            :time-entries="store.timeEntries"
            :children="store.children"
            :parents="store.parents"
          />
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
  gap: 1rem;
  width: 100%;
  height: 100%;
}

.tabs-sidebar :deep(.p-sidebar-header) {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.tabs-sidebar :deep(.p-sidebar-content) {
  padding: 0;
}

.tabs-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  position: relative;
  border-left: 3px solid transparent;
}

.tab-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tab-item.active {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
  color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.tab-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  flex-shrink: 0;
}

.tab-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.tab-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.tab-description {
  font-size: 0.8rem;
  opacity: 0.7;
}

.tab-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.tables-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.toggle-button {
  display: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .tabs-sidebar {
    width: 280px !important;
  }

  .tab-description {
    display: none;
  }

  .tab-label {
    gap: 0;
  }
}

@media (max-width: 768px) {
  .tables-layout {
    flex-direction: column;
    gap: 0;
  }

  .tabs-sidebar {
    width: 100% !important;
    max-height: 50vh;
  }

  .tabs-menu {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .tab-item {
    flex: 0 0 auto;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.5rem;
    border-left: none;
    border-bottom: 3px solid transparent;
    border-radius: 0 0 0.5rem 0.5rem;
  }

  .tab-item.active {
    border-left: none;
    border-bottom-color: var(--color-primary);
  }

  .tab-icon {
    width: auto;
  }

  .toggle-button {
    display: flex;
    align-items: center;
  }

  .tables-container {
    gap: 0.5rem;
  }
}
</style>
