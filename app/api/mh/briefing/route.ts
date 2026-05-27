import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const PASTA_DOCS_ID = process.env.GOOGLE_DRIVE_PASTA_DOCS_ID!

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SA_EMAIL,
    key: process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
  })
}

interface VideoData {
  hook: string
  referencia: string
  produto: string
  audio: string
  obs: string
  prazo: string
}

// ─── Encontra ou cria o doc "Pautas CREATOR" ─────────────────
async function getOrCreateDoc(drive: ReturnType<typeof google.drive>, docs: ReturnType<typeof google.docs>, creator: string): Promise<{ docId: string; isNew: boolean }> {
  const nomeDoc = `Pautas ${creator}`

  const res = await drive.files.list({
    q: `'${PASTA_DOCS_ID}' in parents and name='${nomeDoc}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })

  if (res.data.files && res.data.files.length > 0) {
    return { docId: res.data.files[0].id!, isNew: false }
  }

  // Cria novo doc
  const created = await docs.documents.create({ requestBody: { title: nomeDoc } })
  const docId = created.data.documentId!

  // Move para a pasta correta
  await drive.files.update({
    fileId: docId,
    addParents: PASTA_DOCS_ID,
    removeParents: 'root',
    fields: 'id, parents',
  })

  return { docId, isNew: true }
}

// ─── Monta as requests de inserção de um bloco de semana ─────
// Estratégia: inserir tudo no índice 1 em ordem reversa à ordem final desejada.
// Cada insertText/insertTable ao índice 1 empurra o conteúdo anterior para baixo,
// resultando na ordem correta sem precisar rastrear índices pós-tabela.
//
// Ordem desejada (top→bottom):
//   H2 semana → [VÍDEO 01 H3 → tabela → \n] → [VÍDEO 02 H3 → tabela → \n] → separador
//
// Portanto inserimos na ordem inversa:
//   1. separador  2. \n + tabela + H3 (último vídeo)  ...  N. H2 semana
function buildInsertRequests(semanaLabel: string, videos: VideoData[]): object[] {
  const GRAY = { red: 0.8, green: 0.8, blue: 0.8 }
  const IDX = 1
  const requests: object[] = []

  // 1. Separador (ficará no final do bloco)
  const sepText = '─────────────────────────────────────────\n'
  requests.push({ insertText: { location: { index: IDX }, text: sepText } })
  requests.push({
    updateTextStyle: {
      range: { startIndex: IDX, endIndex: IDX + sepText.length - 1 },
      textStyle: { foregroundColor: { color: { rgbColor: GRAY } } },
      fields: 'foregroundColor',
    },
  })

  // 2. Vídeos em ordem inversa (último vídeo inserido primeiro ao idx 1)
  for (let vi = videos.length - 1; vi >= 0; vi--) {
    const numStr = String(vi + 1).padStart(2, '0')

    // Parágrafo vazio após tabela
    requests.push({ insertText: { location: { index: IDX }, text: '\n' } })

    // Tabela 6x2 (índices reais preenchidos depois em fillTableCells)
    requests.push({ insertTable: { location: { index: IDX }, rows: 6, columns: 2 } })

    // H3 VÍDEO NN
    const h3 = `VÍDEO ${numStr}\n`
    requests.push({ insertText: { location: { index: IDX }, text: h3 } })
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: IDX, endIndex: IDX + h3.length },
        paragraphStyle: { namedStyleType: 'HEADING_3' },
        fields: 'namedStyleType',
      },
    })
  }

  // 3. H2 da semana (inserido por último → ficará no topo)
  const h2 = `📅 ${semanaLabel}\n`
  requests.push({ insertText: { location: { index: IDX }, text: h2 } })
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: IDX, endIndex: IDX + h2.length },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType',
    },
  })

  return requests
}

// ─── Preenche as células da tabela após criação ───────────────
async function fillTableCells(docs: ReturnType<typeof google.docs>, docId: string, semanaLabel: string, videos: VideoData[]) {
  // Relê o doc para achar os índices reais das tabelas inseridas
  const doc = await docs.documents.get({ documentId: docId })
  const body = doc.data.body!.content!

  const LABELS = ['TÍTULO / HOOK', 'REFERÊNCIA', 'PRODUTO FOCO', 'ÁUDIO', 'OBSERVAÇÕES', 'PRAZO']
  const PINK_BG = { red: 0.988, green: 0.894, blue: 0.925 }

  // Acha as tabelas que pertencem ao bloco da semana recém-inserida
  // Estratégia: procura o H2 da semana e pega as N tabelas seguintes (em ordem reversa no doc)
  const tables: { tableIndex: number; startIndex: number; rows: { cells: { startIndex: number; endIndex: number }[] }[] }[] = []

  for (const el of body) {
    if (el.table) {
      const rows = el.table.tableRows?.map(row => ({
        cells: row.tableCells?.map(cell => ({
          startIndex: cell.startIndex!,
          endIndex: cell.endIndex!,
        })) ?? [],
      })) ?? []
      tables.push({ tableIndex: tables.length, startIndex: el.startIndex!, rows })
    }
  }

  // As tabelas do bloco atual são as últimas `videos.length` encontradas antes do separador
  // Simplificação: pegamos as primeiras N tabelas (as mais recentes inseridas ficam no topo)
  const relevantTables = tables.slice(0, videos.length)

  // Coleta inserções de texto separadas dos style requests.
  // insertText muda índices — então precisamos enviar em dois batches:
  // 1) todos os insertText em ordem DECRESCENTE de índice (para não deslocar uns aos outros)
  // 2) depois os style requests (updateTextStyle + updateTableCellStyle) que não mudam índices
  type InsertOp = { index: number; text: string; bold: boolean }
  const inserts: InsertOp[] = []
  const styleRequests: object[] = []

  for (let vi = 0; vi < relevantTables.length; vi++) {
    const table = relevantTables[vi]
    const video = videos[vi]
    const values = [video.hook, video.referencia, video.produto, video.audio, video.obs, video.prazo]

    for (let r = 0; r < 6; r++) {
      const labelCell = table.rows[r]?.cells[0]
      const valueCell = table.rows[r]?.cells[1]
      if (!labelCell || !valueCell) continue

      inserts.push({ index: labelCell.startIndex + 1, text: LABELS[r], bold: true })
      inserts.push({ index: valueCell.startIndex + 1, text: values[r] || '—', bold: false })

      styleRequests.push({
        updateTableCellStyle: {
          tableCellStyle: { backgroundColor: { color: { rgbColor: PINK_BG } } },
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: table.startIndex },
              rowIndex: r,
              columnIndex: 0,
            },
            rowSpan: 1,
            columnSpan: 1,
          },
          fields: 'backgroundColor',
        },
      })
    }
  }

  if (inserts.length === 0) return

  // Ordena decrescente por índice — inserções do fim para o início não deslocam índices anteriores
  inserts.sort((a, b) => b.index - a.index)

  // Batch 1: apenas insertText (em ordem decrescente)
  const insertRequests = inserts.map(op => ({
    insertText: { location: { index: op.index }, text: op.text },
  }))
  await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests: insertRequests } })

  // Relê o doc para obter os índices corretos após as inserções
  const doc2 = await docs.documents.get({ documentId: docId })
  const body2 = doc2.data.body!.content!
  const tables2: typeof tables = []
  for (const el of body2) {
    if (el.table) {
      const rows = el.table.tableRows?.map(row => ({
        cells: row.tableCells?.map(cell => ({
          startIndex: cell.startIndex!,
          endIndex: cell.endIndex!,
        })) ?? [],
      })) ?? []
      tables2.push({ tableIndex: tables2.length, startIndex: el.startIndex!, rows })
    }
  }
  const relevantTables2 = tables2.slice(0, videos.length)

  // Batch 2: updateTextStyle (bold nos labels) + updateTableCellStyle
  const styleReqs2: object[] = []
  for (let vi = 0; vi < relevantTables2.length; vi++) {
    const table = relevantTables2[vi]
    for (let r = 0; r < 6; r++) {
      const labelCell = table.rows[r]?.cells[0]
      if (!labelCell) continue
      const labelText = LABELS[r]
      styleReqs2.push({
        updateTextStyle: {
          range: { startIndex: labelCell.startIndex + 1, endIndex: labelCell.startIndex + 1 + labelText.length },
          textStyle: {
            bold: true,
            foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } } },
          },
          fields: 'bold,foregroundColor',
        },
      })
      styleReqs2.push({
        updateTableCellStyle: {
          tableCellStyle: { backgroundColor: { color: { rgbColor: PINK_BG } } },
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: table.startIndex },
              rowIndex: r,
              columnIndex: 0,
            },
            rowSpan: 1,
            columnSpan: 1,
          },
          fields: 'backgroundColor',
        },
      })
    }
  }

  if (styleReqs2.length > 0) {
    await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests: styleReqs2 } })
  }

}

// ─── Doc novo: insere título + primeiro bloco ─────────────────
async function initNewDoc(docs: ReturnType<typeof google.docs>, docId: string, creator: string, semanaLabel: string, videos: VideoData[]) {
  // Título
  const titleText = `PAUTAS DE CONTEÚDO — ${creator}\n`
  const requests: object[] = [
    { insertText: { location: { index: 1 }, text: titleText } },
    {
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: titleText.length },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType',
      },
    },
  ]

  // Bloco da semana (append ao fim)
  const semLine = `📅 ${semanaLabel}\n`
  let idx = titleText.length + 1
  requests.push({ insertText: { location: { index: idx }, text: semLine } })
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: idx, endIndex: idx + semLine.length },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType',
    },
  })
  idx += semLine.length

  for (let vi = 0; vi < videos.length; vi++) {
    const numStr = String(vi + 1).padStart(2, '0')
    const h3 = `VÍDEO ${numStr}\n`
    requests.push({ insertText: { location: { index: idx }, text: h3 } })
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: idx, endIndex: idx + h3.length },
        paragraphStyle: { namedStyleType: 'HEADING_3' },
        fields: 'namedStyleType',
      },
    })
    idx += h3.length

    requests.push({ insertTable: { location: { index: idx }, rows: 6, columns: 2 } })
    idx += 1
    requests.push({ insertText: { location: { index: idx }, text: '\n' } })
    idx += 1
  }

  await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } })
  await fillTableCells(docs, docId, semanaLabel, videos)
}

// ─── Handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { creator: string; semana: number; videos: VideoData[] }
    const { creator, semana, videos } = body

    if (!creator || !semana || !videos?.length) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const semanaLabel = `SEMANA ${semana}`
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })
    const docs = google.docs({ version: 'v1', auth })

    const { docId, isNew } = await getOrCreateDoc(drive, docs, creator)
    const docUrl = `https://docs.google.com/document/d/${docId}`

    if (isNew) {
      await initNewDoc(docs, docId, creator, semanaLabel, videos)
    } else {
      const requests = buildInsertRequests(semanaLabel, videos)
      await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } })
      await fillTableCells(docs, docId, semanaLabel, videos)
    }

    return NextResponse.json({ docUrl, docId })
  } catch (err: unknown) {
    console.error('[mh/briefing]', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
