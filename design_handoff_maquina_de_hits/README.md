# Handoff · Máquina de Hits — Integração na plataforma SocialHub

## Overview

Antes da plataforma SocialHub, o fluxo de **Máquina de Hits (MH)** vivia numa planilha do Google Sheets com automação Apps Script:

- Pautas criadas em lote por semana (formulário lateral)
- Briefing automático gerado em Google Doc por creator
- Status `Em pauta → Entregue → Agendado` automatizado a partir de arquivos no Google Drive
- Cada vídeo postado em **duas datas** (Instagram primeiro, TikTok depois)

Hoje a plataforma SocialHub trata MH como uma **visualização filtrada** do calendário (posts com `tags: ['mh']`) — só vê o resultado postado, não o processo. Este handoff descreve a integração completa: trazer pauta, creator, briefing e ciclo de entrega pra dentro do app.

A integração foi planejada em 8 fases. As **Fases 1–7 estão prototipadas em HTML/JSX** neste bundle (clicáveis, com dados mock realistas extraídos da planilha real). A **Fase 8** (verificação automática via Dropbox API) está documentada como stub funcional, sem integração real.

---

## About the Design Files

Os arquivos em `prototype/` são **referências de design feitas em HTML + React (via Babel inline)**. **Não são código de produção pra copiar diretamente.** Eles funcionam como protótipos clicáveis para demonstrar look-and-feel, layout, fluxos de interação e modelo de dados.

A tarefa é **recriar estes designs no codebase existente do SocialHub**, usando os padrões e bibliotecas já estabelecidos lá (componentes, design tokens, sistema de roteamento, gerenciamento de estado real, integração com APIs reais).

Se o codebase ainda não tem ambiente estabelecido, recomenda-se React + TypeScript + CSS Modules (ou Tailwind) — o mesmo stack visual usado no protótipo é facilmente portável.

---

## Fidelity

**High-fidelity (hi-fi)** — os mockups têm cores, tipografia, spacing e interações finais. Recriar pixel-perfect usando os tokens listados na seção **Design Tokens** abaixo. Os arquivos `prototype/socialhub.css` (base) e `prototype/socialhub-mh.css` (extensões MH) contêm todos os tokens em variáveis CSS prontos pra portar.

---

## What changes from the current SocialHub

Comparação direta:

| Hoje | Depois da integração |
|---|---|
| Calendário com tag MH filtrada | Seção MH com **3 modos**: Pautas (default) · Calendário · Creators |
| `post.owner` (social media interno) | `post.owner` + `post.mh.creator` (talento contratado) |
| `post.date / time` único | Primary IG (`post.date/time/type`) + opcional TikTok repost (`post.mh.repostTT.{date,time,type,status}`) |
| `post.status`: Em produção/Agendado/Publicado/Cancelado | + Em pauta + Entregue (exclusivos de MH) |
| Sem conceito de semana | `post.mh.semanaCreator` (relativa à entrada do creator no time) |
| Posts soltos | Posts agrupados por (creator, semana) com numeração `vídeo 1, 2...` |
| Modal único (PostModal) | PostModal padrão + PostModalMH com bloco Pauta e Agendamentos IG/TT |
| Sem batch creation | BatchPautaModal cria N posts de uma vez por creator/semana, gera briefing `.txt` |
| Sem briefing | Briefing `.txt` gerado automaticamente, salvo na pasta Dropbox da creator |
| Sem entidade Creator | 5 creators contratados como entidades de primeira classe, com perfil e métricas |

---

## Screens / Views

### 1. Sidebar (mudanças)

A sidebar existente ganha **uma nova seção "Creators"** entre "Calendários" e "Planejamento":

```
SIDEBAR
├── (logo)
├── Calendários
│   ├── Calendário do mês
│   ├── Stories
│   ├── Branding
│   └── Máquina de Hits           ← entrada principal
├── Creators                       ← NOVO
│   ├── Carina        S85
│   ├── Rebeca        S60
│   ├── Tha           S45
│   ├── Marina        S18
│   └── Reciclado     S32
├── Planejamento
│   └── ...
└── (user avatar)
```

