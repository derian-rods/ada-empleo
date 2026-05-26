<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import Card from 'primevue/card'
import Message from 'primevue/message'
import type { CalculatedRequest } from '../domain/types'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{ data: CalculatedRequest[] }>()
const chartReady = ref(false)

onMounted(async () => {
  // Wait for DOM to fully render and be visible
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  chartReady.value = true
})

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return null

  const sorted = [...props.data]
    .sort((a, b) => b.estimatedHours - a.estimatedHours)
    .slice(0, 20)

  return {
    labels: sorted.map((r) => r.code),
    estimated: sorted.map((r) => r.estimatedHours),
    actual: sorted.map((r) => r.actualHours),
  }
})

const option = computed(() => {
  if (!chartData.value) return {}

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Estimadas', 'Reales'] },
    grid: { left: 60, right: 20, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: chartData.value.labels,
      axisLabel: { rotate: 45, fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      { name: 'Estimadas', type: 'bar', data: chartData.value.estimated },
      { name: 'Reales', type: 'bar', data: chartData.value.actual },
    ],
  }
})
</script>

<template>
  <Card>
    <template #title>Estimadas vs Reales (Top 20)</template>
    <template #content>
      <Message v-if="!data || data.length === 0" severity="info" text="Sin datos" />
      <div v-else-if="chartReady" class="chart-container">
        <VChart :option="option" autoresize />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 350px;
}
</style>
