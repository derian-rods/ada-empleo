import { useThemeStore } from '../stores/theme'
import { onMounted } from 'vue'

export function useThemeInit() {
  const themeStore = useThemeStore()

  onMounted(() => {
    themeStore.loadTheme()
  })

  return themeStore
}
