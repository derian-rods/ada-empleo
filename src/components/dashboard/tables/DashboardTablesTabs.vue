<script setup lang="ts">
import { ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ParentGroupedRequestsTable from './ParentGroupedRequestsTable.vue'
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
} from '../../../domain/types'

interface DashboardTablesTabsProps {
  parents: ParentRequest[]
  children: ChildRequest[]
  timeEntries: TimeEntry[]
  calculatedRequests: CalculatedRequest[]
  loading?: boolean
  rowsPerPage?: number
  rowsPerPageOptions?: number[]
}

const props = withDefaults(defineProps<DashboardTablesTabsProps>(), {
  loading: false,
  rowsPerPage: 25,
  rowsPerPageOptions: () => [10, 25, 50, 100],
})

const activeTab = ref('grouped')
</script>

<template>
  <Tabs v-model:value="activeTab" class="tables-tabs">
    <TabList>
      <Tab value="grouped" class="flex items-center gap-2">
        <i class="pi pi-fw pi-sitemap"></i>
        <span>Tabla agrupada por padre</span>
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="grouped">
        <ParentGroupedRequestsTable
          :parents="parents"
          :children="children"
          :time-entries="timeEntries"
          :calculated-requests="calculatedRequests"
          :loading="loading"
          :rows="rowsPerPage"
          :rows-per-page-options="rowsPerPageOptions"
        />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<style scoped>
.tables-tabs {
  width: 100%;
  background: var(--bg-primary);
}

.tables-tabs :deep(.p-tabs) {
  background: var(--bg-primary);
}

.tables-tabs :deep(.p-tabs-nav) {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.tables-tabs :deep(.p-tabs-nav .p-tablist) {
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tables-tabs :deep(.p-tabs-nav .p-tablist .p-tab) {
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 1rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tables-tabs :deep(.p-tabs-nav .p-tablist .p-tab:hover) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tables-tabs :deep(.p-tabs-nav .p-tablist .p-tab[aria-selected='true']) {
  color: var(--color-primary);
  border-bottom: 3px solid var(--color-primary);
}

.tables-tabs :deep(.p-tabs-panels) {
  background: var(--bg-primary);
  padding: 1rem;
}

.tables-tabs :deep(.p-tabs-panel) {
  color: var(--text-primary);
  background: var(--bg-primary);
}
</style>
