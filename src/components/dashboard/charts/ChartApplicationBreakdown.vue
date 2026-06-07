<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { use } from "echarts";
import { BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
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
  DataZoomComponent,
  CanvasRenderer,
]);

interface ChartApplicationBreakdownProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartApplicationBreakdownProps>();
const chartRef = ref();

// Calculate global breakdown by applications
const appBreakdown = computed(() => {
  const apps: Record<
    string,
    {
      estimated: number;
      actual: number;
      count: number;
    }
  > = {};

  props.requests.forEach((r) => {
    if (r.applications && r.applications.length > 0) {
      r.applications.forEach((app) => {
        if (!apps[app]) {
          apps[app] = { estimated: 0, actual: 0, count: 0 };
        }
        apps[app].estimated += r.estimatedHoursTotal || r.estimatedHours || 0;
        apps[app].actual += r.actualHours || 0;
        apps[app].count++;
      });
    }
  });

  // Sort by actual hours descending
  return Object.entries(apps)
    .sort((a, b) => b[1].actual - a[1].actual)
    .map(([name, data]) => ({
      name,
      ...data,
    }));
});

const option = computed(() => ({
  title: {
    text: `Horas por Aplicación (${appBreakdown.value.length} aplicaciones)`,
    left: "center",
    textStyle: {
      fontSize: 14,
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
      fontSize: 12,
    },
    padding: [8, 12],
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return "";
      const dataIndex = params[0].dataIndex;
      const app = appBreakdown.value[dataIndex];

      if (!app) return "";

      return `
        <div style="max-width: 280px; word-wrap: break-word;">
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">${app.name}</div>
          <div style="border-top: 1px solid var(--border-color); margin: 6px 0; padding-top: 6px;"></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Estimado:</span> <strong>${app.estimated.toFixed(1)}h</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Real:</span> <strong>${app.actual.toFixed(1)}h</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Diferencia:</span> <strong>${(app.estimated - app.actual).toFixed(1)}h</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Peticiones:</span> <strong>${app.count}</strong></div>
        </div>
      `;
    },
  },
  legend: {
    data: ["Estimado", "Real"],
    bottom: 0,
  },
  grid: {
    left: "5%",
    right: "5%",
    top: "15%",
    bottom: "25%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: appBreakdown.value.map((a) => a.name),
    axisLabel: {
      interval: 0,
      rotate: 45,
      fontSize: 9,
    },
  },
  yAxis: {
    type: "value",
    name: "Horas",
    axisLabel: {
      fontSize: 10,
    },
  },
  dataZoom: [
    {
      type: "inside",
      start: 0,
      end: 100,
    },
    {
      type: "slider",
      show: true,
      start: 0,
      end: 100,
      height: 20,
    },
  ],
  series: [
    {
      name: "Estimado",
      type: "bar",
      data: appBreakdown.value.map((a) => a.estimated),
      itemStyle: {
        color: "#3b82f6",
      },
    },
    {
      name: "Real",
      type: "bar",
      data: appBreakdown.value.map((a) => a.actual),
      itemStyle: {
        color: "#10b981",
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
  <div class="chart-wrapper">
    <div class="chart-container">
      <VChart ref="chartRef" :option="option" autoresize />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 500px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
