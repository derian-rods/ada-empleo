<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { nextTick } from 'vue'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()

const tabs = [
  { label: 'Dashboard', value: 'dashboard', icon: 'pi pi-fw pi-home', path: '/dashboard' },
  { label: 'Tablas', value: 'tables', icon: 'pi pi-fw pi-table', path: '/tables' },
  { label: 'Gráficos', value: 'charts', icon: 'pi pi-fw pi-chart-bar', path: '/charts' },
]

function getActiveTab() {
  const path = route.path
  if (path === '/dashboard' || path === '/') return 'dashboard'
  if (path === '/tables') return 'tables'
  if (path === '/charts') return 'charts'
  return 'dashboard'
}

async function navigateTo(path: string) {
  // Usar nextTick para asegurar que la navegación sea no-bloqueante
  await nextTick()
  router.push(path)
}

const activeTab = getActiveTab()
</script>

<template>
  <div class="main-nav">
    <div class="nav-tabs">
      <Button
        v-for="tab in tabs"
        :key="tab.value"
        :label="tab.label"
        :icon="tab.icon"
        :severity="activeTab === tab.value ? 'primary' : 'secondary'"
        text
        class="nav-tab-button"
        @click="navigateTo(tab.path)"
      />
    </div>
  </div>
</template>

<style scoped>
.main-nav {
  width: 100%;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.nav-tab-button {
  border-radius: 4px;
  padding: 0.5rem 1rem;
}
</style>


