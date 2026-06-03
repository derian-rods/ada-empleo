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
import * as echarts from "echarts";
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

// Calculate deviation ranges with detailed stats
const deviationStats = computed(() => {
  const ranges = {
    "Muy Bajo (-50%)": { count: 0, hours: 0 },
    "Bajo (-25% a -50%)": { count: 0, hours: 0 },
    "Medio (-10% a -25%)": { count: 0, hours: 0 },
    "Bajo Positivo (-10% a 10%)": { count: 0, hours: 0 },
    "Medio Positivo (10% a 25%)": { count: 0, hours: 0 },
    "Alto (25% a 50%)": { count: 0, hours: 0 },
    "Muy Alto (>50%)": { count: 0, hours: 0 },
  };

  props.requests.forEach((r) => {
    const deviation = r.deviationPercent;
    const hours = r.actualHours || 0;

    if (deviation <= -50) {
      ranges["Muy Bajo (-50%)"].count++;
      ranges["Muy Bajo (-50%)"].hours += hours;
    } else if (deviation <= -25) {
      ranges["Bajo (-25% a -50%)"].count++;
      ranges["Bajo (-25% a -50%)"].hours += hours;
    } else if (deviation <= -10) {
      ranges["Medio (-10% a -25%)"].count++;
      ranges["Medio (-10% a -25%)"].hours += hours;
    } else if (deviation <= 10) {
      ranges["Bajo Positivo (-10% a 10%)"].count++;
      ranges["Bajo Positivo (-10% a 10%)"].hours += hours;
    } else if (deviation <= 25) {
      ranges["Medio Positivo (10% a 25%)"].count++;
      ranges["Medio Positivo (10% a 25%)"].hours += hours;
    } else if (deviation <= 50) {
      ranges["Alto (25% a 50%)"].count++;
      ranges["Alto (25% a 50%)"].hours += hours;
    } else {
      ranges["Muy Alto (>50%)"].count++;
      ranges["Muy Alto (>50%)"].hours += hours;
    }
  });

  return ranges;
});

const option = computed(() => ({
  title: {
    text: "Distribución de Desviaciones: Cantidad de Peticiones por Rango",
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
      const param = params[0];
      const total = props.requests.length;
      const pct = ((param.value / total) * 100).toFixed(1);
      const range = param.axisValue;
      const hours =
        deviationStats.value[range as keyof typeof deviationStats.value]
          ?.hours || 0;
      return `${range}<br/>Peticiones: ${param.value} (${pct}%)<br/>Horas: ${hours.toFixed(0)}h`;
    },
  },
  legend: {
    bottom: 0,
  },
  grid: {
    left: "5%",
    right: "5%",
    top: "15%",
    bottom: "20%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: Object.keys(deviationStats.value),
    axisLabel: {
      interval: 0,
      rotate: 45,
      fontSize: 10,
    },
  },
  yAxis: {
    type: "value",
    name: "Peticiones",
    axisLabel: {
      fontSize: 10,
    },
  },
  series: [
    {
      name: "Peticiones",
      type: "bar",
      data: Object.values(deviationStats.value).map((v) => v.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#3b82f6" },
          { offset: 1, color: "#1e40af" },
        ]),
      },
      label: {
        show: true,
        position: "top",
        fontSize: 10,
        formatter: (params: any) => {
          return params.value;
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

    <div class="ranges-detail">
      <h3>Detalle por Rango de Desviación</h3>
      <div class="ranges-grid">
        <div
          v-for="(stats, range) in deviationStats"
          :key="range"
          class="range-card"
        >
          <div class="range-title">{{ range }}</div>
          <div class="range-stat">
            <span class="range-label">Peticiones:</span>
            <span class="range-value">{{ stats.count }}</span>
          </div>
          <div class="range-stat">
            <span class="range-label">Horas:</span>
            <span class="range-value">{{ stats.hours.toFixed(0) }}h</span>
          </div>
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

.ranges-detail {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ranges-detail h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.ranges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.range-card {
  background: var(--bg-primary);
  padding: 0.75rem;
  border-radius: 0.4rem;
  border-left: 3px solid var(--color-primary);
}

.range-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.range-stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
}

.range-label {
  color: var(--text-secondary);
}

.range-value {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
