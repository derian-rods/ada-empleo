<script setup lang="ts">
import { ref, computed } from "vue";
import FileUpload, { type FileUploadSelectEvent } from "primevue/fileupload";
import Tag from "primevue/tag";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import Button from "primevue/button";
import { useDashboardStore } from "../stores/dashboard";

const store = useDashboardStore();
const showUploadPanel = ref(true);

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

// Check if all CSVs are loaded
const allCsvsLoaded = computed(
  () => store.parentsLoaded && store.childrenLoaded && store.timeEntriesLoaded,
);

// Show errors/warnings even when panel is hidden
const hasIssues = computed(
  () => store.errors.length > 0 || store.warnings.length > 0,
);

// Watch for data clearing to show panel again
const handleShowUploadPanel = () => {
  showUploadPanel.value = true;
};

// Expose function for external calls
defineExpose({
  showUploadPanel: handleShowUploadPanel,
});
</script>

<template>
  <div class="csv-panel">
    <!-- When all CSVs are loaded: Show compact status bar with action buttons -->
    <div v-if="allCsvsLoaded && !showUploadPanel" class="compact-status-bar">
      <div class="status-info">
        <div class="loaded-badge">
          <i class="pi pi-check-circle"></i>
          <span>Datos cargados correctamente</span>
        </div>
      </div>

      <div class="status-actions">
        <Button
          icon="pi pi-upload"
          label="Cargar nuevos datos"
          severity="info"
          text
          rounded
          @click="showUploadPanel = true"
          class="action-btn"
        />
      </div>
    </div>

    <!-- Upload Panel: Show when loading or not all CSVs are loaded -->
    <div v-if="!allCsvsLoaded || showUploadPanel" class="upload-panel">
      <div class="panel-header">
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

      <!-- Close button when panel is shown after data loaded -->
      <div v-if="allCsvsLoaded && showUploadPanel" class="panel-footer">
        <Button
          icon="pi pi-times"
          label="Cerrar"
          severity="secondary"
          text
          rounded
          @click="showUploadPanel = false"
          class="close-btn"
        />
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
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Compact Status Bar (when all CSVs are loaded) */
.compact-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-primary) 100%
  );
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  gap: 1rem;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.loaded-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

.loaded-badge i {
  color: #22c55e;
  font-size: 1.2rem;
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  white-space: nowrap;
}

/* Upload Panel */
.upload-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
  flex-wrap: wrap;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
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

/* Upload Grid */
.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
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

/* Panel Footer */
.panel-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.close-btn {
  white-space: nowrap;
}

/* Alerts Section */
.alerts-section {
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
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
  .compact-status-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-grid {
    grid-template-columns: 1fr;
  }
}
</style>
