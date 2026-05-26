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

const losses = computed(() => {
  if (!props.data) return []
  return props.data
    .filter((r) => r.resultStatus === 'loss')
    .sort((a, b) => a.differenceHours - b.differenceHours)
    .slice(0, 10)
})

const option = computed(() => {
  if (losses.value.length === 0) return {}

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: losses.value.map((r) => r.code),
      axisLabel: { rotate: 45, fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Pérdida',
        type: 'bar',
        data: losses.value.map((r) => Math.abs(r.differenceHours)),
        itemStyle: { color: '#ef4444' },
      },
    ],
  }
})
</script>

<template>
  <Card>
    <template #title>Top 10 Pérdidas</template>
    <template #content>
      <Message v-if="losses.length === 0" severity="info" text="Sin pérdidas registradas" />
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
