<script setup lang="ts">
import { ref } from "vue";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import SummaryTab from "./SummaryTab.vue";
import DashboardTablesTabs from "./dashboard/tables/DashboardTablesTabs.vue";
import CollaboratorsTable from "./dashboard/tables/CollaboratorsTable.vue";
import ChartsTab from "./ChartsTab.vue";
import OrphanTimeEntriesPanel from "./OrphanTimeEntriesPanel.vue";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const activeTab = ref(0);
</script>

<template>
  <TabView
    v-model:activeIndex="activeTab"
    class="tabs-view"
    :disabled="store.isProcessing"
  >
    <!-- Resumen Tab -->
    <TabPanel header="Resumen" value="resumen" :leftIcon="'pi pi-fw pi-home'">
      <SummaryTab
        :summary="store.filteredSummary"
        :requests="store.filteredCalculatedRequests"
        :warnings="store.warnings"
        :errors="store.errors"
      />
    </TabPanel>

    <!-- Tabla Tab with subtabs -->
    <TabPanel
      header="Tabla de Peticiones"
      value="tablas"
      :leftIcon="'pi pi-fw pi-table'"
    >
      <DashboardTablesTabs
        :parents="store.parents"
        :children="store.children"
        :time-entries="store.filteredTimeEntries"
        :calculated-requests="store.filteredCalculatedRequests"
        :rows-per-page="25"
      />
    </TabPanel>

    <!-- Colaboradores Tab -->
    <TabPanel
      header="Colaboradores"
      value="colaboradores"
      :leftIcon="'pi pi-fw pi-users'"
    >
      <CollaboratorsTable
        :time-entries="store.filteredTimeEntries"
        :children="store.children"
        :parents="store.parents"
      />
    </TabPanel>

    <!-- Gráficas Tab -->
    <TabPanel
      header="Gráficas"
      value="graficos"
      :leftIcon="'pi pi-fw pi-chart-bar'"
    >
      <ChartsTab
        :requests="store.calculatedRequests"
        :parents="store.parents"
        :children="store.children"
        :time-entries="store.timeEntries"
      />
    </TabPanel>

    <!-- Tiempos Huérfanos Tab -->
    <TabPanel
      :header="`Tiempos Huérfanos (${store.orphanTimeEntries.length})`"
      value="huerfanos"
      :leftIcon="'pi pi-fw pi-exclamation-circle'"
    >
      <OrphanTimeEntriesPanel :orphans="store.orphanTimeEntries" />
    </TabPanel>
  </TabView>
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