Cada item de creator:
- Avatar circular de 24×24, fundo na cor do creator, inicial branca bold
- Nome (font-weight 500)
- Label "S{semanaAtual}" alinhado à direita, mono font 10.5px, cor `--ink-3`
- Hover: bg `--accent-softer`, color `--ink`
- Active: bg `--accent-gradient-soft`, color `oklch(0.35 0.12 40)`, label muda pra `--accent-deep`

CSS classes no protótipo: `.sb-creator`, `.sb-creator-avatar`, `.sb-creator-sem`.

---

### 2. View Pautas (default da seção MH)

**Layout:** lista vertical de cards de "grupo semana", cada um contendo várias linhas de pautas. Container com `padding: 0 28px 80px`.

**Componentes (top-down):**

#### 2.1 · Dropbox sync banner (Fase 8 stub)
Banner azul claro no topo:
- 30×30 ícone (≡) com bg `oklch(0.94 0.04 230)`, color `oklch(0.4 0.16 230)`
- Texto: "**Verificação automática Dropbox** · próxima sync amanhã 09:00" + sublinha explicativa
- Tag pequena "Backlog · Fase 8" (mono font, bg `oklch(0.95 0.025 60)`)
- Botão "Simular sync agora" com ícone de refresh

Após clique no botão de sync, o texto muda temporariamente (6s) pra "X entregas detectadas no Dropbox · última sincronização agora".

CSS: `.dropbox-sync-banner`, `.dropbox-sync-icon`, `.dropbox-sync-tag`, `.dropbox-sync-btn`.

#### 2.2 · Filtro de creator
Pills horizontais:
- Pill "Todos" (preto quando ativa)
- 5 pills, uma por creator, com avatar circular colorido + nome + S{N} em mono
- Active state: bg `--ink`, color white, shadow no avatar

CSS: `.pautas-filter`, `.creator-filter-pill`, `.cfp-av`.

#### 2.3 · CTA "Nova pauta da semana"
Banner laranja pastel com:
- Texto à esquerda explicando o flow
- Botão preto "+ Nova pauta da semana" à direita
- Abre o BatchPautaModal (ver seção 5)

CSS: `.pauta-cta`, `.pauta-cta-btn`.

#### 2.4 · Grupos por semana
Cards de container, um por (creator, semana). Ordenados: **semana mais recente primeiro**, dentro do mesmo número de semana ordena pela ordem dos creators (Carina, Rebeca, Tha, Marina, Reciclado).

Cabeçalho do grupo (`.pauta-group-head`):
- Esquerda: avatar 36×36 do creator + nome + label "semana atual" ou "há N semanas" + chip de semana (`S86`, bg `--accent-soft`, color `--accent-deep`, mono font)
- Direita: contagens — "**3** em pauta · **2** entregues · **1** agendados · **2** publicados" (só mostra contagens > 0)

Linha de pauta (`.pauta-row`) — grid de 6 colunas:
- 36px: número do vídeo (`V01`, mono font)
- 1fr: hook (max 2 linhas, line-clamp) + produto abaixo (mono font 11.5px)
- 130px: creator chip
- 88px: par de platforms IG/TT (badges 26×26, com tick verde se publicado, "muted" cinza se TT não existe)
- 96px: status badge (cores na seção Design Tokens)
- 80px: prazo (mono, "Prazo: DD/MM/AAAA"; cor vermelha se atrasado)

Linha inteira é clicável; abre o `PostModalMH`.

CSS: `.pauta-group`, `.pauta-group-head`, `.pauta-row`, `.pauta-plat`, `.pauta-status`, `.pauta-prazo`.

---

### 3. View Calendário MH

**Mesma grade mensal do calendário regular**, mas usa um post card customizado (`MHPostCard`) e expande cada post MH em **duas células**:
- Card primary IG na `post.date`
- Card TikTok na `post.mh.repostTT.date` (se existir)

Cada card mostra, além do que o regular mostra:
- **Inicial colorida do creator** ao lado do horário (font-weight 700, color = creator.color)
- **Indicador "↗TT" ou "IG↗"** se há um companheiro do outro lado (mostra que é o mesmo vídeo replicado)

