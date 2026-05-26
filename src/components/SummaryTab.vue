<script setup lang="ts">
import Card from 'primevue/card'
import Message from 'primevue/message'
import type { DashboardSummary, CalculatedRequest } from '../domain/types'

interface SummaryTabProps {
  summary: DashboardSummary | null
  requests: CalculatedRequest[]
  warnings: string[]
  errors: string[]
}

defineProps<SummaryTabProps>()

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 1 })
}

function fmtPct(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%'
}
</script>

<template>
  <div class="summary-tab">
    <!-- Errors -->
    <div v-if="errors.length > 0" class="messages">
      <Message v-for="(err, i) in errors" :key="i" severity="error" :closable="false">
        {{ err }}
      </Message>
    </div>

    <!-- Warnings -->
    <div v-if="warnings.length > 0" class="messages">
      <Message v-for="(warn, i) in warnings" :key="i" severity="warn" :closable="false">
        {{ warn }}
      </Message>
    </div>

    <!-- Main KPIs: Only 4 metrics -->
    <div v-if="summary" class="kpi-grid">
      <Card class="kpi-card">
        <template #title>Horas estimadas</template>
        <template #content><span class="kpi-value">{{ fmt(summary.totalEstimatedHours) }}</span></template>
      </Card>

      <Card class="kpi-card">
        <template #title>Horas reales</template>
        <template #content><span class="kpi-value">{{ fmt(summary.totalActualHours) }}</span></template>
      </Card>

      <Card class="kpi-card">
        <template #title>Diferencia</template>
        <template #content>
          <span class="kpi-value" :class="summary.totalDifferenceHours >= 0 ? 'profit' : 'loss'">
            {{ fmt(summary.totalDifferenceHours) }}h
          </span>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #title>Desviación media</template>
        <template #content><span class="kpi-value">{{ fmtPct(summary.averageDeviationPercent) }}</span></template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.summary-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  text-align: center;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.kpi-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.kpi-card :deep(.p-card-header) {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.kpi-card :deep(.p-card-title) {
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1rem;
}

.kpi-card :deep(.p-card-content) {
  background: var(--bg-primary);
  padding: 2rem 1rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  display: block;
  color: var(--text-primary);
}

.kpi-value.profit {
  color: var(--color-success);
}

.kpi-value.loss {
  color: var(--color-danger);
}
</style>
