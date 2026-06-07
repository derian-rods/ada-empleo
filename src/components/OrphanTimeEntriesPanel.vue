<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Message from "primevue/message";
import type { OrphanTimeEntry } from "../domain/types";

interface OrphanTimeEntriesPanelProps {
  orphans: OrphanTimeEntry[];
}

defineProps<OrphanTimeEntriesPanelProps>();

function fmt(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}
</script>

<template>
  <Card v-if="orphans.length > 0">
    <template #title>
      <span>Entradas de Tiempo Huérfanas ({{ orphans.length }})</span>
    </template>
    <template #content>
      <Message severity="warn" :closable="false">
        <span
          >{{ orphans.length }} entradas no pudieron vincularse a una
          demanda.</span
        >
      </Message>

      <DataTable
        :value="orphans"
        :paginator="true"
        :rows="15"
        :rows-per-page-options="[10, 15, 25]"
        striped-rows
        size="small"
        responsive-layout="scroll"
        class="orphan-table"
      >
        <Column field="id" header="ID" style="width: 100px" />
        <Column field="date" header="Fecha" style="width: 100px" />
        <Column field="user" header="Usuario" style="width: 100px" />
        <Column field="activity" header="Actividad" style="width: 120px" />
        <Column field="petitionId" header="Petición ID" style="width: 100px" />
        <Column field="parentTaskId" header="Demanda ID" style="width: 120px" />
        <Column field="hours" header="Horas" style="width: 80px">
          <template #body="{ data }">{{ fmt(data.hours) }}</template>
        </Column>
        <Column field="orphanReason" header="Razón" style="min-width: 250px">
          <template #body="{ data }">
            <Tag severity="danger" :value="data.orphanReason" />
          </template>
        </Column>
        <Column field="profiledRole" header="Perfil" style="width: 100px" />
      </DataTable>
    </template>
  </Card>
  <Card v-else>
    <template #title>Entradas de Tiempo Huérfanas</template>
    <template #content>
      <Message
        severity="success"
        :closable="false"
        text="✓ Todas las entradas están vinculadas"
      />
    </template>
  </Card>
</template>

<style scoped>
.orphan-table {
  margin-top: 1rem;
}

.orphan-table :deep(.p-datatable) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.orphan-table :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.orphan-table :deep(.p-datatable .p-datatable-tbody > tr) {
  border-color: var(--border-color);
  background: var(--bg-primary);
}

.orphan-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  color: var(--text-primary);
  border-color: var(--border-color);
}

.orphan-table :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--bg-hover);
}
</style>
