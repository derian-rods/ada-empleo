<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts'
import { ScatterChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import {
  buildRiskMatrixData,
  getResultStatusValue,
  type RiskMatrixPoint,
} from '../../../domain/chartsData'
import type { ParentGroupedTableRow } from '../../../domain/parentGroupedTable'

use([ScatterChart, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

interface ChartRiskMatrixProps {
  rows: ParentGroupedTableRow[]
}

const props = defineProps<ChartRiskMatrixProps>()

const chartRef = ref()
const chartData = computed(() => {
  const points = buildRiskMatrixData(props.rows)

  // Organize by risk level
  const byRisk = {
    low: points.filter((p) => p.riskLevel === 'low'),
    medium: points.filter((p) => p.riskLevel === 'medium'),
    high: points.filter((p) => p.riskLevel === 'high'),
  }

  return {
    low: byRisk.low.map((p) => [
      getResultStatusValue(p.resultStatus),
      0,
      p.estimatedHours,
      p,
    ]),
    medium: byRisk.medium.map((p) => [
      getResultStatusValue(p.resultStatus),
      1,
      p.estimatedHours,
      p,
    ]),
    high: byRisk.high.map((p) => [
      getResultStatusValue(p.resultStatus),
      2,
      p.estimatedHours,
      p,
    ]),
  }
})

const option = computed(() => ({
  title: {
    text: 'Matriz de Riesgo: Resultado vs Riesgo',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  },
  tooltip: {
    trigger: 'item',
    confine: true,
    textStyle: {
      width: 300,
      overflow: 'break',
      lineHeight: 1.5,
    },
    formatter: (params: any) => {
      if (params.componentSubType === 'scatter') {
        const data = params.value[3] as RiskMatrixPoint
        return `
          <div style="max-width: 320px; word-wrap: break-word; white-space: normal;">
            <strong>${data.parentCode}</strong><br/>
            <span style="font-size: 12px; word-break: break-word;">${data.parentSubject}</span><br/>
            <hr style="margin: 4px 0; border: none; border-top: 1px solid #ccc;"/>
            <strong>Riesgo:</strong> ${data.riskLevel}<br/>
            <strong>Resultado:</strong> ${data.resultStatus}<br/>
            <strong>Est.:</strong> ${data.estimatedHours.toFixed(1)}h<br/>
            <strong>Real:</strong> ${data.actualHours.toFixed(1)}h<br/>
            <strong>Diferencia:</strong> ${data.differenceHours.toFixed(1)}h
          </div>
        `
      }
      return ''
    },
  },
  xAxis: {
    type: 'value',
    name: 'Resultado',
    nameLocation: 'middle',
    nameGap: 25,
    axisLabel: {
      formatter: (value: number) => {
        if (value === -1) return 'Pérdida'
        if (value === 0) return 'Neutral'
        return 'Ganancia'
      },
    },
    min: -1.5,
    max: 1.5,
    splitLine: {
      show: true,
      lineStyle: { type: 'dashed', color: '#e5e7eb' },
    },
  },
  yAxis: {
    type: 'category',
    data: ['Bajo', 'Medio', 'Alto'],
    name: 'Nivel de Riesgo',
    nameLocation: 'middle',
    nameGap: 50,
    axisLine: { show: true },
    splitLine: { show: false },
  },
  grid: {
    left: 120,
    right: 40,
    top: 80,
    bottom: 60,
    containLabel: true,
  },
  series: [
    {
      name: 'Bajo',
      type: 'scatter',
      data: chartData.value.low,
      symbolSize: (val: any) => Math.sqrt(val[2] ?? 20) * 1.5,
      itemStyle: { color: '#10b981' },
      emphasis: {
        itemStyle: { borderColor: '#059669', borderWidth: 2 },
      },
    },
    {
      name: 'Medio',
      type: 'scatter',
      data: chartData.value.medium,
      symbolSize: (val: any) => Math.sqrt(val[2] ?? 20) * 1.5,
      itemStyle: { color: '#f59e0b' },
      emphasis: {
        itemStyle: { borderColor: '#d97706', borderWidth: 2 },
      },
    },
    {
      name: 'Alto',
      type: 'scatter',
      data: chartData.value.high,
      symbolSize: (val: any) => Math.sqrt(val[2] ?? 20) * 1.5,
      itemStyle: { color: '#ef4444' },
      emphasis: {
        itemStyle: { borderColor: '#dc2626', borderWidth: 2 },
      },
    },
  ],
  legend: {
    orient: 'horizontal',
    bottom: 10,
  },
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
