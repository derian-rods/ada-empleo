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

interface ChartGlobalDeviationBucketsProps {
  requests: CalculatedRequest[];
}

const props = defineProps<ChartGlobalDeviationBucketsProps>();
const chartRef = ref();

// Calculate global deviation distribution with ALL requests
const deviationBuckets = computed(() => {
  const buckets = {
    "< -50%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "-50% a -25%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "-25% a -10%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "-10% a 0%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "0% a 10%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "10% a 25%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "25% a 50%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
    "> 50%": { count: 0, hours: 0, requests: [] as CalculatedRequest[] },
  };

  props.requests.forEach((r) => {
    const deviation = r.deviationPercent;
    const hours = r.actualHours || 0;

    if (deviation < -50) {
      buckets["< -50%"].count++;
      buckets["< -50%"].hours += hours;
      buckets["< -50%"].requests.push(r);
    } else if (deviation < -25) {
      buckets["-50% a -25%"].count++;
      buckets["-50% a -25%"].hours += hours;
      buckets["-50% a -25%"].requests.push(r);
    } else if (deviation < -10) {
      buckets["-25% a -10%"].count++;
      buckets["-25% a -10%"].hours += hours;
      buckets["-25% a -10%"].requests.push(r);
    } else if (deviation < 0) {
      buckets["-10% a 0%"].count++;
      buckets["-10% a 0%"].hours += hours;
      buckets["-10% a 0%"].requests.push(r);
    } else if (deviation < 10) {
      buckets["0% a 10%"].count++;
      buckets["0% a 10%"].hours += hours;
      buckets["0% a 10%"].requests.push(r);
    } else if (deviation < 25) {
      buckets["10% a 25%"].count++;
      buckets["10% a 25%"].hours += hours;
      buckets["10% a 25%"].requests.push(r);
    } else if (deviation < 50) {
      buckets["25% a 50%"].count++;
      buckets["25% a 50%"].hours += hours;
      buckets["25% a 50%"].requests.push(r);
    } else {
      buckets["> 50%"].count++;
      buckets["> 50%"].hours += hours;
      buckets["> 50%"].requests.push(r);
    }
  });

  return buckets;
});

const option = computed(() => ({
  title: {
    text: "Distribución Global de Desviaciones (% Horas Reales vs Estimadas)",
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
      const bucket =
        deviationBuckets.value[
          param.axisValue as keyof typeof deviationBuckets.value
        ];

      if (!bucket) return "";

      const totalBucketHours = bucket.hours;
      const percent = ((bucket.count / props.requests.length) * 100).toFixed(1);

      return `
        <div style="max-width: 300px; word-wrap: break-word; white-space: normal;">
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">${param.axisValue}</div>
          <div style="border-top: 1px solid var(--border-color); margin: 6px 0; padding-top: 6px;"></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Peticiones:</span> <strong>${bucket.count}</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">% del Total:</span> <strong>${percent}%</strong></div>
          <div style="margin-bottom: 4px;"><span style="color: var(--text-secondary);">Horas Reales:</span> <strong>${totalBucketHours.toFixed(0)}h</strong></div>
        </div>
      `;
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
    data: Object.keys(deviationBuckets.value),
    axisLabel: {
      interval: 0,
      rotate: 45,
      fontSize: 10,
    },
  },
  yAxis: {
    type: "value",
    name: "Cantidad de Peticiones",
    axisLabel: {
      fontSize: 10,
    },
  },
  series: [
    {
      name: "Peticiones",
      type: "bar",
      data: Object.values(deviationBuckets.value).map((v) => v.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#60a5fa" },
          { offset: 1, color: "#1e40af" },
        ]),
      },
      label: {
        show: true,
        position: "top",
        fontSize: 10,
        formatter: (params: any) => {
          return params.value > 0 ? params.value : "";
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

    <div class="buckets-detail">
      <h3>Detalle por Rango de Desviación</h3>
      <div class="buckets-grid">
        <div
          v-for="(stats, range) in deviationBuckets"
          :key="range"
          class="bucket-card"
        >
          <div class="bucket-title">{{ range }}</div>
          <div class="bucket-stat">
            <span class="bucket-label">Peticiones:</span>
            <span class="bucket-value">{{ stats.count }}</span>
          </div>
          <div class="bucket-stat">
            <span class="bucket-label">Horas Reales:</span>
            <span class="bucket-value">{{ stats.hours.toFixed(0) }}h</span>
          </div>
          <div class="bucket-percentage">
            {{ ((stats.count / requests.length) * 100).toFixed(1) }}% del total
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

.buckets-detail {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.buckets-detail h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.buckets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.bucket-card {
  background: var(--bg-primary);
  padding: 0.75rem;
  border-radius: 0.4rem;
  border-left: 3px solid var(--color-primary);
}

.bucket-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.bucket-stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
}

.bucket-label {
  color: var(--text-secondary);
}

.bucket-value {
  font-weight: 600;
  color: var(--color-primary);
}

.bucket-percentage {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  font-style: italic;
}
</style>
