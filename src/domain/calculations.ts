import type {
  CalculatedRequest,
  OrphanTimeEntry,
  DashboardSummary,
} from './types'

export function calculateDashboardSummary(
  calculatedRequests: CalculatedRequest[],
  orphanTimeEntries: OrphanTimeEntry[]
): DashboardSummary {
  const totalEstimatedHours = calculatedRequests.reduce(
    (sum, r) => sum + r.estimatedHours,
    0
  )
  const totalActualHours = calculatedRequests.reduce(
    (sum, r) => sum + r.actualHours,
    0
  )
  const totalDifferenceHours = totalEstimatedHours - totalActualHours

  const requestsWithDeviation = calculatedRequests.filter(
    (r) => r.estimatedHours > 0
  )
  const averageDeviationPercent =
    requestsWithDeviation.length > 0
      ? requestsWithDeviation.reduce((sum, r) => sum + r.deviationPercent, 0) /
        requestsWithDeviation.length
      : 0

  const allPeople = new Set(calculatedRequests.flatMap((r) => r.people))
  const allApplications = new Set(
    calculatedRequests.flatMap((r) => r.applications)
  )

  return {
    totalEstimatedHours,
    totalActualHours,
    totalDifferenceHours,
    averageDeviationPercent,
    profitableRequests: calculatedRequests.filter(
      (r) => r.resultStatus === 'profit'
    ).length,
    lossRequests: calculatedRequests.filter((r) => r.resultStatus === 'loss')
      .length,
    neutralRequests: calculatedRequests.filter(
      (r) => r.resultStatus === 'neutral'
    ).length,
    orphanTimeEntries: orphanTimeEntries.length,
    totalPeople: allPeople.size,
    totalApplications: allApplications.size,
  }
}
