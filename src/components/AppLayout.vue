<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import Toast from "primevue/toast";
import Toolbar from "primevue/toolbar";
import Button from "primevue/button";
import { useDashboardStore } from "../stores/dashboard";
import { useThemeStore } from "../stores/theme";

const store = useDashboardStore();
const themeStore = useThemeStore();
const toast = useToast();

// Inicializar tema
themeStore.loadTheme();

function handleReset() {
  store.reset();
  toast.add({ severity: "info", summary: "Datos vaciados", life: 3000 });
}

function handleThemeToggle() {
  themeStore.toggleTheme();
}
</script>

<template>
  <div class="app-layout">
    <Toolbar class="app-toolbar" :disabled="store.isProcessingCsv">
      <template #start>
        <h2 style="margin: 0; font-size: 1.25rem">CCV Dashboard</h2>
      </template>
      <template #end>
        <div class="toolbar-end">
          <Button
            :icon="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'"
            text
            size="small"
            @click="handleThemeToggle"
            :title="`Cambiar a tema ${themeStore.isDark ? 'claro' : 'oscuro'}`"
          />
          <Button
            label="Vaciar datos"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            :disabled="!store.hasData || store.isProcessingCsv"
            @click="handleReset"
          />
        </div>
      </template>
    </Toolbar>

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

.toolbar-end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
