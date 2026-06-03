<script setup lang="ts">
import { computed } from "vue";
import ProgressSpinner from "primevue/progressspinner";
import { useNavigationStore } from "../stores/navigation";

const navigationStore = useNavigationStore();

const isNavigating = computed(() => navigationStore.isNavigating);
</script>

<template>
  <transition name="fade">
    <div v-if="isNavigating" class="loading-overlay">
      <div class="loading-content">
        <ProgressSpinner
          stroke-width="4"
          fill="var(--surface-ground)"
          animation-duration=".8s"
        />
        <p>Cargando...</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.loading-content p {
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
