<script setup lang="ts">
import { ref } from "vue";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import Card from "primevue/card";
import DashboardTablesTabs from "../components/dashboard/tables/DashboardTablesTabs.vue";
import CollaboratorsTable from "../components/dashboard/tables/CollaboratorsTable.vue";
import UnestimatedWithIncurredPanel from "../components/dashboard/tables/UnestimatedWithIncurredPanel.vue";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const activeTab = ref(0);
</script>

<template>
  <div v-if="store.hasData" class="tables-view">
    <TabView
      :activeIndex="activeTab"
      @update:activeIndex="(i) => (activeTab = i)"
    >
      <!-- Peticiones Tab -->
      <TabPanel header="Peticiones" leftIcon="pi pi-briefcase" value="0">
        <div class="tab-content">
          <DashboardTablesTabs
            :parents="store.parents"
            :children="store.children"
            :time-entries="store.timeEntries"
            :calculated-requests="store.calculatedRequests"
            :rows-per-page="25"
          />
        </div>
      </TabPanel>

      <!-- Colaboradores Tab -->
      <TabPanel header="Colaboradores" leftIcon="pi pi-users" value="1">
        <div class="tab-content">
          <CollaboratorsTable
            :time-entries="store.timeEntries"
            :children="store.children"
            :parents="store.parents"
          />
        </div>
      </TabPanel>

      <!-- Tiempo Huérfano Tab -->
      <TabPanel
        header="Tiempo Huérfano"
        leftIcon="pi pi-exclamation-triangle"
        value="2"
      >
        <div class="tab-content">
          <UnestimatedWithIncurredPanel
            :calculated-requests="store.calculatedRequests"
            :children="store.children"
            :time-entries="store.timeEntries"
          />
        </div>
      </TabPanel>
    </TabView>
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

.tables-view :deep(.p-tabview) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.tables-view :deep(.p-tabview-nav) {
  flex-shrink: 0;
}

.tables-view :deep(.p-tabview-panels) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tables-view :deep(.p-tabview-panel) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  min-height: 0;
}

.tables-view :deep(.p-tabview-content) {
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
