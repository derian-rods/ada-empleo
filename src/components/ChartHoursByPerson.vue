<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import Card from 'primevue/card'
import Message from 'primevue/message'
import type { CalculatedRequest } from '../domain/types'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{ data: CalculatedRequest[] }>()
const chartReady = ref(false)

onMounted(async () => {
  // Wait for DOM to fully render and be visible
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  chartReady.value = true
})

const chartData = computed(() => {
  if (!props.data) return null

  const hoursMap = new Map<string, number>()
  for (const req of props.data) {
    const perPerson = req.actualHours / (req.people.length || 1)
    for (const person of req.people) {
      hoursMap.set(person, (hoursMap.get(person) ?? 0) + perPerson)
    }
  }

  const sorted = [...hoursMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  if (sorted.length === 0) return null

  return {
    names: sorted.map(([name]) => name).reverse(),
    values: sorted.map(([, h]) => Math.round(h * 10) / 10).reverse(),
  }
})

const option = computed(() => {
  if (!chartData.value) return {}

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 20, top: 40, bottom: 20 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: chartData.value.names,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: chartData.value.values,
        itemStyle: { color: '#6366f1' },
      },
    ],
  }
})
</script>

<template>
  <Card>
    <template #title>Horas por Persona (Top 15)</template>
    <template #content>
      <Message v-if="!chartData" severity="info" text="Sin datos" />
      <div v-else-if="chartReady" class="chart-container">
        <VChart :option="option" autoresize />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}
</style>
