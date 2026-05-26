<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { UserTableRow } from '../../../domain/tableAggregations'

interface UsersTableProps {
  rows: UserTableRow[]
  loading?: boolean
  rowsPerPage?: number
  rowsPerPageOptions?: number[]
}

withDefaults(defineProps<UsersTableProps>(), {
  loading: false,
  rowsPerPage: 25,
  rowsPerPageOptions: () => [10, 25, 50, 100],
})

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
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
    sort-field="totalHours"
    :sort-order="-1"
    size="small"
    responsive-layout="scroll"
  >
    <Column field="user" header="Usuario" sortable style="width: 120px" />

    <Column field="totalHours" header="Horas imputadas" sortable style="width: 120px">
      <template #body="{ data }">{{ fmt(data.totalHours) }}</template>
    </Column>

    <Column field="parentRequestsCount" header="Nº padres" sortable style="width: 100px" />
    <Column field="childRequestsCount" header="Nº hijas" sortable style="width: 100px" />

    <Column field="projects" header="Proyectos" style="min-width: 150px">
      <template #body="{ data }">
        <div class="flex flex-wrap gap-1">
          <Tag v-for="proj in data.projects" :key="proj" :value="proj" severity="info" />
        </div>
      </template>
    </Column>

    <Column field="applications" header="Aplicaciones" style="min-width: 150px">
      <template #body="{ data }">
        <div class="flex flex-wrap gap-1">
          <Tag v-for="app in data.applications" :key="app" :value="app" severity="secondary" />
        </div>
      </template>
    </Column>

    <Column field="activities" header="Actividades" style="min-width: 150px">
      <template #body="{ data }">
        <div class="flex flex-wrap gap-1">
          <Tag v-for="act in data.activities" :key="act" :value="act" severity="warning" />
        </div>
      </template>
    </Column>

    <Column field="roles" header="Roles" style="min-width: 100px">
      <template #body="{ data }">
        <div class="flex flex-wrap gap-1">
          <Tag v-for="role in data.roles" :key="role" :value="role" />
        </div>
      </template>
    </Column>

    <Column field="profitRelatedHours" header="Horas ganancia" sortable style="width: 120px">
      <template #body="{ data }">
        <span style="color: #22c55e; font-weight: bold">{{ fmt(data.profitRelatedHours) }}</span>
      </template>
    </Column>

    <Column field="lossRelatedHours" header="Horas pérdida" sortable style="width: 120px">
      <template #body="{ data }">
        <span v-if="data.lossRelatedHours > 0" style="color: #ef4444; font-weight: bold">
          {{ fmt(data.lossRelatedHours) }}
        </span>
        <span v-else>-</span>
      </template>
    </Column>

    <template #empty>
      <div style="padding: 2rem; text-align: center; color: #999">Sin datos disponibles</div>
    </template>
  </DataTable>
</template>

<style scoped>
.flex {
  display: flex;
}
.flex-wrap {
  flex-wrap: wrap;
}
.gap-1 {
  gap: 0.25rem;
}
</style>
