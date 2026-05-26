<script setup lang="ts">
import Card from 'primevue/card'
import ChartsTab from '../components/ChartsTab.vue'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
</script>

<template>
  <Card>
    <template #title>Gráficos y Análisis Visual</template>
    <template #content>
      <div v-if="store.hasData" class="charts-content">
        <ChartsTab :requests="store.calculatedRequests" />
      </div>

      <div v-else class="empty-state">
        <p>Carga los tres CSV en la vista de Dashboard para ver los gráficos</p>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.charts-content {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-size: 1rem;
}
</style>
