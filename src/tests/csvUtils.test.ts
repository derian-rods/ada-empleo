import { describe, it, expect } from 'vitest'
import { parseCsvNumber, extractIssueId, cleanText } from '../domain/csvUtils'

describe('parseCsvNumber', () => {
  it('parses 8,00 as 8', () => {
    expect(parseCsvNumber('8,00')).toBe(8)
  })

  it('parses 0,50 as 0.5', () => {
    expect(parseCsvNumber('0,50')).toBe(0.5)
  })

  it('parses 1.234,50 as 1234.5', () => {
    expect(parseCsvNumber('1.234,50')).toBe(1234.5)
  })

  it('parses empty string as 0', () => {
    expect(parseCsvNumber('')).toBe(0)
  })

  it('parses null as 0', () => {
    expect(parseCsvNumber(null)).toBe(0)
  })

  it('parses undefined as 0', () => {
    expect(parseCsvNumber(undefined)).toBe(0)
  })

  it('parses invalid string as 0', () => {
    expect(parseCsvNumber('abc')).toBe(0)
  })

  it('parses integer without comma', () => {
    expect(parseCsvNumber('100')).toBe(100)
  })
})

describe('extractIssueId', () => {
  it('extracts from OT #1078795: text', () => {
    expect(extractIssueId('OT #1078795: MTTO.EVO texto')).toBe('1078795')
  })

  it('extracts from Tarea #1080770: text', () => {
    expect(extractIssueId('Tarea #1080770: Texto')).toBe('1080770')
  })

  it('extracts from OT SFW #1079245: text', () => {
    expect(extractIssueId('OT SFW #1079245: Texto')).toBe('1079245')
  })

  it('extracts from plain number 1082818', () => {
    expect(extractIssueId('1082818')).toBe('1082818')
  })

  it('extracts from 1082818.0', () => {
    expect(extractIssueId('1082818.0')).toBe('1082818')
  })

  it('returns undefined for empty string', () => {
    expect(extractIssueId('')).toBeUndefined()
  })

  it('returns undefined for null', () => {
    expect(extractIssueId(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(extractIssueId(undefined)).toBeUndefined()
  })
})

describe('cleanText', () => {
  it('trims whitespace', () => {
    expect(cleanText('  hello  ')).toBe('hello')
  })

  it('returns undefined for empty string', () => {
    expect(cleanText('')).toBeUndefined()
  })

  it('returns undefined for whitespace-only', () => {
    expect(cleanText('   ')).toBeUndefined()
  })

  it('returns undefined for null', () => {
    expect(cleanText(null)).toBeUndefined()
  })

  it('preserves accents', () => {
    expect(cleanText('Versión prevista')).toBe('Versión prevista')
  })
})
