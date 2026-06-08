# Handoff — Dashboard de Lives + automação de proposta semanal

> **Para o agente (Claude Code / VSCode):** este doc é a especificação completa pra terminar a
> feature de **Lives** no SocialHub. Parte da base já foi feita (ver §2). Sua missão é o **front**
> (3 componentes + wiring) e a **API route que gera a proposta semanal** (port do algoritmo Python
> pra TypeScript). Leia o `AGENTS.md` antes de criar rotas/componentes — esta versão do Next.js tem
> breaking changes; consulte `node_modules/next/dist/docs/` quando em dúvida.

---

## 1. Contexto do produto

A Gocase faz **uma live por dia** no Instagram, sempre com 1 ou 2 cupons ("merchans") — ex:
"DESCONTO + FRETE GRÁTIS", "R$20 OFF EM COMPRAS A PARTIR DE R$150". Cada cupom tem um **nome/código
nominal** (ex: `SEXTATOP`, `20SEGUNDA`). Antes isso era planejado numa planilha. Agora vive no
Supabase e o time de social vai planejar **dentro do SocialHub**.

Há um histórico de **505 lives realizadas** (jan/2025 → mai/2026) já no banco. A feature tem 3 partes:

1. **Dashboard de performance** — receita por live, melhores merchans, frequência, tendência.
2. **Edição manual** — cadastrar/editar lives e merchans direto em modais (sem planilha).
3. **Proposta semanal automática** — um algoritmo distribui os 7 dias da próxima semana respeitando
   regras de performance e grava como linhas `status='proposta'` que o time aprova na plataforma.

### ⚠️ Decisão de arquitetura crítica (mudou o plano original)

A automação **antes** rodava só no Claude Code (via Supabase MCP), disparada manualmente por uma
pessoa técnica. **Isso não serve mais:** quem vai usar a plataforma é **outro time, não-técnico**,
que precisa gerar a proposta **sozinho, sob demanda, com um botão**, sem pedir pra ninguém rodar uma
skill nem abrir o Claude.

➡️ Por isso, **o algoritmo da skill (`gerar_proposta.py`) precisa ser portado pra TypeScript e
exposto como uma API route do Next.js** (`POST /api/lives/gerar-proposta`). Um botão "Gerar proposta
da semana" no dashboard chama essa rota; ela lê o banco, roda a distribuição e faz upsert das 7
linhas `proposta`. **Sem cron, sem agendamento** — só o botão (decisão tomada com a usuária).

A skill Python continua existindo como ferramenta interna, mas **a fonte de verdade do algoritmo
passa a ser a versão TS na API route.** Porte fielmente (§5).

---

## 2. O que JÁ está pronto (NÃO refazer)

- **Banco (Supabase, projeto "Social" `pynjnxqmhiwsrehhfxxx`):** tabelas `lives` e `merchans` criadas
  (migrations `supabase/004_lives_cupons.sql` + `005` que adicionou `lives.notes`). 505 lives
  `realizada` + 16 merchans com flags importados. RLS `authenticated USING(true)`.
- **`lib/types.ts`** — já tem `interface Live`, `interface Merchan`, `type LiveStatus`,
  `'lives'` no union `AppView`, e as constantes `LIVE_STATUSES` / `LIVE_STATUS_BY_ID`.
- **`lib/livesUtils.ts`** — TODAS as funções de agregação e formatação já portadas e tipadas:
  `hashStr`, `colorFromName`, `shortLabel`, `fmtBRL`, `fmtBRLk`, `fmtPct`, `inPeriod`, `liveKpis`,
  `perMerchanMetrics`, `weeklyTrend`, `heatmapMatrix`, `monthVsPrev`, e as constantes
  `WEEKDAY_LABELS`, `WEEKDAY_NOMES`, `MONTH_NAMES_PT`, `MONTH_SHORT_PT`.
- **`lib/supabase/mappers.ts`** — `dbToLive`/`liveToDb` e `dbToMerchan`/`merchanToDb` já existem.
  (`dbToMerchan` deriva `color` e `short` via `colorFromName`/`shortLabel`.)
