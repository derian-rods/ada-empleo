import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
} from './types'

export interface UserTableRow {
  user: string
  totalHours: number
  parentRequestsCount: number
  childRequestsCount: number
  projects: string[]
  parentProjects: string[]
  applications: string[]
  activities: string[]
  roles: string[]
  profitRelatedHours: number
  lossRelatedHours: number
}

export interface ChildRequestTableRow {
  childId: string
  childCode?: string
  childSubject: string
  parentId?: string
  parentCode?: string
  parentSubject?: string
  project?: string
  parentProject?: string
  application?: string
  status?: string
  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  resultStatus?: 'profit' | 'loss' | 'neutral'
  people: string[]
  peopleCount: number
  activities: string[]
  roles: string[]
}

export interface ParentRequestTableRow {
  parentId: string
  parentCode: string
  parentSubject: string
  project?: string
  application?: string
  status?: string
  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  resultStatus: 'profit' | 'loss' | 'neutral'
  childrenCount: number
  timeEntriesCount: number
  people: string[]
  peopleCount: number
  activities: string[]
  roles: string[]
}

export interface ParentProjectGroupTableRow {
  parentProject: string
  parentRequestsCount: number
  childRequestsCount: number
  timeEntriesCount: number
  estimatedHours: number
  actualHours: number
  differenceHours: number
  deviationPercent: number
  resultStatus: 'profit' | 'loss' | 'neutral'
  people: string[]
  peopleCount: number
  roles: string[]
  activities: string[]
  applications: string[]
}

export function buildUserTableRows(
  calculatedRequests: CalculatedRequest[],
  children: ChildRequest[],
  timeEntries: TimeEntry[]
): UserTableRow[] {
  const userMap = new Map<string, UserTableRow>()

  for (const te of timeEntries) {
    const user = te.user || 'Sin usuario'
    const existing = userMap.get(user) || {
      user,
      totalHours: 0,
      parentRequestsCount: 0,
      childRequestsCount: 0,
      projects: [],
      parentProjects: [],
      applications: [],
      activities: [],
      roles: [],
      profitRelatedHours: 0,
      lossRelatedHours: 0,
    }

    existing.totalHours += te.hours

    // Resolve which parent this time entry belongs to
    let resolvedParentId: string | undefined
    if (te.petitionId) {
      const child = children.find((c) => c.id === te.petitionId)
      if (child?.parentId) resolvedParentId = child.parentId
    }
    if (!resolvedParentId && te.parentTaskId) {
      const child = children.find((c) => c.id === te.parentTaskId)
      if (child?.parentId) resolvedParentId = child.parentId
    }

    // Add to profit/loss buckets
    if (resolvedParentId) {
      const calc = calculatedRequests.find((c) => c.parentId === resolvedParentId)
      if (calc) {
        if (calc.resultStatus === 'profit') {
          existing.profitRelatedHours += te.hours
        } else if (calc.resultStatus === 'loss') {
          existing.lossRelatedHours += te.hours
        }
      }
    }

    // Collect metadata
    if (te.project) existing.projects.push(te.project)
    if (te.activity) existing.activities.push(te.activity)
    if (te.profiledRole) existing.roles.push(te.profiledRole)
    if (te.cauRole) existing.roles.push(te.cauRole)
    if (te.application) existing.applications.push(te.application)

    userMap.set(user, existing)
  }

  // Build parent/child counts and deduplicate arrays
  const result = Array.from(userMap.values()).map((row) => ({
    ...row,
    projects: [...new Set(row.projects)],
    parentProjects: [...new Set(row.parentProjects)],
    applications: [...new Set(row.applications)],
    activities: [...new Set(row.activities)],
    roles: [...new Set(row.roles)],
    parentRequestsCount: calculatedRequests.filter((cr) =>
      cr.people.includes(row.user.replace('Sin usuario', ''))
    ).length,
    childRequestsCount: children.filter((c) =>
      timeEntries.some((te) => te.petitionId === c.id && (te.user || 'Sin usuario') === row.user)
    ).length,
  }))

  return result.sort((a, b) => b.totalHours - a.totalHours)
}

