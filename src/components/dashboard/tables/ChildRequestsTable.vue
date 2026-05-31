<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import type { ChildRequestTableRow } from "../../../domain/tableAggregations";

interface ChildRequestsTableProps {
  rows: ChildRequestTableRow[];
  loading?: boolean;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
}

withDefaults(defineProps<ChildRequestsTableProps>(), {
  loading: false,
  rowsPerPage: 25,
  rowsPerPageOptions: () => [10, 25, 50, 100],
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
  <DataTable
    :value="rows"
    :paginator="true"
    :rows="rowsPerPage"
    :rows-per-page-options="rowsPerPageOptions"
    :loading="loading"
    striped-rows
    removable-sort
    sort-field="actualHours"
    :sort-order="-1"
    size="small"
    responsive-layout="scroll"
  >
    <Column
      field="childCode"
      header="Código hija"
      sortable
      style="width: 100px"
    />

    <Column
      field="childSubject"
      header="Asunto hija"
      sortable
      style="min-width: 200px"
    />
    <Column
      field="parentCode"
      header="Código padre"
      sortable
      style="width: 100px"
    />
    <Column
      field="parentSubject"
      header="Asunto padre"
      sortable
      style="min-width: 200px"
    />

    <Column field="project" header="Proyecto" sortable style="width: 120px" />
    <Column
      field="parentProject"
      header="Proyecto padre"
      sortable
      style="width: 120px"
    />
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

    <Column field="actualHours" header="Reales" sortable style="width: 100px">
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
      v-if="rows.some((r) => r.resultStatus)"
      field="resultStatus"
      header="Resultado"
      sortable
      style="width: 100px"
    >
      <template #body="{ data }">
        <Tag
          v-if="data.resultStatus"
          :severity="severityFor(data.resultStatus)"
          :value="labelFor(data.resultStatus)"
        />
      </template>
    </Column>

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
</template>