- **`app/lives.css`** — CSS do dashboard já copiado do design (com `--line-strong` → `--line-2`).
- **`app/layout.tsx`** — já importa `./lives.css`.
- **`recharts`** já instalado (v3.8.1) no `package.json`.
- **`lib/lives/gerarProposta.ts`** — algoritmo completo da proposta semanal, **portado 1:1 do
  Python** (`cupons-gocase/scripts/gerar_proposta.py`). Função pura, sem deps de Supabase. Exporta
  `gerarProposta(input)` e `proximaSegunda(refIso)`. Já testado via `tsc`.
- **`app/api/lives/gerar-proposta/route.ts`** — handler `POST` que faz auth, lê os dados agregados
  do banco (histórico 84 dias, merchans ativos, recentes 14d, nomes 30d), chama `gerarProposta()` e
  faz **upsert seguro** (`status='proposta'` only — nunca sobrescreve `realizada`/`confirmada`).
  Retorna `{ semana, proposta, lives, inseridas, atualizadas, puladas }`. Já testado via `tsc`.

➡️ **Confira esses arquivos antes de começar** pra não duplicar. Se algum tipo/helper estiver
faltando algo que você precisa, estenda — não recrie.

---

## 3. Referência de design (fonte visual exata)

O design veio de um handoff do Claude Design em JSX (React via Babel no browser, `window.Recharts`,
`Object.assign(window, …)`). Estão em **`design-reference/`** neste repo:

| Arquivo | Vira o componente |
|---|---|
| `design-reference/socialhub-lives-view.jsx` | `components/LivesView.tsx` |
| `design-reference/socialhub-lives-modal.jsx` | `components/LiveModal.tsx` |
| `design-reference/socialhub-lives-merchans-modal.jsx` | `components/MerchansModal.tsx` |
| `design-reference/socialhub-lives-data.jsx` | (já portado → `lib/livesUtils.ts`, só referência) |
| `design-reference/socialhub-lives.css` | (já portado → `app/lives.css`) |

**Reproduza o design fielmente** — markup, classes CSS, estrutura. O que muda é só a "casca" técnica:

| No JSX do design | No projeto (TypeScript/Next) |
|---|---|
| `const { useState } = React` | `import { useState, useMemo, useEffect } from 'react'` + `'use client'` no topo |
| `window.Recharts.BarChart` etc. | `import { BarChart, Bar, … } from 'recharts'` |
| `Icon.check` (global) | `import { Icon } from './Icons'` |
| `Popover` (global, do design) | `import { Popover } from './FormHelpers'` (já existe; API: `open`, `onClose`, `anchor`, `children`) |
| `fmtBRL`, `liveKpis`, `WEEKDAY_LABELS`… | `import { … } from '@/lib/livesUtils'` |
| `LIVE_STATUSES`, `LIVE_STATUS_BY_ID` | `import { … } from '@/lib/types'` |
| `todayISO()` | `import { todayISO } from '@/lib/types'` |
| props sem tipo | tipar tudo (use `Live`, `Merchan` de `@/lib/types`) |

**Notas de compat recharts v3 (design usava v2):** a API de `BarChart`/`AreaChart`/`ScatterChart`/
`LabelList`/`ReferenceLine` é praticamente igual. Pontos de atenção no v3: `LabelList`
usa `formatter` ainda; `ResponsiveContainer` mantém a mesma API. Se algum componente reclamar de
prop, cheque o tipo exportado pelo recharts e ajuste — não troque a lib.

**Popover — diferença importante:** o `Popover` do projeto (`FormHelpers.tsx`) renderiza um backdrop
`position:fixed` + um div `.popover` com `position:absolute; top:100%`. Ele precisa que o **elemento
pai tenha `position:relative`** (o design já faz isso com `style={{ position:'relative' }}` nos
wrappers de `MerchanSelect`/`LiveStatusSelect` — mantenha). O design também usa classes `.po-search`,
`.po-scroll`, `.po-item`, `.po-divider`, `.po-item-add`, etc. — todas já estão no `app/lives.css` ou
no `socialhub.css` existente. Se faltar `.po-divider`/`.po-input`, confira o `socialhub.css`.

