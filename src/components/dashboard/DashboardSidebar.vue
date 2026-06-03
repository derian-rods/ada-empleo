<script setup lang="ts">
import { ref, computed } from "vue";

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  children?: SidebarSubItem[];
}

interface SidebarSubItem {
  id: string;
  label: string;
  icon?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeItemId?: string;
}

const props = defineProps<DashboardSidebarProps>();

const emit = defineEmits<{
  "select-item": [id: string];
}>();

// State
const isHoveredOnSidebar = ref(false);
const hoveredItemId = ref<string | null>(null);

// Computed
const isHovering = computed(() => isHoveredOnSidebar.value);
const expandedWidth = computed(() => (isHovering.value ? "280px" : "80px"));

function handleItemClick(itemId: string) {
  emit("select-item", itemId);
}

function handleSidebarMouseEnter() {
  isHoveredOnSidebar.value = true;
}

function handleSidebarMouseLeave() {
  isHoveredOnSidebar.value = false;
  hoveredItemId.value = null;
}

function handleItemMouseEnter(itemId: string) {
  hoveredItemId.value = itemId;
}

function handleItemMouseLeave() {
  hoveredItemId.value = null;
}

function isItemActive(itemId: string): boolean {
  return props.activeItemId === itemId;
}
</script>

<template>
  <div
    class="dashboard-sidebar"
    :class="{ 'is-expanded': isHovering }"
    :style="{ width: expandedWidth }"
    @mouseenter="handleSidebarMouseEnter"
    @mouseleave="handleSidebarMouseLeave"
  >
    <!-- Logo/Header -->
    <div class="sidebar-header">
      <i class="pi pi-bars"></i>
    </div>

    <!-- Items -->
    <div class="sidebar-items">
      <div
        v-for="item in items"
        :key="item.id"
        class="sidebar-item-wrapper"
        @mouseenter="handleItemMouseEnter(item.id)"
        @mouseleave="handleItemMouseLeave"
      >
        <!-- Main item button -->
        <div
          :class="[
            'sidebar-item',
            { active: isItemActive(item.id) },
            { hovered: hoveredItemId === item.id },
          ]"
          @click="handleItemClick(item.id)"
        >
          <div class="item-icon">
            <i :class="`pi ${item.icon}`"></i>
          </div>
          <div v-if="isHovering" class="item-content">
            <div class="item-label">{{ item.label }}</div>
            <div v-if="item.description" class="item-description">
              {{ item.description }}
            </div>
          </div>
        </div>

        <!-- Expanded submenu (only show on hover) -->
        <transition name="expand">
          <div
            v-if="isHovering && hoveredItemId === item.id && item.children"
            class="submenu"
          >
            <div
              v-for="child in item.children"
              :key="child.id"
              class="submenu-item"
              @click="emit('select-item', child.id)"
            >
              <i v-if="child.icon" :class="`pi ${child.icon}`"></i>
              <span>{{ child.label }}</span>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar, var(--bg-secondary));
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease;
  height: 100%;
  overflow: visible;
  z-index: 100;
  min-width: 80px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  font-size: 1.2rem;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-header:hover {
  background: var(--bg-primary);
}

.sidebar-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  flex: 1;
  overflow-y: auto;
}

.sidebar-item-wrapper {
  position: relative;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  min-height: 50px;
}

.sidebar-item:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.sidebar-item.hovered {
  background: var(--bg-primary);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
}

.item-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.item-description {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Submenu */
.submenu {
  position: absolute;
  left: 80px;
  top: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 101;
  overflow: hidden;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
  font-size: 0.85rem;
  border-left: 3px solid transparent;
}

.submenu-item:hover {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.submenu-item i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
  font-size: 0.9rem;
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Scrollbar */
.sidebar-items::-webkit-scrollbar {
  width: 6px;
}

.sidebar-items::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-items::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.sidebar-items::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Mobile */
@media (max-width: 768px) {
  .dashboard-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .submenu {
    position: fixed;
    left: 80px;
  }
}
</style>
