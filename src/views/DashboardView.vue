<script setup lang="ts">
import CsvUploadPanel from '../components/CsvUploadPanel.vue'
import SummaryTab from '../components/SummaryTab.vue'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
</script>

<template>
  <div class="dashboard-view">
    <CsvUploadPanel />

    <SummaryTab
      v-if="store.hasData"
      :summary="store.summary"
      :requests="store.calculatedRequests"
      :warnings="store.warnings"
      :errors="store.errors"
    />

    <div v-if="!store.hasData" class="empty-state">
      <p>Carga los tres CSV para empezar el análisis</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-size: 1rem;
}
</style>
