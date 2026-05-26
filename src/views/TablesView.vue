<script setup lang="ts">
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Card from 'primevue/card'
import { ref } from 'vue'
import DashboardTablesTabs from '../components/dashboard/tables/DashboardTablesTabs.vue'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
const activeTabIndex = ref(0)
</script>

<template>
  <Card>
    <template #title>Tablas de Datos</template>
    <template #content>
      <div v-if="store.hasData" class="tables-content">
        <TabView v-model:activeIndex="activeTabIndex" class="tables-tabs">
          <TabPanel header="Peticiones Padre" value="0" :leftIcon="'pi pi-fw pi-briefcase'">
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </TabPanel>

          <TabPanel header="Peticiones Hijas" value="1" :leftIcon="'pi pi-fw pi-sitemap'">
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </TabPanel>

          <TabPanel header="Usuarios" value="2" :leftIcon="'pi pi-fw pi-users'">
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </TabPanel>

          <TabPanel header="Proyectos" value="3" :leftIcon="'pi pi-fw pi-map'">
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.timeEntries"
              :calculated-requests="store.calculatedRequests"
              :rows-per-page="25"
            />
          </TabPanel>
        </TabView>
      </div>

      <div v-else class="empty-state">
        <p>Carga los tres CSV en la vista de Dashboard para ver las tablas</p>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.tables-content {
  width: 100%;
}

.tables-tabs {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-size: 1rem;
}
</style>
