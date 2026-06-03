<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Button from "primevue/button";

interface GSPFiltersModalProps {
  visible: boolean;
  filters: {
    code?: string;
    assignedUser?: string;
    profile?: string[];
  };
  profileOptions: string[];
}

const props = defineProps<GSPFiltersModalProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:filters": [
    value: {
      code?: string;
      assignedUser?: string;
      profile?: string[];
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
  return f.code || f.assignedUser || (f.profile && f.profile.length > 0);
});

const handleClearFilters = () => {
  emit("clear-filters");
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(val: boolean) => emit('update:visible', val)"
    header="Filtros - GP-SAE"
    modal
    :style="{ width: '80vw' }"
    class="filters-modal"
  >
    <div class="filters-modal-content">
      <!-- Código -->
      <div class="filter-item compact">
        <label>Código de Petición</label>
        <InputText
          :model-value="filters.code || ''"
          @update:model-value="updateFilter('code', $event)"
          placeholder="Buscar código..."
        />
      </div>

      <!-- Usuario Asignado -->
      <div class="filter-item compact">
        <label>Usuario Asignado</label>
        <InputText
          :model-value="filters.assignedUser || ''"
          @update:model-value="updateFilter('assignedUser', $event)"
          placeholder="Buscar usuario..."
        />
      </div>

      <!-- Perfil/Rol -->
      <div class="filter-item compact">
        <label>Perfil / Rol</label>
        <MultiSelect
          :model-value="filters.profile || []"
          :options="profileOptions"
          @update:model-value="updateFilter('profile', $event)"
          placeholder="Seleccionar perfiles..."
          :max-selected-labels="3"
          display="chip"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <div class="footer-info">
          <span v-if="hasActiveFilters" class="active-filters-badge">
            Filtros activos
          </span>
        </div>
        <div class="footer-actions">
          <Button
            label="Limpiar"
            severity="secondary"
            @click="handleClearFilters"
            :disabled="!hasActiveFilters"
          />
          <Button label="Cerrar" @click="() => emit('update:visible', false)" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.filters-modal-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1rem 0;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item.compact label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-item.compact :deep(input),
.filter-item.compact :deep(.p-multiselect) {
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.footer-info {
  flex: 1;
}

.active-filters-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
}

.footer-actions :deep(.p-button) {
  min-width: 100px;
}
</style>
