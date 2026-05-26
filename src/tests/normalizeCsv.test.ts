import { describe, it, expect } from 'vitest'
import {
  normalizeParentRequests,
  normalizeChildRequests,
  normalizeTimeEntries,
} from '../domain/normalizeCsv'

describe('normalizeParentRequests', () => {
  it('normalizes a parent request with basic fields', () => {
    const rows = [
      {
        '#': '1000',
        Proyecto: 'Proyecto A',
        Asunto: 'Petición principal',
        Estado: 'Abierta',
        'Total de Tiempo Estimado': '100,00',
        'Tiempo dedicado': '50,00',
      },
    ]
    const result = normalizeParentRequests(rows)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1000')
    expect(result[0].subject).toBe('Petición principal')
    expect(result[0].estimatedHours).toBe(100)
    expect(result[0].project).toBe('Proyecto A')
  })

  it('uses Tiempo estimado as fallback', () => {
    const rows = [{ '#': '1001', Asunto: 'Test', 'Tiempo estimado': '50,00' }]
    const result = normalizeParentRequests(rows)
    expect(result[0].estimatedHours).toBe(50)
  })

  it('skips rows without #', () => {
    const rows = [{ Asunto: 'No ID' }]
    expect(normalizeParentRequests(rows)).toHaveLength(0)
  })

  it('extracts parentId from Tarea padre', () => {
    const rows = [{ '#': '1002', 'Tarea padre': 'OT #999: Texto' }]
    const result = normalizeParentRequests(rows)
    expect(result[0].parentId).toBe('999')
  })
})

describe('normalizeChildRequests', () => {
  it('uses profile hours sum when available', () => {
    const rows = [
      {
        '#': '2000',
        'Tarea padre': '1000',
        Asunto: 'Hija',
        'Horas JP': '10,00',
        'Horas CS': '20,00',
        'Horas AF': '5,00',
        'Horas AS / ES': '0,00',
        'Horas AP / TS': '0,00',
        'Horas P': '0,00',
        'Total de Tiempo Estimado': '0,00',
      },
    ]
    const result = normalizeChildRequests(rows)
    expect(result[0].estimatedHours).toBe(35)
  })

  it('falls back to Total de Tiempo Estimado when profiles are 0', () => {
    const rows = [
      {
        '#': '2001',
        'Tarea padre': '1000',
        Asunto: 'Hija 2',
        'Horas JP': '0,00',
        'Horas CS': '0,00',
        'Horas AF': '0,00',
        'Horas AS / ES': '0,00',
        'Horas AP / TS': '0,00',
        'Horas P': '0,00',
        'Total de Tiempo Estimado': '80,00',
      },
    ]
    const result = normalizeChildRequests(rows)
    expect(result[0].estimatedHours).toBe(80)
  })

  it('extracts parentId from Tarea padre', () => {
    const rows = [{ '#': '2002', 'Tarea padre': 'Tarea #1000: Principal' }]
    const result = normalizeChildRequests(rows)
    expect(result[0].parentId).toBe('1000')
  })
})

describe('normalizeTimeEntries', () => {
  it('normalizes a time entry with hours', () => {
    const rows = [
      {
        Proyecto: 'Proyecto A',
        Fecha: '2024-01-15',
        Usuario: 'Juan',
        Petición: 'OT #2000: Hija',
        'Tarea padre': 'OT #1000: Padre',
        Horas: '4,50',
        Actividad: 'Desarrollo',
        'Perfil (perfilado)': 'Analista',
      },
    ]
    const result = normalizeTimeEntries(rows)
    expect(result).toHaveLength(1)
    expect(result[0].hours).toBe(4.5)
    expect(result[0].petitionId).toBe('2000')
    expect(result[0].parentTaskId).toBe('1000')
    expect(result[0].user).toBe('Juan')
    expect(result[0].profiledRole).toBe('Analista')
  })

  it('normalizes hours to 0 when empty', () => {
    const rows = [{ Horas: '' }]
    const result = normalizeTimeEntries(rows)
    expect(result[0].hours).toBe(0)
  })

  it('extracts petitionId from plain number', () => {
    const rows = [{ Petición: '2000', Horas: '1,00' }]
    const result = normalizeTimeEntries(rows)
    expect(result[0].petitionId).toBe('2000')
  })
})
