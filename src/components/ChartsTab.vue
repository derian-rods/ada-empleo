<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import ChartTotalSummary from "./dashboard/charts/ChartTotalSummary.vue";
import ChartDeviationRanges from "./dashboard/charts/ChartDeviationRanges.vue";
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
    <!-- New summary charts: Total Summary and Deviation Ranges -->
    <div v-if="renderCharts && requests.length > 0" class="charts-wrapper">
      <ChartTotalSummary :requests="requests" />
      <ChartDeviationRanges :requests="requests" />
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
  gap: 2rem;
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
