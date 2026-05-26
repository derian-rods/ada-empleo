<script setup lang="ts">
import CsvUploadPanel from './CsvUploadPanel.vue'
import TabsView from './TabsView.vue'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
</script>

<template>
  <div class="dashboard-view">
    <CsvUploadPanel />

    <TabsView v-if="store.hasData" />
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
