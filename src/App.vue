<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
import CsvUploadPanel from './components/CsvUploadPanel.vue'
import TabsView from './components/TabsView.vue'
import { useDashboardStore } from './stores/dashboard'
import { useThemeInit } from './composables/useThemeInit'

const store = useDashboardStore()
useThemeInit()
</script>

<template>
  <AppLayout>
    <div class="app-content">
      <CsvUploadPanel />

      <TabsView v-if="store.hasData" />

      <div v-if="!store.hasData" class="empty-state">
        <p>Carga los tres CSV para empezar el análisis</p>
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
  color: var(--text-secondary);
  font-size: 1rem;
}
</style>