Status visual:
- Status `pauta`: fundo roxo claro, borda esquerda 3px
- Status `entregue`: fundo verde claro, borda esquerda 3px verde

CSS: classes do calendário base + `.pc-mh-creator`, `.pc-mh-side` em `socialhub-mh.css`.

Componentes a portar: `MHCalendarGrid`, `MHPostCard` em `prototype/socialhub-mh-calendar.jsx`.

---

### 4. PostModalMH

Variante do PostModal regular usada quando o post tem `mh` payload. Mesma estrutura two-column.

**Header:**
- Mark roxo (oklch(0.55 0.12 280)) com "MH" em mono branca
- Título editável (`post.title` — o hook)
- Linha abaixo: StatusSelect (com Em pauta, Entregue + os 4 padrões) + creator chip + label "{creator} · S{N} · V{NN}" + id `#0000`

**Coluna esquerda — Detalhes + Pauta + Agendamentos:**

**a) Detalhes:**
- Creator (dropdown com avatar)
- Produto foco (text)
- Linha editorial (dropdown)

**b) Bloco Pauta** (separado por borda dashed):
- Grid 3 colunas:
  - Semana (read-only, `S{N}`)
  - Nº do vídeo (read-only, `V{NN}`)
  - Prazo (date input)
- Áudio sugerido (full width)
- Link de referência (full width)
- Pílula clicável "📄 Pautas {Creator} · S{N}" + path do .txt no Dropbox + botão "Abrir no Dropbox ↗"

CSS: `.mh-section`, `.mh-pauta-grid`, `.mh-pauta-cell`, `.mh-briefing-row`.

**c) Bloco Agendamentos** (também separado):
Dois sub-blocos verticais:

*Instagram (sempre presente):*
- Header: badge IG vermelho + label "Instagram"
- Grid 2 colunas (100px label / 1fr field), 3 linhas:
  - "Plataforma" → "Instagram" (estático)
  - "Data e hora" → date + time (par)
  - "Tipo" → dropdown (CONTENT_TYPES_IG: Reels, Carrossel, Imagem, Story)

*TikTok (opcional):*
- Mesmo formato, mas tipos = CONTENT_TYPES_OTHER (Vídeo, Imagem, Texto)
- Botão "remover" no canto
- Se não houver repost: botão dashed "+ Agendar repostagem no TikTok" que cria com data = primary +7 dias

CSS: `.mh-sched-block`, `.mh-sched-head`, `.mh-sched-plat`, `.mh-sched-fields-grid`, `.mh-sched-field`, `.mh-sched-field-label`, `.mh-sched-field-static`, `.mh-sched-field-pair`, `.mh-sched-add`.

**Coluna direita — Conteúdo:**
Nota cinza no topo: "Campos exportados no CSV de agendamento. Compartilhados entre IG e TikTok."

Campos com **labels exatamente iguais ao modal padrão** (importante para o mapeamento CSV):
- **Legenda** (textarea)
- **Link da mídia** (vídeo com texto no Dropbox)
- **Link da capa** (imagem de capa no Dropbox)
- **Pasta da entrega** (link da pasta Dropbox da creator/semana)
- **Link do Post** (após publicar)
- **Observações** (textarea)

Componente a portar: `PostModalMH` em `prototype/socialhub-mh-modal.jsx`.

---

### 5. BatchPautaModal (Fase 6)

Modal grande (780px, max 92vh) com **3 steps**: `form` → `preview` → `done`.

**Step `form`:**
- Header: "Criar pauta de **{CreatorSelect}** · semana **S{N+1}**" (creator escolhível inline via pill)
- Helper: explica que a semana é auto-calculada e que os vídeos vão pra Pautas em "Em pauta"
- Lista de blocos de vídeo (default: 1 vazio). Cada bloco:
  - Header: tag "VÍDEO 01" mono + botão "× remover" (só aparece se >1)
  - Grid 2 colunas:
    - Hook (full width, textarea 2 rows) — obrigatório
    - Link de referência (full width)
    - Produto foco / Áudio sugerido (par)
    - Prazo (date) / Observações (input)
