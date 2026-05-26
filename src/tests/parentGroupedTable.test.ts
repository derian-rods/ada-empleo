import { describe, it, expect } from 'vitest'
import {
  buildParentGroupedTableRows,
  filterParentGroupedRows,
} from '../domain/parentGroupedTable'
import {
  buildCalculatedRequests,
} from '../domain/relationships'
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
} from '../domain/types'

// Test fixtures
const parent1: ParentRequest = {
  id: 'p1',
  code: 'P-1000',
  subject: 'Petición padre 1',
  project: 'Proyecto A',
  application: 'App X',
  status: 'Open',
  estimatedHours: 100,
}

const parent2: ParentRequest = {
  id: 'p2',
  code: 'P-2000',
  subject: 'Petición padre 2',
  project: 'Proyecto B',
  application: 'App Y',
  status: 'In Progress',
  estimatedHours: 50,
}

const child1: ChildRequest = {
  id: 'c1',
  code: 'C-1001',
  parentId: 'p1',
  subject: 'Hija 1.1',
  application: 'App X',
  status: 'Open',
  estimatedHours: 40,
}

const child2: ChildRequest = {
  id: 'c2',
  code: 'C-1002',
  parentId: 'p1',
  subject: 'Hija 1.2',
  application: 'App X',
  status: 'Open',
  estimatedHours: 30,
}

const child3: ChildRequest = {
  id: 'c3',
  code: 'C-2001',
  parentId: 'p2',
  subject: 'Hija 2.1',
  application: 'App Y',
  status: 'Open',
  estimatedHours: 25,
}

function makeTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: `te-${Math.random()}`,
    hours: 10,
    ...overrides,
  }
}

describe('buildParentGroupedTableRows', () => {
  it('agrupa hijos dentro del padre correcto', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', user: 'Juan', hours: 5 })
    const te2 = makeTimeEntry({ petitionId: 'c2', user: 'Ana', hours: 8 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].parentCode).toBe('P-1000')
    expect(rows[0].children).toHaveLength(2)
    expect(rows[1].parentCode).toBe('P-2000')
    expect(rows[1].children).toHaveLength(1)
  })

  it('agrupa horas por usuario dentro de una hija', () => {
    const te1 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Juan',
      hours: 5,
      activity: 'Desarrollo',
    })
    const te2 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Ana',
      hours: 8,
      activity: 'Testing',
    })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const child = rows[0].children[0]
    expect(child.userRoleHours).toHaveLength(2)
    expect(child.userRoleHours[0].user).toBe('Juan')
    expect(child.userRoleHours[0].hours).toBe(5)
    expect(child.userRoleHours[1].user).toBe('Ana')
    expect(child.userRoleHours[1].hours).toBe(8)
  })

  it('agrupa horas por usuario y rol', () => {
    const te1 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Juan',
      profiledRole: 'Analyst',
      hours: 5,
    })
    const te2 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Juan',
      profiledRole: 'Developer',
      hours: 3,
    })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const child = rows[0].children[0]
    expect(child.userRoleHours).toHaveLength(2)
    expect(child.userRoleHours[0].role).toBe('Analyst')
    expect(child.userRoleHours[1].role).toBe('Developer')
  })

  it('calcula actualHours desde TimeEntry.hours', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 10 })
    const te2 = makeTimeEntry({ petitionId: 'c1', hours: 15 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const child = rows[0].children[0]
    expect(child.actualHours).toBe(25)
  })

  it('calcula riskLevel high cuando differenceHours < -20', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 100 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const parent = rows[0]
    expect(parent.riskLevel).toBe('high')
  })

  it('calcula riskLevel medium cuando differenceHours entre -20 y -5', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 50 })
    const te2 = makeTimeEntry({ petitionId: 'c2', hours: 30 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2],
      [te1, te2],
      calculatedRequests
    )

    const parent = rows[0]
    // child1+child2 = 40+30=70 est, 50+30=80 actual, diff = 70-80 = -10 (between -20 and -5)
    expect(parent.riskLevel).toBe('medium')
  })

  it('calcula riskLevel low cuando differenceHours > -5', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 30 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const parent = rows[0]
    expect(parent.riskLevel).toBe('low')
  })

  it('no duplica usuarios en agregación padre', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', user: 'Juan', hours: 5 })
    const te2 = makeTimeEntry({ petitionId: 'c2', user: 'Juan', hours: 3 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const parent = rows[0]
    const juanCount = parent.users.filter((u) => u === 'Juan').length
    expect(juanCount).toBe(1)
  })

  it('no duplica roles en agregación padre', () => {
    const te1 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Juan',
      profiledRole: 'Developer',
      hours: 5,
    })
    const te2 = makeTimeEntry({
      petitionId: 'c2',
      user: 'Ana',
      profiledRole: 'Developer',
      hours: 3,
    })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const parent = rows[0]
    const devCount = parent.roles.filter((r) => r === 'Developer').length
    expect(devCount).toBe(1)
  })

  it('usa "Sin usuario" cuando user está vacío', () => {
    const te1 = makeTimeEntry({
      petitionId: 'c1',
      user: undefined,
      hours: 5,
    })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const child = rows[0].children[0]
    expect(child.userRoleHours[0].user).toBe('Sin usuario')
  })

  it('usa "Sin rol" cuando role está vacío', () => {
    const te1 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Juan',
      profiledRole: undefined,
      cauRole: undefined,
      hours: 5,
    })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const child = rows[0].children[0]
    expect(child.userRoleHours[0].role).toBe('Sin rol')
  })
})

