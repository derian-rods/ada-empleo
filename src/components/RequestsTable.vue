<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import type { CalculatedRequest } from "../domain/types";

interface RequestsTableProps {
  requests: CalculatedRequest[];
  loading?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  showGlobalSearch?: boolean;
}

withDefaults(defineProps<RequestsTableProps>(), {
  loading: false,
  rows: 25,
  rowsPerPageOptions: () => [10, 25, 50, 100],
  showGlobalSearch: false,
});

function severityFor(status: string): "success" | "danger" | "secondary" {
  if (status === "profit") return "success";
  if (status === "loss") return "danger";
  return "secondary";
}

function labelFor(status: string): string {
  if (status === "profit") return "Ganancia";
  if (status === "loss") return "Pérdida";
  return "Neutral";
}

function fmt(n: number): string {
  return n.toLocaleString("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function fmtPct(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 }) + "%";
}
</script>

<template>
  <DataTable
    :value="requests"
    :paginator="true"
    :rows="rows"
    :rows-per-page-options="rowsPerPageOptions"
    :loading="loading"
    striped-rows
    removable-sort
    sort-field="differenceHours"
    :sort-order="-1"
    filter-display="row"
    size="small"
    responsive-layout="scroll"
    :global-filter-fields="[
      'code',
      'subject',
      'project',
      'application',
      'status',
    ]"
  >
    <template v-if="showGlobalSearch" #header>
      <div class="table-header">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <!-- Global search could go here if needed -->
        </span>
      </div>
    </template>

    <Column field="code" header="Código" sortable style="width: 80px" />
    <Column field="subject" header="Asunto" sortable style="min-width: 200px" />
    <Column field="project" header="Proyecto" sortable style="width: 120px" />
    <Column
      field="application"
      header="Aplicación"
      sortable
      style="width: 120px"
    />
    <Column field="status" header="Estado" sortable style="width: 100px" />

    <Column
      field="estimatedHours"
      header="Estimadas"
      sortable
      style="width: 100px"
    >
      <template #body="{ data }">{{ fmt(data.estimatedHours) }}</template>
    </Column>

    <Column
      field="actualHours"
      header="Incurridas"
      sortable
      style="width: 100px"
    >
      <template #body="{ data }">{{ fmt(data.actualHours) }}</template>
    </Column>

    <Column
      field="differenceHours"
      header="Diferencia"
      sortable
      style="width: 100px"
    >
      <template #body="{ data }">
        <span
          class="difference-value"
          :class="{
            profit: data.differenceHours >= 0,
            loss: data.differenceHours < 0,
          }"
        >
          {{ fmt(data.differenceHours) }}h
        </span>
      </template>
    </Column>

    <Column
      field="deviationPercent"
      header="Desviación"
      sortable
      style="width: 100px"
    >
      <template #body="{ data }">{{ fmtPct(data.deviationPercent) }}</template>
    </Column>

    <Column
      field="resultStatus"
      header="Resultado"
      sortable
      style="width: 100px"
    >
      <template #body="{ data }">
        <Tag
          :severity="severityFor(data.resultStatus)"
          :value="labelFor(data.resultStatus)"
        />
      </template>
    </Column>

    <Column field="childrenCount" header="Hijas" sortable style="width: 80px" />
    <Column
      field="timeEntriesCount"
      header="Imputaciones"
      sortable
      style="width: 100px"
    />
    <Column
      field="peopleCount"
      header="Personas"
      sortable
      style="width: 80px"
    />

    <template #empty>
      <div class="empty-state-text">Sin datos disponibles</div>
    </template>
  </DataTable>
</template>

<style scoped>
.table-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
</style>
