# Patch — Botão "Gerar vídeos da semana" no PropostaPanel

> Adição ao `components/LivesView.tsx` que o VSCode agent construiu na
> PARTE 2. Adiciona um botão que dispara a automação de render de vídeos
> via `POST /api/lives/trigger-render`.

## 1. O que já está pronto (não refazer)

- ✅ Tabela `render_jobs` (Supabase, migration 006 aplicada).
- ✅ API route `app/api/lives/trigger-render/route.ts` — lê confirmadas da
  semana, cria `render_jobs`, chama webhook do n8n.
- ✅ Spec do workflow n8n em `n8n-workflow-lives-render.md` (raiz).
- ✅ Endpoint Python `editing-automation-patch/api/routes/lives_render.py`
  (a aplicar no servidor FFmpeg).

## 2. O que adicionar no front (este handoff)

### 2.1 No `lib/types.ts`
Adicionar a interface do job:
```ts
export type RenderJobStatus = 'queued' | 'running' | 'done' | 'error'

export interface RenderJob {
  id: string
  semanaInicio: string          // YYYY-MM-DD
  triggeredBy: string | null
  status: RenderJobStatus
  videosProcessados: number
  videosFalhos: number
  dropboxUrl: string | null
  errorMessage: string | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### 2.2 No `lib/supabase/mappers.ts`
Adicionar mapper:
```ts
export function dbToRenderJob(row: Record<string, unknown>): RenderJob {
  return {
    id:                 String(row.id),
    semanaInicio:       (row.semana_inicio as string) ?? '',
    triggeredBy:        row.triggered_by ? String(row.triggered_by) : null,
    status:             ((row.status as string) ?? 'queued') as RenderJobStatus,
    videosProcessados:  Number(row.videos_processados ?? 0),
    videosFalhos:       Number(row.videos_falhos ?? 0),
    dropboxUrl:         (row.dropbox_url as string) ?? null,
    errorMessage:       (row.error_message as string) ?? null,
    startedAt:          (row.started_at as string) ?? null,
    endedAt:            (row.ended_at as string) ?? null,
    createdAt:          (row.created_at as string) ?? '',
    updatedAt:          (row.updated_at as string) ?? '',
  }
}
```

### 2.3 No `components/LivesView.tsx` (ou `PropostaPanel` se for componente separado)

#### Estado e fetch inicial
```tsx
const [renderJob, setRenderJob] = useState<RenderJob | null>(null)
const [isTriggering, setIsTriggering] = useState(false)

// Detecta a segunda da semana das propostas confirmadas
const semanaIso = useMemo(() => {
  const confirmadas = lives
    .filter(l => l.status === 'confirmada')
    .filter(l => /* dentro da semana corrente */)
    .map(l => l.date)
    .sort()
  return confirmadas[0] ?? null
}, [lives])

