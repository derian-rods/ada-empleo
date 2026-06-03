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

interface ChartDeviationRangesProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartDeviationRangesProps>();

const chartRef = ref();

// Calculate deviation ranges
const deviationRanges = computed(() => {
  const ranges = {
    "Muy Bajo (-50%)": 0,
    "Bajo (-25% a -50%)": 0,
    "Medio (-10% a -25%)": 0,
    "Bajo Positivo (-10% a 10%)": 0,
    "Medio Positivo (10% a 25%)": 0,
    "Alto (25% a 50%)": 0,
    "Muy Alto (>50%)": 0,
  };

  props.requests.forEach((r) => {
    const deviation = r.deviationPercent;

    if (deviation <= -50) ranges["Muy Bajo (-50%)"]++;
    else if (deviation <= -25) ranges["Bajo (-25% a -50%)"]++;
    else if (deviation <= -10) ranges["Medio (-10% a -25%)"]++;
    else if (deviation <= 10) ranges["Bajo Positivo (-10% a 10%)"]++;
    else if (deviation <= 25) ranges["Medio Positivo (10% a 25%)"]++;
    else if (deviation <= 50) ranges["Alto (25% a 50%)"]++;
    else ranges["Muy Alto (>50%)"]++;
  });

  return ranges;
});

const option = computed(() => ({
  title: {
    text: "Distribución de Desviaciones por Rango",
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
    },
    padding: [12, 16],
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return "";
      const param = params[0];
      const total = props.requests.length;
      const pct = ((param.value / total) * 100).toFixed(1);
      return `${param.name}: ${param.value} peticiones (${pct}%)`;
    },
  },
  legend: {
    bottom: 10,
  },
  grid: {
    left: "5%",
    right: "5%",
    top: "20%",
    bottom: "20%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: Object.keys(deviationRanges.value),
    axisLabel: {
      interval: 0,
      rotate: 45,
      fontSize: 11,
    },
  },
  yAxis: {
    type: "value",
    name: "Peticiones",
    axisLabel: {
      fontSize: 11,
    },
  },
  series: [
    {
      name: "Peticiones",
      type: "bar",
      data: Object.values(deviationRanges.value),
      itemStyle: {
        color: new (window as any).echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#3b82f6" },
          { offset: 1, color: "#1e40af" },
        ]),
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
