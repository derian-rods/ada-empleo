<script setup lang="ts">
import ChartEstimatedVsActual from './ChartEstimatedVsActual.vue'
import ChartTopLosses from './ChartTopLosses.vue'
import ChartHoursByPerson from './ChartHoursByPerson.vue'
import ChartHoursByApp from './ChartHoursByApp.vue'
import type { CalculatedRequest } from '../domain/types'

interface ChartsTabProps {
  requests: CalculatedRequest[]
}

defineProps<ChartsTabProps>()
</script>

<template>
  <div class="charts-tab">
    <div class="charts-grid">
      <ChartEstimatedVsActual :data="requests" />
      <ChartTopLosses :data="requests" />
      <ChartHoursByPerson :data="requests" />
      <ChartHoursByApp :data="requests" />
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
</style>