- Botão dashed "+ Adicionar vídeo" no fim da lista
- Footer: contador "X de Y preenchidos" · Cancelar · "Gerar briefing" (disabled se nenhum hook preenchido)

**Step `preview`:**
- Header: "{Creator} · S{N+1} · X vídeos"
- Bloco com path do arquivo: "Arquivo será salvo em `/Creators/{Creator}/pautas-semana-{N+1}.txt`"
- Tag .txt + tamanho em KB
- **Bloco preto monospace** com o briefing renderizado (font `--font-mono`, bg `oklch(0.16 0.02 280)`, color `oklch(0.92 0.02 280)`, max-height 380px, scroll)
- Aviso amarelo: integração Dropbox real não implementada
- Footer: "← Voltar e editar" · "Criar pauta e salvar no Dropbox"

Formato do briefing (`.txt`):
```
PAUTAS — {CREATOR} · SEMANA {N+1}
═══════════════════════════════════════
Gerada em DD/MM/AAAA HH:MM por {usuario}


📹 VÍDEO 01
───────────────────────────────────────
HOOK / TAKE INICIAL
  {hook}

REFERÊNCIA
  {ref}

PRODUTO FOCO
  {product}

ÁUDIO SUGERIDO
  {audio}

PRAZO DE ENTREGA
  DD/MM/AAAA

OBSERVAÇÕES
  {notes}


📹 VÍDEO 02
...

═══════════════════════════════════════
N vídeos nesta semana · arquivo gerado automaticamente pelo SocialHub
```

**Step `done`:**
- Check verde grande
- "X vídeos foram criados"
- Path do briefing salvo
- Footer: "Criar mais uma pauta" · "Concluir"

Submit (de `preview` para `done`) cria N posts via callback `onCreated(posts, { briefingPath, briefingTxt })`. Cada post:
- `status: 'pauta'`
- `tags: ['mh']`
- `type: 'Reels'`, `platform: 'ig'`
- `date: today + 7 + i` (staggered por dia)
- `time: '12:00'`
- `mh: { creator, semanaCreator: N+1, numVideo: i+1, audio, prazo, briefingFile, repostTT: null }`

CSS: `.batch-modal`, `.batch-body`, `.batch-helper`, `.batch-video`, `.batch-video-head`, `.batch-video-num`, `.batch-video-remove`, `.batch-grid`, `.batch-field`, `.batch-add`, `.briefing-meta`, `.briefing-tag`, `.briefing-preview`, `.briefing-warn`.

Componente a portar: `BatchPautaModal` em `prototype/socialhub-mh-batch.jsx`.

---

### 6. CreatorProfileView

Página individual do creator. Abre quando o usuário clica num creator na sidebar (ou no header de um grupo de pauta).

**Layout:**

#### 6.1 · Link "← Voltar"
Texto pequeno, color `--ink-3`. Volta pra view Pautas.

#### 6.2 · Header (.cp-header)
Card branco, padding 22×26, border radius 16:
- Avatar 78×78 com inicial branca, bg = creator.color
- Centro: nome (26px bold), meta "Creator contratad{a/o} · Desde DD/MM/AAAA · S{N} · N semanas no time", path do Dropbox em mono
- Direita: "ENTREGAS NO PRAZO" (uppercase mono 11px) + valor enorme 38px em verde escuro (`oklch(0.5 0.16 150)`)

#### 6.3 · Grid de stats (.cp-stats)
4 colunas:
- Vídeos totais (`metrics.total`, sublabel "desde a entrada")
- Esta semana (`metrics.thisWeek`, sublabel `S{N}`)
- Em pauta agora (`metrics.emPauta`, sublabel "aguardando entrega")
- Média / semana (`metrics.avgPerWeek`, sublabel "vídeos por semana")

Cards brancos com label uppercase 10.5px, valor 26px bold, sublabel 11px cinza.

#### 6.4 · Histograma (.cp-histogram)
Card branco com 12 barras, uma por semana das últimas 12. Barra atual destacada (bg `--accent-deep`). Hover mostra número. Labels em mono 9.5px abaixo (número da semana). Altura total 90px.

