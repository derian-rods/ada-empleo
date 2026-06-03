<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { use } from "echarts";
import { BarChart, PieChart, LineChart } from "echarts/charts";
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
  LineChart,
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

// Calculate comprehensive totals
const totals = computed(() => {
  const totalEstimated = props.requests.reduce(
    (sum, r) => sum + (r.estimatedHoursTotal || r.estimatedHours || 0),
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

  // Calculate HBS totals
  const totalEstimatedHbs = props.requests.reduce(
    (sum, r) => sum + (r.estimatedHbs || 0),
    0,
  );
  const totalConsumedHbs = props.requests.reduce(
    (sum, r) => sum + (r.consumedHbs || 0),
    0,
  );
  const totalDifferenceHbs = totalEstimatedHbs - totalConsumedHbs;

  // Count applications and people
  const uniqueApplications = new Set<string>();
  const uniquePeople = new Set<string>();
  props.requests.forEach((r) => {
    if (r.applications)
      r.applications.forEach((a) => uniqueApplications.add(a));
    if (r.people) r.people.forEach((p) => uniquePeople.add(p));
  });

  return {
    totalEstimated,
    totalActual,
    totalDifference,
    deviationPercent,
    profitCount,
    lossCount,
    neutralCount,
    totalRequests: props.requests.length,
    totalEstimatedHbs,
    totalConsumedHbs,
    totalDifferenceHbs,
    totalApplications: uniqueApplications.size,
    totalPeople: uniquePeople.size,
    childrenCount: props.requests.reduce(
      (sum, r) => sum + (r.childrenCount || 0),
      0,
    ),
  };
});

const option = computed(() => ({
  title: {
    text: "Comparativa Total: Estimado vs Dedicado",
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
  },
  legend: {
    data: ["Estimado Total", "Dedicado Total", "Diferencia"],
    bottom: 0,
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
      fontSize: 11,
    },
  },
  yAxis: {
    type: "value",
    name: "Horas",
    axisLabel: {
      fontSize: 10,
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
    {
      name: "Diferencia",
      type: "bar",
      data: [totals.value.totalDifference],
      itemStyle: {
        color: totals.value.totalDifference > 0 ? "#22c55e" : "#ef4444",
      },
    },
  ],
}));

const statusPieOption = computed(() => ({
  title: {
    text: "Estado de Peticiones",
    left: "center",
    textStyle: {
      fontSize: 14,
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
      fontSize: 12,
    },
    padding: [8, 12],
    formatter: (params: any) => {
      if (!params) return "";
      const pct = ((params.value / totals.value.totalRequests) * 100).toFixed(
        1,
      );
      return `${params.name}: ${params.value} (${pct}%)`;
    },
  },
  legend: {
    bottom: 0,
  },
  series: [
    {
      name: "Peticiones",
      type: "pie",
      radius: ["30%", "70%"],
      data: [
        {
          value: totals.value.profitCount,
          name: `Ganancia (${totals.value.profitCount})`,
          itemStyle: { color: "#22c55e" },
        },
        {
          value: totals.value.lossCount,
          name: `Pérdida (${totals.value.lossCount})`,
          itemStyle: { color: "#ef4444" },
        },
        {
          value: totals.value.neutralCount,
          name: `Neutral (${totals.value.neutralCount})`,
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

const hbsOption = computed(() => ({
  title: {
    text: "Comparativa HBS: Estimado vs Consumido",
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
  },
  legend: {
    data: ["HBS Estimado", "HBS Consumido"],
    bottom: 0,
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
    data: ["HBS"],
    axisLabel: {
      fontSize: 11,
    },
  },
  yAxis: {
    type: "value",
    name: "Horas",
    axisLabel: {
      fontSize: 10,
    },
  },
  series: [
    {
      name: "HBS Estimado",
      type: "bar",
      data: [totals.value.totalEstimatedHbs],
      itemStyle: {
        color: "#8b5cf6",
      },
    },
    {
      name: "HBS Consumido",
      type: "bar",
      data: [totals.value.totalConsumedHbs],
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
  <div class="charts-wrapper">
    <!-- Main Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">Total Peticiones</div>
          <div class="stat-value">{{ totals.totalRequests }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-label">Personas</div>
          <div class="stat-value">{{ totals.totalPeople }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🗂️</div>
        <div class="stat-content">
          <div class="stat-label">Aplicaciones</div>
          <div class="stat-value">{{ totals.totalApplications }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <div class="stat-label">Peticiones Hijas</div>
          <div class="stat-value">{{ totals.childrenCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <div class="stat-label">Horas Estimadas</div>
          <div class="stat-value">{{ totals.totalEstimated.toFixed(0) }}h</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-label">Horas Dedicadas</div>
          <div class="stat-value">{{ totals.totalActual.toFixed(0) }}h</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-label">Diferencia</div>
          <div
            class="stat-value"
            :class="totals.totalDifference > 0 ? 'profit' : 'loss'"
          >
            {{ totals.totalDifference.toFixed(0) }}h
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📉</div>
        <div class="stat-content">
          <div class="stat-label">Desviación %</div>
          <div
            class="stat-value"
            :class="totals.deviationPercent > 0 ? 'profit' : 'loss'"
          >
            {{ totals.deviationPercent.toFixed(1) }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💚</div>
        <div class="stat-content">
          <div class="stat-label">Ganancia</div>
          <div class="stat-value profit">{{ totals.profitCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-label">Pérdida</div>
          <div class="stat-value loss">{{ totals.lossCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚪</div>
        <div class="stat-content">
          <div class="stat-label">Neutral</div>
          <div class="stat-value">{{ totals.neutralCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">HBS Estimado</div>
          <div class="stat-value">
            {{ totals.totalEstimatedHbs.toFixed(0) }}h
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <div class="chart-container">
        <VChart ref="chartRef" :option="option" autoresize />
      </div>
      <div class="chart-container">
        <VChart :option="statusPieOption" autoresize />
      </div>
      <div class="chart-container">
        <VChart :option="hbsOption" autoresize />
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts-wrapper {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-left: 4px solid var(--border-color);
}

.stat-card.primary {
  border-left-color: var(--color-primary);
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    rgba(59, 130, 246, 0.05) 100%
  );
}

.stat-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  font-size: 1.25rem;
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
  height: 350px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
