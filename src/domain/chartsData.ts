import type { ParentGroupedTableRow } from './parentGroupedTable'

/**
 * Risk Matrix data point
 */
export interface RiskMatrixPoint {
  parentCode: string
  parentSubject: string
  riskLevel: 'low' | 'medium' | 'high'
  resultStatus: 'profit' | 'loss' | 'neutral'
  estimatedHours: number
  actualHours: number
  differenceHours: number
  project?: string
  application?: string
}

/**
 * Deviation Distribution bucket
 */
export interface DeviationBucket {
  range: string
  count: number
  percentage: number
  color: string
}

/**
 * Build risk matrix data from grouped rows
 */
export function buildRiskMatrixData(
  rows: ParentGroupedTableRow[]
): RiskMatrixPoint[] {
  return rows.map((row) => ({
    parentCode: row.parentCode,
    parentSubject: row.parentSubject,
    riskLevel: row.riskLevel,
    resultStatus: row.resultStatus,
    estimatedHours: row.estimatedHours,
    actualHours: row.actualHours,
    differenceHours: row.differenceHours,
    project: row.project,
    application: row.application,
  }))
}

/**
 * Build deviation distribution from grouped rows
 */
export function buildDeviationDistribution(
  rows: ParentGroupedTableRow[]
): DeviationBucket[] {
  const buckets = [
    { range: '< -50%', min: -Infinity, max: -50, count: 0, color: '#dc2626' },
    { range: '-50% a -20%', min: -50, max: -20, count: 0, color: '#f97316' },
    { range: '-20% a 0%', min: -20, max: 0, count: 0, color: '#facc15' },
    { range: '0% a 20%', min: 0, max: 20, count: 0, color: '#86efac' },
    { range: '20% a 50%', min: 20, max: 50, count: 0, color: '#22c55e' },
    { range: '> 50%', min: 50, max: Infinity, count: 0, color: '#16a34a' },
  ]

  // Count rows in each bucket
  rows.forEach((row) => {
    const dev = row.deviationPercent
    for (const bucket of buckets) {
      if (dev >= bucket.min && dev < bucket.max) {
        bucket.count++
        break
      }
    }
  })

  // Calculate percentages
  const total = rows.length || 1
  return buckets.map((bucket) => ({
    range: bucket.range,
    count: bucket.count,
    percentage: (bucket.count / total) * 100,
    color: bucket.color,
  }))
}

/**
 * Get risk level numeric value for sorting/positioning
 */
export function getRiskLevelValue(level: string): number {
  if (level === 'high') return 2
  if (level === 'medium') return 1
  return 0
}

/**
 * Get result status numeric value for sorting/positioning
 */
export function getResultStatusValue(status: string): number {
  if (status === 'loss') return -1
  if (status === 'neutral') return 0
  return 1 // profit
}