#### 6.5 · Lista de pautas recentes
Mesmo componente das pauta-rows da view Pautas, mas filtrado para este creator. Limite 8 itens.

Componente a portar: `CreatorProfileView` em `prototype/socialhub-mh-creator-profile.jsx`.

---

## Interactions & Behavior

### Navegação
- Sidebar `Máquina de Hits` → seção MH (default: mode Pautas)
- Sidebar `Creators > {nome}` → CreatorProfileView desse creator
- Header de grupo de pauta (click no avatar/nome) → CreatorProfileView desse creator
- Linha de pauta → abre PostModalMH
- Card no calendário MH → abre PostModalMH (mesmo modal, seja IG ou TT side)

### Filtros (view Pautas)
- Pills de creator no topo filtram a lista
- "Todos" zera o filtro

### View toggle (header da view MH)
- "Pautas" (default) / "Calendário"
- Some o toggle Mês/Semana padrão quando em MH

### Modal MH (criação de post avulso)
- Botão "Novo vídeo MH" na topbar (visível quando view MH)
- Cria post com defaults: creator = CARINA, semana = sua semana atual, numVideo = 1, status = pauta, IG primary today/12:00, sem repost

### BatchPautaModal
- Botão "+ Nova pauta da semana" no CTA da view Pautas abre o modal
- Vídeos com hook vazio são ignorados no submit
- "Cancelar" descarta tudo

### Sync simulado (Fase 8)
- "Simular sync agora" itera os posts MH com `status === 'pauta'` e `prazo <= hoje`
- Vira o status pra `entregue` e preenche `mh.dropboxLink` com `{creator.dropboxPath}/SEMANA {N}/`
- Banner mostra "X entregas detectadas" por 6 segundos, depois volta ao texto padrão

### Animações
- Hovers e clicks: transição 0.12–0.15s ease (background, color, border-color)
- Modal: backdrop fade-in instantâneo, modal slide-up via CSS (já existe no socialhub.css base)

---

## State Management

### Modelo de Post (extensão)
```typescript
type MHPayload = {
  creator: 'CARINA' | 'REBECA' | 'THA' | 'MARINA' | 'RECICLADO';
  semanaCreator: number;       // relative to creator's join date
  numVideo: number;            // 1..N within (creator, semana)
  audio: string;
  prazo: string;               // YYYY-MM-DD
  dropboxLink: string;         // link to the SEMANA N folder
  briefingFile: string;        // path of pautas-semana-N.txt
  repostTT: {
    date: string;
    time: string;
    status: PostStatus;
    type: string;              // CONTENT_TYPES_OTHER
  } | null;
};

type Post = {
  // ... existing fields
  caption: string;             // legenda
  coverLink: string;           // NEW: link da capa
  postLink: string;            // existing in modal, formalize on Post type
  mh?: MHPayload;              // present iff post is MH
};

type PostStatus = 'pauta' | 'entregue' | 'prod' | 'sched' | 'pub' | 'cancel';
```

### Modelo de Creator
```typescript
type Creator = {
  id: string;
  name: string;
  initial: string;
  color: string;               // oklch
  dataEntrada: string;         // YYYY-MM-DD
  semanaAtual: number;         // derived from dataEntrada
  dropboxPath: string;         // e.g. /Creators/Carina
  isVirtual?: boolean;         // true for "Reciclado" (conceptual slot)
};
```

Importante: `semanaAtual` pode ser calculado a partir de `dataEntrada` em runtime (`floor(weeksBetween(dataEntrada, today))`), em vez de stored. Mas é prático ter cached. Lock semanal — não muda durante o dia.

### State no SocialHubApp
Reutiliza tudo do app atual + adiciona:
- `mhMode: 'pautas' | 'month'` (default `'pautas'`)
- `creatorFilter: string` (default `'all'`)
- `activeCreator: string | null` (creator id quando view = 'creator')
- `batchOpen: boolean`
- `lastSyncResult: { found: number } | null` (limpa após 6s via setTimeout)

