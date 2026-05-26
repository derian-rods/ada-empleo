<script setup lang="ts">
import Card from 'primevue/card'
import Message from 'primevue/message'
import DashboardKpis from './DashboardKpis.vue'
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

    <!-- KPIs -->
    <DashboardKpis />

    <!-- Summary Cards -->
    <div v-if="summary" class="summary-cards">
      <Card class="summary-card profit">
        <template #title>Total Ganancias</template>
        <template #content>
          <div class="card-content">
            <span class="card-value">{{ fmt(summary.totalDifferenceHours) }}h</span>
            <span class="card-label">de {{ summary.profitableRequests }} peticiones</span>
          </div>
        </template>
      </Card>

      <Card class="summary-card loss">
        <template #title>Total Pérdidas</template>
        <template #content>
          <div class="card-content">
            <span class="card-value">{{ summary.lossRequests }}</span>
            <span class="card-label">peticiones</span>
          </div>
        </template>
      </Card>

      <Card class="summary-card neutral">
        <template #title>Peticiones Neutrales</template>
        <template #content>
          <div class="card-content">
            <span class="card-value">{{ summary.neutralRequests }}</span>
            <span class="card-label">sin variación</span>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #title>Participantes</template>
        <template #content>
          <div class="card-content">
            <span class="card-value">{{ summary.totalPeople }}</span>
            <span class="card-label">personas</span>
          </div>
        </template>
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-card {
  border-left: 4px solid #ccc;
}

.summary-card.profit {
  border-left-color: #22c55e;
}

.summary-card.loss {
  border-left-color: #ef4444;
}

.summary-card.neutral {
  border-left-color: #f59e0b;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
}

.card-label {
  font-size: 0.85rem;
  color: #999;
}
</style>