describe('filterParentGroupedRows', () => {
  it('filtra por código padre', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 5 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, { parentCode: 'P-1000' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].parentCode).toBe('P-1000')
  })

  it('filtra por asunto padre', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 5 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, {
      parentSubject: 'padre 1',
    })
    expect(filtered).toHaveLength(1)
  })

  it('filtra por usuario', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', user: 'Juan', hours: 5 })
    const te2 = makeTimeEntry({ petitionId: 'c3', user: 'Ana', hours: 3 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, { user: ['Juan'] })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].parentCode).toBe('P-1000')
  })

  it('filtra por rol', () => {
    const te1 = makeTimeEntry({
      petitionId: 'c1',
      user: 'Juan',
      profiledRole: 'Developer',
      hours: 5,
    })
    const te2 = makeTimeEntry({
      petitionId: 'c3',
      user: 'Ana',
      profiledRole: 'Analyst',
      hours: 3,
    })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, { role: ['Developer'] })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].parentCode).toBe('P-1000')
  })

  it('filtra por solo pérdidas', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 100 })
    const te2 = makeTimeEntry({ petitionId: 'c3', hours: 10 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, { onlyLosses: true })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].resultStatus).toBe('loss')
  })

  it('filtra por consumo > 100%', () => {
    const te1 = makeTimeEntry({ petitionId: 'c3', hours: 60 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent2],
      [child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent2],
      [child3],
      [te1],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, {
      onlyConsumptionOver100: true,
    })
    // parent2 = 50 est, 60 actual → consumption = 60/50 * 100 = 120% > 100%
    expect(filtered.length).toBeGreaterThanOrEqual(1)
  })

  it('filtra por desviación > 20%', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 80 })
    const te2 = makeTimeEntry({ petitionId: 'c3', hours: 10 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, {
      onlyDeviationOver20: true,
    })
    expect(filtered.length).toBeGreaterThanOrEqual(1)
  })

  it('no rompe con tiempo huérfano', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 5 })
    const te2 = makeTimeEntry({ hours: 10 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1, te2],
      calculatedRequests
    )

    expect(rows).toBeDefined()
    expect(rows).toHaveLength(2)
  })

  it('calcula consumption percent correctamente', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 40 })
    const te2 = makeTimeEntry({ petitionId: 'c2', hours: 30 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1],
      [child1, child2],
      [te1, te2]
    )

    const rows = buildParentGroupedTableRows(
      [parent1],
      [child1, child2],
      [te1, te2],
      calculatedRequests
    )

    const parent = rows[0]
    // child1+child2 = 40+30=70 est, 40+30=70 actual, consumption = 70/70 * 100 = 100%
    expect(parent.consumptionPercent).toBe(100)
  })

  it('filtra por código hija', () => {
    const te1 = makeTimeEntry({ petitionId: 'c1', hours: 5 })

    const { calculatedRequests } = buildCalculatedRequests(
      [parent1, parent2],
      [child1, child2, child3],
      [te1]
    )

    const rows = buildParentGroupedTableRows(
      [parent1, parent2],
      [child1, child2, child3],
      [te1],
      calculatedRequests
    )

    const filtered = filterParentGroupedRows(rows, { childCode: 'C-1001' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].children).toHaveLength(1)
  })
})
