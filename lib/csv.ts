import type { Product } from './schemas.js'

// Deterministic CSV parsing for the setup step, no AI involved. Expects a
// header row with at minimum "name" and "priceCents" (or "price", treated as
// dollars and converted); "available" and "compatibility" are optional. This
// is a real ingestion path in its own right, not a stand-in for AI structuring.

export interface CsvParseError {
  row: number
  message: string
}

export interface CsvParseResult {
  products: Array<Omit<Product, 'id'>>
  errors: CsvParseError[]
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV split: handles quoted fields with commas, not escaped quotes
  // inside quotes. Sufficient for a business owner exporting from a
  // spreadsheet; not a general-purpose CSV parser.
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

export function parseProductsCsv(csvText: string): CsvParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { products: [], errors: [{ row: 0, message: 'The file is empty.' }] }
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const nameIdx = header.indexOf('name')
  const priceCentsIdx = header.indexOf('pricecents')
  const priceIdx = header.indexOf('price')
  const availableIdx = header.indexOf('available')
  const compatibilityIdx = header.indexOf('compatibility')
  const descriptionIdx = header.indexOf('description')

  if (nameIdx === -1 || (priceCentsIdx === -1 && priceIdx === -1)) {
    return {
      products: [],
      errors: [
        {
          row: 0,
          message: 'Header row must include "name" and either "priceCents" or "price".',
        },
      ],
    }
  }

  const products: Array<Omit<Product, 'id'>> = []
  const errors: CsvParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1 // 1-indexed, header is row 1
    const cells = splitCsvLine(lines[i])
    const name = cells[nameIdx]?.trim()
    if (!name) {
      errors.push({ row: rowNum, message: 'Missing product name.' })
      continue
    }

    let priceCents: number
    if (priceCentsIdx !== -1 && cells[priceCentsIdx]) {
      priceCents = Math.round(Number(cells[priceCentsIdx]))
    } else if (priceIdx !== -1 && cells[priceIdx]) {
      priceCents = Math.round(Number(cells[priceIdx]) * 100)
    } else {
      errors.push({ row: rowNum, message: `"${name}": missing price.` })
      continue
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      errors.push({ row: rowNum, message: `"${name}": invalid price.` })
      continue
    }

    const availableRaw = availableIdx !== -1 ? cells[availableIdx]?.trim().toLowerCase() : undefined
    const available = availableRaw === undefined || availableRaw === '' ? true : !['false', 'no', '0'].includes(availableRaw)

    products.push({
      name,
      priceCents,
      currency: 'USD',
      available,
      compatibility: compatibilityIdx !== -1 ? cells[compatibilityIdx]?.trim() || null : null,
      description: descriptionIdx !== -1 ? cells[descriptionIdx]?.trim() || null : null,
    })
  }

  return { products, errors }
}
