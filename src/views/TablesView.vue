<script setup lang="ts">
import { ref } from "vue";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import Card from "primevue/card";
import DashboardTablesTabs from "../components/dashboard/tables/DashboardTablesTabs.vue";
import CollaboratorsTable from "../components/dashboard/tables/CollaboratorsTable.vue";
import UnestimatedWithIncurredPanel from "../components/dashboard/tables/UnestimatedWithIncurredPanel.vue";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const activeTab = ref("requests");
</script>

<template>
  <div v-if="store.hasData" class="tables-view">
    <Tabs v-model:value="activeTab" class="tables-tabs">
      <TabList>
        <Tab value="requests" class="flex items-center gap-2">
          <i class="pi pi-briefcase"></i>
          <span>Peticiones</span>
        </Tab>
        <Tab value="collaborators" class="flex items-center gap-2">
          <i class="pi pi-users"></i>
          <span>Colaboradores</span>
        </Tab>
        <Tab value="orphans" class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Tiempo Huérfano</span>
        </Tab>
      </TabList>

      <TabPanels>
        <!-- Peticiones Tab -->
        <TabPanel value="requests">
          <div class="tab-content">
            <DashboardTablesTabs
              :parents="store.parents"
              :children="store.children"
              :time-entries="store.filteredTimeEntries"
              :calculated-requests="store.filteredCalculatedRequests"
              :rows-per-page="25"
            />
          </div>
        </TabPanel>

        <!-- Colaboradores Tab -->
        <TabPanel value="collaborators">
          <div class="tab-content">
            <CollaboratorsTable
              :time-entries="store.filteredTimeEntries"
              :children="store.children"
              :parents="store.parents"
            />
          </div>
        </TabPanel>

        <!-- Tiempo Huérfano Tab -->
        <TabPanel value="orphans">
          <div class="tab-content">
            <UnestimatedWithIncurredPanel
              :calculated-requests="store.filteredCalculatedRequests"
              :children="store.children"
              :time-entries="store.filteredTimeEntries"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
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
.tables-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.tables-view :deep(.p-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.tables-view :deep(.p-tablist) {
  flex-shrink: 0;
}

.tables-view :deep(.p-tabpanels) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tables-view :deep(.p-tabpanel) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  min-height: 0;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  width: 100%;
  overflow: auto;
  min-height: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
}
</style>
