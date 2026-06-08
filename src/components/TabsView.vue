<script setup lang="ts">
import { ref } from "vue";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import SummaryTab from "./SummaryTab.vue";
import DashboardTablesTabs from "./dashboard/tables/DashboardTablesTabs.vue";
import CollaboratorsTable from "./dashboard/tables/CollaboratorsTable.vue";
import ChartsTab from "./ChartsTab.vue";
import OrphanTimeEntriesPanel from "./OrphanTimeEntriesPanel.vue";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const activeTab = ref("resumen");
</script>

<template>
  <Tabs
    v-model:value="activeTab"
    class="tabs-view"
    :disabled="store.isProcessing"
  >
    <TabList>
      <Tab value="resumen" class="flex items-center gap-2">
        <i class="pi pi-fw pi-home"></i>
        <span>Resumen</span>
      </Tab>
      <Tab value="tablas" class="flex items-center gap-2">
        <i class="pi pi-fw pi-table"></i>
        <span>Tabla de Peticiones</span>
      </Tab>
      <Tab value="colaboradores" class="flex items-center gap-2">
        <i class="pi pi-fw pi-users"></i>
        <span>Colaboradores</span>
      </Tab>
      <Tab value="graficos" class="flex items-center gap-2">
        <i class="pi pi-fw pi-chart-bar"></i>
        <span>Gráficas</span>
      </Tab>
      <Tab value="huerfanos" class="flex items-center gap-2">
        <i class="pi pi-fw pi-exclamation-circle"></i>
        <span>Tiempos Huérfanos ({{ store.orphanTimeEntries.length }})</span>
      </Tab>
    </TabList>

    <TabPanels>
      <!-- Resumen Tab -->
      <TabPanel value="resumen">
        <SummaryTab
          :summary="store.filteredSummary"
          :requests="store.filteredCalculatedRequests"
          :warnings="store.warnings"
          :errors="store.errors"
        />
      </TabPanel>

      <!-- Tabla Tab with subtabs -->
      <TabPanel value="tablas">
        <DashboardTablesTabs
          :parents="store.parents"
          :children="store.children"
          :time-entries="store.filteredTimeEntries"
          :calculated-requests="store.filteredCalculatedRequests"
          :rows-per-page="25"
        />
      </TabPanel>

      <!-- Colaboradores Tab -->
      <TabPanel value="colaboradores">
        <CollaboratorsTable
          :time-entries="store.filteredTimeEntries"
          :children="store.children"
          :parents="store.parents"
        />
      </TabPanel>

      <!-- Gráficas Tab -->
      <TabPanel value="graficos">
        <ChartsTab
          :requests="store.calculatedRequests"
          :parents="store.parents"
          :children="store.children"
          :time-entries="store.timeEntries"
        />
      </TabPanel>

      <!-- Tiempos Huérfanos Tab -->
      <TabPanel value="huerfanos">
        <OrphanTimeEntriesPanel :orphans="store.orphanTimeEntries" />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<style scoped>
.tabs-view {
  width: 100%;
  background: var(--bg-primary);
}

.tabs-view :deep(.p-tabs) {
  background: var(--bg-primary);
}

.tabs-view :deep(.p-tabs-nav) {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.tabs-view :deep(.p-tabs-nav .p-tablist button) {
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 1rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabs-view :deep(.p-tabs-nav .p-tablist button:hover) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tabs-view :deep(.p-tabs-nav .p-tablist button[aria-selected="true"]) {
  color: var(--color-primary);
  border-bottom: 3px solid var(--color-primary);
}

.tabs-view :deep(.p-tabs-panels) {
  background: var(--bg-primary);
  padding: 1rem;
}

.tabs-view :deep(.p-tabs-panel) {
  color: var(--text-primary);
  background: var(--bg-primary);
}
</style>
