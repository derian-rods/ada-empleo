<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
import CsvUploadPanel from './components/CsvUploadPanel.vue'
import TabsView from './components/TabsView.vue'
import { useDashboardStore } from './stores/dashboard'
import { watch } from 'vue'

const store = useDashboardStore()

// Debug
watch(
  () => store.hasData,
  (newVal) => {
    console.log('hasData changed to:', newVal)
    console.log('parentsLoaded:', store.parentsLoaded)
    console.log('timeEntriesLoaded:', store.timeEntriesLoaded)
    console.log('parents count:', store.parents.length)
    console.log('timeEntries count:', store.timeEntries.length)
    console.log('calculatedRequests count:', store.calculatedRequests.length)
  }
)
</script>

<template>
  <AppLayout>
    <div class="app-content">
      <CsvUploadPanel />

      <div v-if="store.hasData">
        <p style="color: green; font-weight: bold;">DEBUG: hasData es TRUE</p>
        <p>Parents: {{ store.parents.length }}, Calculados: {{ store.calculatedRequests.length }}</p>
        <TabsView />
      </div>

      <div v-else class="empty-state">
        <p>Carga los tres CSV para empezar el análisis</p>
        <p style="color: gray; font-size: 0.9rem;">DEBUG: hasData={{ store.hasData }}, parentsLoaded={{ store.parentsLoaded }}, timeEntriesLoaded={{ store.timeEntriesLoaded }}</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.app-content {
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
