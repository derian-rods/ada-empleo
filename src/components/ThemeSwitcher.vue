<script setup lang="ts">
import { useThemeStore } from '../stores/theme'
import { computed } from 'vue'

const themeStore = useThemeStore()

const themeLabel = computed(() => {
  return themeStore.isDark ? 'Tema Oscuro' : 'Tema Claro'
})

const themeIcon = computed(() => {
  return themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'
})
</script>

<template>
  <div class="theme-switcher">
    <button
      class="theme-toggle"
      :title="themeLabel"
      @click="themeStore.toggleTheme"
      aria-label="Cambiar tema"
    >
      <i :class="themeIcon"></i>
    </button>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background-color: var(--hover-bg);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.theme-toggle:active {
  transform: scale(0.95);
}
</style>
