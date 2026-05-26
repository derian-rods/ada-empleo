<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { buildDeviationDistribution } from '../../../domain/chartsData'
import type { ParentGroupedTableRow } from '../../../domain/parentGroupedTable'

use([BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

interface ChartDeviationDistributionProps {
  rows: ParentGroupedTableRow[]
}

const props = defineProps<ChartDeviationDistributionProps>()

const chartRef = ref()
const distribution = computed(() => buildDeviationDistribution(props.rows))

const option = computed(() => ({
  title: {
    text: 'Distribución de Desviación de Estimación',
    subtext: 'Porcentaje de solicitudes por rango de desviación',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  },
  tooltip: {
    trigger: 'axis',
    confine: true,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderColor: '#333',
    borderWidth: 1,
    textStyle: {
      color: '#fff',
      fontSize: 13,
      lineHeight: 20,
    },
    padding: [12, 16],
    formatter: (params: any) => {
      if (params.length > 0) {
        const param = params[0]
        const bucket = distribution.value[param.dataIndex]
        return `
          <div style="max-width: 320px; word-wrap: break-word; white-space: normal; line-height: 1.8;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${bucket.range}</div>
            <div style="border-top: 1px solid #666; margin: 8px 0; padding-top: 8px;"></div>
            <div style="margin-bottom: 6px;"><span style="color: #aaa;">Solicitudes:</span> <strong>${bucket.count}</strong></div>
            <div style="margin-bottom: 6px;"><span style="color: #aaa;">Porcentaje:</span> <strong>${bucket.percentage.toFixed(1)}%</strong></div>
          </div>
        `
      }
      return ''
    },
  },
  xAxis: {
    type: 'category',
    data: distribution.value.map((b) => b.range),
    axisLabel: {
      rotate: 45,
      interval: 0,
    },
    name: 'Rango de Desviación',
    nameLocation: 'middle',
    nameGap: 40,
  },
  yAxis: {
    type: 'value',
    name: 'Cantidad de Solicitudes',
    nameLocation: 'middle',
    nameGap: 50,
    axisLabel: {
      formatter: (value: number) => Math.round(value).toString(),
    },
    splitLine: {
      show: true,
      lineStyle: { type: 'dashed', color: '#e5e7eb' },
    },
  },
  grid: {
    left: 80,
    right: 40,
    top: 100,
    bottom: 100,
    containLabel: true,
  },
  series: [
    {
      type: 'bar',
      data: distribution.value.map((bucket) => ({
        value: bucket.count,
        itemStyle: { color: bucket.color },
      })),
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => params.value,
      },
      emphasis: {
        itemStyle: {
          opacity: 0.8,
          borderColor: '#000',
          borderWidth: 1,
        },
      },
    },
  ],
}))

onMounted(() => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
})
</script>

<template>
  <div class="chart-container">
    <VChart ref="chartRef" :option="option" autoresize style="width: 100%; height: 100%" />
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}
</style>
