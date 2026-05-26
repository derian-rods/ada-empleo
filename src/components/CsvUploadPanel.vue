<script setup lang="ts">
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()

function onParentSelect(event: FileUploadSelectEvent) {
  const file = event.files[0]
  if (file) store.loadParents(file)
}

function onChildSelect(event: FileUploadSelectEvent) {
  const file = event.files[0]
  if (file) store.loadChildren(file)
}

function onTimeSelect(event: FileUploadSelectEvent) {
  const file = event.files[0]
  if (file) store.loadTimeEntries(file)
}

function getProcessingCsvName(): string {
  if (store.csvLoadStatus.parents.status === 'loading') {
    return 'Peticiones padre'
  }
  if (store.csvLoadStatus.children.status === 'loading') {
    return 'Peticiones hijas'
  }
  if (store.csvLoadStatus.timeEntries.status === 'loading') {
    return 'Tiempo dedicado'
  }
  return ''
}
</script>

<template>
  <Card>
    <template #title>Carga de CSV</template>
    <template #content>
      <div class="upload-grid">
        <div class="upload-item">
          <label>Peticiones padre <Tag v-if="store.parentsLoaded" severity="success" value="OK" /></label>
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            choose-label="Seleccionar"
            :disabled="store.isProcessingCsv"
            @select="onParentSelect"
          />
        </div>

        <div class="upload-item">
          <label>Peticiones hijas <Tag v-if="store.childrenLoaded" severity="success" value="OK" /></label>
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            choose-label="Seleccionar"
            :disabled="store.isProcessingCsv"
            @select="onChildSelect"
          />
        </div>

        <div class="upload-item">
          <label>Tiempo dedicado <Tag v-if="store.timeEntriesLoaded" severity="success" value="OK" /></label>
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            choose-label="Seleccionar"
            :disabled="store.isProcessingCsv"
            @select="onTimeSelect"
          />
        </div>
      </div>

      <div v-if="store.errors.length" class="messages">
        <Message v-for="(err, i) in store.errors" :key="i" severity="error" :closable="false">
          {{ err }}
        </Message>
      </div>

      <div v-if="store.warnings.length" class="messages">
        <Message v-for="(warn, i) in store.warnings" :key="i" severity="warn" :closable="false">
          {{ warn }}
        </Message>
      </div>

      <!-- Global Processing Overlay -->
      <div v-if="store.isProcessingCsv" class="processing-overlay">
        <div class="processing-content">
          <ProgressSpinner
            stroke-width="2"
            fill="var(--surface-ground)"
            style="width: 50px; height: 50px"
          />
          <p>Procesando: <strong>{{ getProcessingCsvName() }}</strong></p>
          <p class="text-muted">Contando filas y validando estructura...</p>
          <p class="text-muted">Por favor espera, no cierres esta ventana</p>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
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
}
.messages {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: auto;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.processing-content p {
  margin: 0;
  color: var(--text-color);
  text-align: center;
}

.processing-content strong {
  color: var(--primary-color);
}

.text-muted {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}
</style>