### Roteamento
- `/mh` → Pautas
- `/mh/calendar` → Calendário MH
- `/mh/creator/:id` → Perfil do creator

(O protótipo usa state local; a impl real deve usar o router do codebase.)

---

## Design Tokens

Todos definidos como CSS custom properties em `prototype/socialhub.css` (base) e `prototype/socialhub-mh.css` (extensões).

### Cores

**Base (já existem no codebase):**
```
--bg:        oklch(0.985 0.005 300)   /* page bg */
--surface:   #ffffff
--surface-2: oklch(0.975 0.006 300)
--surface-3: oklch(0.96  0.008 300)
--ink:       oklch(0.22 0.02 300)     /* primary text */
--ink-2:     oklch(0.42 0.015 300)
--ink-3:     oklch(0.62 0.012 300)
--ink-4:     oklch(0.78 0.01 300)
--line:      oklch(0.94 0.01 300)
--line-2:    oklch(0.90 0.012 300)
--accent:        oklch(0.72 0.16 55)  /* peach/coral */
--accent-deep:   oklch(0.62 0.18 50)
--accent-soft:   oklch(0.94 0.05 60)
--accent-softer: oklch(0.975 0.025 65)
```

**Status MH:**
```
'pauta'    → bg oklch(0.96 0.025 280)   fg oklch(0.42 0.13 280)   dot oklch(0.55 0.12 280)   (purple)
'entregue' → bg oklch(0.95 0.045 165)   fg oklch(0.4 0.13 165)    dot oklch(0.55 0.14 165)   (green)
'prod'     → dot oklch(0.62 0.13 75)    (amber)
'sched'    → dot oklch(0.6 0.13 265)    (blue)
'pub'      → dot oklch(0.6 0.13 150)    (green)
'cancel'   → dot oklch(0.6 0.05 25)     (gray-red)
```

**Cores dos creators:**
```
CARINA    → oklch(0.65 0.17 18)    coral
REBECA    → oklch(0.6 0.16 290)    violet
THA       → oklch(0.62 0.15 150)   green
MARINA    → oklch(0.6 0.16 230)    blue
RECICLADO → oklch(0.55 0.05 280)   muted purple-gray
```

**Plataformas:**
```
Instagram → #E1306C
TikTok    → oklch(0.36 0.08 200)
Canal     → oklch(0.45 0.16 22)
Twitter   → oklch(0.4 0.12 230)
```

### Tipografia
- Sans: **DM Sans** 400/500/600/700 (Google Fonts)
- Mono: **JetBrains Mono** 400/500 (Google Fonts)

Escala usada:
- Title hero: 26px / 700 / -0.025em
- Section title: 16–20px / 700 / -0.02em
- Body: 13.5–14px / 400–500
- Small: 11.5–12px / 400
- Mono labels: 10.5–11.5px / 500–600 / 0.04–0.08em letter-spacing

### Spacing
Escala derivada dos números em uso: 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 22 · 24 · 28 px. Não há sistema rígido; segue do que parece certo visualmente.

### Border radius
- Pills/badges: 6–8px ou 999px (perfect pill)
- Cards: 10–14px
- Modal: 16px+

### Shadows
- Card: `box-shadow: 0 1px 3px rgba(0,0,0,0.04)` (já existe como `--shadow-sm`)
- Modal: `--shadow-modal` (existente)

---

## Assets

- `brand-header.svg` — logo SocialHub (já existe no codebase atual)
- Ícones: SVGs inline em `prototype/socialhub-icons.jsx`. Reutilizam o objeto `Icon` existente. Para o handoff, recomenda-se trocar por Lucide React ou Heroicons.
- Sem imagens raster

---

## CSV Export (mapeamento)

Os campos abaixo formam a tabela CSV que alimenta o agendador externo. **Os labels precisam coincidir exatamente com os do PostModal padrão** (não trocar nomes na implementação):

