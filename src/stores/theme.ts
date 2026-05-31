import { defineStore } from "pinia";
import { ref, computed } from "vue";

export type Theme = "light" | "dark";

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(false);

  /**
   * Carga el tema guardado o detecta preferencia del sistema
   */
  const loadTheme = () => {
    const saved = localStorage.getItem("theme") as Theme | null;

    if (saved === "dark" || saved === "light") {
      // Usar preferencia guardada
      isDark.value = saved === "dark";
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      isDark.value = prefersDark;
    }

    applyTheme();
  };

  /**
   * Aplica el tema al documento usando clase CSS
   */
  const applyTheme = () => {
    const root = document.documentElement;

    if (isDark.value) {
      root.classList.add("app-dark");
    } else {
      root.classList.remove("app-dark");
    }

    // Guardar preferencia
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  };

  /**
   * Alterna entre light y dark mode
   */
  const toggleTheme = () => {
    isDark.value = !isDark.value;
    applyTheme();
  };

  const isLight = computed(() => !isDark.value);

  return {
    isDark,
    isLight,
    loadTheme,
    toggleTheme,
    applyTheme,
  };
});
