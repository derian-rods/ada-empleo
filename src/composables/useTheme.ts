import { ref, watch } from "vue";

export type Theme = "light" | "dark";

export function useTheme() {
  // Tema actual
  const currentTheme = ref<Theme>("light");

  // Inicializar tema desde localStorage
  function initTheme() {
    const saved = localStorage.getItem("dashboard-theme") as Theme | null;
    if (saved === "dark" || saved === "light") {
      currentTheme.value = saved;
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      currentTheme.value = prefersDark ? "dark" : "light";
    }
    applyTheme();
  }

  // Aplicar tema al DOM
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme.value);
    localStorage.setItem("dashboard-theme", currentTheme.value);
  }

  // Alternar tema
  function toggleTheme() {
    currentTheme.value = currentTheme.value === "light" ? "dark" : "light";
  }

  // Watchers
  watch(currentTheme, () => {
    applyTheme();
  });

  return {
    currentTheme,
    toggleTheme,
    initTheme,
    applyTheme,
  };
}
