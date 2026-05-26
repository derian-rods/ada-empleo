<script setup lang="ts">
import { computed } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import UsersTable from './UsersTable.vue'
import ChildRequestsTable from './ChildRequestsTable.vue'
import ParentRequestsTable from './ParentRequestsTable.vue'
import ParentProjectGroupTable from './ParentProjectGroupTable.vue'
import {
  buildUserTableRows,
  buildChildRequestTableRows,
  buildParentRequestTableRows,
  buildParentProjectGroupTableRows,
} from '../../../domain/tableAggregations'
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

const userRows = computed(() =>
  buildUserTableRows(props.calculatedRequests, props.children, props.timeEntries)
)

const childRows = computed(() =>
  buildChildRequestTableRows(
    props.parents,
    props.children,
    props.calculatedRequests,
    props.timeEntries
  )
)

const parentRows = computed(() => buildParentRequestTableRows(props.calculatedRequests))

const projectGroupRows = computed(() =>
  buildParentProjectGroupTableRows(
    props.parents,
    props.children,
    props.calculatedRequests,
    props.timeEntries
  )
)
</script>

<template>
  <TabView class="tables-tabs">
    <!-- Usuarios Tab -->
    <TabPanel header="Usuarios" value="0" :leftIcon="'pi pi-fw pi-users'">
      <UsersTable :rows="userRows" :loading="loading" :rows-per-page="rowsPerPage" :rows-per-page-options="rowsPerPageOptions" />
    </TabPanel>

    <!-- Peticiones hijas Tab -->
    <TabPanel header="Peticiones hijas" value="1" :leftIcon="'pi pi-fw pi-list'">
      <ChildRequestsTable :rows="childRows" :loading="loading" :rows-per-page="rowsPerPage" :rows-per-page-options="rowsPerPageOptions" />
    </TabPanel>

    <!-- Peticiones padre Tab -->
    <TabPanel header="Peticiones padre" value="2" :leftIcon="'pi pi-fw pi-home'">
      <ParentRequestsTable :rows="parentRows" :loading="loading" :rows-per-page="rowsPerPage" :rows-per-page-options="rowsPerPageOptions" />
    </TabPanel>

    <!-- Agrupado por proyecto padre Tab -->
    <TabPanel header="Agrupado por proyecto" value="3" :leftIcon="'pi pi-fw pi-folder'">
      <ParentProjectGroupTable :rows="projectGroupRows" :loading="loading" :rows-per-page="rowsPerPage" :rows-per-page-options="rowsPerPageOptions" />
    </TabPanel>
  </TabView>
</template>

<style scoped>
.tables-tabs {
  width: 100%;
}
</style>
