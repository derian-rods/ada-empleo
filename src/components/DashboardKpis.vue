<script setup lang="ts">
import Card from 'primevue/card'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 1 })
}

function fmtPct(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%'
}
</script>

<template>
  <div v-if="store.summary" class="kpi-grid">
    <Card class="kpi-card">
      <template #title>Horas estimadas</template>
      <template #content><span class="kpi-value">{{ fmt(store.summary.totalEstimatedHours) }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Horas reales</template>
      <template #content><span class="kpi-value">{{ fmt(store.summary.totalActualHours) }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Diferencia</template>
      <template #content>
        <span class="kpi-value" :class="store.summary.totalDifferenceHours >= 0 ? 'profit' : 'loss'">
          {{ fmt(store.summary.totalDifferenceHours) }}h
        </span>
      </template>
    </Card>

    <Card class="kpi-card">
      <template #title>Desviación media</template>
      <template #content><span class="kpi-value">{{ fmtPct(store.summary.averageDeviationPercent) }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Con ganancia</template>
      <template #content><span class="kpi-value profit">{{ store.summary.profitableRequests }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Con pérdida</template>
      <template #content><span class="kpi-value loss">{{ store.summary.lossRequests }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Neutras</template>
      <template #content><span class="kpi-value">{{ store.summary.neutralRequests }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Huérfanas</template>
      <template #content>
        <span class="kpi-value" :class="store.summary.orphanTimeEntries > 0 ? 'loss' : ''">
          {{ store.summary.orphanTimeEntries }}
        </span>
      </template>
    </Card>

    <Card class="kpi-card">
      <template #title>Personas</template>
      <template #content><span class="kpi-value">{{ store.summary.totalPeople }}</span></template>
    </Card>

    <Card class="kpi-card">
      <template #title>Aplicaciones</template>
      <template #content><span class="kpi-value">{{ store.summary.totalApplications }}</span></template>
    </Card>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}
.kpi-card {
  text-align: center;
}
.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
}
.kpi-value.profit {
  color: var(--p-green-500, #22c55e);
}
.kpi-value.loss {
  color: var(--p-red-500, #ef4444);
}
</style>
