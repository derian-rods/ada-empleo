<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import MultiSelect from "primevue/multiselect";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

interface UnestimatedFiltersModalProps {
  visible: boolean;
  filters: {
    code?: string;
    subject?: string;
    project?: string;
    application?: string;
    status?: string;
    user?: string[];
  };
  uniqueProjects: string[];
  uniqueApplications: string[];
  uniqueStatuses: string[];
  uniqueUsers: string[];
}

const props = defineProps<UnestimatedFiltersModalProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:filters": [
    value: {
      code?: string;
      subject?: string;
      project?: string;
      application?: string;
      status?: string;
      user?: string[];
    },
  ];
  "clear-filters": [];
}>();

// Helper to update filters
const updateFilter = (key: string, value: any) => {
  const newFilters = { ...props.filters, [key]: value };
  emit("update:filters", newFilters);
};

// Check if any filter is active
const hasActiveFilters = computed(() => {
  const f = props.filters;
  return (
    f.code ||
    f.subject ||
    f.project ||
    f.application ||
    f.status ||
    f.user?.length
  );
});

const handleClearFilters = () => {
  emit("clear-filters");
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(val: boolean) => emit('update:visible', val)"
    header="Filtros"
    modal
    :style="{ width: '80vw' }"
    class="filters-modal"
  >
    <div class="filters-modal-content">
      <!-- Código -->
      <div class="filter-item compact">
        <label>Código</label>
        <InputText
          :model-value="filters.code || ''"
          @update:model-value="updateFilter('code', $event)"
          placeholder="Buscar código..."
        />
      </div>

      <!-- Asunto -->
      <div class="filter-item compact">
        <label>Asunto</label>
        <InputText
          :model-value="filters.subject || ''"
          @update:model-value="updateFilter('subject', $event)"
          placeholder="Buscar asunto..."
        />
      </div>

      <!-- Proyecto -->
      <div class="filter-item compact">
        <label>Proyecto</label>
        <Select
          :model-value="filters.project || null"
          @update:model-value="updateFilter('project', $event)"
          :options="uniqueProjects"
          placeholder="Todos"
          show-clear
        />
      </div>

      <!-- Aplicación -->
      <div class="filter-item compact">
        <label>Aplicación</label>
        <Select
          :model-value="filters.application || null"
          @update:model-value="updateFilter('application', $event)"
          :options="uniqueApplications"
          placeholder="Todos"
          show-clear
        />
      </div>

      <!-- Estado -->
      <div class="filter-item compact">
        <label>Estado</label>
        <Select
          :model-value="filters.status || null"
          @update:model-value="updateFilter('status', $event)"
          :options="uniqueStatuses"
          placeholder="Todos"
          show-clear
        />
      </div>

      <!-- Usuario -->
      <div class="filter-item compact">
        <label>Usuario</label>
        <MultiSelect
          :model-value="filters.user || []"
          @update:model-value="updateFilter('user', $event)"
          :options="uniqueUsers"
          placeholder="Seleccionar..."
          :max-selected-labels="1"
          :show-toggle-all="false"
        />
      </div>

      <!-- Actions -->
      <div class="filter-actions">
        <Button
          label="Limpiar"
          severity="danger"
          size="small"
          :disabled="!hasActiveFilters"
          @click="handleClearFilters"
        />
        <Button
          label="Aplicar"
          severity="primary"
          size="small"
          @click="emit('update:visible', false)"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.filters-modal :deep(.p-dialog-header) {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.filters-modal :deep(.p-dialog-content) {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.filters-modal-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.filter-item.compact {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  grid-column: span 1;
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-multiselect) {
  width: 100%;
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  padding: 0.4rem 0.5rem;
}

:deep(.p-inputtext:focus),
:deep(.p-select:focus),
:deep(.p-multiselect:focus) {
  border-color: var(--color-primary);
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  grid-column: 1 / -1;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-modal :deep(.p-dialog) {
    width: 95vw !important;
  }

  .filters-modal-content {
    grid-template-columns: 1fr;
  }
}
</style>
