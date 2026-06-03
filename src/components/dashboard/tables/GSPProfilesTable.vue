<script setup lang="ts">
import { computed, ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputGroup from "primevue/inputgroup";
import InputText from "primevue/inputtext";
import GSPFiltersModal from "./GSPFiltersModal.vue";
import GpsaeRequestLink from "../../GpsaeRequestLink.vue";
import type { ChildRequest, TimeEntry } from "../../../domain/types";

interface GSPProfilesTableProps {
  children: ChildRequest[];
  timeEntries: TimeEntry[];
  loading?: boolean;
}

interface GSPProfile {
  id: string;
  code: string;
  status: string;
  assignedUser: string;
  profiles: string[]; // Array of unique profiles
  profilesDisplay: string; // Display string for profiles
}

interface Filters {
  code?: string;
  assignedUser?: string;
  profile?: string[];
}

const props = withDefaults(defineProps<GSPProfilesTableProps>(), {
  loading: false,
});

// State
const filters = ref<Filters>({});
const globalFilter = ref("");
const showFiltersModal = ref(false);

// Get unique profiles for a child request
function getProfilesForChild(childCode: string): string[] {
  const profiles = props.timeEntries
    .filter((te) => te.petitionId === childCode)
    .map((te) => te.profiledRole || te.cauRole)
    .filter((p): p is string => Boolean(p && p.trim() !== ""));

  return Array.from(new Set(profiles));
}

// Build GSP data from children requests
const gspProfiles = computed(() => {
  return props.children
    .filter((child) => child.code && (child.assignedUser || child.status))
    .map((child) => {
      const profiles = getProfilesForChild(child.code);

      return {
        id: child.id,
        code: child.code,
        status: child.status || "Sin datos",
        assignedUser: child.assignedUser || "-",
        profiles,
        profilesDisplay: profiles.length > 0 ? profiles.join(", ") : "-",
      } as GSPProfile;
    });
});

// Get unique profile options for filter
const profileOptions = computed(() => {
  const allProfiles = new Set<string>();
  props.timeEntries.forEach((te) => {
    if (te.profiledRole) allProfiles.add(te.profiledRole);
    if (te.cauRole) allProfiles.add(te.cauRole);
  });
  return Array.from(allProfiles)
    .filter((p) => p && p.trim() !== "")
    .sort();
});

// Apply filters
const filteredProfiles = computed(() => {
  let result = gspProfiles.value;

  if (globalFilter.value) {
    const searchTerm = globalFilter.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.code.toLowerCase().includes(searchTerm) ||
        p.assignedUser.toLowerCase().includes(searchTerm) ||
        p.profilesDisplay.toLowerCase().includes(searchTerm) ||
        p.status.toLowerCase().includes(searchTerm),
    );
  }

  if (filters.value.code) {
    result = result.filter((p) =>
      p.code.toLowerCase().includes(filters.value.code?.toLowerCase() || ""),
    );
  }

  if (filters.value.assignedUser) {
    result = result.filter((p) =>
      p.assignedUser
        .toLowerCase()
        .includes(filters.value.assignedUser?.toLowerCase() || ""),
    );
  }

  if (filters.value.profile && filters.value.profile.length > 0) {
    result = result.filter((p) =>
      p.profiles.some((profile) => filters.value.profile?.includes(profile)),
    );
  }

  return result;
});

// Helper function to get severity for status
function severityFor(
  status: string,
): "success" | "warning" | "danger" | "info" {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("nueva")) return "info";
  if (statusLower.includes("en progreso")) return "warning";
  if (statusLower.includes("completada") || statusLower.includes("cerrada"))
    return "success";
  if (statusLower.includes("cancelada")) return "danger";
  return "info";
}

// Check if any filter is active
const hasActiveFilters = computed(() => {
  return (
    filters.value.code ||
    filters.value.assignedUser ||
    (filters.value.profile && filters.value.profile.length > 0) ||
    globalFilter.value
  );
});

// Clear all filters
function clearFilters() {
  filters.value = {};
  globalFilter.value = "";
}

// Handle filters modal updates
function handleFiltersUpdate(newFilters: Filters) {
  filters.value = newFilters;
}

