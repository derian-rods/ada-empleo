<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import type { CompanyCollaborator } from "../../../domain/companies";

interface Props {
  visible: boolean;
  collaborators: CompanyCollaborator[];
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "save", collaborators: CompanyCollaborator[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const confirm = useConfirm();
const toast = useToast();

// State
const localCollaborators = ref<CompanyCollaborator[]>([...props.collaborators]);
const editingCollaborator = ref<CompanyCollaborator | null>(null);
const showForm = ref(false);
const searchTerm = ref("");

watch(
  () => [props.visible, props.collaborators] as const,
  ([visible]) => {
    if (visible) {
      localCollaborators.value = [...props.collaborators];
    }
  },
);

// Form state
const formData = ref<{
  name: string;
  profile: string;
  company: string;
}>({
  name: "",
  profile: "",
  company: "Sopra Steria",
});

// Available profiles
const profileOptions = [
  { label: "Sin rol asignado", value: "Sin rol asignado" },
  { label: "Gestor de proyecto (GP)", value: "Gestor de proyecto (GP)" },
  { label: "Consultor digital (CD)", value: "Consultor digital (CD)" },
  { label: "Analista de sistemas (AS)", value: "Analista de sistemas (AS)" },
  { label: "Desarrollador (DE)", value: "Desarrollador (DE)" },
];

// Company options
const companyOptions = [
  { label: "Sopra Steria", value: "Sopra Steria" },
  { label: "Otros", value: "Otros" },
];

// Computed
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0;
});

const displayedCollaborators = computed(() => {
  const search = searchTerm.value.trim().toLowerCase();
  if (!search) return localCollaborators.value;

  return localCollaborators.value.filter((collaborator) => {
    return [collaborator.name, collaborator.profile, collaborator.company]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(search));
  });
});

// Métodos
function openForm(collaborator?: CompanyCollaborator) {
  if (collaborator) {
    editingCollaborator.value = collaborator;
    formData.value = {
      name: collaborator.name,
      profile: collaborator.profile,
      company: collaborator.company,
    };
  } else {
    editingCollaborator.value = null;
    formData.value = {
      name: "",
      profile: "",
      company: "Sopra Steria",
    };
  }
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingCollaborator.value = null;
  formData.value = {
    name: "",
    profile: "",
    company: "Sopra Steria",
  };
}

function saveCollaborator() {
  if (!isFormValid.value) {
    toast.add({
      severity: "warn",
      summary: "Validación",
      detail: "Por favor completa todos los campos",
      life: 3000,
    });
    return;
  }

  if (editingCollaborator.value) {
    // Editar colaborador existente
    const index = localCollaborators.value.findIndex(
      (c) => c.id === editingCollaborator.value!.id,
    );
    if (index !== -1) {
      localCollaborators.value[index] = {
        ...editingCollaborator.value,
        name: formData.value.name.trim(),
        profile: formData.value.profile || "Sin rol asignado",
        company: formData.value.company,
      };
    }
    toast.add({
      severity: "success",
      summary: "Éxito",
      detail: "Colaborador actualizado",
      life: 3000,
    });
  } else {
    // Crear nuevo colaborador
    const newCollaborator: CompanyCollaborator = {
      id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.value.name.trim(),
      profile: formData.value.profile || "Sin rol asignado",
      company: formData.value.company,
    };
    localCollaborators.value.push(newCollaborator);
    toast.add({
      severity: "success",
      summary: "Éxito",
      detail: "Colaborador creado",
      life: 3000,
    });
  }

  closeForm();
}

function deleteCollaborator(collaborator: CompanyCollaborator) {
  confirm.require({
    message: `¿Eliminar a ${collaborator.name}?`,
    header: "Confirmar eliminación",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      const index = localCollaborators.value.findIndex(
        (c) => c.id === collaborator.id,
      );
      if (index !== -1) {
        localCollaborators.value.splice(index, 1);
      }
      toast.add({
        severity: "success",
        summary: "Éxito",
        detail: "Colaborador eliminado",
        life: 3000,
      });
    },
  });
}

