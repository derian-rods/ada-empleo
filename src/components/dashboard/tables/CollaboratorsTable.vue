<script setup lang="ts">
import { computed, ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Tag from "primevue/tag";
import GpsaeRequestLink from "../../GpsaeRequestLink.vue";
import CollaboratorManagementModal from "../modals/CollaboratorManagementModal.vue";
import CollaboratorsFiltersModal from "./CollaboratorsFiltersModal.vue";
import {
  buildCollaboratorsSummary,
  buildCollaboratorsPageSummary,
  filterCollaborators,
  formatHours,
  type CollaboratorFilters,
} from "../../../domain/collaborators";
import type { CompanyCollaborator } from "../../../domain/companies";
import { useDashboardStore } from "../../../stores/dashboard";
import type {
  TimeEntry,
  ChildRequest,
  ParentRequest,
} from "../../../domain/types";

interface Props {
  timeEntries: TimeEntry[];
  children: ChildRequest[];
  parents: ParentRequest[];
}

const props = defineProps<Props>();
const store = useDashboardStore();

// State
const filters = ref<{
  collaboratorNames?: string[];
  dateFrom?: Date | null;
  dateTo?: Date | null;
  petitionCode?: string;
}>({});
const expandedRows = ref<string[]>([]);
const showCollaboratorModal = ref(false);
const showFiltersModal = ref(false);

// Computed: TimeEntries
const filteredByCompanyTimeEntries = computed(() => {
  return props.timeEntries;
});

// Computed: Colaboradores agrupados (basado en TimeEntries)
const collaboratorsSummary = computed(() => {
  return buildCollaboratorsSummary(
    filteredByCompanyTimeEntries.value,
    props.children,
    props.parents,
  );
});

// Computed: Enriquecer resumen
const enrichedCollaboratorsSummary = computed(() => {
  return collaboratorsSummary.value;
});

const collaboratorManagementList = computed(
  () => store.allManagedCollaborators,
);

// Computed: Resumen de página
const pageSummary = computed(() => {
  return buildCollaboratorsPageSummary(enrichedCollaboratorsSummary.value);
});

// Computed: Filtros aplicados
const filteredCollaborators = computed(() => {
  // Convertir fechas de Date a string ISO para la función de filtro
  const filterParams: CollaboratorFilters = {
    ...filters.value,
    dateFrom: filters.value.dateFrom
      ? new Date(filters.value.dateFrom).toISOString().split("T")[0]
      : undefined,
    dateTo: filters.value.dateTo
      ? new Date(filters.value.dateTo).toISOString().split("T")[0]
      : undefined,
  };
  return filterCollaborators(enrichedCollaboratorsSummary.value, filterParams);
});

// Opciones para dropdown de colaboradores (multiple)
const collaboratorOptions = computed(() => {
  return enrichedCollaboratorsSummary.value.map((c) => ({
    label: c.collaboratorName,
    value: c.collaboratorName,
  }));
});

// Opciones para dropdown de peticiones (de todos los colaboradores)
const petitionOptions = computed(() => {
  const petitions = new Set<string>();
  for (const summary of enrichedCollaboratorsSummary.value) {
    for (const entry of summary.entries) {
      if (entry.petitionCode) {
        petitions.add(entry.petitionCode);
      }
    }
  }
  return Array.from(petitions).sort();
});

// Limpiar filtros
function clearFilters() {
  filters.value = {};
  expandedRows.value = [];
}

function onSaveCollaborators(collaborators: CompanyCollaborator[]) {
  store.saveManagedCollaborators(collaborators);
}
</script>

<template>
  <div class="collaborators-table-container">
    <!-- Resumen de página -->
    <div v-if="collaboratorsSummary.length > 0" class="summary-section">
      <!-- Fila superior: Cards + Botón Gestionar -->
      <div class="summary-header">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-label">Colaboradores</div>
            <div class="card-value">{{ pageSummary.totalCollaborators }}</div>
          </div>

          <div class="summary-card">
            <div class="card-label">Total imputado</div>
            <div class="card-value">
              {{ formatHours(pageSummary.totalHours) }}
            </div>
          </div>

          <div class="summary-card">
            <div class="card-label">Peticiones distintas</div>
            <div class="card-value">
              {{ pageSummary.totalUniqueRequests }}
            </div>
          </div>

          <div class="summary-card">
            <div class="card-label">Período</div>
            <div class="card-value-small">
              {{ pageSummary.monthRange.displayRange || "Sin datos" }}
            </div>
          </div>
        </div>

        <!-- Botón Gestionar Colaboradores y Botón Filtros -->
        <div class="summary-actions">
          <Button
            label="Filtros"
            icon="pi pi-sliders-v"
            severity="secondary"
            size="small"
            @click="showFiltersModal = true"
          />
          <Button
            label="Gestionar colaboradores"
            icon="pi pi-users"
            severity="info"
            size="small"
            @click="showCollaboratorModal = true"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de colaboradores - con scroll interno -->
    <div class="table-scroll-container">
      <DataTable
        :value="filteredCollaborators"
        :paginator="false"
        striped-rows
        removable-sort
        sort-field="totalHours"
        :sort-order="-1"
        size="small"
        scrollable
        scrollHeight="950px"
        class="collaborators-table"
        v-model:expanded-rows="expandedRows"
        :data-key="(row) => row.collaboratorName"
      >
        <!-- Expansion column -->
        <Column :expander="true" style="width: 50px" />

        <!-- Colaborador -->
        <Column
          field="collaboratorName"
          header="Colaborador"
          sortable
          style="width: 200px"
        >
          <template #body="{ data }">
            <strong>{{ data.collaboratorName }}</strong>
          </template>
        </Column>

        <!-- Total imputado -->
        <Column
          field="totalHours"
          header="Total imputado"
          sortable
          style="width: 120px"
        >
          <template #body="{ data }">
            {{ formatHours(data.totalHours) }}
          </template>
        </Column>

        <!-- Peticiones distintas -->
        <Column
          field="uniqueRequestCount"
          header="Peticiones"
          sortable
          style="width: 100px"
        >
          <template #body="{ data }">
            {{ data.uniqueRequestCount }}
          </template>
        </Column>

        <!-- Expansion: Detalle de imputaciones -->
        <template #expansion="{ data: collaborator }">
          <div class="expansion-content">
            <h5 class="detail-title">
              Detalle de imputaciones: {{ collaborator.collaboratorName }}
            </h5>

            <DataTable
              :value="collaborator.entries"
              :paginator="false"
              striped-rows
              removable-sort
              sort-field="date"
              :sort-order="-1"
              size="small"
              scrollable
              scrollHeight="950px"
              class="detail-table"
            >
              <!-- Petición -->
              <Column
                field="petitionCode"
                header="Petición"
                sortable
                style="width: 120px"
              >
                <template #body="{ data }">
                  <GpsaeRequestLink :code="data.petitionCode" />
                </template>
              </Column>

              <!-- Descripción -->
              <Column
                field="petitionTitle"
                header="Descripción"
                style="min-width: 250px"
              >
                <template #body="{ data }">
                  {{ data.petitionTitle || "-" }}
                </template>
              </Column>

              <!-- Petición padre -->
              <Column
                field="parentRequestCode"
                header="Padre"
                style="width: 100px"
              >
                <template #body="{ data }">
                  <GpsaeRequestLink
                    v-if="data.parentRequestCode"
                    :code="data.parentRequestCode"
                  />
                  <span v-else>-</span>
                </template>
              </Column>

              <!-- Fecha -->
              <Column field="date" header="Fecha" sortable style="width: 110px">
                <template #body="{ data }">
                  {{ data.date }}
                </template>
              </Column>

              <!-- Mes -->
              <Column
                field="monthDisplay"
                header="Mes"
                sortable
                style="width: 130px"
              >
                <template #body="{ data }">
                  <Tag :value="data.monthDisplay" severity="secondary" />
                </template>
              </Column>

              <!-- Tiempo imputado -->
              <Column
                field="hours"
                header="Tiempo imputado"
                sortable
                style="width: 120px"
              >
                <template #body="{ data }">
                  <strong>{{ formatHours(data.hours) }}</strong>
                </template>
              </Column>

              <!-- Actividad -->
              <Column
                field="activity"
                header="Actividad"
                style="min-width: 150px"
              >
                <template #body="{ data }">
                  {{ data.activity || "-" }}
                </template>
              </Column>

              <template #empty>
                <div class="empty-state">Sin imputaciones</div>
              </template>
            </DataTable>
          </div>
        </template>

        <template #empty>
          <div class="empty-state">
            <p>No hay colaboradores en los datos cargados</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Modal de gestión de colaboradores -->
    <CollaboratorManagementModal
      :visible="showCollaboratorModal"
      :collaborators="collaboratorManagementList"
      @update:visible="showCollaboratorModal = $event"
      @save="onSaveCollaborators"
    />

    <!-- Modal de filtros -->
    <CollaboratorsFiltersModal
      :visible="showFiltersModal"
      :filters="filters"
      :collaborator-options="collaboratorOptions"
      :petition-options="petitionOptions"
      @update:visible="showFiltersModal = $event"
      @update:filters="filters = $event"
      @clear-filters="clearFilters"
    />
  </div>
</template>

<style scoped>
.collaborators-table-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0;
}

/* Summary Section */
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  flex: 1;
}

.summary-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.summary-card {
  padding: 1rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-color);
}

.card-value-small {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Filters Section */
.filters-section {
  padding: 1rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.p-inputtext-sm),
:deep(.p-select-sm) {
  font-size: 0.875rem;
}

/* Table Styles */
.table-scroll-container {
  max-height: 950px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  background: var(--surface-0);
}

.table-scroll-container :deep(.p-datatable-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface-100);
}

.collaborators-table {
  width: 100%;
}

.collaborators-table :deep(.p-datatable-table-container) {
  height: 950px;
}

.month-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--primary-color);
  color: white;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.8rem;
}

.month-empty {
  color: var(--text-color-secondary);
}

/* Expansion */
.expansion-content {
  padding: 1.5rem;
  background: var(--surface-25);
}

.detail-title {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

.detail-table {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}
</style>