---

## 4. Modelo de dados

### `Live` (camelCase no app; snake_case no banco — ver `mappers.ts`)
```
id, date (YYYY-MM-DD, único — 1 live/dia), diaSemana ("segunda-feira"…),
cupomLigado, criativo,
merchan1, nominal1, receita1,        // cupom principal (obrigatório)
merchan2, nominal2, receita2,        // cupom secundário (opcional)
cupomExtra, receitaExtra,
receitaTotal (= receita1 + receita2, auto), receitaUtm, alcance,
linkUtm, utmCampaign,
status: 'realizada' | 'confirmada' | 'proposta',
origem: 'import' | 'skill' | 'manual',
notes
```

### `Merchan`
```
id, nome (= texto que casa com lives.merchan1/2), name (alias de nome p/ o design),
ativo, forte, sempreSozinho,
color, short                          // DERIVADOS de nome (colorFromName/shortLabel) — não persistem
```
`color`/`short`/`name` **não existem no banco** — são preenchidos pelo `dbToMerchan`. Ao gravar um
merchan use só `nome/ativo/forte/sempre_sozinho` (já é o que `merchanToDb` faz).

### Semântica de status (importante pro algoritmo e pra segurança)
- `realizada` — live passada, com receita (histórico).
- `confirmada` — live futura aprovada pelo time.
- `proposta` — sugestão do algoritmo, aguardando aprovação.

O algoritmo **lê** `status IN ('realizada','confirmada')` e **escreve só** `proposta`. Aprovar =
`proposta → confirmada`. **Nunca** sobrescrever uma linha que não seja `proposta` (ver §5.4).

---

## 5. API route: `POST /api/lives/gerar-proposta` — **JÁ PRONTA**

> ⚠️ **Esta seção é informativa.** O algoritmo + handler **já foram implementados** em
> `lib/lives/gerarProposta.ts` e `app/api/lives/gerar-proposta/route.ts` (typecheck limpo). Leia
> abaixo só pra entender o contrato e como chamar do front. Não recrie esses arquivos.

### 5.1 Contrato da rota (como o front chama)

- **Request:** `POST /api/lives/gerar-proposta`, body `{ semana?: "YYYY-MM-DD" }`. Se omitir, calcula
  a próxima segunda a partir de hoje (UTC).
- **Response (200):**
  ```ts
  {
    semana:      "YYYY-MM-DD",            // segunda alvo
    proposta:    ProposalDay[],           // 7 itens {date, diaSemana, merchan1, nominal1, merchan2, nominal2}
    lives:       Live[],                  // linhas inseridas/atualizadas (já mapeadas via dbToLive)
    inseridas:   string[],                // datas criadas
    atualizadas: string[],                // datas atualizadas (eram 'proposta')
    puladas:     { date: string; status: string }[]   // realizada/confirmada/race
  }
  ```
- **Erro (400)** se não houver histórico suficiente nas últimas 12 semanas.
- **Erro (401)** se não estiver autenticado.

No `SocialHubApp`, o handler `generateProposta()` deve:
```ts
const r = await fetch('/api/lives/gerar-proposta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ semana }),  // semana opcional
})
const { lives: novas, puladas } = await r.json()
// merge por id no estado (substitui se existe, senão append)
setLives(prev => {
  const map = new Map(prev.map(l => [l.id, l]))
  for (const n of novas) map.set(n.id, n)
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
})
if (puladas.length) toastOrAlert(`${puladas.length} dia(s) não foram alterados (já confirmados/realizados)`)
```

### 5.2 Como o algoritmo agrega os dados (já implementado — só pra entender)
A query (em `../cupons-gocase/SKILL.md`, passo 2) já devolve tudo agregado server-side. Reproduza-a
com `supabase.rpc` **não** — use `supabase.from()` ou, mais simples, replique a lógica em TS sobre os
dados que você já carrega. O essencial que o algoritmo precisa:

