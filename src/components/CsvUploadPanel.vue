<script setup lang="ts">
import { ref, computed } from "vue";
import FileUpload, { type FileUploadSelectEvent } from "primevue/fileupload";
import Tag from "primevue/tag";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import Button from "primevue/button";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const isExpanded = ref(false);

function onParentSelect(event: FileUploadSelectEvent) {
  const file = event.files[0];
  if (file) store.loadParents(file);
}

function onChildSelect(event: FileUploadSelectEvent) {
  const file = event.files[0];
  if (file) store.loadChildren(file);
}

function onTimeSelect(event: FileUploadSelectEvent) {
  const file = event.files[0];
  if (file) store.loadTimeEntries(file);
}

function getProcessingMessage(): string {
  if (store.csvLoadStatus.parents.status === "loading") {
    return "Peticiones padre";
  }
  if (store.csvLoadStatus.children.status === "loading") {
    return "Peticiones hijas";
  }
  if (store.csvLoadStatus.timeEntries.status === "loading") {
    return "Tiempo dedicado";
  }
  if (store.isCalculating) {
    return "Calculando...";
  }
  return "";
}

function getStatusSeverity(loaded: boolean): "success" | "secondary" {
  return loaded ? "success" : "secondary";
}

function getStatusLabel(loaded: boolean): string {
  return loaded ? "OK" : "Pendiente";
}

// Show errors/warnings even when collapsed
const hasIssues = computed(
  () => store.errors.length > 0 || store.warnings.length > 0,
);
</script>

<template>
  <div class="csv-panel">
    <!-- Compact Header / Status Bar -->
    <div class="compact-header">
      <div class="status-info">
        <h3>Gestión de CSVs</h3>
        <div class="status-badges">
          <span
            v-for="(item, idx) in [
              { name: 'Padres', loaded: store.parentsLoaded },
              { name: 'Hijas', loaded: store.childrenLoaded },
              { name: 'Tiempo', loaded: store.timeEntriesLoaded },
            ]"
            :key="idx"
            class="status-item"
          >
            <span class="status-text">{{ item.name }}</span>
            <Tag
              :severity="getStatusSeverity(item.loaded)"
              :value="getStatusLabel(item.loaded)"
              style="font-size: 0.75rem; padding: 0.25rem 0.5rem"
            />
          </span>
        </div>
      </div>

      <!-- Toggle and Action Buttons -->
      <div class="header-actions">
        <Button
          :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          severity="secondary"
          text
          rounded
          @click="isExpanded = !isExpanded"
          class="toggle-btn"
          v-tooltip="isExpanded ? 'Cerrar' : 'Expandir'"
        />
      </div>
    </div>

    <!-- Expanded Content -->
    <div v-show="isExpanded" class="expanded-content">
      <div class="upload-grid">
        <div class="upload-item">
          <label>
            Peticiones padre
            <Tag
              v-if="store.parentsLoaded"
              severity="success"
              value="OK"
              style="font-size: 0.75rem; padding: 0.25rem 0.5rem"
            />
          </label>
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            choose-label="Seleccionar"
            :disabled="store.isProcessing"
            @select="onParentSelect"
          />
        </div>

        <div class="upload-item">
          <label>
            Peticiones hijas
            <Tag
              v-if="store.childrenLoaded"
              severity="success"
              value="OK"
              style="font-size: 0.75rem; padding: 0.25rem 0.5rem"
            />
          </label>
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            choose-label="Seleccionar"
            :disabled="store.isProcessing"
            @select="onChildSelect"
          />
        </div>

        <div class="upload-item">
          <label>
            Tiempo dedicado
            <Tag
              v-if="store.timeEntriesLoaded"
              severity="success"
              value="OK"
              style="font-size: 0.75rem; padding: 0.25rem 0.5rem"
            />
          </label>
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            choose-label="Seleccionar"
            :disabled="store.isProcessing"
            @select="onTimeSelect"
          />
        </div>
      </div>
    </div>

    <!-- Alerts Section (Always Visible if there are issues) -->
    <div v-if="hasIssues" class="alerts-section">
      <div v-if="store.errors.length" class="messages">
        <Message
          v-for="(err, i) in store.errors"
          :key="`error-${i}`"
          severity="error"
          :closable="false"
        >
          {{ err }}
        </Message>
      </div>

      <div v-if="store.warnings.length" class="messages">
        <Message
          v-for="(warn, i) in store.warnings"
          :key="`warn-${i}`"
          severity="warn"
          :closable="false"
        >
          {{ warn }}
        </Message>
      </div>
    </div>

    <!-- Global Processing Overlay -->
    <div v-if="store.isProcessing" class="processing-overlay">
      <div class="processing-content">
        <ProgressSpinner
          stroke-width="2"
          fill="var(--surface-ground)"
          style="width: 50px; height: 50px"
        />
        <p>
          Procesando: <strong>{{ getProcessingMessage() }}</strong>
        </p>
        <p class="text-muted">Por favor espera, no cierres esta ventana</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.csv-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Compact Header */
.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.status-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.status-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.status-text {
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  flex-shrink: 0;
}

/* Expanded Content */
.expanded-content {
  padding: 1rem;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.upload-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-item label {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  flex-wrap: wrap;
}

/* Alerts Section */
.alerts-section {
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.messages :deep(.p-message) {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

/* Processing Overlay */
.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: auto;
  backdrop-filter: blur(2px);
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
}

.processing-content p {
  margin: 0;
  color: var(--text-primary);
  text-align: center;
}

.processing-content strong {
  color: var(--color-primary);
  font-weight: 700;
}

.text-muted {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .compact-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-info {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .upload-grid {
    grid-template-columns: 1fr;
  }
}
</style>
