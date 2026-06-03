<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { use } from "echarts";
import { BarChart, PieChart } from "echarts/charts";
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
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface ChartTotalSummaryProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartTotalSummaryProps>();

const chartRef = ref();

// Calculate totals
const totals = computed(() => {
  const totalEstimated = props.requests.reduce(
    (sum, r) => sum + (r.estimatedHoursTotal || 0),
    0,
  );
  const totalActual = props.requests.reduce(
    (sum, r) => sum + (r.actualHours || 0),
    0,
  );
  const totalDifference = totalEstimated - totalActual;
  const deviationPercent =
    totalEstimated > 0
      ? ((totalActual - totalEstimated) / totalEstimated) * 100
      : 0;

  const profitCount = props.requests.filter(
    (r) => r.resultStatus === "profit",
  ).length;
  const lossCount = props.requests.filter(
    (r) => r.resultStatus === "loss",
  ).length;
  const neutralCount = props.requests.filter(
    (r) => r.resultStatus === "neutral",
  ).length;

  return {
    totalEstimated,
    totalActual,
    totalDifference,
    deviationPercent,
    profitCount,
    lossCount,
    neutralCount,
    totalRequests: props.requests.length,
  };
});

const option = computed(() => ({
  title: {
    text: "Resumen Total de Horas",
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
  },
  legend: {
    data: ["Estimado Total", "Dedicado Total"],
    bottom: 10,
  },
  grid: {
    left: "10%",
    right: "10%",
    top: "20%",
    bottom: "15%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: ["Horas"],
    axisLabel: {
      fontSize: 12,
    },
  },
  yAxis: {
    type: "value",
    name: "Horas",
    axisLabel: {
      fontSize: 11,
    },
  },
  series: [
    {
      name: "Estimado Total",
      type: "bar",
      data: [totals.value.totalEstimated],
      itemStyle: {
        color: "#3b82f6",
      },
    },
    {
      name: "Dedicado Total",
      type: "bar",
      data: [totals.value.totalActual],
      itemStyle: {
        color: "#10b981",
      },
    },
  ],
}));

const statusPieOption = computed(() => ({
  title: {
    text: "Estado de Peticiones",
    left: "center",
    textStyle: {
      fontSize: 16,
      fontWeight: "bold",
    },
  },
  tooltip: {
    trigger: "item",
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
      if (!params) return "";
      const pct = ((params.value / totals.value.totalRequests) * 100).toFixed(
        1,
      );
      return `${params.name}: ${params.value} (${pct}%)`;
    },
  },
  legend: {
    bottom: 10,
  },
  series: [
    {
      name: "Peticiones",
      type: "pie",
      radius: "50%",
      data: [
        {
          value: totals.value.profitCount,
          name: "Ganancia",
          itemStyle: { color: "#22c55e" },
        },
        {
          value: totals.value.lossCount,
          name: "Pérdida",
          itemStyle: { color: "#ef4444" },
        },
        {
          value: totals.value.neutralCount,
          name: "Neutral",
          itemStyle: { color: "#6b7280" },
        },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
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
  <div class="charts-wrapper">
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-label">Horas Estimadas (JP+CS+AF)</div>
        <div class="stat-value">{{ totals.totalEstimated.toFixed(1) }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Horas Dedicadas</div>
        <div class="stat-value">{{ totals.totalActual.toFixed(1) }}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Diferencia</div>
        <div
          class="stat-value"
          :class="totals.totalDifference > 0 ? 'profit' : 'loss'"
        >
          {{ totals.totalDifference.toFixed(1) }}h
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Desviación %</div>
        <div
          class="stat-value"
          :class="totals.deviationPercent > 0 ? 'profit' : 'loss'"
        >
          {{ totals.deviationPercent.toFixed(1) }}%
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-container">
        <VChart ref="chartRef" :option="option" autoresize />
      </div>
      <div class="chart-container">
        <VChart :option="statusPieOption" autoresize />
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts-wrapper {
  width: 100%;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-value.profit {
  color: #22c55e;
}

.stat-value.loss {
  color: #ef4444;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