export function buildChildRequestTableRows(
  parents: ParentRequest[],
  children: ChildRequest[],
  _calculatedRequests: CalculatedRequest[],
  timeEntries: TimeEntry[]
): ChildRequestTableRow[] {
  const parentMap = new Map(parents.map((p) => [p.id, p]))

  return children.map((child) => {
    const parentId = child.parentId
    const parent = parentId ? parentMap.get(parentId) : undefined

    const childEntries = timeEntries.filter((te) => te.petitionId === child.id)
    const actualHours = childEntries.reduce((sum, te) => sum + te.hours, 0)

    const differenceHours = child.estimatedHours - actualHours
    const deviationPercent =
      child.estimatedHours > 0
        ? ((actualHours - child.estimatedHours) / child.estimatedHours) * 100
        : 0

    const resultStatus: 'profit' | 'loss' | 'neutral' =
      differenceHours > 0 ? 'profit' : differenceHours < 0 ? 'loss' : 'neutral'

    const people = [...new Set(childEntries.map((te) => te.user).filter(Boolean) as string[])]
    const activities = [...new Set(childEntries.map((te) => te.activity).filter(Boolean) as string[])]
    const roles = [
      ...new Set(
        childEntries.flatMap((te) => [te.profiledRole, te.cauRole]).filter(Boolean) as string[]
      ),
    ]

    return {
      childId: child.id,
      childCode: child.code,
      childSubject: child.subject,
      parentId,
      parentCode: parent?.code,
      parentSubject: parent?.subject,
      project: child.project || 'Sin proyecto',
      parentProject: parent?.project || 'Sin proyecto padre',
      application: child.application || 'Sin app',
      status: child.status,
      estimatedHours: child.estimatedHours,
      actualHours,
      differenceHours,
      deviationPercent,
      resultStatus,
      people,
      peopleCount: people.length,
      activities,
      roles,
    }
  })
}

export function buildParentRequestTableRows(
  calculatedRequests: CalculatedRequest[]
): ParentRequestTableRow[] {
  return calculatedRequests.map((calc) => ({
    parentId: calc.parentId,
    parentCode: calc.code,
    parentSubject: calc.subject,
    project: calc.project || 'Sin proyecto',
    application: calc.application || 'Sin app',
    status: calc.status,
    estimatedHours: calc.estimatedHours,
    actualHours: calc.actualHours,
    differenceHours: calc.differenceHours,
    deviationPercent: calc.deviationPercent,
    resultStatus: calc.resultStatus,
    childrenCount: calc.childrenCount,
    timeEntriesCount: calc.timeEntriesCount,
    people: calc.people,
    peopleCount: calc.peopleCount,
    activities: calc.activities,
    roles: calc.roles,
  }))
}

export function buildParentProjectGroupTableRows(
  _parents: ParentRequest[],
  children: ChildRequest[],
  calculatedRequests: CalculatedRequest[],
  _timeEntries: TimeEntry[]
): ParentProjectGroupTableRow[] {
  const projectMap = new Map<string, ParentProjectGroupTableRow>()

  for (const calc of calculatedRequests) {
    const project = calc.project || 'Sin proyecto padre'

    const existing = projectMap.get(project) || {
      parentProject: project,
      parentRequestsCount: 0,
      childRequestsCount: 0,
      timeEntriesCount: 0,
      estimatedHours: 0,
      actualHours: 0,
      differenceHours: 0,
      deviationPercent: 0,
      resultStatus: 'neutral' as const,
      people: [],
      peopleCount: 0,
      roles: [],
      activities: [],
      applications: [],
    }

    existing.parentRequestsCount += 1
    existing.estimatedHours += calc.estimatedHours
    existing.actualHours += calc.actualHours
    existing.timeEntriesCount += calc.timeEntriesCount

    // Aggregate people, roles, activities, applications
    for (const person of calc.people) {
      if (!existing.people.includes(person)) existing.people.push(person)
    }
    for (const role of calc.roles) {
      if (!existing.roles.includes(role)) existing.roles.push(role)
    }
    for (const activity of calc.activities) {
      if (!existing.activities.includes(activity)) existing.activities.push(activity)
    }
    for (const app of calc.applications) {
      if (!existing.applications.includes(app)) existing.applications.push(app)
    }

    projectMap.set(project, existing)
  }

  // Count children per project
  for (const [project, row] of projectMap.entries()) {
    const projectParents = calculatedRequests
      .filter((c) => (c.project || 'Sin proyecto padre') === project)
      .map((c) => c.parentId)
    row.childRequestsCount = children.filter((c) =>
      projectParents.includes(c.parentId || '')
    ).length
  }

  // Recalculate difference and deviation for each project
  const result = Array.from(projectMap.values()).map((row) => {
    const diff = row.estimatedHours - row.actualHours
    const dev =
      row.estimatedHours > 0
        ? ((row.actualHours - row.estimatedHours) / row.estimatedHours) * 100
        : 0
    const status: 'profit' | 'loss' | 'neutral' =
      diff > 0 ? 'profit' : diff < 0 ? 'loss' : 'neutral'

    return {
      ...row,
      differenceHours: diff,
      deviationPercent: dev,
      resultStatus: status,
      peopleCount: row.people.length,
    }
  })

  return result.sort((a, b) => a.differenceHours - b.differenceHours)
}
