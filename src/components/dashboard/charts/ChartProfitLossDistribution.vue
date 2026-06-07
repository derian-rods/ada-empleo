<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { use } from "echarts";
import { PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import type { CalculatedRequest } from "../../../domain/types";

use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface ChartProfitLossDistributionProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartProfitLossDistributionProps>();
const chartRef = ref();

// Calculate global profit/loss distribution with totals
const plDistribution = computed(() => {
  let profit = 0;
  let loss = 0;
  let neutral = 0;
  let profitCount = 0;
  let lossCount = 0;
  let neutralCount = 0;

  props.requests.forEach((r) => {
    const status = r.resultStatus;
    const hours = r.actualHours || 0;

    if (status === "profit") {
      profit += hours;
      profitCount++;
    } else if (status === "loss") {
      loss += hours;
      lossCount++;
    } else {
      neutral += hours;
      neutralCount++;
    }
  });

  return {
    profit,
    loss,
    neutral,
    profitCount,
    lossCount,
    neutralCount,
    totalHours: profit + loss + neutral,
  };
});

const option = computed(() => ({
  title: {
    text: `Distribución Global: Ganancia vs Pérdida (${props.requests.length} peticiones)`,
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
      const name = params.name;
      const value = params.value;
      const percent = ((value / plDistribution.value.totalHours) * 100).toFixed(
        1,
      );

      let count = 0;
      if (name.includes("Ganancia")) {
        count = plDistribution.value.profitCount;
      } else if (name.includes("Pérdida")) {
        count = plDistribution.value.lossCount;
      } else {
        count = plDistribution.value.neutralCount;
      }

      return `
        <div style="max-width: 250px;">
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">${name}</div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Horas:</span> <strong>${value.toFixed(1)}h</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Porcentaje:</span> <strong>${percent}%</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Peticiones:</span> <strong>${count}</strong></div>
        </div>
      `;
    },
  },
  legend: {
    bottom: 0,
    orient: "horizontal",
  },
  series: [
    {
      name: "Distribución de Horas",
      type: "pie",
      radius: ["30%", "70%"],
      data: [
        {
          value: plDistribution.value.profit,
          name: `Ganancia (${plDistribution.value.profitCount})`,
          itemStyle: { color: "#22c55e" },
        },
        {
          value: plDistribution.value.loss,
          name: `Pérdida (${plDistribution.value.lossCount})`,
          itemStyle: { color: "#ef4444" },
        },
        {
          value: plDistribution.value.neutral,
          name: `Neutral (${plDistribution.value.neutralCount})`,
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
  height: 400px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
