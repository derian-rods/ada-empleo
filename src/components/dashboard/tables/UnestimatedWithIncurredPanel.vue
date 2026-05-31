<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "primevue/card";
import Message from "primevue/message";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Dropdown from "primevue/dropdown";
import GpsaeRequestLink from "../../GpsaeRequestLink.vue";
import type {
  CalculatedRequest,
  ChildRequest,
  TimeEntry,
} from "../../../domain/types";

interface UnestimatedWithIncurredProps {
  calculatedRequests: CalculatedRequest[];
  children: ChildRequest[];
  timeEntries: TimeEntry[];
  loading?: boolean;
}

interface Filters {
  code?: string;
  subject?: string;
  project?: string;
  application?: string;
  status?: string;
  user?: string[];
}

interface ExtendedChildRequest extends ChildRequest {
  actualHours?: number;
}

interface ExtendedRequest extends CalculatedRequest {
  childrenRequests?: ExtendedChildRequest[];
}

const props = withDefaults(defineProps<UnestimatedWithIncurredProps>(), {
  loading: false,
});

// State
const filters = ref<Filters>({});
const expandedRows = ref<string[]>([]);

// Calcular horas reales para cada hijo
const childrenWithActualHours = computed(() => {
  return props.children.map((child) => {
    const extended: ExtendedChildRequest = { ...child };
    extended.actualHours = props.timeEntries
      .filter((te) => te.petitionId === child.code)
      .reduce((sum, te) => sum + (te.hours || 0), 0);
    return extended;
  });
});

// Filtrar peticiones sin estimado pero con incurrido
const baseFilteredRequests = computed(() => {
  return props.calculatedRequests.filter(
    (r) => r.estimatedHours === 0 && r.actualHours > 0,
  );
});

// Añadir hijas relacionadas a cada petición
const requestsWithChildren = computed(() => {
  return baseFilteredRequests.value.map((request) => {
    const extended: ExtendedRequest = { ...request };
    extended.childrenRequests = childrenWithActualHours.value.filter(
      (c) => c.parentId === request.parentId,
    );
    return extended;
  });
});

// Aplicar filtros adicionales
const filteredRequests = computed(() => {
  let result = requestsWithChildren.value;

  if (filters.value.code) {
    result = result.filter((r) =>
      r.code?.toLowerCase().includes(filters.value.code?.toLowerCase() || ""),
    );
  }

  if (filters.value.subject) {
    result = result.filter((r) =>
      r.subject
        ?.toLowerCase()
        .includes(filters.value.subject?.toLowerCase() || ""),
    );
  }

  if (filters.value.project) {
    result = result.filter((r) => r.project === filters.value.project);
  }

  if (filters.value.application) {
    result = result.filter((r) => r.application === filters.value.application);
  }

  if (filters.value.status) {
    result = result.filter((r) => r.status === filters.value.status);
  }

  if (filters.value.user && filters.value.user.length > 0) {
    result = result.filter((r) =>
      r.people?.some((p) => filters.value.user?.includes(p)),
    );
  }

  return result;
});

const count = computed(() => filteredRequests.value.length);

// Unique filter options
const uniqueProjects = computed(() => {
  const projects = new Set<string>();
  baseFilteredRequests.value.forEach((r) => {
    if (r.project) projects.add(r.project);
  });
  return Array.from(projects).sort();
});

const uniqueApplications = computed(() => {
  const apps = new Set<string>();
  baseFilteredRequests.value.forEach((r) => {
    if (r.application) apps.add(r.application);
  });
  return Array.from(apps).sort();
});

const uniqueStatuses = computed(() => {
  const statuses = new Set<string>();
  baseFilteredRequests.value.forEach((r) => {
    if (r.status) statuses.add(r.status);
  });
  return Array.from(statuses).sort();
});

const uniqueUsers = computed(() => {
  const users = new Set<string>();
  baseFilteredRequests.value.forEach((r) => {
    r.people?.forEach((p) => users.add(p));
  });
  return Array.from(users).sort();
});

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function clearFilters() {
  filters.value = {};
}
</script>

