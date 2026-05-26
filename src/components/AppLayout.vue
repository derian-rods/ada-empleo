<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import { useDashboardStore } from '../stores/dashboard'
import ThemeSwitcher from './ThemeSwitcher.vue'

const store = useDashboardStore()
const toast = useToast()

function handleReset() {
  store.reset()
  toast.add({ severity: 'info', summary: 'Datos vaciados', life: 3000 })
}
</script>

<template>
  <div class="app-layout">
    <Toolbar class="app-toolbar" :disabled="store.isProcessingCsv">
      <template #start>
        <h2 style="margin: 0; font-size: 1.25rem">CCV Dashboard</h2>
      </template>
      <template #end>
        <ThemeSwitcher />
        <Button
          label="Vaciar datos"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          :disabled="!store.hasData || store.isProcessingCsv"
          @click="handleReset"
        />
      </template>
    </Toolbar>

    <main class="app-content" :class="{ 'is-processing': store.isProcessingCsv }">
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
}

.app-toolbar {
  border-radius: 0;
}

.app-content {
  flex: 1;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  transition: opacity 0.2s ease;
}

.app-content.is-processing {
  opacity: 0.6;
  pointer-events: none;
}
</style>

