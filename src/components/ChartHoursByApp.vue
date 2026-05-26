<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import Card from 'primevue/card'
import Message from 'primevue/message'
import type { CalculatedRequest } from '../domain/types'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

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
    for (const app of req.applications) {
      hoursMap.set(
        app,
        (hoursMap.get(app) ?? 0) + req.actualHours / (req.applications.length || 1)
      )
    }
  }

  const sorted = [...hoursMap.entries()].sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return null

  return sorted.map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }))
})

const option = computed(() => {
  if (!chartData.value) return {}

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}h ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['35%', '50%'],
        data: chartData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: { fontSize: 11 },
      },
    ],
  }
})
</script>

<template>
  <Card>
    <template #title>Horas por Aplicación</template>
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
  height: 350px;
}
</style>
