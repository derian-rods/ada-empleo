<script setup lang="ts">
import { computed } from "vue";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Dropdown from "primevue/dropdown";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import Sidebar from "primevue/sidebar";
import type { ParentGroupedTableFilters } from "../../../domain/parentGroupedTable";

interface TableFiltersPanelProps {
  visible: boolean;
  filters: ParentGroupedTableFilters;
  uniqueUsers: string[];
  uniqueRoles: string[];
  uniqueApplications: string[];
  uniqueStatuses: string[];
  uniqueProjects: string[];
}

const props = defineProps<TableFiltersPanelProps>();

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
  <Sidebar
    :visible="visible"
    @update:visible="(val: boolean) => emit('update:visible', val)"
    position="right"
    class="filters-sidebar"
    header="Filtros"
    modal
    :show-close-icon="true"
  >
    <div class="filters-content">
      <!-- Text Filters -->
      <div class="filter-group">
        <h4 class="filter-group-title">Búsqueda</h4>

        <div class="filter-item">
          <label>Código padre</label>
          <InputText
            :model-value="filters.parentCode || ''"
            @update:model-value="updateFilter('parentCode', $event)"
            placeholder="Buscar código..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Asunto padre</label>
          <InputText
            :model-value="filters.parentSubject || ''"
            @update:model-value="updateFilter('parentSubject', $event)"
            placeholder="Buscar asunto..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Código hija</label>
          <InputText
            :model-value="filters.childCode || ''"
            @update:model-value="updateFilter('childCode', $event)"
            placeholder="Buscar código..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Asunto hija</label>
          <InputText
            :model-value="filters.childSubject || ''"
            @update:model-value="updateFilter('childSubject', $event)"
            placeholder="Buscar asunto..."
            size="small"
          />
        </div>
      </div>

      <!-- Multi-select Filters -->
      <div class="filter-group">
        <h4 class="filter-group-title">Personal</h4>

        <div class="filter-item">
          <label>Usuario</label>
          <MultiSelect
            :model-value="filters.user || []"
            @update:model-value="updateFilter('user', $event)"
            :options="uniqueUsers"
            placeholder="Seleccionar..."
            :max-selected-labels="1"
            :show-toggle-all="false"
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Rol/Perfil</label>
          <MultiSelect
            :model-value="filters.role || []"
            @update:model-value="updateFilter('role', $event)"
            :options="uniqueRoles"
            placeholder="Seleccionar..."
            :max-selected-labels="1"
            :show-toggle-all="false"
            size="small"
          />
        </div>
      </div>

      <!-- Dropdown Filters -->
      <div class="filter-group">
        <h4 class="filter-group-title">Clasificación</h4>

        <div class="filter-item">
          <label>Aplicación</label>
          <MultiSelect
            :model-value="filters.application || []"
            @update:model-value="updateFilter('application', $event)"
            :options="uniqueApplications"
            placeholder="Seleccionar..."
            :max-selected-labels="1"
            :show-toggle-all="false"
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Estado</label>
          <Dropdown
            :model-value="filters.status || null"
            @update:model-value="updateFilter('status', $event)"
            :options="uniqueStatuses"
            placeholder="Todos"
            show-clear
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Proyecto</label>
          <Dropdown
            :model-value="filters.project || null"
            @update:model-value="updateFilter('project', $event)"
            :options="uniqueProjects"
            placeholder="Todos"
            show-clear
            size="small"
          />
        </div>
      </div>

      <!-- Result Filters -->
      <div class="filter-group">
        <h4 class="filter-group-title">Resultado</h4>

        <div class="filter-item">
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
            size="small"
          />
        </div>

        <div class="filter-item">
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
            size="small"
          />
        </div>
      </div>

      <!-- Checkbox Filters -->
      <div class="filter-group">
        <h4 class="filter-group-title">Criterios</h4>

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
      </div>

      <!-- Action Buttons -->
      <div class="filter-actions">
        <Button
          label="Limpiar filtros"
          severity="secondary"
          size="small"
          :disabled="!hasActiveFilters"
          @click="handleClearFilters"
          class="w-full"
        />
      </div>
    </div>
  </Sidebar>
</template>

<style scoped>
.filters-sidebar :deep(.p-sidebar-header) {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-group-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-item.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.filter-item.checkbox-item label {
  margin: 0;
  font-size: 0.875rem;
  cursor: pointer;
}

:deep(.p-inputtext-sm),
:deep(.p-multiselect-sm),
:deep(.p-dropdown-sm) {
  font-size: 0.875rem;
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
  width: 100%;
}

:deep(.p-inputtext-sm:focus),
:deep(.p-multiselect-sm:focus),
:deep(.p-dropdown-sm:focus) {
  border-color: var(--color-primary);
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.w-full {
  width: 100%;
}
</style>
