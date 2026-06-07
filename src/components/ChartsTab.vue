<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import ChartTotalSummary from "./dashboard/charts/ChartTotalSummary.vue";
import ChartGlobalHours from "./dashboard/charts/ChartGlobalHours.vue";
import ChartProfitLossDistribution from "./dashboard/charts/ChartProfitLossDistribution.vue";
import ChartGlobalDeviationBuckets from "./dashboard/charts/ChartGlobalDeviationBuckets.vue";
import ChartGlobalHbs from "./dashboard/charts/ChartGlobalHbs.vue";
import ChartApplicationBreakdown from "./dashboard/charts/ChartApplicationBreakdown.vue";
// import ChartRiskMatrix from './dashboard/charts/ChartRiskMatrix.vue'
// import ChartDeviationDistribution from './dashboard/charts/ChartDeviationDistribution.vue'
// import ChartEstimatedVsDedicated from "./dashboard/charts/ChartEstimatedVsDedicated.vue";
// import ChartHbsConsumption from "./dashboard/charts/ChartHbsConsumption.vue";
// import { buildParentGroupedTableRows } from "../domain/parentGroupedTable";
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
    <!-- Global charts: Show comprehensive data from ALL requests -->
    <div v-if="renderCharts && requests.length > 0" class="charts-wrapper">
      <!-- Summary KPIs and initial overview -->
      <section class="charts-section">
        <h2 class="section-title">Resumen Global</h2>
        <ChartTotalSummary :requests="requests" />
      </section>

      <!-- Hours comparison for all requests -->
      <section class="charts-section">
        <h2 class="section-title">
          Comparativa de Horas (Todas las Peticiones)
        </h2>
        <ChartGlobalHours :requests="requests" />
      </section>

      <!-- Profit/Loss distribution -->
      <section class="charts-section">
        <h2 class="section-title">Distribución: Ganancia vs Pérdida</h2>
        <ChartProfitLossDistribution :requests="requests" />
      </section>

      <!-- Deviation buckets -->
      <section class="charts-section">
        <h2 class="section-title">Distribución de Desviaciones</h2>
        <ChartGlobalDeviationBuckets :requests="requests" />
      </section>

      <!-- HBS global comparison -->
      <section class="charts-section">
        <h2 class="section-title">HBS (Horas de Billing) Global</h2>
        <ChartGlobalHbs :requests="requests" />
      </section>

      <!-- Applications breakdown -->
      <section class="charts-section">
        <h2 class="section-title">Análisis por Aplicación</h2>
        <ChartApplicationBreakdown :requests="requests" />
      </section>
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
  gap: 3rem;
}

.charts-section {
  width: 100%;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-color);
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
