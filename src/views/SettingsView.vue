<script setup lang="ts">
// Settings view placeholder
</script>

<template>
  <div class="settings-view">
    <div class="settings-container">
      <div class="icon">
        <i class="pi pi-cog"></i>
      </div>
      <h2>Configuración</h2>
      <p class="subtitle">Estamos ajustando los engranajes...</p>
      <p class="description">
        Esta sección está en desarrollo. Pronto podrás personalizar tu
        experiencia con opciones avanzadas, preferencias de tema, permisos y
        más.
      </p>
      <div class="coming-soon">
        <span class="badge">🚀 Próximamente</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.settings-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem;
  background: var(--surface-ground);
  border-radius: 12px;
  max-width: 500px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 3rem;
  color: var(--color-primary);
  opacity: 0.8;
}

h2 {
  color: var(--text-primary);
  font-size: 1.75rem;
  margin: 0;
}

.subtitle {
  color: var(--color-primary);
  font-size: 1rem;
  font-style: italic;
  margin: 0;
  opacity: 0.9;
}

.description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.coming-soon {
  margin-top: 1rem;
}

.badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--color-primary);
  opacity: 0.8;
}
</style>