| CSV column | Vem de | Notas |
|---|---|---|
| Plataforma | Para IG row: `"Instagram"`; para TT row: `"TikTok"` | Cada post MH com `repostTT` gera 2 linhas |
| Data e hora | IG: `post.date + post.time`; TT: `post.mh.repostTT.date + post.mh.repostTT.time` | Formato: `DD/MM/YYYY HH:MM AM/PM` |
| Tipo | IG: `post.type` (default Reels); TT: `post.mh.repostTT.type` (default Vídeo) | |
| Legenda | `post.caption` | Compartilhado entre IG e TT rows |
| Link da mídia | `post.link` (URL do .mp4 com texto no Dropbox) | Compartilhado |
| Link da capa | `post.coverLink` | Compartilhado |

Posts MH sem `repostTT` exportam só 1 linha (IG).

---

## Phases roadmap

| Fase | Status | O que entrega |
|---|---|---|
| 1 | ✅ Prototipado | Modelo de Post estendido + entidade Creator |
| 2 | ✅ Prototipado | PostModalMH com Pauta + Agendamentos IG/TT |
| 3 | ✅ Prototipado | View Pautas agrupada por semana do creator |
| 4 | ✅ Prototipado | Calendário MH expandindo cada post em 2 cards |
| 5 | ✅ Prototipado | CreatorProfileView com métricas |
| 6 | ✅ Prototipado | BatchPautaModal (criação em lote) |
| 7 | ✅ Prototipado (UI; integração real pendente) | Briefing `.txt` no Dropbox |
| 8 | 🔵 Stub apenas (backlog) | Sync automática de entregas via Dropbox API |

---

## Files in this bundle

```
design_handoff_maquina_de_hits/
├── README.md                           ← este arquivo
├── SocialHub MH.html                   ← entry point clicável do protótipo
├── plano-mh-integracao.html            ← doc original de planejamento (contexto da decisão)
├── prototype/
│   ├── socialhub.css                   ← tokens base (reutiliza do codebase)
│   ├── socialhub-mh.css                ← extensões MH (tokens novos)
│   ├── socialhub-data.jsx              ← modelo + mock base (referência)
│   ├── socialhub-icons.jsx             ← icons (referência)
│   ├── socialhub-modal.jsx             ← PostModal padrão (referência)
│   ├── socialhub-calendar.jsx          ← Calendário padrão (referência)
│   ├── socialhub-mh-data.jsx           ← CREATORS, MH_POSTS, helpers
│   ├── socialhub-mh-modal.jsx          ← PostModalMH
│   ├── socialhub-mh-pautas.jsx         ← PautasView + CreatorChip + PautaStatusBadge
│   ├── socialhub-mh-creator-profile.jsx← CreatorProfileView
│   ├── socialhub-mh-calendar.jsx       ← MHCalendarGrid + MHPostCard
│   ├── socialhub-mh-batch.jsx          ← BatchPautaModal + formatBriefingTxt
│   └── socialhub-mh-app.jsx            ← shell que pluga tudo (referência de fluxo)
└── reference/
    ├── script_mh_original.gs           ← Apps Script original (Google Sheets MH)
    └── maquina-de-hits-planilha.xlsx   ← planilha real com 299 linhas de MH
```

**Como rodar o protótipo localmente:**
1. `cd design_handoff_maquina_de_hits/`
2. Servir com qualquer static server (`python -m http.server 8000`)
3. Abrir `http://localhost:8000/SocialHub%20MH.html`

Funciona offline (CDN para React + Babel + Fonts apenas).

---

## Dúvidas a resolver com produto antes de implementar

1. **Dropbox API**: confirmar credenciais e quais escopos da API (file write + folder list) o backend tem acesso.
2. **Cálculo de `semanaAtual` do creator**: ISO week, calendar week, ou contagem exata de dias desde `dataEntrada` ÷ 7?
3. **Posts MH herdam Owner do criador da pauta**, ou sempre Eduarda (social media manager)?
4. **Quando flippa de Entregue → Agendado**: manual ou automático ao definir data/hora?
5. **Numeração de vídeo** quando edita pauta existente: recalcular ou imutável após criação?
6. **Limpeza dos posts mock antigos com `tags: ['mh']`** na seed atual: substituir totalmente ou conviver?
