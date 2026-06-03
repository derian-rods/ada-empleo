<script setup lang="ts">
import { ref, computed } from "vue";
import Toast from "primevue/toast";
import Toolbar from "primevue/toolbar";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import Sidebar from "primevue/sidebar";
import { useDashboardStore } from "../stores/dashboard";
import { useThemeStore } from "../stores/theme";

const store = useDashboardStore();
const themeStore = useThemeStore();
const showAlertsPanel = ref(false);

// Inicializar tema
themeStore.loadTheme();

function handleThemeToggle() {
  themeStore.toggleTheme();
}

// Compute alerts info
const allAlerts = computed(() => [
  ...store.errors.map((e) => ({ text: e, type: "error" })),
  ...store.warnings.map((w) => ({ text: w, type: "warning" })),
]);

const alertCount = computed(() => allAlerts.value.length);

// Opciones para dropdown de empresa
const companyFilterOptions = [
  { label: "Todos", value: null },
  { label: "Sopra Steria", value: "Sopra Steria" },
];
</script>

<template>
  <div class="app-layout">
    <Toolbar class="app-toolbar" :disabled="store.isProcessingCsv">
      <template #start>
        <h2 style="margin: 0; font-size: 1.25rem">
          Control de estimaciones e incurridos ADA – Empleo
        </h2>
        <div class="toolbar-center" v-if="store.hasData">
          <Dropdown
            :model-value="store.selectedCompanyFilter"
            :options="companyFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="Seleccionar"
            size="small"
            @update:model-value="store.setCompanyFilter"
            class="company-dropdown"
          />
        </div>
      </template>
      <template #end>
        <div class="toolbar-end">
          <!-- Alert Badge with Bell Icon -->
          <div v-if="alertCount > 0" class="alert-badge-container">
            <Button
              icon="pi pi-bell"
              severity="warning"
              text
              rounded
              size="small"
              @click="showAlertsPanel = true"
              class="bell-btn"
              v-tooltip="'Ver alertas'"
            />
            <span class="alert-count-badge">{{ alertCount }}</span>
          </div>

          <!-- Theme Toggle -->
          <Button
            :icon="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'"
            text
            size="small"
            @click="handleThemeToggle"
            :title="`Cambiar a tema ${themeStore.isDark ? 'claro' : 'oscuro'}`"
          />
        </div>
      </template>
    </Toolbar>

    <!-- Alerts Sidebar -->
    <Sidebar
      v-model:visible="showAlertsPanel"
      position="right"
      class="alerts-sidebar"
      header="Alertas"
    >
      <div class="alerts-list">
        <div v-if="allAlerts.length === 0" class="no-alerts">
          <i class="pi pi-check-circle"></i>
          <p>No hay alertas</p>
        </div>
        <div
          v-for="(alert, idx) in allAlerts"
          :key="idx"
          class="alert-item"
          :class="`alert-${alert.type}`"
        >
          <i
            :class="`pi ${alert.type === 'error' ? 'pi-exclamation-circle' : 'pi-exclamation-triangle'}`"
          ></i>
          <span>{{ alert.text }}</span>
        </div>
      </div>
    </Sidebar>

    <main
      class="app-content"
      :class="{ 'is-processing': store.isProcessingCsv }"
    >
      <slot />
    </main>

    <Toast />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

.app-toolbar {
  border-radius: 0;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
}

.app-toolbar :deep(h2) {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 700;
}

.toolbar-center {
  display: flex;
  align-items: center;
  margin-left: 2rem;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
}

.company-dropdown {
  min-width: 150px;
}

.toolbar-end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-badge-container {
  position: relative;
  display: flex;
  align-items: center;
}

.bell-btn {
  color: #d97706;
}

.alert-count-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Alerts Sidebar */
.alerts-sidebar :deep(.p-sidebar-header) {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.no-alerts i {
  font-size: 2rem;
  color: #22c55e;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  border-left: 3px solid;
}

.alert-item i {
  flex-shrink: 0;
  margin-top: 0.125rem;
  font-size: 1rem;
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.1);
  border-left-color: #ef4444;
  color: #991b1b;
}

.alert-error i {
  color: #ef4444;
}

.alert-warning {
  background-color: rgba(217, 119, 6, 0.1);
  border-left-color: #d97706;
  color: #92400e;
}

.alert-warning i {
  color: #d97706;
}

.app-content {
  flex: 1;
  padding: 1.5rem;
  margin: 0 auto;
  width: 100%;
  transition:
    opacity 0.2s ease,
    background-color 0.3s ease;
  background-color: var(--bg-primary);
}

.app-content.is-processing {
  opacity: 0.6;
  pointer-events: none;
}
</style>