- **`scores`**: por (`dia_semana` × `merchan`), a **média de receita** e a **contagem de usos**,
  considerando cupom1 e cupom2 empilhados, só `status IN ('realizada','confirmada')`,
  `merchan<>''`, `receita>0`, e **janela móvel das últimas 12 semanas (84 dias)** antes de `semana`.
- **`media_global`**: média de todas as receitas dessa mesma janela (fallback do smoothing).
- **`merchans`**: os `merchans` com `ativo=true` (com flags `forte`, `sempre_sozinho`).
- **`recentes`**: lives dos **14 dias** anteriores a `semana` (`date`, `merchan1`, `merchan2`) — pra
  continuidade na virada + penalidade de freshness.
- **`nomes_recentes`**: `nominal1`+`nominal2` dos **30 dias** anteriores (pra não repetir nomes).

> Você pode rodar essa agregação em SQL (melhor) ou em TS depois de um `select`. Em TS é tranquilo
> porque o volume é pequeno. Se for SQL, a query exata está no `SKILL.md`.

### 5.3 Algoritmo de distribuição (regras — porte 1:1)

Constantes: `SATURACAO_SEMANA = 2`, `MAX_DIAS_COM_2_CUPONS = 1`, `MIN_USOS_CONFIAVEL = 3`,
`TAMANHO_MAX_NOME = 15`, `JANELA_RECENTE_DIAS = 14`, `JANELA_NOMES_DIAS = 30`.

`ehTriplo(nome)` = `nome` contém `' + '` duas ou mais vezes (3 benefícios).

**Score por merchan/dia (smoothing bayesiano):**
```
score = (media*usos + media_global*MIN_USOS_CONFIAVEL) / (usos + MIN_USOS_CONFIAVEL)
```
Só considera merchans `ativo`. Ordena desc por score dentro de cada dia-da-semana.

**Semear continuidade (antes de distribuir):** olhe a última live em `recentes` ANTERIOR a `semana`
→ `ultimoMerchanPrincipal` e `ultimoEraTriplo`. Conte `usoRecente` (Counter) dos merchans usados nos
últimos 14 dias (cupom1 e cupom2) pra penalidade de freshness.

**1º pass — CUPOM 1, para cada um dos 7 dias (seg→dom a partir de `semana`):**
1. Candidatos = scores daquele dia-da-semana (se vazio, junta todos os dias ordenados por score).
2. `ehInicioMes = dt.day <= 5`.
3. Ajusta score de cada candidato:
   - se `ehInicioMes && merchan.forte` → `*= 1.4` (boost de forte só no começo do mês);
   - `*= 0.75 ** contadorUso[merchan]` (decay dentro da semana — saturação suave);
   - `*= 0.88 ** usoRecente[merchan]` (freshness vs. semanas recentes).
4. Ordena desc. Escolhe o 1º que: **≠ `ultimoMerchanPrincipal`** (anti-repetição), **não é triplo se
   o anterior era triplo** (anti-triplo-consecutivo), e `contadorUso < SATURACAO_SEMANA`.
   - Se nada passar, relaxa só a saturação (limite 99) mantendo anti-repetição/anti-triplo.
   - Se ainda nada, pega o topo de `ajustados`.
5. `contadorUso[escolhido]++`; atualiza `ultimoMerchanPrincipal`/`ultimoEraTriplo`. Grava
   `{data, diaSemana, merchan1: escolhido, merchan2: null}`.

**2º pass — CUPOM 2 (no máx 1 dia da semana):**
- Elegíveis = dias cujo `merchan1` **não** é `sempre_sozinho`.
- Ordena elegíveis priorizando: dias 1–5 do mês, depois sábado/domingo, depois ordem natural.
- Para cada elegível (até `MAX_DIAS_COM_2_CUPONS`): pula se um dia **vizinho** (idx±1) já recebeu
  cupom 2 (não-consecutivo). Escolhe o melhor merchan daquele dia que **≠ merchan1**, **não é
  `sempre_sozinho`**, e `contadorUso < SATURACAO_SEMANA + 1`. Aplica score com os mesmos decays.