// Busca último render_job da semana atual + subscribe realtime
useEffect(() => {
  if (!semanaIso) return
  const supabase = createClient()
  
  // Fetch último job da semana
  supabase
    .from('render_jobs')
    .select('*')
    .eq('semana_inicio', semanaIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .then(({ data }) => {
      if (data) setRenderJob(dbToRenderJob(data as Record<string, unknown>))
    })
  
  // Subscribe nas mudanças desta semana
  const channel = supabase
    .channel(`render_jobs:semana=${semanaIso}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'render_jobs',
      filter: `semana_inicio=eq.${semanaIso}`,
    }, payload => {
      if (payload.new) {
        setRenderJob(dbToRenderJob(payload.new as Record<string, unknown>))
      }
    })
    .subscribe()
  
  return () => { supabase.removeChannel(channel) }
}, [semanaIso])
```

#### Handler do botão
```tsx
const handleGerarVideos = async () => {
  if (!semanaIso) return
  setIsTriggering(true)
  try {
    const res = await fetch('/api/lives/trigger-render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ semana: semanaIso }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(`Falha: ${data.error ?? 'erro desconhecido'}`)
      return
    }
    // O realtime subscribe vai atualizar o renderJob automaticamente
  } catch (e) {
    alert(`Erro de rede: ${e instanceof Error ? e.message : String(e)}`)
  } finally {
    setIsTriggering(false)
  }
}
```

#### Lógica de habilitação
O botão aparece só quando:
1. Existem **7 lives `confirmada`** na semana corrente (`semanaIso != null` e
   todas confirmadas), **OU**
2. Já existe um `render_job` da semana corrente (mesmo se incompleto — pra
   mostrar o status).

```tsx
const semanaTemTodasConfirmadas = lives
  .filter(l => l.date >= semanaIso && l.date <= addDays(semanaIso, 6))
  .filter(l => l.status === 'confirmada').length === 7

const mostrarBotao = semanaTemTodasConfirmadas || renderJob != null
```

#### Estados visuais do botão

```tsx
function BotaoGerarVideos() {
  if (!mostrarBotao) return null
  
  // Caso 1: queued ou running → botão desabilitado com spinner
  if (renderJob && (renderJob.status === 'queued' || renderJob.status === 'running')) {
    return (
      <button className="btn btn-ghost" disabled>
        <span className="spinner" /> {renderJob.status === 'queued' ? 'Na fila…' : 'Gerando vídeos…'}
        {renderJob.videosProcessados > 0 && ` (${renderJob.videosProcessados})`}
      </button>
    )
  }
  
  // Caso 2: done → link pro Dropbox
  if (renderJob?.status === 'done' && renderJob.dropboxUrl) {
    return (
      <a className="btn btn-accent"
         href={`https://www.dropbox.com/home${encodeURI(renderJob.dropboxUrl)}`}
         target="_blank" rel="noreferrer">
        <Icon.check /> Vídeos prontos · ver pasta
      </a>
    )
  }
  
  // Caso 3: error → mostra erro + botão pra tentar de novo
  if (renderJob?.status === 'error') {
    return (
      <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
        <span style={{ color: 'oklch(0.5 0.15 25)', fontSize: 12 }}>
          ❌ {renderJob.errorMessage?.slice(0, 60) || 'Erro'}
        </span>
        <button className="btn btn-ghost" onClick={handleGerarVideos} disabled={isTriggering}>
          Tentar de novo
        </button>
      </div>
    )
  }
  
  // Caso 4: idle (sem job ou job antigo) → botão pra disparar
  return (
    <button className="btn btn-accent" onClick={handleGerarVideos} disabled={isTriggering}>
      🎬 Gerar vídeos da semana
    </button>
  )
}
```

#### Onde renderizar o botão
Dentro do `PropostaPanel`, na header (ao lado dos botões "Regerar" /
"Aprovar tudo" que já existem). Esses 3 botões formam a régua de ações da
semana:
- **Regerar** — quando há propostas pendentes
- **Aprovar tudo** — quando há propostas a aprovar
- **Gerar vídeos da semana** — quando todas as 7 viraram `confirmada`

## 3. Não esquecer

- `.env.local` precisa de `N8N_RENDER_WEBHOOK_URL` e `N8N_WEBHOOK_SECRET`
  (ver `.env.local.example` e `SECRETS_INVENTORY.md`).
- Supabase Realtime precisa estar habilitado pra tabela `render_jobs` —
  geralmente já vem habilitado por padrão; se não, no painel do Supabase:
  Database → Replication → Source → `render_jobs` checkbox.
- Não rolar polling como fallback — o realtime já é confiável. Só fazer
  o fetch inicial no mount.

## 4. Teste rápido

1. Garantir que 7 lives da semana corrente estão `confirmada`.
2. Botão "Gerar vídeos da semana" aparece e está habilitado.
3. Clicar → `render_jobs` ganha linha `queued` (conferir via MCP ou
   dashboard Supabase). Botão muda pra "Na fila…".
4. Quando o n8n PATCH → `running`, botão muda pra "Gerando vídeos…".
5. Quando termina → botão vira link verde "Vídeos prontos · ver pasta".
6. Recarregar a página: o estado persiste (porque vem do banco).
