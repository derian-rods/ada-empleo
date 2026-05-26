<script setup lang="ts">
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import SummaryTab from './SummaryTab.vue'
import DashboardTablesTabs from './dashboard/tables/DashboardTablesTabs.vue'
import ChartsTab from './ChartsTab.vue'
import OrphanTimeEntriesPanel from './OrphanTimeEntriesPanel.vue'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
</script>

<template>
  <TabView class="tabs-view" :disabled="store.isProcessingCsv">
    <!-- Resumen Tab -->
    <TabPanel header="Resumen" value="0" :leftIcon="'pi pi-fw pi-home'">
      <SummaryTab
        :summary="store.summary"
        :requests="store.calculatedRequests"
        :warnings="store.warnings"
        :errors="store.errors"
      />
    </TabPanel>

    <!-- Tabla Tab with subtabs -->
    <TabPanel header="Tabla de Peticiones" value="1" :leftIcon="'pi pi-fw pi-table'">
      <DashboardTablesTabs
        :parents="store.parents"
        :children="store.children"
        :time-entries="store.timeEntries"
        :calculated-requests="store.calculatedRequests"
        :rows-per-page="25"
      />
    </TabPanel>

    <!-- Gráficas Tab -->
    <TabPanel header="Gráficas" value="2" :leftIcon="'pi pi-fw pi-chart-bar'">
      <ChartsTab :requests="store.calculatedRequests" />
    </TabPanel>

    <!-- Tiempos Huérfanos Tab -->
    <TabPanel :header="`Tiempos Huérfanos (${store.orphanTimeEntries.length})`" value="3" :leftIcon="'pi pi-fw pi-exclamation-circle'">
      <OrphanTimeEntriesPanel :orphans="store.orphanTimeEntries" />
    </TabPanel>
  </TabView>
</template>

<style scoped>
.tabs-view {
  width: 100%;
}
</style>
