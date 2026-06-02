<script setup lang="ts">
import { ref, computed } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Dropdown from "primevue/dropdown";
import Checkbox from "primevue/checkbox";
import GpsaeRequestLink from "../../GpsaeRequestLink.vue";
import type { ParentGroupedTableFilters } from "../../../domain/parentGroupedTable";
import {
  buildParentGroupedTableRows,
  filterParentGroupedRows,
} from "../../../domain/parentGroupedTable";
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
} from "../../../domain/types";
import { useDashboardStore } from "../../../stores/dashboard";

interface ParentGroupedRequestsTableProps {
  parents: ParentRequest[];
  children: ChildRequest[];
  timeEntries: TimeEntry[];
  calculatedRequests: CalculatedRequest[];
  loading?: boolean;
}

const props = withDefaults(defineProps<ParentGroupedRequestsTableProps>(), {
  loading: false,
});

const dashboardStore = useDashboardStore();

// State
const expandedRows = ref<string[]>([]);
const filters = ref<ParentGroupedTableFilters>({});

// Build and filter data
const groupedRows = computed(() => {
  // Usar TimeEntries filtrados por empresa desde el store
  const rows = buildParentGroupedTableRows(
    props.parents,
    props.children,
    dashboardStore.filteredTimeEntries, // TimeEntries filtrados por empresa
    props.calculatedRequests,
  );
  return filterParentGroupedRows(rows, filters.value);
});

// Unique filter options
const uniqueUsers = computed(() => {
  const users = new Set<string>();
  groupedRows.value.forEach((row) => {
    row.users.forEach((u) => users.add(u));
  });
  return Array.from(users).sort();
});

const uniqueRoles = computed(() => {
  const roles = new Set<string>();
  groupedRows.value.forEach((row) => {
    row.roles.forEach((r) => roles.add(r));
  });
  return Array.from(roles).sort();
});

const uniqueApplications = computed(() => {
  const apps = new Set<string>();
  groupedRows.value.forEach((row) => {
    row.applications.forEach((a) => apps.add(a));
  });
  return Array.from(apps).sort();
});

const uniqueStatuses = computed(() => {
  const statuses = new Set<string>();
  groupedRows.value.forEach((row) => {
    if (row.status) statuses.add(row.status);
  });
  return Array.from(statuses).sort();
});

const uniqueProjects = computed(() => {
  const projects = new Set<string>();
  groupedRows.value.forEach((row) => {
    if (row.project) projects.add(row.project);
  });
  return Array.from(projects).sort();
});

// Helper functions
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

function riskBadge(level: string): "success" | "warning" | "danger" {
  if (level === "low") return "success";
  if (level === "medium") return "warning";
  return "danger";
}

function riskLabel(level: string): string {
  if (level === "low") return "Bajo";
  if (level === "medium") return "Medio";
  return "Alto";
}

