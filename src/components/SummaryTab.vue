<script setup lang="ts">
import Card from "primevue/card";
import Message from "primevue/message";
import type { DashboardSummary, CalculatedRequest } from "../domain/types";

interface SummaryTabProps {
  summary: DashboardSummary | null;
  requests: CalculatedRequest[];
  warnings: string[];
  errors: string[];
}

defineProps<SummaryTabProps>();

function fmt(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function fmtPct(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 }) + "%";
}

function getDifferenceHbsClass(diff: number): string {
  if (diff > 0) return "loss"; // Sobreconsumo = rojo
  if (diff < 0) return "profit"; // Ahorro = verde
  return ""; // Neutral = blanco
}

function getDifferenceHbsSign(diff: number): string {
  if (diff > 0) return "+";
  if (diff < 0) return "−"; // Unicode minus sign
  return "";
}
</script>

<template>
  <div class="summary-tab">
    <!-- Errors -->
    <div v-if="errors.length > 0" class="messages">
      <Message
        v-for="(err, i) in errors"
        :key="i"
        severity="error"
        :closable="false"
      >
        {{ err }}
      </Message>
    </div>

    <!-- Main KPIs: Hours Summary -->
    <div v-if="summary" class="kpi-grid">
      <!-- Horas Estimadas -->
      <Card class="kpi-card">
        <template #title>Horas Estimadas</template>
        <template #content>
          <div class="kpi-content">
            <div class="kpi-row">
              <span class="label">Horas:</span>
              <span class="value">{{ fmt(summary.totalEstimatedHours) }}h</span>
            </div>
            <div class="kpi-row">
              <span class="label">HBS:</span>
              <span class="value">{{ fmt(summary.totalEstimatedHbs) }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Horas Reales (Incurridas) -->
      <Card class="kpi-card">
        <template #title>Horas Incurridas</template>
        <template #content>
          <div class="kpi-content">
            <div class="kpi-row">
              <span class="label">Horas:</span>
              <span class="value">{{ fmt(summary.totalActualHours) }}h</span>
            </div>
            <div class="kpi-row">
              <span class="label">HBS:</span>
              <span class="value">{{ fmt(summary.totalConsumedHbs) }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Diferencia en HBS Consumidas vs Estimadas -->
      <Card class="kpi-card">
        <template #title>Diferencia HBS</template>
        <template #content>
          <div class="kpi-content">
            <span
              class="kpi-value-large"
              :class="getDifferenceHbsClass(summary.totalDifferenceHbs)"
            >
              {{ getDifferenceHbsSign(summary.totalDifferenceHbs)
              }}{{ fmt(Math.abs(summary.totalDifferenceHbs)) }}
            </span>
            <div class="kpi-label">Consumidas - Estimadas</div>
          </div>
        </template>
      </Card>

      <!-- Desviación media HBS -->
      <Card class="kpi-card">
        <template #title>Desviación Media HBS</template>
        <template #content>
          <span class="kpi-value-large">{{
            fmtPct(summary.averageDeviationPercentHbs)
          }}</span>
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

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kpi-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
}

.kpi-row .label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.kpi-row .value {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  display: block;
  color: var(--text-primary);
}

.kpi-value-large {
  font-size: 2.5rem;
  font-weight: 700;
  display: block;
  color: var(--text-primary);
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.kpi-value.profit {
  color: var(--color-success);
}

.kpi-value.loss {
  color: var(--color-danger);
}
</style>
