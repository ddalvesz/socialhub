import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://pynjnxqmhiwsrehhfxxx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bmpueHFtaGl3c3JlaGhmeHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMjI3NCwiZXhwIjoyMDk0Mjc4Mjc0fQ.hFXhW6sVvQac26g8tuavrGSPpk8_vdPK6wexg0XgM0U'
const CSV_PATH = 'C:\\Users\\Notebook\\Documents\\claude_pastas\\SOCIAL\\CALENDÁRIO\\supabase_import\\Cópia de CRONOGRAMA STORIES - GOCASE - SUPABASE.csv'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const today = '2026-06-09'

// Parse date: "01/01/2026" or "07/06" (sem ano → 2026) → "2026-01-01"
function parseDate(val) {
  val = val.trim()
  const parts = val.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  if (parts.length === 2) {
    const [d, m] = parts
    return `2026-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  return null
}

// Map STATUS csv → db
function mapStatus(csvStatus, isoDate) {
  const s = (csvStatus ?? '').trim().toLowerCase()
  if (s === 'feito') return 'feito'
  if (s === 'não postado' || s === 'nao postado') return 'nao_postado'
  if (s === 'em andamento') return 'em_andamento'
  // vazio: inferir pela data
  if (isoDate && isoDate < today) return 'feito'
  return 'nao_iniciado'
}

// Normaliza link: "-" ou vazio → null
function cleanLink(val) {
  val = (val ?? '').trim()
  return val === '' || val === '-' ? null : val
}

// Parse CSV com suporte a campos entre aspas
function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const result = []
  for (const line of lines) {
    if (!line.trim()) continue
    const fields = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQuote = !inQuote }
      else if (c === ',' && !inQuote) { fields.push(cur); cur = '' }
      else { cur += c }
    }
    fields.push(cur)
    result.push(fields)
  }
  return result
}

async function run() {
  const csvContent = readFileSync(CSV_PATH, 'utf8')
  const rows = parseCSV(csvContent)
  const header = rows[0] // Data,Hora,Dia da semana,UTM,Produto foco,Categoria,STATUS,LINK DA MÍDIA,LINK UTM,RASTREIO RECEITA,RECEITA
  const dataRows = rows.slice(1)

  const records = []
  let skipped = 0

  for (const cols of dataRows) {
    const dateRaw      = cols[0]?.trim() ?? ''
    const horaRaw      = cols[1]?.trim() ?? ''
    const diaSemana    = cols[2]?.trim() ?? ''
    const utm          = cols[3]?.trim() ?? ''
    const produto      = cols[4]?.trim() ?? ''
    const categoria    = cols[5]?.trim() ?? ''
    const statusRaw    = cols[6]?.trim() ?? ''
    const linkMidia    = cleanLink(cols[7])
    const linkUtm      = cleanLink(cols[8])
    const rastreio     = cols[9]?.trim() ?? ''
    const receitaRaw   = cols[10]?.trim() ?? ''

    if (!dateRaw) { skipped++; continue }

    const isoDate = parseDate(dateRaw)
    if (!isoDate) { skipped++; continue }

    // Pular linhas completamente vazias (sem produto, sem categoria, sem link)
    if (!produto && !categoria && !linkUtm) { skipped++; continue }

    // rastreio vazio ou terminando em _ sem produto → pular
    if (!rastreio || rastreio.endsWith('_')) {
      if (!produto && !categoria) { skipped++; continue }
    }

    const hora = parseInt(horaRaw) || 18
    const status = mapStatus(statusRaw, isoDate)
    const receita = receitaRaw && receitaRaw !== '' ? parseFloat(receitaRaw.replace(/[R$\s.]/g, '').replace(',', '.')) : null

    records.push({
      date:             isoDate,
      hora,
      dia_semana:       diaSemana,
      utm,
      produto,
      categoria,
      status,
      link_midia:       linkMidia,
      link_utm:         linkUtm,
      rastreio_receita: rastreio || null,
      receita:          isNaN(receita) ? null : receita,
      origem:           'csv_import',
    })
  }

  // Deduplicar por rastreio_receita (manter último encontrado)
  const seen = new Map()
  for (const r of records) {
    const key = r.rastreio_receita ?? `${r.date}_${r.hora}_${r.produto}`
    seen.set(key, r)
  }
  const deduped = [...seen.values()]

  console.log(`\n📋 CSV lido: ${dataRows.length} linhas | ${records.length} registros válidos | ${skipped} pulados (vazios)`)
  console.log(`   Após deduplicação: ${deduped.length} únicos (${records.length - deduped.length} duplicatas removidas)`)
  const allRecords = deduped

  // Upsert em lotes de 100
  const BATCH = 100
  let inseridas = 0, atualizadas = 0, erros = []

  for (let i = 0; i < allRecords.length; i += BATCH) {
    const batch = allRecords.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('stories')
      .upsert(batch, { onConflict: 'rastreio_receita', ignoreDuplicates: false })
      .select('id')

    if (error) {
      erros.push(`Lote ${i}-${i+BATCH}: ${error.message}`)
    } else {
      inseridas += data?.length ?? batch.length
    }

    process.stdout.write(`\r  Progresso: ${Math.min(i + BATCH, allRecords.length)}/${allRecords.length}`)
  }

  console.log('\n')
  console.log('=== RESULTADO ===')
  console.log(`✅ Upserted: ${inseridas} registros`)
  if (erros.length) {
    console.log(`❌ Erros (${erros.length}):`)
    erros.forEach(e => console.log('  ' + e))
  } else {
    console.log('✅ Sem erros')
  }
}

run().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
