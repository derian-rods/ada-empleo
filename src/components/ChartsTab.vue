<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import ChartGlobalHours from "./dashboard/charts/ChartGlobalHours.vue";
import ChartProfitLossDistribution from "./dashboard/charts/ChartProfitLossDistribution.vue";
import ChartApplicationBreakdown from "./dashboard/charts/ChartApplicationBreakdown.vue";
import type {
  CalculatedRequest,
  ParentRequest,
  ChildRequest,
  TimeEntry,
} from "../domain/types";

interface ChartsTabProps {
  requests: CalculatedRequest[];
  parents?: ParentRequest[];
  children?: ChildRequest[];
  timeEntries?: TimeEntry[];
}

const props = withDefaults(defineProps<ChartsTabProps>(), {
  parents: () => [],
  children: () => [],
  timeEntries: () => [],
});

const renderCharts = ref(false);

onMounted(() => {
  renderCharts.value = true;
});

watch(
  () => props.requests,
  () => {
    renderCharts.value = false;
    setTimeout(() => {
      renderCharts.value = true;
    }, 0);
  },
);
</script>

<template>
  <div class="charts-tab">
    <div v-if="renderCharts && requests.length > 0" class="charts-wrapper">
      <!-- Core Analysis: Estimated vs Actual Hours -->
      <div class="chart-item">
        <ChartGlobalHours :requests="requests" />
      </div>

      <!-- Profitability: Gain vs Loss -->
      <div class="chart-item">
        <ChartProfitLossDistribution :requests="requests" />
      </div>

      <!-- Application Breakdown -->
      <div class="chart-item">
        <ChartApplicationBreakdown :requests="requests" />
      </div>
    </div>
    <div v-else-if="requests.length === 0" class="no-data">
      <p>No hay datos para mostrar gráficos</p>
    </div>
  </div>
</template>

<style scoped>
.charts-tab {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 1.5rem;
}

.charts-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.chart-item {
  width: 100%;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  margin: 0;
}
</style>
