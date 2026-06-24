import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://pynjnxqmhiwsrehhfxxx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bmpueHFtaGl3c3JlaGhmeHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMjI3NCwiZXhwIjoyMDk0Mjc4Mjc0fQ.hFXhW6sVvQac26g8tuavrGSPpk8_vdPK6wexg0XgM0U'
const CSV_PATH = 'C:\\Users\\Notebook\\Documents\\claude_pastas\\SOCIAL\\CALENDÁRIO\\supabase_import\\calendario - stories.csv'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const today = '2026-06-22'

// Parse "dd/mm/yyyy" → "yyyy-mm-dd"
function parseDate(val) {
  val = (val ?? '').trim()
  const parts = val.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  return null
}

// STATUS csv → db: 'Postado' → 'postado', 'Não postado' → 'nao_postado', else → 'pendente'
function mapStatus(csvStatus, isoDate) {
  const s = (csvStatus ?? '').trim().toLowerCase()
  if (s === 'postado') return 'postado'
  if (s === 'não postado' || s === 'nao postado') return 'nao_postado'
  // vazio: inferir pela data
  if (isoDate && isoDate < today) return 'postado'
  return 'pendente'
}

// Normaliza "1.234,56" ou "1234,56" → número
function parseReceita(val) {
  val = (val ?? '').trim()
  if (!val || val === '0,00' || val === '-') return null
  // remove pontos de milhar e troca vírgula por ponto
  const num = parseFloat(val.replace(/\./g, '').replace(',', '.'))
  return isNaN(num) || num === 0 ? null : num
}

function clean(val) {
  val = (val ?? '').trim()
  return val === '' || val === '-' ? null : val
}

// Parse CSV respeitando campos com vírgula dentro de aspas
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const fields = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
      else cur += ch
    }
    fields.push(cur)
    const row = {}
    headers.forEach((h, i) => { row[h] = (fields[i] ?? '').trim().replace(/^"|"$/g, '') })
    return row
  })
}

async function main() {
  const text = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCSV(text)

  console.log(`Lidos ${rows.length} registros do CSV`)

  const MARCAS_BELEZA = ['barbours', 'kokeshi', 'lescent']
  const belezaRows = rows.filter(r => MARCAS_BELEZA.includes((r['MARCA'] ?? '').trim().toLowerCase()))
  console.log(`Marcas de beleza: ${belezaRows.length} registros`)

  const records = belezaRows.map(r => {
    const isoDate = parseDate(r['Data'])
    const cod = (r['Cod'] ?? '').trim()
    return {
      date:             isoDate,
      hora:             parseInt(r['Hora'], 10) || 12,
      cod,
      page:             (r['Page'] ?? '').trim(),
      merchant:         (r['Merchant'] ?? '').trim(),
      status:           mapStatus(r['STATUS'], isoDate),
      link_conteudo:    clean(r['LINK CONTEÚDO']),
      link_cta:         clean(r['LINK CTA']),
      rastreio_receita: cod || null,
      receita:          parseReceita(r['RASTREIO RECEITA']),
      marca:            (r['MARCA'] ?? '').trim().toLowerCase(),
      origem:           'csv_import',
    }
  }).filter(r => r.date && r.marca)

  console.log(`Inserindo ${records.length} registros válidos...`)

  // Upsert em lotes de 100 — usa cod como chave natural (pode haver duplicatas)
  const BATCH = 100
  let inserted = 0, errors = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error } = await supabase.from('stories_beleza').insert(batch)
    if (error) {
      console.error(`Erro no lote ${i / BATCH + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      process.stdout.write(`\r${inserted}/${records.length}...`)
    }
  }

  console.log(`\nConcluído: ${inserted} inseridos, ${errors} com erro.`)
}

main().catch(console.error)
