<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import AppLayout from "./components/AppLayout.vue";
import LoadingOverlay from "./components/LoadingOverlay.vue";
import CsvUploadPanel from "./components/CsvUploadPanel.vue";
import SummaryTab from "./components/SummaryTab.vue";
import { useDashboardStore } from "./stores/dashboard";
import { useThemeStore } from "./stores/theme";
import { onMounted } from "vue";

const store = useDashboardStore();
const themeStore = useThemeStore();
const router = useRouter();
const route = useRoute();

onMounted(() => {
  themeStore.loadTheme();
});

function handleViewChange(viewId: string) {
  // Mapear ID del sidebar a ruta
  const routeMap: Record<string, string> = {
    dashboard: "/dashboard",
    tables: "/tables",
    analytics: "/charts",
  };

  const routePath = routeMap[viewId] || "/dashboard";
  router.push(routePath);
}

// Verificar si estamos en ruta /dashboard
const isDashboardRoute = () =>
  route.path === "/dashboard" || route.path === "/";
</script>

<template>
  <LoadingOverlay />
  <AppLayout @select-item="handleViewChange">
    <!-- Dashboard (solo en ruta /dashboard) -->
    <template v-if="isDashboardRoute()">
      <div class="main-dashboard">
        <CsvUploadPanel />

        <SummaryTab
          v-if="store.hasData"
          :summary="store.summary"
          :requests="store.calculatedRequests"
          :warnings="store.warnings"
          :errors="store.errors"
        />

        <div v-if="!store.hasData" class="empty-state">
          <p>Carga los CSVs para empezar el análisis</p>
        </div>
      </div>
    </template>

    <!-- Otras vistas (Tablas, Análisis, etc) con Suspense -->
    <template v-else>
      <Suspense>
        <template #default>
          <RouterView />
        </template>
        <template #fallback>
          <!-- Fallback mientras carga -->
          <div style="min-height: 400px"></div>
        </template>
      </Suspense>
    </template>
  </AppLayout>
</template>

<style scoped>
.main-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-size: 1rem;
}
</style>