function fmt(n: number): string {
  return n.toLocaleString("es-ES", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function fmtPct(n: number): string {
  return (
    n.toLocaleString("es-ES", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }) + "%"
  );
}

function clearFilters() {
  filters.value = {};
  expandedRows.value = [];
}
</script>

<template>
  <div class="parent-grouped-table">
    <!-- Filtros -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>Código padre</label>
          <InputText
            v-model="filters.parentCode"
            placeholder="Buscar código..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Asunto padre</label>
          <InputText
            v-model="filters.parentSubject"
            placeholder="Buscar asunto..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Código hija</label>
          <InputText
            v-model="filters.childCode"
            placeholder="Buscar código..."
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Asunto hija</label>
          <InputText
            v-model="filters.childSubject"
            placeholder="Buscar asunto..."
            size="small"
          />
        </div>
      </div>

      <div class="filter-row">
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

        <div class="filter-item">
          <label>Rol/Perfil</label>
          <MultiSelect
            v-model="filters.role"
            :options="uniqueRoles"
            placeholder="Seleccionar..."
            :max-selected-labels="1"
            :show-toggle-all="false"
            size="small"
          />
        </div>

        <div class="filter-item">
          <label>Aplicación</label>
          <MultiSelect
            v-model="filters.application"
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
            v-model="filters.status"
            :options="uniqueStatuses"
            placeholder="Todos"
            show-clear
            size="small"
          />
        </div>
      </div>

      <div class="filter-row">
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
          <label>Resultado</label>
          <Dropdown
            v-model="filters.resultStatus"
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
            v-model="filters.riskLevel"
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

        <div class="filter-item checkbox-item">
          <label>Solo pérdidas</label>
          <Checkbox v-model="filters.onlyLosses" binary />
        </div>

        <div class="filter-item checkbox-item">
          <label>Consumo &gt; 100%</label>
          <Checkbox v-model="filters.onlyConsumptionOver100" binary />
        </div>

        <div class="filter-item checkbox-item">
          <label>Desviación &gt; 20%</label>
          <Checkbox v-model="filters.onlyDeviationOver20" binary />
        </div>

        <Button
          label="Limpiar filtros"
          severity="secondary"
          size="small"
          @click="clearFilters"
        />
      </div>
    </div>

    <!-- Tabla con scroll -->
    <DataTable
      v-model:expanded-rows="expandedRows"
      :value="groupedRows"
      :paginator="false"
      :loading="loading"
      striped-rows
      removable-sort
      size="small"
      scrollable
      scrollHeight="600px"
      :global-filter-fields="['parentCode', 'parentSubject']"
      class="grouped-table"
      data-key="parentId"
    >
      <!-- Expansion column for children -->
      <Column :expander="true" style="width: 50px" />

      <!-- Parent columns -->
      <Column
        field="parentCode"
        header="Código padre"
        sortable
        style="width: 120px"
      >
        <template #body="{ data }">
          <GpsaeRequestLink :code="data.parentCode" />
        </template>
      </Column>

      <Column
        field="parentSubject"
        header="Asunto padre"
        sortable
        style="min-width: 200px"
      />

      <Column field="project" header="Proyecto" sortable style="width: 120px" />

      <Column
        field="application"
        header="Aplicación"
        sortable
        style="width: 120px"
      />

      <Column field="status" header="Estado" sortable style="width: 100px" />

      <Column
        field="childrenCount"
        header="Nº hijas"
        sortable
        style="width: 80px"
      />

      <Column field="users" header="Nº usuarios" sortable style="width: 100px">
        <template #body="{ data }">
          {{ data.users.length }}
        </template>
      </Column>

      <Column field="estimatedHours" header="Est." sortable style="width: 80px">
        <template #body="{ data }">{{ fmt(data.estimatedHours) }}</template>
      </Column>

      <Column
        field="actualHours"
        header="Incurridas"
        sortable
        style="width: 80px"
      >
        <template #body="{ data }">{{ fmt(data.actualHours) }}</template>
      </Column>

      <Column
        field="filteredActualHours"
        header="Filtradas"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">
          {{
            data.filteredActualHours !== undefined
              ? fmt(data.filteredActualHours)
              : "-"
          }}
        </template>
      </Column>

      <Column
        field="differenceHours"
        header="Diferencia"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">
          <span
            class="difference-value"
            :class="{
              profit: data.differenceHours >= 0,
              loss: data.differenceHours < 0,
            }"
          >
            {{ data.differenceHours >= 0 ? "+" : ""
            }}{{ fmt(data.differenceHours) }}h
          </span>
        </template>
      </Column>

      <Column
        field="deviationPercent"
        header="Dev. Horas %"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">{{
          fmtPct(data.deviationPercent)
        }}</template>
      </Column>

      <!-- HBS Columns -->
      <Column
        field="estimatedHbs"
        header="HBS Est."
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">{{ fmt(data.estimatedHbs) }}</template>
      </Column>

      <Column
        field="consumedHbs"
        header="HBS Real"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">{{ fmt(data.consumedHbs) }}</template>
      </Column>

      <Column
        field="differenceHbs"
        header="Dif. HBS"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">
          <span
            class="difference-value"
            :class="{
              profit: data.differenceHbs < 0,
              loss: data.differenceHbs >= 0,
            }"
          >
            {{ data.differenceHbs >= 0 ? "+" : ""
            }}{{ fmt(data.differenceHbs) }}
          </span>
        </template>
      </Column>

      <Column
        field="deviationPercentHbs"
        header="Dev. HBS %"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">{{
          fmtPct(data.deviationPercentHbs)
        }}</template>
      </Column>

      <Column
        field="consumptionPercent"
        header="Cons. %"
        sortable
        style="width: 90px"
      >
        <template #body="{ data }">{{
          fmtPct(data.consumptionPercent)
        }}</template>
      </Column>

      <Column
        field="resultStatus"
        header="Resultado"
        sortable
        style="width: 100px"
      >
        <template #body="{ data }">
          <Tag
            :severity="severityFor(data.resultStatus)"
            :value="labelFor(data.resultStatus)"
          />
        </template>
      </Column>

      <Column field="riskLevel" header="Riesgo" sortable style="width: 90px">
        <template #body="{ data }">
          <Tag
            :severity="riskBadge(data.riskLevel)"
            :value="riskLabel(data.riskLevel)"
          />
        </template>
      </Column>

      <!-- Expanded row template: children -->
      <template #expansion="{ data: parent }">
        <div class="expansion-content">
          <div class="children-grid">
            <div
              v-for="child in parent.children"
              :key="child.childId"
              class="child-card"
            >
              <div class="child-header">
                <h4>
                  <GpsaeRequestLink :code="child.childCode" />
                  -
                  {{ child.childSubject }}
                </h4>
              </div>

              <div class="child-metrics">
                <div class="metric">
                  <span class="label">Est.</span>
                  <span class="value">{{ fmt(child.estimatedHours) }}h</span>
                </div>
                <div class="metric">
                  <span class="label">Diferencia</span>
                  <span
                    class="difference-value"
                    :class="{
                      profit: child.differenceHours >= 0,
                      loss: child.differenceHours < 0,
                    }"
                  >
                    {{ child.differenceHours >= 0 ? "+" : ""
                    }}{{ fmt(child.differenceHours) }}h
                  </span>
                </div>
                <div class="metric">
                  <span class="label">Diferencia</span>
                  <span
                    class="value difference-value"
                    :class="{
                      profit: child.differenceHours >= 0,
                      loss: child.differenceHours < 0,
                    }"
                  >
                    {{ child.differenceHours >= 0 ? "+" : ""
                    }}{{ fmt(child.differenceHours) }}h
                  </span>
                </div>
                <div class="metric">
                  <span class="label">Desv.</span>
                  <span class="value">{{
                    fmtPct(child.deviationPercent)
                  }}</span>
                </div>
              </div>

              <div class="user-role-table">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Horas</th>
                      <th>Actividades</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(urh, idx) in child.userRoleHours"
                      :key="`${child.childId}-${idx}`"
                    >
                      <td>{{ urh.user }}</td>
                      <td>{{ urh.role }}</td>
                      <td class="text-right">{{ fmt(urh.hours) }}h</td>
                      <td>
                        <Tag
                          v-for="act in urh.activities"
                          :key="act"
                          :value="act"
                          severity="info"
                          style="font-size: 0.75rem; margin-right: 4px"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <template #empty>
        <div class="empty-state">
          <p>No hay peticiones que mostrar con los filtros aplicados</p>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.parent-grouped-table {
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

.filter-item.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.filter-item.checkbox-item label {
  margin: 0;
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

.grouped-table {
  width: 100%;
  background: var(--bg-primary);
}

.grouped-table :deep(.p-datatable-header) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.grouped-table :deep(.p-datatable-thead > tr > th) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 0.75rem;
  border-color: var(--border-color);
}

.grouped-table :deep(.p-datatable-tbody > tr) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.grouped-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
}

.grouped-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--bg-secondary);
}

.expansion-content {
  padding: 1.5rem;
  background: var(--bg-secondary);
}

.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1.5rem;
}

.child-card {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.child-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.child-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.child-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 0.375rem;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.metric .label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.metric .value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-role-table {
  overflow-x: auto;
}

.user-role-table table {
  width: 100%;
  font-size: 0.85rem;
  border-collapse: collapse;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.user-role-table thead {
  background: var(--bg-tertiary);
}

.user-role-table th {
  padding: 0.5rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.user-role-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.user-role-table td.text-right {
  text-align: right;
}

.user-role-table tbody tr:hover {
  background: var(--bg-hover);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
}

.empty-state p {
  margin: 0;
}

.difference-value {
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.difference-value.profit {
  color: #22c55e;
  background-color: rgba(34, 197, 94, 0.1);
}

.difference-value.loss {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}
</style>
