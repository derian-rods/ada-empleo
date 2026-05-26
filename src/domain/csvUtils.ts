/**
 * Parse a CSV number value with Spanish format (comma decimal, dot thousands).
 * Examples: "8,00" -> 8, "1.234,50" -> 1234.5, "" -> 0
 */
export function parseCsvNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  const str = String(value).trim()
  if (str === '') return 0

  // Remove thousand separators (dots) and convert decimal comma to dot
  const normalized = str.replace(/\./g, '').replace(',', '.')
  const result = parseFloat(normalized)
  return Number.isNaN(result) ? 0 : result
}

/**
 * Extract an issue ID from a raw Redmine-like string.
 * Examples: "OT #1078795: text" -> "1078795", "1082818.0" -> "1082818"
 */
export function extractIssueId(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const str = String(value).trim()
  if (str === '') return undefined

  // Try to match #ID pattern
  const hashMatch = str.match(/#(\d+)/)
  if (hashMatch) return hashMatch[1]

  // Try plain number (possibly with .0)
  const numMatch = str.match(/^(\d+)(?:\.0+)?$/)
  if (numMatch) return numMatch[1]

  return undefined
}

/**
 * Clean text: trim and return undefined for empty strings.
 */
export function cleanText(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const str = String(value).trim()
  return str === '' ? undefined : str
}
