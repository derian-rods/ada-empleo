<script setup lang="ts">
import Card from "primevue/card";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();

function fmt(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function fmtPct(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 }) + "%";
}
</script>

<template>
  <div v-if="store.summary" class="kpi-grid">
    <!-- Horas estimadas + HBS estimadas -->
    <Card class="kpi-card">
      <template #title>Horas estimadas</template>
      <template #content>
        <div class="kpi-content">
          <div class="kpi-value">
            {{ fmt(store.summary.totalEstimatedHours) }}h
          </div>
          <div class="kpi-label">
            HBS estimadas: {{ fmt(store.summary.totalEstimatedHbs) }}
          </div>
        </div>
      </template>
    </Card>

    <!-- Horas incurridas + HBS consumidas -->
    <Card class="kpi-card">
      <template #title>Horas incurridas</template>
      <template #content>
        <div class="kpi-content">
          <div class="kpi-value">
            {{ fmt(store.summary.totalActualHours) }}h
          </div>
          <div class="kpi-label">
            HBS consumidas: {{ fmt(store.summary.totalConsumedHbs) }}
          </div>
        </div>
      </template>
    </Card>

    <!-- Diferencia en HBS (with proper color coding) -->
    <Card class="kpi-card">
      <template #title>Diferencia HBS</template>
      <template #content>
        <span
          class="kpi-value"
          :class="getDifferenceHbsClass(store.summary.totalDifferenceHbs)"
        >
          {{ getDifferenceHbsSign(store.summary.totalDifferenceHbs)
          }}{{ fmt(Math.abs(store.summary.totalDifferenceHbs)) }}
        </span>
      </template>
    </Card>

    <!-- Desviación media en HBS -->
    <Card class="kpi-card">
      <template #title>Desviación media HBS</template>
      <template #content
        ><span class="kpi-value">{{
          fmtPct(store.summary.averageDeviationPercentHbs)
        }}</span></template
      >
    </Card>

    <!-- Con ganancia -->
    <Card class="kpi-card">
      <template #title>Con ganancia</template>
      <template #content
        ><span class="kpi-value profit">{{
          store.summary.profitableRequests
        }}</span></template
      >
    </Card>

    <!-- Con pérdida -->
    <Card class="kpi-card">
      <template #title>Con pérdida</template>
      <template #content
        ><span class="kpi-value loss">{{
          store.summary.lossRequests
        }}</span></template
      >
    </Card>

    <!-- Neutras -->
    <Card class="kpi-card">
      <template #title>Neutras</template>
      <template #content
        ><span class="kpi-value">{{
          store.summary.neutralRequests
        }}</span></template
      >
    </Card>

    <!-- Huérfanas -->
    <Card class="kpi-card">
      <template #title>Huérfanas</template>
      <template #content>
        <span
          class="kpi-value"
          :class="store.summary.orphanTimeEntries > 0 ? 'loss' : ''"
        >
          {{ store.summary.orphanTimeEntries }}
        </span>
      </template>
    </Card>

    <!-- Personas -->
    <Card class="kpi-card">
      <template #title>Personas</template>
      <template #content
        ><span class="kpi-value">{{
          store.summary.totalPeople
        }}</span></template
      >
    </Card>

    <!-- Aplicaciones -->
    <Card class="kpi-card">
      <template #title>Aplicaciones</template>
      <template #content
        ><span class="kpi-value">{{
          store.summary.totalApplications
        }}</span></template
      >
    </Card>
  </div>
</template>

<script lang="ts">
/**
 * Helper to determine color class for HBS difference
 * Positive (over-consumption) = red (loss)
 * Negative (under-consumption) = green (profit)
 */
function getDifferenceHbsClass(diff: number): string {
  if (diff > 0) return "loss"; // Sobreconsumo = rojo
  if (diff < 0) return "profit"; // Ahorro = verde
  return ""; // Neutral = blanco
}

/**
 * Helper to get sign for HBS difference
 * Positive = + (sobreconsumo)
 * Negative = - (ahorro)
 */
function getDifferenceHbsSign(diff: number): string {
  if (diff > 0) return "+";
  if (diff < 0) return "−"; // Unicode minus sign
  return "";
}
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.kpi-card {
  text-align: center;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.kpi-value.profit {
  color: var(--color-success);
}

.kpi-value.loss {
  color: var(--color-danger);
}
</style>