function handleClearFilters() {
  filters.value = {};
}
</script>

<template>
  <div class="gsp-profiles-table-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <InputGroup>
          <span class="p-inputgroup-addon">
            <i class="pi pi-search"></i>
          </span>
          <InputText
            v-model="globalFilter"
            type="text"
            placeholder="Buscar en todas las columnas..."
            class="global-search"
          />
        </InputGroup>
      </div>

      <div class="toolbar-right">
        <Button
          icon="pi pi-filter"
          :label="`Filtros${hasActiveFilters ? ' (' + Object.keys(filters).filter((k) => filters[k as keyof Filters]).length + ')' : ''}`"
          @click="showFiltersModal = true"
          :severity="hasActiveFilters ? 'warning' : 'secondary'"
          text
        />
        <Button
          v-if="hasActiveFilters"
          icon="pi pi-times"
          label="Limpiar"
          severity="secondary"
          text
          @click="clearFilters"
        />
      </div>
    </div>

    <!-- Info bar -->
    <div class="info-bar">
      <span class="record-count">
        Mostrando {{ filteredProfiles.length }} de {{ gspProfiles.length }}
        registros
      </span>
    </div>

    <!-- Table -->
    <DataTable
      :value="filteredProfiles"
      :loading="loading"
      scrollable
      scrollHeight="950px"
      striped-rows
      removable-sort
      paginator
      :rows="25"
      class="gsp-table"
      data-key="id"
    >
      <!-- Código de Petición -->
      <Column
        field="code"
        header="Código de Petición"
        sortable
        style="width: 150px"
      >
        <template #body="{ data }">
          <GpsaeRequestLink :code="data.code" />
        </template>
      </Column>

      <!-- Estado -->
      <Column field="status" header="Estado" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag :value="data.status" :severity="severityFor(data.status)" />
        </template>
      </Column>

      <!-- Usuario Asignado -->
      <Column
        field="assignedUser"
        header="Usuario Asignado"
        sortable
        style="width: 180px"
      >
        <template #body="{ data }">
          {{ data.assignedUser }}
        </template>
      </Column>

      <!-- Perfil / Rol -->
      <Column
        field="profilesDisplay"
        header="Perfil / Rol"
        sortable
        style="width: 250px"
      >
        <template #body="{ data }">
          <div v-if="data.profiles.length > 0" class="profiles-container">
            <Tag
              v-for="profile in data.profiles"
              :key="profile"
              :value="profile"
              class="profile-tag"
            />
          </div>
          <span v-else class="text-secondary">-</span>
        </template>
      </Column>

      <template #empty>
        <div class="empty-state">
          <p>No hay perfiles GSP con los filtros aplicados</p>
        </div>
      </template>
    </DataTable>

    <!-- Filters Modal -->
    <GSPFiltersModal
      :visible="showFiltersModal"
      :filters="filters"
      :profile-options="profileOptions"
      @update:visible="showFiltersModal = $event"
      @update:filters="handleFiltersUpdate"
      @clear-filters="handleClearFilters"
    />
  </div>
</template>

<style scoped>
.gsp-profiles-table-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
}

.toolbar-left {
  flex: 1;
  max-width: 400px;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.global-search {
  font-size: 0.875rem;
}

.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.record-count {
  font-style: italic;
}

.gsp-table {
  width: 100%;
  background: var(--bg-primary);
  flex: 1;
  min-height: 0;
}

.gsp-table :deep(.p-datatable-header) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.gsp-table :deep(.p-datatable-thead > tr > th) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 0.75rem;
  border-color: var(--border-color);
}

.gsp-table :deep(.p-datatable-tbody > tr) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.gsp-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
}

.gsp-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--bg-secondary);
}

.gsp-table :deep(.p-datatable-table-container) {
  max-height: 950px;
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

.profiles-container {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.profile-tag {
  font-size: 0.8rem;
}

.text-secondary {
  color: var(--text-secondary);
}

:deep(.p-inputgroup) {
  width: 100%;
}

:deep(.p-inputgroup-addon) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
}

:deep(.p-inputtext) {
  font-size: 0.875rem;
}

:deep(.p-multiselect) {
  font-size: 0.875rem;
}
</style>
