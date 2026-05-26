import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('light')

  // Load theme from localStorage on creation
  const loadTheme = () => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved && (saved === 'light' || saved === 'dark')) {
      currentTheme.value = saved
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme(currentTheme.value)
  }

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    applyTheme(currentTheme.value)
    localStorage.setItem('theme', currentTheme.value)
  }

  const applyTheme = (theme: Theme) => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }

  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')

  return {
    currentTheme,
    isDark,
    isLight,
    toggleTheme,
    loadTheme,
    applyTheme,
  }
})
