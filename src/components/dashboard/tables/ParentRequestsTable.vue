<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import GpsaeRequestLink from "../../GpsaeRequestLink.vue";
import type { ParentRequestTableRow } from "../../../domain/tableAggregations";

interface ParentRequestsTableProps {
  rows: ParentRequestTableRow[];
  loading?: boolean;
}

withDefaults(defineProps<ParentRequestsTableProps>(), {
  loading: false,
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
</script>

<template>
  <div class="table-container">
    <DataTable
      :value="rows"
      :paginator="false"
      :loading="loading"
      striped-rows
      removable-sort
      sort-field="differenceHours"
      :sort-order="1"
      size="small"
      scrollable
      scrollHeight="600px"
      class="data-table"
    >
      <Column
        field="parentCode"
        header="Código padre"
        sortable
        style="width: 120px"
      >
        <template #body="{ data }">
          <GpsaeRequestLink :code="data.parentCode" />
        </template>
      </Column>

      <Column
        field="parentSubject"
        header="Asunto padre"
        sortable
        style="min-width: 250px"
      />
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
        header="Desviación %"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">{{ fmt(data.deviationPercent) }}%</template>
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

      <Column
        field="childrenCount"
        header="Nº hijas"
        sortable
        style="width: 100px"
      />
      <Column
        field="timeEntriesCount"
        header="Nº imputaciones"
        sortable
        style="width: 130px"
      />

      <Column field="people" header="Usuarios" style="min-width: 150px">
        <template #body="{ data }">
          <Tag
            v-for="person in data.people"
            :key="person"
            :value="person"
            severity="info"
          />
        </template>
      </Column>

      <Column
        field="peopleCount"
        header="Nº usuarios"
        sortable
        style="width: 100px"
      />

      <Column field="activities" header="Actividades" style="min-width: 100px">
        <template #body="{ data }">
          <Tag
            v-for="act in data.activities"
            :key="act"
            :value="act"
            severity="warning"
          />
        </template>
      </Column>

      <Column field="roles" header="Roles" style="min-width: 100px">
        <template #body="{ data }">
          <Tag v-for="role in data.roles" :key="role" :value="role" />
        </template>
      </Column>

      <template #empty>
        <div class="empty-state-text">Sin datos disponibles</div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  background: var(--bg-primary);
}

.data-table {
  width: 100%;
}

.data-table :deep(.p-datatable-header) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.data-table :deep(.p-datatable-thead > tr > th) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 0.75rem;
  border-color: var(--border-color);
}

.data-table :deep(.p-datatable-tbody > tr) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.data-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
}

.data-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--bg-secondary);
}

.empty-state-text {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>
