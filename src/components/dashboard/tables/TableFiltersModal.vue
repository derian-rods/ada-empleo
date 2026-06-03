<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Dropdown from "primevue/dropdown";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import type { ParentGroupedTableFilters } from "../../../domain/parentGroupedTable";

interface TableFiltersModalProps {
  visible: boolean;
  filters: ParentGroupedTableFilters;
  uniqueUsers: string[];
  uniqueRoles: string[];
  uniqueApplications: string[];
  uniqueStatuses: string[];
  uniqueProjects: string[];
}

const props = defineProps<TableFiltersModalProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:filters": [value: ParentGroupedTableFilters];
  "clear-filters": [];
}>();

// Helper to update filters
const updateFilter = (key: keyof ParentGroupedTableFilters, value: any) => {
  const newFilters = { ...props.filters, [key]: value };
  emit("update:filters", newFilters);
};

// Check if any filter is active
const hasActiveFilters = computed(() => {
  const f = props.filters;
  return (
    f.parentCode ||
    f.parentSubject ||
    f.childCode ||
    f.childSubject ||
    f.user?.length ||
    f.role?.length ||
    f.application?.length ||
    f.status ||
    f.project ||
    f.resultStatus ||
    f.riskLevel ||
    f.onlyLosses ||
    f.onlyConsumptionOver100 ||
    f.onlyDeviationOver20
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
      <!-- Row 1: Búsqueda (códigos) -->
      <div class="filter-item compact">
        <label>Código padre</label>
        <InputText
          :model-value="filters.parentCode || ''"
          @update:model-value="updateFilter('parentCode', $event)"
          placeholder="Código..."
        />
      </div>

      <div class="filter-item compact">
        <label>Código hija</label>
        <InputText
          :model-value="filters.childCode || ''"
          @update:model-value="updateFilter('childCode', $event)"
          placeholder="Código..."
        />
      </div>

      <div class="filter-item compact">
        <label>Proyecto</label>
        <Dropdown
          :model-value="filters.project || null"
          @update:model-value="updateFilter('project', $event)"
          :options="uniqueProjects"
          placeholder="Todos"
          show-clear
        />
      </div>

      <!-- Row 2: Asuntos -->
      <div class="filter-item compact">
        <label>Asunto padre</label>
        <InputText
          :model-value="filters.parentSubject || ''"
          @update:model-value="updateFilter('parentSubject', $event)"
          placeholder="Asunto..."
        />
      </div>

      <div class="filter-item compact">
        <label>Asunto hija</label>
        <InputText
          :model-value="filters.childSubject || ''"
          @update:model-value="updateFilter('childSubject', $event)"
          placeholder="Asunto..."
        />
      </div>

      <div class="filter-item compact">
        <label>Estado</label>
        <Dropdown
          :model-value="filters.status || null"
          @update:model-value="updateFilter('status', $event)"
          :options="uniqueStatuses"
          placeholder="Todos"
          show-clear
        />
      </div>

      <!-- Row 3: Personal -->
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

      <div class="filter-item compact">
        <label>Rol/Perfil</label>
        <MultiSelect
          :model-value="filters.role || []"
          @update:model-value="updateFilter('role', $event)"
          :options="uniqueRoles"
          placeholder="Seleccionar..."
          :max-selected-labels="1"
          :show-toggle-all="false"
        />
      </div>

      <div class="filter-item compact">
        <label>Aplicación</label>
        <MultiSelect
          :model-value="filters.application || []"
          @update:model-value="updateFilter('application', $event)"
          :options="uniqueApplications"
          placeholder="Seleccionar..."
          :max-selected-labels="1"
          :show-toggle-all="false"
        />
      </div>

      <!-- Row 4: Resultado y Riesgo -->
      <div class="filter-item compact">
        <label>Resultado</label>
        <Dropdown
          :model-value="filters.resultStatus || null"
          @update:model-value="updateFilter('resultStatus', $event)"
          :options="[
            { label: 'Ganancia', value: 'profit' },
            { label: 'Pérdida', value: 'loss' },
            { label: 'Neutral', value: 'neutral' },
          ]"
          option-label="label"
          option-value="value"
          placeholder="Todos"
          show-clear
        />
      </div>

      <div class="filter-item compact">
        <label>Riesgo</label>
        <Dropdown
          :model-value="filters.riskLevel || null"
          @update:model-value="updateFilter('riskLevel', $event)"
          :options="[
            { label: 'Bajo', value: 'low' },
            { label: 'Medio', value: 'medium' },
            { label: 'Alto', value: 'high' },
          ]"
          option-label="label"
          option-value="value"
          placeholder="Todos"
          show-clear
        />
      </div>

      <div></div>

      <!-- Row 5: Checkboxes -->
      <div class="filter-item checkbox-item">
        <Checkbox
          :model-value="filters.onlyLosses || false"
          @update:model-value="updateFilter('onlyLosses', $event)"
          binary
        />
        <label>Solo pérdidas</label>
      </div>

      <div class="filter-item checkbox-item">
        <Checkbox
          :model-value="filters.onlyConsumptionOver100 || false"
          @update:model-value="updateFilter('onlyConsumptionOver100', $event)"
          binary
        />
        <label>Consumo > 100%</label>
      </div>

      <div class="filter-item checkbox-item">
        <Checkbox
          :model-value="filters.onlyDeviationOver20 || false"
          @update:model-value="updateFilter('onlyDeviationOver20', $event)"
          binary
        />
        <label>Desviación > 20%</label>
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
  grid-template-columns: repeat(3, 1fr);
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

.filter-item.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  grid-column: span 1;
}

.filter-item.checkbox-item label {
  margin: 0;
  font-size: 0.8rem;
  cursor: pointer;
  flex: 1;
  padding-left: 0.5rem;
}

:deep(.p-inputtext),
:deep(.p-multiselect),
:deep(.p-dropdown) {
  width: 100%;
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  padding: 0.4rem 0.5rem;
}

:deep(.p-inputtext:focus),
:deep(.p-multiselect:focus),
:deep(.p-dropdown:focus) {
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

.w-full {
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-modal :deep(.p-dialog) {
    width: 95vw !important;
    height: 90vh !important;
  }

  .filters-modal-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