function saveAndClose() {
  emit("save", localCollaborators.value);
  emit("update:visible", false);
  toast.add({
    severity: "success",
    summary: "Éxito",
    detail: "Cambios guardados",
    life: 3000,
  });
}

function onHide() {
  emit("update:visible", false);
  closeForm();
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="onHide"
    header="Gestión de Colaboradores"
    :modal="true"
    :style="{ width: '90vw', height: '90vh' }"
    :maximizable="true"
    class="p-fluid"
  >
    <div class="modal-content">
      <!-- Toolbar -->
      <div class="toolbar">
        <Button
          label="Añadir colaborador"
          icon="pi pi-plus"
          @click="openForm()"
          severity="success"
          size="small"
        />
        <InputText
          v-model="searchTerm"
          placeholder="Buscar colaborador, rol o empresa"
          class="search-input"
        />
      </div>

      <!-- Tabla de colaboradores -->
      <DataTable
        :value="displayedCollaborators"
        striped-rows
        removable-sort
        size="small"
        scrollable
        scrollHeight="500px"
        class="collaborators-crud-table"
      >
        <!-- Nombre -->
        <Column field="name" header="Nombre" sortable style="width: 250px">
          <template #body="{ data }">
            {{ data.name }}
          </template>
        </Column>

        <!-- Perfil -->
        <Column field="profile" header="Perfil" sortable style="width: 180px">
          <template #body="{ data }">
            {{ data.profile }}
          </template>
        </Column>

        <!-- Empresa -->
        <Column field="company" header="Empresa" sortable style="width: 150px">
          <template #body="{ data }">
            {{ data.company }}
          </template>
        </Column>

        <!-- Acciones -->
        <Column header="Acciones" style="width: 150px" :exportable="false">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              @click="openForm(data)"
              rounded
              outlined
              severity="info"
              size="small"
              class="mr-2"
            />
            <Button
              icon="pi pi-trash"
              @click="deleteCollaborator(data)"
              rounded
              outlined
              severity="danger"
              size="small"
            />
          </template>
        </Column>

        <template #empty>
          <div class="empty-state">Sin colaboradores</div>
        </template>
      </DataTable>

      <!-- Subdiálogo: Formulario de edición/creación -->
      <Dialog
        v-model:visible="showForm"
        :header="
          editingCollaborator ? 'Editar colaborador' : 'Nuevo colaborador'
        "
        :modal="true"
        :style="{ width: '500px' }"
        class="p-fluid"
      >
        <div class="form-group">
          <label for="name">Nombre *</label>
          <InputText
            id="name"
            v-model="formData.name"
            placeholder="Ej: Juan Pérez García"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="profile">Perfil *</label>
          <Dropdown
            id="profile"
            v-model="formData.profile"
            :options="profileOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona perfil"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="company">Empresa *</label>
          <Dropdown
            id="company"
            v-model="formData.company"
            :options="companyOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona empresa"
            class="w-full"
          />
        </div>

        <template #footer>
          <Button label="Cancelar" icon="pi pi-times" @click="closeForm" text />
          <Button
            label="Guardar"
            icon="pi pi-check"
            @click="saveCollaborator"
            :disabled="!isFormValid"
            autofocus
          />
        </template>
      </Dialog>
    </div>

    <!-- Footer del modal principal -->
    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" @click="onHide" text />
      <Button
        label="Guardar cambios"
        icon="pi pi-check"
        @click="saveAndClose"
        severity="success"
      />
    </template>
  </Dialog>

  <!-- ConfirmDialog para eliminaciones -->
  <ConfirmDialog />
</template>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  max-width: 24rem;
}

.collaborators-crud-table {
  width: 100%;
  flex: 1;
  overflow: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.w-full {
  width: 100%;
}

.mr-2 {
  margin-right: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}
</style>
