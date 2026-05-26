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
}
</style>
