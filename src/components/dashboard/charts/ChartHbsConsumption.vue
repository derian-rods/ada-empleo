<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { use } from "echarts";
import { BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import type { CalculatedRequest } from "../../../domain/types";

use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface ChartHbsConsumptionProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartHbsConsumptionProps>();

const chartRef = ref();

// Prepare data for the HBS bar chart
const chartData = computed(() => {
  const data = props.requests
    .filter((r) => r.estimatedHbs > 0 || r.consumedHbs > 0)
    .slice(0, 20) // Limit to top 20 requests for readability
    .map((r) => ({
      code: r.code,
      subject: r.subject,
      estimadoHbs: r.estimatedHbs || 0,
      consumidoHbs: r.consumedHbs || 0,
      diferenciaHbs: r.differenceHbs || 0,
      desviaciónPctHbs: r.deviationPercentHbs || 0,
    }));

  return {
    categories: data.map((d) => d.code),
    estimado: data.map((d) => d.estimadoHbs),
    consumido: data.map((d) => d.consumidoHbs),
    data,
  };
});

const option = computed(() => ({
  title: {
    text: "HBS (Horas de Billing de Sistema): Estimado vs Consumido",
    left: "center",
    textStyle: {
      fontSize: 16,
      fontWeight: "bold",
    },
  },
  tooltip: {
    trigger: "axis",
    confine: true,
    backgroundColor: "var(--tooltip-bg)",
    borderColor: "var(--tooltip-border)",
    borderWidth: 1,
    textStyle: {
      color: "var(--tooltip-text)",
      fontSize: 13,
      lineHeight: 20,
    },
    padding: [12, 16],
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return "";

      const dataIndex = params[0].dataIndex;
      const dataItem = chartData.value.data[dataIndex];

      if (!dataItem) return "";

      return `
        <div style="max-width: 300px; word-wrap: break-word; white-space: normal;">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${dataItem.code}</div>
          <div style="font-size: 12px; margin-bottom: 8px; color: var(--text-soft); word-break: break-word;">${dataItem.subject}</div>
          <div style="border-top: 1px solid var(--border-color-dark); margin: 8px 0; padding-top: 8px;"></div>
          <div style="margin-bottom: 6px;"><span style="color: var(--text-secondary);">Estimado HBS:</span> <strong>${dataItem.estimadoHbs.toFixed(1)}</strong></div>
          <div style="margin-bottom: 6px;"><span style="color: var(--text-secondary);">Consumido HBS:</span> <strong>${dataItem.consumidoHbs.toFixed(1)}</strong></div>
          <div style="margin-bottom: 6px;"><span style="color: var(--text-secondary);">Diferencia HBS:</span> <strong>${dataItem.diferenciaHbs.toFixed(1)}</strong></div>
          <div style="margin-bottom: 6px;"><span style="color: var(--text-secondary);">Desviación:</span> <strong>${dataItem.desviaciónPctHbs.toFixed(1)}%</strong></div>
        </div>
      `;
    },
  },
  legend: {
    data: ["Estimado HBS", "Consumido HBS"],
    bottom: 10,
  },
  grid: {
    left: "5%",
    right: "5%",
    top: "20%",
    bottom: "15%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: chartData.value.categories,
    axisLabel: {
      interval: 0,
      rotate: 45,
      fontSize: 11,
    },
  },
  yAxis: {
    type: "value",
    name: "HBS",
    axisLabel: {
      fontSize: 11,
    },
  },
  series: [
    {
      name: "Estimado HBS",
      type: "bar",
      data: chartData.value.estimado,
      itemStyle: {
        color: "#8b5cf6",
      },
    },
    {
      name: "Consumido HBS",
      type: "bar",
      data: chartData.value.consumido,
      itemStyle: {
        color: "#ec4899",
      },
    },
  ],
}));

onMounted(() => {
  if (chartRef.value) {
    chartRef.value.resize();
  }
});
</script>

<template>
  <div class="chart-container">
    <VChart ref="chartRef" :option="option" autoresize />
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 500px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
