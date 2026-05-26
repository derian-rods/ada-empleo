// csvWorker.ts - Web Worker para parseo de CSV

interface CsvWorkerMessage {
  type: 'parse'
  csvKind: string
  fileContent: string
}

interface CsvWorkerResponse {
  type: 'complete' | 'error'
  csvKind: string
  data?: Record<string, unknown>[]
  error?: string
  rowCount?: number
}

// Parsear CSV localmente usando lógica simple
function parseCSV(content: string, delimiter = ';'): Record<string, unknown>[] {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return []

  // Parsear header
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine, delimiter)

  // Parsear filas
  const data: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values = parseCSVLine(line, delimiter)
    const row: Record<string, unknown> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    data.push(row)
  }

  return data
}

function parseCSVLine(line: string, delimiter: string): string[] {
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

// Listener para mensajes del main thread
self.onmessage = async (event: MessageEvent<CsvWorkerMessage>) => {
  const { type, csvKind, fileContent } = event.data

  if (type === 'parse') {
    try {
      const data = parseCSV(fileContent)
      const response: CsvWorkerResponse = {
        type: 'complete',
        csvKind,
        data,
        rowCount: data.length,
      }
      self.postMessage(response)
    } catch (error) {
      const response: CsvWorkerResponse = {
        type: 'error',
        csvKind,
        error: String(error),
      }
      self.postMessage(response)
    }
  }
}

export {}