**Nomes:** gere `nominal1` (e `nominal2` se houver) ≤15 chars, do vocabulário, sem repetir
`nomes_recentes`. Vocabulário e estratégias estão no `gerar_proposta.py` (`TOKENS_DIA`,
`TOKENS_NEUTROS`, `TOKENS_HYPE`, `TOKENS_MERCHAN`, `NOMES_BLOQUEADOS`, função `gerar_nome`). Porte
tudo. Mantenha o filtro `_tem_numero_colado_estranho` e o limite de tentativas.

### 5.4 Gravação (upsert SEGURO — proteção obrigatória)

Para cada um dos 7 dias, faça upsert por `date` mas **só sobrescreva linhas que sejam `proposta`**.
Em SQL puro o `SKILL.md` usa:
```sql
INSERT INTO lives (date, dia_semana, cupom_ligado, merchan1, nominal1, merchan2, nominal2, status, origem)
VALUES (…, 'proposta','skill')
ON CONFLICT (date) DO UPDATE SET … status='proposta', origem='skill', updated_at=now()
WHERE lives.status = 'proposta';
```
Com o supabase-js o `WHERE` no `ON CONFLICT` é mais chato; o jeito seguro:
1. `select status` das 7 datas;
2. para datas **inexistentes** → `insert` (`status='proposta'`, `origem='skill'`);
3. para datas existentes **com `status='proposta'`** → `update`;
4. para datas existentes **`realizada`/`confirmada`** → **pular** e reportar na resposta
   (`{ puladas: [...] }`) pra UI avisar o time.

> **Nunca** escreva em `realizada`/`confirmada`. Isso é regra de negócio dura.

### 5.5 Aposentar a skill?
Deixe a skill Python como está (não apague). Mas a lógica de verdade agora é a TS. Se quiser, deixe
um comentário no topo do `route.ts` apontando pro `gerar_proposta.py` como origem.

---

## 6. Front — componentes a criar

Todos `'use client'`. Reproduza o design dos JSX em `design-reference/`. Resumo do que cada um faz
(detalhes completos nos JSX):

