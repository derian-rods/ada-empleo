<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import Button from "primevue/button";

interface CollaboratorsFiltersModalProps {
  visible: boolean;
  filters: {
    collaboratorNames?: string[];
    dateFrom?: Date | null;
    dateTo?: Date | null;
    petitionCode?: string;
  };
  collaboratorOptions: Array<{ label: string; value: string }>;
  petitionOptions: string[];
}

const props = defineProps<CollaboratorsFiltersModalProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:filters": [
    value: {
      collaboratorNames?: string[];
      dateFrom?: Date | null;
      dateTo?: Date | null;
      petitionCode?: string;
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
    f.collaboratorNames?.length || f.dateFrom || f.dateTo || f.petitionCode
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
      <!-- Colaboradores -->
      <div class="filter-item compact">
        <label>Colaboradores</label>
        <Dropdown
          :model-value="filters.collaboratorNames || []"
          @update:model-value="updateFilter('collaboratorNames', $event)"
          :options="collaboratorOptions"
          option-label="label"
          option-value="value"
          placeholder="Todos"
          show-clear
          :max-selected-labels="2"
          multiple
        />
      </div>

      <!-- Desde -->
      <div class="filter-item compact">
        <label>Desde</label>
        <Calendar
          :model-value="filters.dateFrom || null"
          @update:model-value="updateFilter('dateFrom', $event)"
          date-format="dd/mm/yy"
          placeholder="Fecha inicio"
          :show-icon="true"
        />
      </div>

      <!-- Hasta -->
      <div class="filter-item compact">
        <label>Hasta</label>
        <Calendar
          :model-value="filters.dateTo || null"
          @update:model-value="updateFilter('dateTo', $event)"
          date-format="dd/mm/yy"
          placeholder="Fecha fin"
          :show-icon="true"
        />
      </div>

      <!-- Petición -->
      <div class="filter-item compact">
        <label>Petición</label>
        <Dropdown
          :model-value="filters.petitionCode || null"
          @update:model-value="updateFilter('petitionCode', $event)"
          :options="petitionOptions"
          placeholder="Todas"
          show-clear
        />
      </div>

      <!-- Empty slot for grid alignment -->
      <div></div>

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

:deep(.p-dropdown),
:deep(.p-calendar) {
  width: 100%;
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  padding: 0.4rem 0.5rem;
}

:deep(.p-dropdown:focus),
:deep(.p-calendar:focus) {
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
