<script setup lang="ts">
import { ref } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import SummaryTab from './SummaryTab.vue'
import DashboardTablesTabs from './dashboard/tables/DashboardTablesTabs.vue'
import ChartsTab from './ChartsTab.vue'
import OrphanTimeEntriesPanel from './OrphanTimeEntriesPanel.vue'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
const activeTab = ref(0)
</script>

<template>
  <TabView v-model:activeIndex="activeTab" class="tabs-view" :disabled="store.isProcessingCsv">
    <!-- Resumen Tab -->
    <TabPanel header="Resumen" value="resumen" :leftIcon="'pi pi-fw pi-home'">
      <SummaryTab
        :summary="store.summary"
        :requests="store.calculatedRequests"
        :warnings="store.warnings"
        :errors="store.errors"
      />
    </TabPanel>

    <!-- Tabla Tab with subtabs -->
    <TabPanel header="Tabla de Peticiones" value="tablas" :leftIcon="'pi pi-fw pi-table'">
      <DashboardTablesTabs
        :parents="store.parents"
        :children="store.children"
        :time-entries="store.timeEntries"
        :calculated-requests="store.calculatedRequests"
        :rows-per-page="25"
      />
    </TabPanel>

    <!-- Gráficas Tab -->
    <TabPanel header="Gráficas" value="graficos" :leftIcon="'pi pi-fw pi-chart-bar'">
      <ChartsTab :requests="store.calculatedRequests" />
    </TabPanel>

    <!-- Tiempos Huérfanos Tab -->
    <TabPanel :header="`Tiempos Huérfanos (${store.orphanTimeEntries.length})`" value="huerfanos" :leftIcon="'pi pi-fw pi-exclamation-circle'">
      <OrphanTimeEntriesPanel :orphans="store.orphanTimeEntries" />
    </TabPanel>
  </TabView>
</template>

<style scoped>
.tabs-view {
  width: 100%;
}
</style>