<template>
  <div class="unestimated-panel">
    <!-- Filtros -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>Código</label>
          <InputText
            v-model="filters.code"
            placeholder="Buscar código..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Asunto</label>
          <InputText
            v-model="filters.subject"
            placeholder="Buscar asunto..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Proyecto</label>
          <Dropdown
            v-model="filters.project"
            :options="uniqueProjects"
            placeholder="Todos"
            show-clear
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Aplicación</label>
          <Dropdown
            v-model="filters.application"
            :options="uniqueApplications"
            placeholder="Todos"
            show-clear
            size="small"
          />
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-item">
          <label>Estado</label>
          <Dropdown
            v-model="filters.status"
            :options="uniqueStatuses"
            placeholder="Todos"
            show-clear
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Usuario</label>
          <MultiSelect
            v-model="filters.user"
            :options="uniqueUsers"
            placeholder="Seleccionar..."
            :max-selected-labels="1"
            :show-toggle-all="false"
            size="small"
          />
        </div>

        <Button
          label="Limpiar filtros"
          severity="secondary"
          size="small"
          @click="clearFilters"
        />
      </div>
    </div>

    <!-- Card con tabla -->
    <Card>
      <template #title>
        <div class="title-container">
          <span>Sin estimar con incurrido</span>
          <Tag
            v-if="count > 0"
            :value="`${count} peticiones`"
            severity="warning"
            class="count-badge"
          />
          <Tag
            v-else
            value="Sin datos"
            severity="success"
            class="count-badge"
          />
        </div>
      </template>
      <template #content>
        <Message
          v-if="count === 0"
          severity="success"
          text="No hay peticiones sin estimación pero con horas incurridas"
          class="mb-3"
        />
        <DataTable
          v-else
          :value="filteredRequests"
          :paginator="false"
          :loading="loading"
          striped-rows
          removable-sort
          sort-field="actualHours"
          :sort-order="-1"
          size="small"
          scrollable
          scrollHeight="600px"
          class="table-wrapper"
          v-model:expanded-rows="expandedRows"
          data-key="parentId"
        >
          <!-- Expansion column -->
          <Column :expander="true" style="width: 50px" />

          <Column field="code" header="Código" sortable style="width: 120px">
            <template #body="{ data }">
              <GpsaeRequestLink :code="data.code" />
            </template>
          </Column>

          <Column
            field="subject"
            header="Asunto"
            sortable
            style="min-width: 250px"
          />

          <Column
            field="project"
            header="Proyecto"
            sortable
            style="width: 120px"
          />

          <Column
            field="application"
            header="Aplicación"
            sortable
            style="width: 120px"
          />

          <Column
            field="status"
            header="Estado"
            sortable
            style="width: 100px"
          />

          <Column
            field="estimatedHours"
            header="Estimadas"
            sortable
            style="width: 100px"
          >
            <template #body="{ data }">{{ fmt(data.estimatedHours) }}</template>
          </Column>

          <Column
            field="actualHours"
            header="Incurridas"
            sortable
            style="width: 100px"
          >
            <template #body="{ data }">{{ fmt(data.actualHours) }}</template>
          </Column>

          <Column
            field="consumedHbs"
            header="HBS Consumidas"
            sortable
            style="width: 120px"
          >
            <template #body="{ data }">{{ fmt(data.consumedHbs) }}</template>
          </Column>

          <Column
            field="childrenCount"
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

          <Column field="people" header="Usuarios" style="min-width: 150px">
            <template #body="{ data }">
              <Tag
                v-for="person in data.people"
                :key="person"
                :value="person"
                severity="info"
                style="margin-right: 0.25rem"
              />
            </template>
          </Column>

          <!-- Expansion template: children -->
          <template #expansion="{ data: parent }">
            <div class="expansion-content">
              <div
                v-if="
                  parent.childrenRequests && parent.childrenRequests.length > 0
                "
                class="children-table"
              >
                <h5 class="children-title">
                  Peticiones hijas ({{ parent.childrenRequests.length }})
                </h5>
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Asunto</th>
                      <th>Proyecto</th>
                      <th>Estado</th>
                      <th class="text-right">Estimadas (h)</th>
                      <th class="text-right">Incurridas (h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="child in parent.childrenRequests"
                      :key="child.id"
                    >
                      <td>
                        <GpsaeRequestLink :code="child.code" />
                      </td>
                      <td>{{ child.subject }}</td>
                      <td>{{ child.project }}</td>
                      <td>{{ child.status }}</td>
                      <td class="text-right">
                        {{ fmt(child.estimatedHours) }}
                      </td>
                      <td class="text-right">{{ fmt(child.actualHours) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-children">
                <p>No hay peticiones hijas</p>
              </div>
            </div>
          </template>

          <template #empty>
            <div class="empty-state-text">Sin datos disponibles</div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.unestimated-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

:deep(.p-inputtext-sm),
:deep(.p-multiselect-sm),
:deep(.p-dropdown-sm) {
  font-size: 0.875rem;
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.p-inputtext-sm:focus),
:deep(.p-multiselect-sm:focus),
:deep(.p-dropdown-sm:focus) {
  border-color: var(--color-primary);
}

.title-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.count-badge {
  margin-left: auto;
}

.mb-3 {
  margin-bottom: 1rem;
}

.table-wrapper {
  width: 100%;
}

.table-wrapper :deep(.p-datatable) {
  background: var(--bg-primary);
}

.table-wrapper :deep(.p-datatable-header) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.table-wrapper :deep(.p-datatable-thead > tr > th) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 0.75rem;
  border-color: var(--border-color);
}

.table-wrapper :deep(.p-datatable-tbody > tr) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.table-wrapper :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
}

.table-wrapper :deep(.p-datatable-tbody > tr:hover) {
  background: var(--bg-secondary);
}

.empty-state-text {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.expansion-content {
  padding: 1.5rem;
  background: var(--bg-secondary);
}

.children-table {
  overflow-x: auto;
}

.children-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.children-table table {
  width: 100%;
  font-size: 0.85rem;
  border-collapse: collapse;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.children-table thead {
  background: var(--bg-secondary);
}

.children-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.children-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.children-table tbody tr:hover {
  background-color: var(--bg-tertiary);
}

.text-right {
  text-align: right;
}

.no-children {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}
</style>
