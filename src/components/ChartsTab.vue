<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import ChartRiskMatrix from './dashboard/charts/ChartRiskMatrix.vue'
import ChartDeviationDistribution from './dashboard/charts/ChartDeviationDistribution.vue'
import {
  buildParentGroupedTableRows,
} from '../domain/parentGroupedTable'
import type { CalculatedRequest, ParentRequest, ChildRequest, TimeEntry } from '../domain/types'

interface ChartsTabProps {
  requests: CalculatedRequest[]
  parents?: ParentRequest[]
  children?: ChildRequest[]
  timeEntries?: TimeEntry[]
}

const props = withDefaults(defineProps<ChartsTabProps>(), {
  parents: () => [],
  children: () => [],
  timeEntries: () => [],
})

const renderCharts = ref(false)

// Build grouped rows for charts
const groupedRows = computed(() => {
  if (!props.parents || !props.children || !props.timeEntries) {
    return []
  }
  return buildParentGroupedTableRows(
    props.parents,
    props.children,
    props.timeEntries,
    props.requests
  )
})

onMounted(() => {
  renderCharts.value = true
})

watch(
  () => props.requests,
  () => {
    renderCharts.value = false
    setTimeout(() => {
      renderCharts.value = true
    }, 0)
  }
)
</script>

<template>
  <div class="charts-tab">
    <div v-if="renderCharts && groupedRows.length > 0" class="charts-grid">
      <ChartRiskMatrix :rows="groupedRows" />
      <ChartDeviationDistribution :rows="groupedRows" />
    </div>
    <div v-else-if="groupedRows.length === 0" class="no-data">
      <p>No hay datos para mostrar gráficos</p>
    </div>
  </div>
</template>

<style scoped>
.charts-tab {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-primary);
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  margin: 1.5rem;
}
</style>
