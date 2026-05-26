import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Theme = 'dark'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('dark')

  // Load theme from localStorage on creation
  const loadTheme = () => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'dark') {
      currentTheme.value = saved
    } else {
      currentTheme.value = 'dark'
    }
    applyTheme(currentTheme.value)
  }

  const applyTheme = (theme: Theme) => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }

  const isDark = computed(() => currentTheme.value === 'dark')

  return {
    currentTheme,
    isDark,
    loadTheme,
    applyTheme,
  }
})
