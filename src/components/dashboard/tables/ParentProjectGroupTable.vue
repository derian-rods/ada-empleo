<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import type { ParentProjectGroupTableRow } from "../../../domain/tableAggregations";

interface ParentProjectGroupTableProps {
  rows: ParentProjectGroupTableRow[];
  loading?: boolean;
}

withDefaults(defineProps<ParentProjectGroupTableProps>(), {
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
  >
    <Column
      field="parentProject"
      header="Proyecto padre"
      sortable
      style="min-width: 200px"
    />

    <Column
      field="parentRequestsCount"
      header="Nº padres"
      sortable
      style="width: 100px"
    />
    <Column
      field="childRequestsCount"
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

    <Column
      field="estimatedHours"
      header="Estimadas"
      sortable
      style="width: 120px"
    >
      <template #body="{ data }">{{ fmt(data.estimatedHours) }}</template>
    </Column>

    <Column
      field="actualHours"
      header="Incurridas"
      sortable
      style="width: 140px"
    >
      <template #body="{ data }">{{ fmt(data.actualHours) }}</template>
    </Column>

    <Column
      field="differenceHours"
      header="Diferencia"
      sortable
      style="width: 120px"
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
      style="width: 120px"
    >
      <template #body="{ data }">{{ fmt(data.deviationPercent) }}%</template>
    </Column>

    <Column
      field="resultStatus"
      header="Resultado"
      sortable
      style="width: 120px"
    >
      <template #body="{ data }">
        <Tag
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
      style="width: 120px"
    />

    <Column field="roles" header="Roles" style="min-width: 100px">
      <template #body="{ data }">
        <Tag v-for="role in data.roles" :key="role" :value="role" />
      </template>
    </Column>

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

    <Column field="applications" header="Aplicaciones" style="min-width: 100px">
      <template #body="{ data }">
        <Tag
          v-for="app in data.applications"
          :key="app"
          :value="app"
          severity="secondary"
        />
      </template>
    </Column>

    <template #empty>
      <div class="empty-state-text">Sin datos disponibles</div>
    </template>
  </DataTable>
</template>

<style scoped></style>
