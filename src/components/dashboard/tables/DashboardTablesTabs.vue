<script setup lang="ts">
import { ref } from "vue";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import ParentGroupedRequestsTable from "./ParentGroupedRequestsTable.vue";
import UnestimatedWithIncurredPanel from "./UnestimatedWithIncurredPanel.vue";
import GSPProfilesTable from "./GSPProfilesTable.vue";
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
} from "../../../domain/types";

interface DashboardTablesTabsProps {
  parents: ParentRequest[];
  children: ChildRequest[];
  timeEntries: TimeEntry[];
  calculatedRequests: CalculatedRequest[];
  loading?: boolean;
}

const props = withDefaults(defineProps<DashboardTablesTabsProps>(), {
  loading: false,
});

const activeTab = ref("grouped");
</script>

<template>
  <Tabs v-model:value="activeTab" class="tables-tabs">
    <TabList>
      <Tab value="grouped" class="flex items-center gap-2">
        <i class="pi pi-fw pi-sitemap"></i>
        <span>Tabla agrupada por padre</span>
      </Tab>
      <Tab value="unestimated" class="flex items-center gap-2">
        <i class="pi pi-fw pi-exclamation-circle"></i>
        <span>Sin estimar con incurrido</span>
      </Tab>
      <Tab value="gsp" class="flex items-center gap-2">
        <i class="pi pi-fw pi-users"></i>
        <span>GP-SAE</span>
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
        />
      </TabPanel>
      <TabPanel value="unestimated">
        <UnestimatedWithIncurredPanel
          :calculated-requests="calculatedRequests"
          :children="children"
          :time-entries="timeEntries"
          :loading="loading"
        />
      </TabPanel>
      <TabPanel value="gsp">
        <GSPProfilesTable :children="children" :loading="loading" />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<style scoped>
.tables-tabs {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.tables-tabs :deep(.p-tabs) {
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tables-tabs :deep(.p-tabs-nav) {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
  flex-shrink: 0;
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

.tables-tabs :deep(.p-tabs-nav .p-tablist .p-tab[aria-selected="true"]) {
  color: var(--color-primary);
  border-bottom: 3px solid var(--color-primary);
}

.tables-tabs :deep(.p-tabs-panels) {
  background: var(--bg-primary);
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tables-tabs :deep(.p-tabs-panel) {
  color: var(--text-primary);
  background: var(--bg-primary);
  height: 100%;
  overflow: auto;
}
</style>
