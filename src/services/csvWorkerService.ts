// csvWorkerService.ts - Servicio para comunicación con Web Worker

interface ParseResult {
  data: Record<string, unknown>[]
  rowCount: number
}

class CsvWorkerService {
  private worker: Worker | null = null
  private pending = new Map<string, {
    resolve: (value: ParseResult) => void
    reject: (reason?: unknown) => void
  }>()

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      // Importar el worker con ?worker para Vite
      const CsvWorker = new Worker(
        new URL('../workers/csvWorker.ts', import.meta.url),
        { type: 'module' }
      )

      CsvWorker.onmessage = (event: MessageEvent) => {
        const { type, csvKind, data, error, rowCount } = event.data

        const pending = this.pending.get(csvKind)
        if (!pending) return

        if (type === 'complete') {
          pending.resolve({ data: data || [], rowCount: rowCount || 0 })
        } else if (type === 'error') {
          pending.reject(new Error(error))
        }

        this.pending.delete(csvKind)
      }

      CsvWorker.onerror = (error: ErrorEvent) => {
        console.error('Worker error:', error)
        // Rechazar todas las pendientes en caso de error del worker
        for (const pending of this.pending.values()) {
          pending.reject(error)
        }
        this.pending.clear()
      }

      this.worker = CsvWorker
    } catch (error) {
      console.warn('Web Worker not available, falling back to main thread', error)
    }
  }

  async parseCSV(csvKind: string, fileContent: string): Promise<ParseResult> {
    // Si no hay worker, usar fallback
    if (!this.worker) {
      return this.parseCSVFallback(fileContent)
    }

    return new Promise((resolve, reject) => {
      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        this.pending.delete(csvKind)
        reject(new Error('CSV parsing timeout'))
      }, 30000)

      this.pending.set(csvKind, {
        resolve: (result) => {
          clearTimeout(timeout)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })

      this.worker!.postMessage({
        type: 'parse',
        csvKind,
        fileContent,
      })
    })
  }

  private parseCSVFallback(content: string): ParseResult {
    const lines = content.trim().split('\n')
    if (lines.length === 0) return { data: [], rowCount: 0 }

    const headerLine = lines[0]
    const headers = this.parseCSVLine(headerLine, ';')

    const data: Record<string, unknown>[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      const values = this.parseCSVLine(line, ';')
      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      data.push(row)
    }

    return { data, rowCount: data.length }
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        insideQuotes = !insideQuotes
        continue
      }

      if (char === delimiter && !insideQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pending.clear()
  }
}

export const csvWorkerService = new CsvWorkerService()
