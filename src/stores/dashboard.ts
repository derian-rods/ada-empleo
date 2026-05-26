import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Papa from 'papaparse'
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  OrphanTimeEntry,
  CalculatedRequest,
  DashboardSummary,
} from '../domain/types'
import {
  normalizeParentRequests,
  normalizeChildRequests,
  normalizeTimeEntries,
} from '../domain/normalizeCsv'
import { buildCalculatedRequests } from '../domain/relationships'
import { calculateDashboardSummary } from '../domain/calculations'

export type CsvKind = 'parents' | 'children' | 'timeEntries'

export interface CsvLoadStatus {
  fileName?: string
  rowsCount: number
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
}

export const useDashboardStore = defineStore('dashboard', () => {
  // Raw normalized data
  const parents = ref<ParentRequest[]>([])
  const children = ref<ChildRequest[]>([])
  const timeEntries = ref<TimeEntry[]>([])

  // Computed results
  const calculatedRequests = ref<CalculatedRequest[]>([])
  const orphanTimeEntries = ref<OrphanTimeEntry[]>([])
  const summary = ref<DashboardSummary | null>(null)

  // CSV Load Status
  const csvLoadStatus = ref<Record<CsvKind, CsvLoadStatus>>({
    parents: { status: 'idle', rowsCount: 0 },
    children: { status: 'idle', rowsCount: 0 },
    timeEntries: { status: 'idle', rowsCount: 0 },
  })

  // Status
  const errors = ref<string[]>([])
  const warnings = ref<string[]>([])
  const parentsLoaded = ref(false)
  const childrenLoaded = ref(false)
  const timeEntriesLoaded = ref(false)

  const hasData = computed(
    () => parentsLoaded.value && timeEntriesLoaded.value
  )

  const isProcessingCsv = computed(
    () =>
      csvLoadStatus.value.parents.status === 'loading' ||
      csvLoadStatus.value.children.status === 'loading' ||
      csvLoadStatus.value.timeEntries.status === 'loading'
  )

  const allCsvsValid = computed(
    () =>
      csvLoadStatus.value.parents.status === 'success' &&
      csvLoadStatus.value.children.status === 'success' &&
      csvLoadStatus.value.timeEntries.status === 'success'
  )

  const canCalculate = computed(() => allCsvsValid.value)

  function parseCsvFile(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          resolve(results.data as Record<string, unknown>[])
        },
        error: (err: Error) => {
          reject(err)
        },
      })
    })
  }

  // Helper para permitir que la UI se actualice
  function allowUIUpdate(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
  }

  async function loadParents(file: File) {
    csvLoadStatus.value.parents.status = 'loading'
    csvLoadStatus.value.parents.fileName = file.name
    csvLoadStatus.value.parents.error = undefined
    errors.value = errors.value.filter((e) => !e.includes('padre'))

    // Permitir que la UI se actualice antes de procesar
    await allowUIUpdate()

    try {
      const rows = await parseCsvFile(file)
      if (!rows.length || !('#' in rows[0])) {
        const error = 'Peticiones padre: falta columna #'
        errors.value.push(error)
        csvLoadStatus.value.parents.status = 'error'
        csvLoadStatus.value.parents.error = error
        csvLoadStatus.value.parents.rowsCount = 0
        parentsLoaded.value = false
        return
      }

      // Permitir que la UI responda durante la normalización
      await allowUIUpdate()

      parents.value = normalizeParentRequests(rows)
      csvLoadStatus.value.parents.rowsCount = rows.length
      csvLoadStatus.value.parents.status = 'success'
      parentsLoaded.value = true

      // Permitir que la UI se actualice antes de calcular
      await allowUIUpdate()

      await recalculate()
    } catch (e) {
      const error = `Error al cargar peticiones padre: ${e}`
      errors.value.push(error)
      csvLoadStatus.value.parents.status = 'error'
      csvLoadStatus.value.parents.error = error
      csvLoadStatus.value.parents.rowsCount = 0
      parentsLoaded.value = false
    }
  }

  async function loadChildren(file: File) {
    csvLoadStatus.value.children.status = 'loading'
    csvLoadStatus.value.children.fileName = file.name
    csvLoadStatus.value.children.error = undefined
    errors.value = errors.value.filter((e) => !e.includes('hijas'))

    // Permitir que la UI se actualice antes de procesar
    await allowUIUpdate()

    try {
      const rows = await parseCsvFile(file)
      if (!rows.length || !('#' in rows[0])) {
        const error = 'Peticiones hijas: falta columna #'
        errors.value.push(error)
        csvLoadStatus.value.children.status = 'error'
        csvLoadStatus.value.children.error = error
        csvLoadStatus.value.children.rowsCount = 0
        childrenLoaded.value = false
        return
      }

      // Permitir que la UI responda durante la normalización
      await allowUIUpdate()

      children.value = normalizeChildRequests(rows)
      csvLoadStatus.value.children.rowsCount = rows.length
      csvLoadStatus.value.children.status = 'success'
      childrenLoaded.value = true

      // Permitir que la UI se actualice antes de calcular
      await allowUIUpdate()

      await recalculate()
    } catch (e) {
      const error = `Error al cargar peticiones hijas: ${e}`
      errors.value.push(error)
      csvLoadStatus.value.children.status = 'error'
      csvLoadStatus.value.children.error = error
      csvLoadStatus.value.children.rowsCount = 0
      childrenLoaded.value = false
    }
  }

  async function loadTimeEntries(file: File) {
    csvLoadStatus.value.timeEntries.status = 'loading'
    csvLoadStatus.value.timeEntries.fileName = file.name
    csvLoadStatus.value.timeEntries.error = undefined
    errors.value = errors.value.filter((e) => !e.includes('tiempo dedicado'))
    warnings.value = warnings.value.filter(
      (w) => !w.includes('Tiempo dedicado')
    )

    // Permitir que la UI se actualice antes de procesar
    await allowUIUpdate()

    try {
      const rows = await parseCsvFile(file)
      let hasError = false
      if (rows.length && !('Horas' in rows[0])) {
        const error = 'Tiempo dedicado: falta columna Horas'
        errors.value.push(error)
        hasError = true
      }
      if (rows.length && !('Petición' in rows[0])) {
        const warning = 'Tiempo dedicado: falta columna Petición'
        warnings.value.push(warning)
      }

      // Permitir que la UI responda durante la normalización
      await allowUIUpdate()

      if (hasError) {
        csvLoadStatus.value.timeEntries.status = 'error'
        csvLoadStatus.value.timeEntries.error =
          'Tiempo dedicado: falta columna Horas'
        csvLoadStatus.value.timeEntries.rowsCount = 0
        timeEntriesLoaded.value = false
        return
      }

      timeEntries.value = normalizeTimeEntries(rows)
      csvLoadStatus.value.timeEntries.rowsCount = rows.length
      csvLoadStatus.value.timeEntries.status = 'success'
      timeEntriesLoaded.value = true

      // Permitir que la UI se actualice antes de calcular
      await allowUIUpdate()

      await recalculate()
    } catch (e) {
      const error = `Error al cargar tiempo dedicado: ${e}`
      errors.value.push(error)
      csvLoadStatus.value.timeEntries.status = 'error'
      csvLoadStatus.value.timeEntries.error = error
      csvLoadStatus.value.timeEntries.rowsCount = 0
       timeEntriesLoaded.value = false
    }
  }

  async function recalculate() {
    if (!parentsLoaded.value || !timeEntriesLoaded.value) return

    // Permitir que la UI se actualice antes de empezar cálculos
    await allowUIUpdate()

    const result = buildCalculatedRequests(
      parents.value,
      children.value,
      timeEntries.value
    )

    // Permitir que la UI se actualice entre operaciones
    await allowUIUpdate()

    calculatedRequests.value = result.calculatedRequests
    orphanTimeEntries.value = result.orphanTimeEntries

    // Permitir que la UI se actualice
    await allowUIUpdate()

    summary.value = calculateDashboardSummary(
      result.calculatedRequests,
      result.orphanTimeEntries
    )

    // Permitir que la UI se actualice
    await allowUIUpdate()

    // Generate warnings
    warnings.value = []
    if (result.orphanTimeEntries.length > 0) {
      warnings.value.push(
        `${result.orphanTimeEntries.length} entradas de tiempo huérfanas (sin petición padre)`
      )
    }
    const zeroEstWithActual = result.calculatedRequests.filter(
      (r) => r.estimatedHours === 0 && r.actualHours > 0
    )
    if (zeroEstWithActual.length > 0) {
      warnings.value.push(
        `${zeroEstWithActual.length} peticiones con 0h estimadas pero horas reales > 0`
      )
    }
  }

  function reset() {
    parents.value = []
    children.value = []
    timeEntries.value = []
    calculatedRequests.value = []
    orphanTimeEntries.value = []
    summary.value = null
    errors.value = []
    warnings.value = []
    parentsLoaded.value = false
    childrenLoaded.value = false
    timeEntriesLoaded.value = false
    csvLoadStatus.value = {
      parents: { status: 'idle', rowsCount: 0 },
      children: { status: 'idle', rowsCount: 0 },
      timeEntries: { status: 'idle', rowsCount: 0 },
    }
  }

  return {
    parents,
    children,
    timeEntries,
    calculatedRequests,
    orphanTimeEntries,
    summary,
    errors,
    warnings,
    parentsLoaded,
    childrenLoaded,
    timeEntriesLoaded,
    csvLoadStatus,
    hasData,
    isProcessingCsv,
    allCsvsValid,
    canCalculate,
    loadParents,
    loadChildren,
    loadTimeEntries,
    reset,
  }
})
