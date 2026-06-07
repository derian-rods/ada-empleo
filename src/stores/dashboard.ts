import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Papa from "papaparse";
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  OrphanTimeEntry,
  CalculatedRequest,
  DashboardSummary,
} from "../domain/types";
import {
  normalizeParentRequests,
  normalizeChildRequests,
  normalizeTimeEntries,
} from "../domain/normalizeCsv";
import { buildCalculatedRequests } from "../domain/relationships";
import { calculateDashboardSummary } from "../domain/calculations";
import {
  SOPRA_STERIA_COLLABORATORS,
  assignCompanyToTimeEntries,
  filterTimeEntriesByCompany,
} from "../domain/companies";

export type CsvKind = "parents" | "children" | "timeEntries";

export interface CsvLoadStatus {
  fileName?: string;
  rowsCount: number;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
}

export const useDashboardStore = defineStore("dashboard", () => {
  // Raw normalized data
  const parents = ref<ParentRequest[]>([]);
  const children = ref<ChildRequest[]>([]);
  const timeEntries = ref<TimeEntry[]>([]);

  // Computed results
  const calculatedRequests = ref<CalculatedRequest[]>([]);
  const orphanTimeEntries = ref<OrphanTimeEntry[]>([]);
  const summary = ref<DashboardSummary | null>(null);

  // CSV Load Status
  const csvLoadStatus = ref<Record<CsvKind, CsvLoadStatus>>({
    parents: { status: "idle", rowsCount: 0 },
    children: { status: "idle", rowsCount: 0 },
    timeEntries: { status: "idle", rowsCount: 0 },
  });

  // Status
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);
  const parentsLoaded = ref(false);
  const childrenLoaded = ref(false);
  const timeEntriesLoaded = ref(false);
  const isCalculating = ref(false);

  // Company Filter
  const selectedCompanyFilter = ref<"Sopra Steria" | "Otros" | null>(null);

  const hasData = computed(
    () => parentsLoaded.value && timeEntriesLoaded.value,
  );

  const isProcessingCsv = computed(
    () =>
      csvLoadStatus.value.parents.status === "loading" ||
      csvLoadStatus.value.children.status === "loading" ||
      csvLoadStatus.value.timeEntries.status === "loading",
  );

  const isProcessing = computed(
    () => isProcessingCsv.value || isCalculating.value,
  );

  const allCsvsValid = computed(
    () =>
      csvLoadStatus.value.parents.status === "success" &&
      csvLoadStatus.value.children.status === "success" &&
      csvLoadStatus.value.timeEntries.status === "success",
  );

  const canCalculate = computed(() => allCsvsValid.value);

  // Filtered data by company
  const timeEntriesWithCompany = computed(() => {
    return assignCompanyToTimeEntries(
      timeEntries.value,
      SOPRA_STERIA_COLLABORATORS,
    );
  });

  const filteredTimeEntries = computed(() => {
    if (!selectedCompanyFilter.value) {
      return timeEntriesWithCompany.value;
    }
    return filterTimeEntriesByCompany(
      timeEntriesWithCompany.value,
      selectedCompanyFilter.value,
    );
  });

  const filteredCalculatedRequests = computed(() => {
    if (!selectedCompanyFilter.value) {
      return calculatedRequests.value;
    }
    // Filter calculated requests based on filtered time entries
    const filteredUserSet = new Set(
      filteredTimeEntries.value.map((te) => te.user),
    );
    return calculatedRequests.value.filter((cr) => {
      // Keep request if it has people from the filtered company
      return cr.people.some((person) => filteredUserSet.has(person));
    });
  });

  const filteredSummary = computed(() => {
    if (!summary.value || !selectedCompanyFilter.value) {
      return summary.value;
    }
    // Recalculate summary based on filtered requests
    const filtered = filteredCalculatedRequests.value;
    return calculateDashboardSummary(filtered, orphanTimeEntries.value);
  });

  function parseCsvFile(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          resolve(results.data as Record<string, unknown>[]);
        },
        error: (err: Error) => {
          reject(err);
        },
      });
    });
  }

  // Helper para permitir que la UI se actualice
  function allowUIUpdate(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  // Helper para actualizar estado de CSV sin deprecation warning
  function updateCsvStatus(kind: CsvKind, updates: Partial<CsvLoadStatus>) {
    csvLoadStatus.value[kind] = { ...csvLoadStatus.value[kind], ...updates };
  }

  async function loadParents(file: File) {
    updateCsvStatus("parents", {
      status: "loading",
      fileName: file.name,
      error: undefined,
    });
    errors.value = errors.value.filter((e) => !e.includes("padre"));

    // Permitir que la UI se actualice antes de procesar
    await allowUIUpdate();

    try {
      const rows = await parseCsvFile(file);
      if (!rows.length || !("#" in rows[0])) {
        const error = "Demandas: falta columna #";
        errors.value.push(error);
        updateCsvStatus("parents", { status: "error", error, rowsCount: 0 });
        parentsLoaded.value = false;
        return;
      }

      // Permitir que la UI responda durante la normalización
      await allowUIUpdate();

      parents.value = normalizeParentRequests(rows);
      updateCsvStatus("parents", { rowsCount: rows.length, status: "success" });
      parentsLoaded.value = true;

      // Permitir que la UI se actualice antes de calcular
      await allowUIUpdate();

      await recalculate();
    } catch (e) {
      const error = `Error al cargar demandas: ${e}`;
      errors.value.push(error);
      updateCsvStatus("parents", { status: "error", error, rowsCount: 0 });
      parentsLoaded.value = false;
    }
  }

  async function loadChildren(file: File) {
    updateCsvStatus("children", {
      status: "loading",
      fileName: file.name,
      error: undefined,
    });
    errors.value = errors.value.filter(
      (e) => !e.includes("Órdenes de Trabajo"),
    );

    // Permitir que la UI se actualice antes de procesar
    await allowUIUpdate();

    try {
      const rows = await parseCsvFile(file);
      if (!rows.length || !("#" in rows[0])) {
        const error = "Órdenes de Trabajo: falta columna #";
        errors.value.push(error);
        updateCsvStatus("children", { status: "error", error, rowsCount: 0 });
        childrenLoaded.value = false;
        return;
      }

      // Permitir que la UI responda durante la normalización
      await allowUIUpdate();

      children.value = normalizeChildRequests(rows);
      updateCsvStatus("children", {
        rowsCount: rows.length,
        status: "success",
      });
      childrenLoaded.value = true;

      // Permitir que la UI se actualice antes de calcular
      await allowUIUpdate();

      await recalculate();
    } catch (e) {
      const error = `Error al cargar órdenes de trabajo: ${e}`;
      errors.value.push(error);
      updateCsvStatus("children", { status: "error", error, rowsCount: 0 });
      childrenLoaded.value = false;
    }
  }

  async function loadTimeEntries(file: File) {
    updateCsvStatus("timeEntries", {
      status: "loading",
      fileName: file.name,
      error: undefined,
    });
    errors.value = errors.value.filter((e) => !e.includes("tiempo dedicado"));
    warnings.value = warnings.value.filter(
      (w) => !w.includes("Tiempo dedicado"),
    );

    // Permitir que la UI se actualice antes de procesar
    await allowUIUpdate();

    try {
      const rows = await parseCsvFile(file);
      let hasError = false;
      if (rows.length && !("Horas" in rows[0])) {
        const error = "Tiempo dedicado: falta columna Horas";
        errors.value.push(error);
        hasError = true;
      }
      if (rows.length && !("Petición" in rows[0])) {
        const warning = "Tiempo dedicado: falta columna Petición";
        warnings.value.push(warning);
      }

      // Permitir que la UI responda durante la normalización
      await allowUIUpdate();

      if (hasError) {
        updateCsvStatus("timeEntries", {
          status: "error",
          error: "Tiempo dedicado: falta columna Horas",
          rowsCount: 0,
        });
        timeEntriesLoaded.value = false;
        return;
      }

      timeEntries.value = normalizeTimeEntries(rows);
      updateCsvStatus("timeEntries", {
        rowsCount: rows.length,
        status: "success",
      });
      timeEntriesLoaded.value = true;

      // Permitir que la UI se actualice antes de calcular
      await allowUIUpdate();

      await recalculate();
    } catch (e) {
      const error = `Error al cargar tiempo dedicado: ${e}`;
      errors.value.push(error);
      updateCsvStatus("timeEntries", { status: "error", error, rowsCount: 0 });
      timeEntriesLoaded.value = false;
    }
  }

  async function recalculate() {
    if (!parentsLoaded.value || !timeEntriesLoaded.value) return;

    isCalculating.value = true;

    try {
      // Permitir que la UI se actualice antes de empezar cálculos
      await allowUIUpdate();

      const result = buildCalculatedRequests(
        parents.value,
        children.value,
        timeEntries.value,
      );

      // Permitir que la UI se actualice entre operaciones
      await allowUIUpdate();

      calculatedRequests.value = result.calculatedRequests;
      orphanTimeEntries.value = result.orphanTimeEntries;

      // Permitir que la UI se actualice
      await allowUIUpdate();

      summary.value = calculateDashboardSummary(
        result.calculatedRequests,
        result.orphanTimeEntries,
      );

      // Permitir que la UI se actualice
      await allowUIUpdate();

      // Generate warnings
      warnings.value = [];
      if (result.orphanTimeEntries.length > 0) {
        warnings.value.push(
          `${result.orphanTimeEntries.length} entradas de tiempo huérfanas (sin petición padre)`,
        );
      }
      const zeroEstWithActual = result.calculatedRequests.filter(
        (r) => r.estimatedHours === 0 && r.actualHours > 0,
      );
      if (zeroEstWithActual.length > 0) {
        warnings.value.push(
          `${zeroEstWithActual.length} demandas con 0h estimadas pero horas incurridas > 0`,
        );
      }
    } finally {
      isCalculating.value = false;
    }
  }

  function reset() {
    parents.value = [];
    children.value = [];
    timeEntries.value = [];
    calculatedRequests.value = [];
    orphanTimeEntries.value = [];
    summary.value = null;
    errors.value = [];
    warnings.value = [];
    parentsLoaded.value = false;
    childrenLoaded.value = false;
    timeEntriesLoaded.value = false;
    selectedCompanyFilter.value = null;
    csvLoadStatus.value = {
      parents: { status: "idle", rowsCount: 0 },
      children: { status: "idle", rowsCount: 0 },
      timeEntries: { status: "idle", rowsCount: 0 },
    };
  }

  function setCompanyFilter(company: "Sopra Steria" | "Otros" | null) {
    selectedCompanyFilter.value = company;
  }

  return {
    parents,
    children,
    timeEntries,
    calculatedRequests,
    orphanTimeEntries,
    summary,
    // Filtered data
    filteredTimeEntries,
    filteredCalculatedRequests,
    filteredSummary,
    selectedCompanyFilter,
    errors,
    warnings,
    parentsLoaded,
    childrenLoaded,
    timeEntriesLoaded,
    isCalculating,
    csvLoadStatus,
    hasData,
    isProcessingCsv,
    isProcessing,
    allCsvsValid,
    canCalculate,
    // Actions
    loadParents,
    loadChildren,
    loadTimeEntries,
    reset,
    setCompanyFilter,
  };
});
