<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import ChartEstimatedVsActual from './ChartEstimatedVsActual.vue'
import ChartTopLosses from './ChartTopLosses.vue'
import ChartHoursByPerson from './ChartHoursByPerson.vue'
import ChartHoursByApp from './ChartHoursByApp.vue'
import type { CalculatedRequest } from '../domain/types'

interface ChartsTabProps {
  requests: CalculatedRequest[]
}

const props = defineProps<ChartsTabProps>()
const renderCharts = ref(false)

onMounted(() => {
  // Render charts after component is mounted and visible
  renderCharts.value = true
})

watch(
  () => props.requests,
  () => {
    // Re-render when data changes
    renderCharts.value = false
    setTimeout(() => {
      renderCharts.value = true
    }, 0)
  }
)
</script>

<template>
  <div class="charts-tab">
    <div v-if="renderCharts && requests.length > 0" class="charts-grid">
      <ChartEstimatedVsActual :data="requests" />
      <ChartTopLosses :data="requests" />
      <ChartHoursByPerson :data="requests" />
      <ChartHoursByApp :data="requests" />
    </div>
    <div v-else-if="requests.length === 0" class="no-data">
      <p>No hay datos para mostrar gráficos</p>
    </div>
  </div>
</template>

<style scoped>
.charts-tab {
  width: 100%;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}
</style>
