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

interface ChartGlobalHbsProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartGlobalHbsProps>();
const chartRef = ref();

// Calculate global HBS totals
const hbsTotals = computed(() => {
  const totalEstimatedHbs = props.requests.reduce(
    (sum, r) => sum + (r.estimatedHbs || 0),
    0,
  );
  const totalConsumedHbs = props.requests.reduce(
    (sum, r) => sum + (r.consumedHbs || 0),
    0,
  );
  const totalDifferenceHbs = totalEstimatedHbs - totalConsumedHbs;
  const deviationPercent =
    totalEstimatedHbs > 0
      ? ((totalConsumedHbs - totalEstimatedHbs) / totalEstimatedHbs) * 100
      : 0;

  return {
    totalEstimatedHbs,
    totalConsumedHbs,
    totalDifferenceHbs,
    deviationPercent,
  };
});

const option = computed(() => ({
  title: {
    text: `Comparativa Global HBS: Estimado vs Consumido (${props.requests.length} peticiones)`,
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

      return `
        <div style="max-width: 280px;">
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">HBS Estimado:</span> <strong>${hbsTotals.value.totalEstimatedHbs.toFixed(0)}</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">HBS Consumido:</span> <strong>${hbsTotals.value.totalConsumedHbs.toFixed(0)}</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Diferencia:</span> <strong style="color: ${hbsTotals.value.totalDifferenceHbs > 0 ? "#22c55e" : "#ef4444"}">${hbsTotals.value.totalDifferenceHbs.toFixed(0)}</strong></div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-color);"><span style="color: var(--text-secondary);">Desviación:</span> <strong>${hbsTotals.value.deviationPercent.toFixed(1)}%</strong></div>
        </div>
      `;
    },
  },
  legend: {
    data: ["HBS Estimado", "HBS Consumido", "Diferencia"],
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
    data: ["HBS Global"],
    axisLabel: {
      fontSize: 11,
    },
  },
  yAxis: {
    type: "value",
    name: "Horas de Billing",
    axisLabel: {
      fontSize: 10,
    },
  },
  series: [
    {
      name: "HBS Estimado",
      type: "bar",
      data: [hbsTotals.value.totalEstimatedHbs],
      itemStyle: {
        color: "#8b5cf6",
      },
    },
    {
      name: "HBS Consumido",
      type: "bar",
      data: [hbsTotals.value.totalConsumedHbs],
      itemStyle: {
        color: "#ec4899",
      },
    },
    {
      name: "Diferencia",
      type: "bar",
      data: [hbsTotals.value.totalDifferenceHbs],
      itemStyle: {
        color: hbsTotals.value.totalDifferenceHbs > 0 ? "#22c55e" : "#ef4444",
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

    <div class="hbs-summary">
      <div class="summary-card estimated">
        <div class="summary-label">HBS Estimado</div>
        <div class="summary-value">
          {{ hbsTotals.totalEstimatedHbs.toFixed(0) }}
        </div>
      </div>

      <div class="summary-card consumed">
        <div class="summary-label">HBS Consumido</div>
        <div class="summary-value">
          {{ hbsTotals.totalConsumedHbs.toFixed(0) }}
        </div>
      </div>

      <div
        class="summary-card"
        :class="hbsTotals.totalDifferenceHbs > 0 ? 'profit' : 'loss'"
      >
        <div class="summary-label">Diferencia</div>
        <div class="summary-value">
          {{ hbsTotals.totalDifferenceHbs.toFixed(0) }}
        </div>
      </div>

      <div class="summary-card deviation">
        <div class="summary-label">Desviación</div>
        <div class="summary-value">
          {{ hbsTotals.deviationPercent.toFixed(1) }}%
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.hbs-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-card.estimated {
  border-left-color: #8b5cf6;
}

.summary-card.consumed {
  border-left-color: #ec4899;
}

.summary-card.profit {
  border-left-color: #22c55e;
}

.summary-card.loss {
  border-left-color: #ef4444;
}

.summary-card.deviation {
  border-left-color: #f59e0b;
}

.summary-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
