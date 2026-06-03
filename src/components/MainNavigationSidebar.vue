<script setup lang="ts">
import { ref, computed } from "vue";

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

interface MainNavigationSidebarProps {
  activeId?: string;
  items?: NavigationItem[];
}

const props = withDefaults(defineProps<MainNavigationSidebarProps>(), {
  activeId: "dashboard",
});

const emit = defineEmits<{
  "select-item": [id: string];
}>();

// State
const isHovered = ref(false);

// Default items if not provided
const defaultItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "pi-chart-bar",
  },
  {
    id: "tables",
    label: "Tablas",
    icon: "pi-table",
  },
  {
    id: "analytics",
    label: "Análisis",
    icon: "pi-chart-pie",
  },
  {
    id: "settings",
    label: "Configuración",
    icon: "pi-cog",
  },
];

const sidebarItems = computed(() => props.items || defaultItems);

function handleItemClick(itemId: string) {
  emit("select-item", itemId);
}

function isActive(itemId: string): boolean {
  return props.activeId === itemId;
}
</script>

<template>
  <aside
    class="main-navigation-sidebar"
    :class="{ 'is-hovered': isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Header with logo/toggle -->
    <div class="sidebar-header">
      <i class="pi pi-chevron-right"></i>
    </div>

    <!-- Navigation Items -->
    <nav class="sidebar-nav">
      <button
        v-for="item in sidebarItems"
        :key="item.id"
        :class="['nav-item', { active: isActive(item.id) }]"
        @click="handleItemClick(item.id)"
        :title="item.label"
      >
        <i :class="`pi ${item.icon}`" class="nav-icon"></i>
        <span v-if="isHovered" class="nav-label">{{ item.label }}</span>

        <!-- Active indicator -->
        <div v-if="isActive(item.id)" class="active-indicator"></div>
      </button>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <!-- Could add more actions here -->
    </div>
  </aside>
</template>

<style scoped>
.main-navigation-sidebar {
  position: relative;
  top: auto;
  left: auto;
  height: auto;
  width: 80px;
  background: var(--bg-sidebar, var(--bg-secondary));
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 200;
}

.main-navigation-sidebar.is-hovered {
  width: 240px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  color: var(--color-primary);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.sidebar-header:hover {
  background: var(--bg-primary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  flex: 1;
  overflow-y: auto;
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  border: none;
  background: transparent;
  border-left: 3px solid transparent;
  font-family: inherit;
  font-size: 0.9rem;
  position: relative;
  min-height: 50px;
}

.nav-item:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 600;
}

.nav-item.active .nav-icon {
  color: var(--color-primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  font-weight: 500;
  min-width: 140px;
}

/* Active indicator dot */
.active-indicator {
  position: absolute;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse-indicator 2s ease-in-out infinite;
}

@keyframes pulse-indicator {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.sidebar-footer {
  height: 60px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Mobile */
@media (max-width: 768px) {
  .main-navigation-sidebar {
    width: 60px;
  }

  .main-navigation-sidebar.is-hovered {
    width: 200px;
  }

  .nav-icon {
    width: 30px;
    font-size: 1.1rem;
  }
}
</style>
