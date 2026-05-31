import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/**
 * Preset personalizado para CCV Dashboard
 * Basado en Aura con colores vibrantes para light mode y oscuros para dark mode
 *
 * Light: Colores vibrantes y profesionales (azul, verde, naranja)
 * Dark: Colores oscuros con suficiente contraste
 */
export const CCVPreset = definePreset(Aura, {
  semantic: {
    // Usar paleta primaria de blue para ambos modos (más vibrante)
    primary: {
      50: "{blue.50}",
      100: "{blue.100}",
      200: "{blue.200}",
      300: "{blue.300}",
      400: "{blue.400}",
      500: "{blue.500}",
      600: "{blue.600}",
      700: "{blue.700}",
      800: "{blue.800}",
      900: "{blue.900}",
      950: "{blue.950}",
    },

    // Configuración por esquema de color (light/dark)
    colorScheme: {
      light: {
        // Superficies para light mode - con tonos azules sutiles (más color)
        surface: {
          0: "#ffffff",
          50: "#f0f7ff", // Azul muy claro (en lugar de gris)
          100: "#e0f1fe", // Azul claro
          200: "#bae5fe", // Azul medio-claro
          300: "#7dd3d1", // Tonos azul-verde
          400: "#e0e7ff", // Indigo muy claro (para variación)
          500: "#94a3b8", // Gris azulado
          600: "#64748b", // Gris más oscuro
          700: "#475569", // Gris muy oscuro
          800: "#1e293b", // Azul muy oscuro
          900: "#0f172a", // Azul profundo
          950: "#020617", // Negro profundo
        },

        // Colores primarios en light mode - más vibrante
        primary: {
          color: "{blue.600}", // Blue vibrante
          inverseColor: "#ffffff",
          hoverColor: "{blue.700}",
          activeColor: "{blue.800}",
        },

        // Colores de éxito, advertencia, peligro - más vibrantes
        success: {
          color: "{emerald.500}", // Emerald más vibrante
        },
        warning: {
          color: "{amber.500}", // Amber más vibrante
        },
        danger: {
          color: "{red.500}", // Red más vibrante
        },
        info: {
          color: "{cyan.500}", // Cyan más vibrante
        },

        // Highlight para light mode - con más color
        highlight: {
          background: "{blue.50}",
          focusBackground: "{blue.100}",
          color: "{blue.700}",
          focusColor: "{blue.900}",
        },
      },

      dark: {
        // Superficies para dark mode - colores oscuros con contraste
        surface: {
          0: "#ffffff",
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },

        // Colores primarios en dark mode
        primary: {
          color: "{blue.400}",
          inverseColor: "{slate.900}",
          hoverColor: "{blue.300}",
          activeColor: "{blue.200}",
        },

        // Colores de éxito, advertencia, peligro en dark mode
        success: {
          color: "{emerald.400}",
        },
        warning: {
          color: "{amber.400}",
        },
        danger: {
          color: "{red.400}",
        },
        info: {
          color: "{cyan.400}",
        },

        // Highlight para dark mode
        highlight: {
          background: "rgba(59, 130, 246, 0.16)",
          focusBackground: "rgba(59, 130, 246, 0.24)",
          color: "rgba(255, 255, 255, 0.87)",
          focusColor: "rgba(255, 255, 255, 1)",
        },
      },
    },

    // Focus ring - outline cuando se enfoca
    focusRing: {
      width: "2px",
      style: "solid",
      color: "{primary.color}",
      offset: "2px",
    },
  },
});
