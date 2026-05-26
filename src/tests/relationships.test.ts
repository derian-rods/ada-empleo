import { describe, it, expect } from 'vitest'
import { buildCalculatedRequests } from '../domain/relationships'
import type { ParentRequest, ChildRequest, TimeEntry } from '../domain/types'

const parent: ParentRequest = {
  id: '1000',
  code: '1000',
  subject: 'Parent request',
  estimatedHours: 100,
}

const child: ChildRequest = {
  id: '2000',
  code: '2000',
  parentId: '1000',
  subject: 'Child request',
  estimatedHours: 50,
}

function makeTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'te-1',
    hours: 10,
    ...overrides,
  }
}

describe('buildCalculatedRequests', () => {
  it('relates time entry to child via petitionId', () => {
    const te = makeTimeEntry({ petitionId: '2000', user: 'Ana' })
    const { calculatedRequests, orphanTimeEntries } = buildCalculatedRequests(
      [parent],
      [child],
      [te]
    )
    expect(calculatedRequests[0].actualHours).toBe(10)
    expect(calculatedRequests[0].timeEntriesCount).toBe(1)
    expect(orphanTimeEntries).toHaveLength(0)
  })

  it('relates time entry to parent directly via petitionId', () => {
    const te = makeTimeEntry({ petitionId: '1000' })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [child],
      [te]
    )
    expect(calculatedRequests[0].actualHours).toBe(10)
  })

  it('relates time entry to parent via parentTaskId', () => {
    const te = makeTimeEntry({ parentTaskId: '1000' })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [child],
      [te]
    )
    expect(calculatedRequests[0].actualHours).toBe(10)
  })

  it('relates time entry to child via parentTaskId', () => {
    const te = makeTimeEntry({ parentTaskId: '2000' })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [child],
      [te]
    )
    expect(calculatedRequests[0].actualHours).toBe(10)
  })

  it('marks orphan time entry when no relation found', () => {
    const te = makeTimeEntry({ petitionId: '9999', parentTaskId: '8888' })
    const { orphanTimeEntries } = buildCalculatedRequests(
      [parent],
      [child],
      [te]
    )
    expect(orphanTimeEntries).toHaveLength(1)
    expect(orphanTimeEntries[0].orphanReason).toContain('Could not resolve')
  })

  it('uses children estimated hours when available', () => {
    const te = makeTimeEntry({ petitionId: '2000', hours: 30 })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [child],
      [te]
    )
    // child has 50 estimated, parent has 100, should use child's 50
    expect(calculatedRequests[0].estimatedHours).toBe(50)
  })

  it('falls back to parent estimated hours when no children', () => {
    const te = makeTimeEntry({ petitionId: '1000', hours: 30 })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [],
      [te]
    )
    expect(calculatedRequests[0].estimatedHours).toBe(100)
  })

  it('calculates profit correctly', () => {
    const te = makeTimeEntry({ petitionId: '1000', hours: 80 })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [],
      [te]
    )
    expect(calculatedRequests[0].differenceHours).toBe(20)
    expect(calculatedRequests[0].resultStatus).toBe('profit')
  })

  it('calculates loss correctly', () => {
    const te = makeTimeEntry({ petitionId: '1000', hours: 130 })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [],
      [te]
    )
    expect(calculatedRequests[0].differenceHours).toBe(-30)
    expect(calculatedRequests[0].resultStatus).toBe('loss')
  })

  it('calculates neutral correctly', () => {
    const te = makeTimeEntry({ petitionId: '1000', hours: 100 })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [],
      [te]
    )
    expect(calculatedRequests[0].differenceHours).toBe(0)
    expect(calculatedRequests[0].resultStatus).toBe('neutral')
  })

  it('avoids division by zero for deviation', () => {
    const zeroParent: ParentRequest = { ...parent, estimatedHours: 0 }
    const te = makeTimeEntry({ petitionId: '1000', hours: 10 })
    const { calculatedRequests } = buildCalculatedRequests(
      [zeroParent],
      [],
      [te]
    )
    expect(calculatedRequests[0].deviationPercent).toBe(0)
  })

  it('aggregates people from time entries', () => {
    const te1 = makeTimeEntry({ id: 'te-1', petitionId: '2000', user: 'Ana' })
    const te2 = makeTimeEntry({ id: 'te-2', petitionId: '2000', user: 'Pedro' })
    const te3 = makeTimeEntry({ id: 'te-3', petitionId: '2000', user: 'Ana' })
    const { calculatedRequests } = buildCalculatedRequests(
      [parent],
      [child],
      [te1, te2, te3]
    )
    expect(calculatedRequests[0].people).toEqual(['Ana', 'Pedro'])
    expect(calculatedRequests[0].peopleCount).toBe(2)
  })
})