### 6.1 `components/LivesView.tsx`
A view do dashboard. Estrutura (de cima pra baixo), classe raiz `.lives-wrap`:
1. **`PropostaPanel`** (topo, `.proposta-panel`) — só aparece se houver lives `proposta`/`confirmada`.
   Grid de 7 dias com merchan+nome, status pill, botões **aprovar**/**descartar** por dia e **Aprovar
   tudo**. Clicar no dia abre o `LiveModal`.
   - **➕ ADICIONAR (não está no design):** um botão **"Gerar proposta da semana"** que chama
     `POST /api/lives/gerar-proposta`. Estado de loading enquanto gera. Ao voltar, atualiza `lives`
     com as linhas novas e mostra o painel. Se a resposta trouxer `puladas`, avise (ex: toast/linha
     de texto: "X dias não foram alterados porque já estavam confirmados/realizados"). Posicione o
     botão no cabeçalho do painel, ao lado de "Aprovar tudo" (ou, se não houver proposta ainda,
     mostre um **empty-state** com o botão: "Nenhuma proposta ainda — gere a da próxima semana").
2. **Barra de período** (`.lives-period-bar`) — botões 7/30/90/365/all (`view-toggle`), contador de
   lives, botão **"Gerenciar merchans"** (abre `MerchansModal`).
3. **KPIs** (`.lives-kpis lives-kpis-3`) — receita total, média/live, melhor live. Use `liveKpis`.
4. **Métricas secundárias** (`.lives-kpis-secondary`) — % UTM, alcance (só se houver dado).
5. **Performance por merchan** — `MerchanBars` (barras horizontais de receita média) + `MerchanScatter`
   (uso × receita, com legenda de quadrantes). Use `perMerchanMetrics`.
6. **Heatmap** (`.live-card full`) — dia-da-semana × merchan (top 10 por uso). Grid custom, sem
   recharts. Use `heatmapMatrix`.
7. **Tendência** (`.lives-grid lives-grid-trend`) — `WeeklyTrend` (área, `weeklyTrend`) +
   `MonthVsPrev` (`monthVsPrev`).
8. **Tabela** (`.live-table`) com busca + filtros (merchan, status) → clique abre `LiveModal`.

Props sugeridas: `{ lives, merchans, onLiveClick, onNewLive, onOpenMerchans, onApproveProposta,
onApproveAll, onDiscardProposta, onGenerateProposta }`.

### 6.2 `components/LiveModal.tsx`
Espelha o `PostModal` existente (`.modal-backdrop`/`.modal`/`.modal-body`/`.col`/`.modal-grid`).
Campos: data, CUPOM 1 (`MerchanSelect` + nominal + receita, obrigatório), CUPOM 2 (idem, opcional,
**desabilitado se o merchan1 for `sempreSozinho`**), total auto (`receita1+receita2`) + checkboxes
`cupomLigado`/`criativo`, receita UTM + % UTM (readonly) + alcance, notes, recap (se
`realizada` e total>0), status select (`LIVE_STATUSES`). Footer Salvar/Excluir/Cancelar.
Inclui os sub-componentes `LiveStatusSelect` e `MerchanSelect` (com busca + "Novo merchan" inline →
`onAddMerchan`). Props: `{ live, merchans, onClose, onSave, onDelete, onAddMerchan }`.

### 6.3 `components/MerchansModal.tsx`
Catálogo de merchans (`.modal-merchans`). Lista com toggles `ativo`/`forte`/`sempreSozinho`
(`.flag-pill`), rename inline, "Novo merchan", delete (só se 0 lives usam). Busca + "mostrar
inativos". Props: `{ merchans, lives, onClose, onChange, onAdd, onRename, onDelete }`.
**Esses flags alimentam o algoritmo (§5)** — deixe isso claro no rodapé (o design já tem o texto).

---

## 7. Wiring

### 7.1 `app/page.tsx`
Adicione ao `Promise.all`:
```ts
supabase.from('lives').select('*').order('date', { ascending: true }),
supabase.from('merchans').select('*').order('nome', { ascending: true }),
```
Mapeie com `dbToLive`/`dbToMerchan` e passe `initialLives` / `initialMerchans` ao `SocialHubApp`.

### 7.2 `components/SocialHubApp.tsx`
Siga **exatamente** o padrão de `posts`/`products` (otimista + Supabase):
- Estado: `const [lives, setLives] = useState(initialLives)`, idem `merchans`.
- Props novas: `initialLives: Live[]`, `initialMerchans: Merchan[]`.
- Handlers (espelhar `savePost`/`createPost`/`deletePost`):
  - `saveLive(l)` → otimista + `supabase.from('lives').update(liveToDb(rest)).eq('id', id)`.
  - `createLive(defaults)` → `insert(...).select().single()` + abre modal. Default `status:'confirmada'`,
    `origem:'manual'`, `date: today`, `diaSemana` derivado de `WEEKDAY_NOMES[new Date(date).getDay()]`.
  - `deleteLive(l)` → otimista filter + `delete().eq('id')`.
  - `approveLive(l)` → `saveLive({...l, status:'confirmada'})`.
  - `approveAllPropostas()` → todas `proposta` → `confirmada` (update em lote).
  - `discardProposta(l)` → `deleteLive(l)`.
  - `generateProposta()` → `fetch('/api/lives/gerar-proposta', { method:'POST', body: JSON.stringify({ semana }) })`
    → ao voltar, recarregue as lives afetadas no estado (merge por `date`/`id`). Trate `puladas`.
  - `onAddMerchan(nome)` → `insert({nome, ativo:true, forte:false, sempre_sozinho:false}).select().single()`,
    devolve o `Merchan` mapeado (com `color`/`short` via `dbToMerchan`), atualiza `merchans`. Se já
    existir (nome igual), retorna o existente (espelha `onAddProduct`).
  - `saveMerchan(m, patch)` → `update(merchanToDb).eq('id')`.
  - `renameMerchan(m, novoNome)` → atualiza `merchans.nome` **e cascateia** `lives.merchan1/merchan2`
    que usavam o nome antigo (update das lives afetadas no banco + estado).
  - `deleteMerchan(m)` → só se nenhuma live usa; `delete().eq('id')`.
- **Sidebar:** crie uma seção **"Performance"** (nova `.sb-section` com `.sb-label`) — ou coloque o
  item em "Planejamento" se preferir — com `{ id:'lives', label:'Lives', icon:<Icon.mh /> }` e count =
  `lives.filter(l => l.status==='realizada').length`. Adicione `lives` em `viewTitles`
  (ex: `{ title:'Lives', sub:'Performance · Proposta semanal' }`).
- **Render:** `view === 'lives' && <LivesView … />`; e os modais `<LiveModal>` / `<MerchansModal>`
  controlados por estado (`activeLive`, `merchansOpen`), no mesmo lugar onde `PostModal` é renderizado.

> Não há ícone de "broadcast" no `Icon` do projeto; use `Icon.mh` (gráfico) ou adicione um novo ícone
> em `components/Icons.tsx` se quiser fidelidade ao design (o design usava um ícone de transmissão).

---

## 8. Convenções do projeto (siga)

- `'use client'` no topo de todo componente com hooks/eventos.
- Imports absolutos com `@/` (ex: `@/lib/types`, `@/lib/livesUtils`).
- Otimismo + Supabase: atualize o estado local primeiro, depois persista (como `savePost`).
- Cores: tokens OKLCH do `socialhub.css` (`--accent`, `--ink`, `--surface`, `--line`, `--line-2`,
  `--surface-2/3`, status colors). **Não** use `--line-strong` (não existe aqui).
- Datas: strings `YYYY-MM-DD`. Use `todayISO()` de `@/lib/types`. Para dia-da-semana use
  `new Date(iso + 'T00:00:00').getDay()` + `WEEKDAY_LABELS`/`WEEKDAY_NOMES`.
- Não crie arquivos `.md` de doc sem pedir.

---

## 9. Verificação (ponta a ponta)

1. `npm install && npm run dev`; logar; abrir **Performance → Lives** na sidebar.
2. KPIs batem com número conhecido: **melhor live ≈ R$551.676 em 28/11/2025** (Black Friday).
3. Filtros de período/status e busca funcionam; clicar numa linha abre o `LiveModal` e salva (recarregar confirma persistência).
4. **Gerar proposta:** clicar "Gerar proposta da semana" → 7 linhas `proposta` aparecem no painel;
   respeitam as regras (sem merchan repetido em dias seguidos, sem 2 triplos seguidos, máx 1 dia com
   cupom 2, saturação ≤2). Rodar de novo na mesma semana **não duplica** (upsert por `date`).
5. Aprovar (`proposta → confirmada`) reflete no banco; rodar a proposta de novo **não sobrescreve**
   linhas `confirmada`/`realizada` (devem vir em `puladas`).
6. `MerchansModal`: marcar um merchan como `forte`/`sempreSozinho`/`ativo` persiste; gerar a proposta
   passa a respeitar (regras data-driven — lê da tabela `merchans`).

---

## 10. Ordem sugerida

1. Conferir §2 (base pronta — **a API route já está implementada**, é só consumir). 2. `app/page.tsx`
fetch. 3. Wiring no `SocialHubApp` (estado/handlers/sidebar/render). 4. `LiveModal` + `MerchansModal`.
5. `LivesView` (filtros → painel+botão gerar → KPIs → tabela → gráficos). 6. Verificação §9.

> **Antes de começar o front:** rode `npx tsc --noEmit` e veja se aparece o erro em
> `SocialHubApp.tsx` reclamando que `'lives'` está faltando em `viewTitles`. **É esperado** — adicione
> `lives: { title:'Lives', sub:'Performance · Proposta semanal' }` no `viewTitles` (passo do wiring).
> Esse erro existe porque `'lives'` foi adicionado ao union `AppView` mas o front ainda não foi
> wirado.
