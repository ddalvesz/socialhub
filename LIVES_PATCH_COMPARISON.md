# Patch — Gráfico de comparação de períodos (Lives)

> Adição posterior ao `LIVES_HANDOFF.md` original. Substitui a seção **"Tendência temporal"**
> (que tinha 2 cards lado a lado: `WeeklyTrend` + `MonthVsPrev`) por **um único gráfico
> comparativo full-width** que reage ao filtro de período (7/30/90 dias). Para 12 meses / Tudo /
> Personalizado, mostra um fallback de barras de receita semanal sem comparação.

---

## 1. O que muda na UX

### Antes (já implementado pelo VSCode agent na primeira passada)
- Logo abaixo do Heatmap havia uma seção **"Tendência temporal"** com 2 cards lado a lado:
  - `WeeklyTrend` (área de receita semana a semana)
  - `MonthVsPrev` (card de "mês atual vs anterior" com pill de delta)

### Depois (este patch)
- A seção temporal é **movida pra cima** — vira a **primeira seção de análise**, antes de
  "Performance por merchan". Lógica: o time abre a view querendo saber "como tá indo no período?"
  e tem essa resposta de cara, em vez de scrollar até o final.
- O card antigo `MonthVsPrev` é **removido da view** (a função `monthVsPrev` em `livesUtils.ts`
  permanece exportada — não dá pra apagar sem quebrar import, e pode ser útil noutro lugar).
- O `WeeklyTrend` (área simples sem comparação) também sai. Em seu lugar:
  - **Quando o filtro é 7 / 30 / 90 dias**: gráfico de comparação **período atual vs período
    anterior**, com badge de variação % no canto superior direito do card.
  - **Quando o filtro é 12 meses / Tudo / Personalizado**: gráfico de **barras** de receita por
    semana (fallback simples, sem comparação — porque comparar "tudo" não faz sentido, e o filtro
    customizado não tem um "período anterior" óbvio).

### Resumo do comportamento
| Filtro ativo | Título do card | X-axis | Granularidade | Tem comparação? |
|---|---|---|---|---|
| 7 dias | "Esta semana vs semana passada" | Seg, Ter, Qua, Qui, Sex, Sáb, Dom | por dia | sim |
| 30 dias | "Últimos 30 dias vs 30 anteriores" | Dia 1 … Dia 30 | por dia | sim |
| 90 dias | "Últimos 90 dias vs 90 anteriores" | Sem 1 … Sem 13 | por semana (soma) | sim |
| 12 meses | "Receita semanal" (fallback) | semana ISO | por semana | não |
| Tudo | "Receita semanal" (fallback) | semana ISO | por semana | não |
| Personalizado | "Receita semanal" (fallback) | semana ISO | por semana | não |

---

## 2. O que JÁ está pronto (não refazer)

- **`lib/livesUtils.ts`** — função `periodComparison(lives, period, todayIso)` já foi adicionada.
  Devolve `{ title, curLabel, prevLabel, points, curTotal, prevTotal, delta }` ou `null` se o filtro
  não é 7/30/90 (sinal pro componente cair no fallback).
- **`app/lives.css`** — classes novas já adicionadas: `.cmp-badge`, `.cmp-badge.up`,
  `.cmp-badge.down`, `.cmp-legend`, `.cmp-legend-item`, `.cmp-swatch`, `.cmp-swatch.cur`,
  `.cmp-swatch.prev`. (Ver bloco "COMPARAÇÃO DE PERÍODOS — badge, legenda, swatches".)
- **`design-reference/socialhub-lives-view.jsx`** — versão v2 com os componentes novos
  (`PeriodComparison`, `CompareTooltip`, `CmpBadge`, `WeeklyBars`). Use como referência visual.
- **`design-reference/socialhub-lives.css`** — versão v2 do CSS (mesmas classes que já portei).
- **`design-reference/socialhub-lives-data.jsx`** — versão v2 com a função `periodComparison` em JS
  (já portada pra TS em `livesUtils.ts`, é só referência).

---

## 3. O que você precisa fazer em `components/LivesView.tsx`

### 3.1 Adicionar 4 sub-componentes no arquivo (ou em arquivos novos, como preferir)

**a) `CompareTooltip`** — tooltip customizado do recharts pra mostrar atual + anterior + os
swatches. Espera `payload[0].payload.cur` e `.prev`. Recebe `curLabel` / `prevLabel` por props
(porque mudam com o filtro). Markup já desenhado no JSX de referência.

**b) `CmpBadge`** — recebe `delta: number | null`. Se `null`, não renderiza. Se ≥0 → `cmp-badge up`
com "+X%". Se <0 → `cmp-badge down` com "−X%". Vai no `action` do `DashCard`.

**c) `PeriodComparison`** — o gráfico em si. Usa `ComposedChart` do recharts com:
- `Area` (dataKey="cur", `stroke=LIVES_ACCENT`, `fill="url(#cmpAreaGrad)"`, `strokeWidth={2}`,
  `dot={false}`, `connectNulls={false}` — importante pra dias futuros aparecerem como gap).
- `Line` (dataKey="prev", `stroke=LIVES_INK_3`, `strokeDasharray="4 3"`, `strokeWidth={1.5}`,
  `dot={false}`).
- `<defs><linearGradient id="cmpAreaGrad" …>` com 22% → 3% de opacidade do accent.
- Tooltip = `<CompareTooltip curLabel={cmp.curLabel} prevLabel={cmp.prevLabel} />`.
- Depois do `<ResponsiveContainer>`, uma `<div className="cmp-legend">` com 2 itens (cur + prev).

**d) `WeeklyBars`** (fallback) — `BarChart` simples de `data` (que vem do `weeklyTrend(livesInPeriod)`
existente), `dataKey="total"`, `fill={LIVES_ACCENT}`, `barSize={13}`, `radius=[4,4,0,0]`. Tooltip =
`<WeekTooltip />` (já existe).

> Use `import { ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'` —
> a versão do recharts no projeto é a v3, mas a API desses componentes é igual à v2 que o design usou.

### 3.2 Mudanças no componente `LivesView` (principal)

**a)** Importar `periodComparison` de `@/lib/livesUtils`:
```ts
import {
  /* ...as existing imports... */,
  periodComparison,
  type PeriodComparisonData,
} from '@/lib/livesUtils'
```

**b)** Adicionar o memo:
```ts
const cmp = useMemo(() => periodComparison(lives, period, today), [lives, period, today])
```
(Mantenha o `weekly` que já existe — agora ele é só pro fallback `WeeklyBars`.)

**c)** Mover a seção temporal pra **antes** de "Performance por merchan", e substituir o bloco
existente de "Tendência temporal" (que hoje tem `lives-grid lives-grid-trend` com `WeeklyTrend` +
`MonthVsPrev`) por:

```tsx
<div className="lives-section-title">
  {cmp ? 'Comparação de períodos' : 'Tendência temporal'}
  <span className="sub">
    {cmp
      ? 'período atual vs período anterior · reage ao filtro acima'
      : 'receita semana a semana · selecione 7, 30 ou 90 dias para comparar períodos'}
  </span>
</div>
<DashCard
  title={cmp ? cmp.title : 'Receita semanal'}
  hint={cmp
    ? `${fmtBRLk(cmp.curTotal)} no período atual · ${fmtBRLk(cmp.prevTotal)} no anterior`
    : `período: ${period === 'all' ? 'jan/2025 → hoje' : `últimos ${period === 365 ? '12 meses' : period + ' dias'}`}`}
  action={cmp ? <CmpBadge delta={cmp.delta} /> : null}
  full>
  {cmp ? <PeriodComparison cmp={cmp} /> : <WeeklyBars data={weekly} />}
</DashCard>
```

**d)** **Remover** o bloco antigo de `lives-grid-trend` com `<WeeklyTrend>` + `<MonthVsPrev>`
(que ficava depois do Heatmap). O `MonthVsPrev` não aparece mais na tela — a comparação periódica
substitui essa função informacional.

### 3.3 Ordem final das seções dentro de `LivesView` (de cima pra baixo)

1. `PropostaPanel` (topo, accent)
2. Barra de período + "Gerenciar merchans"
3. KPIs (`lives-kpis-3`)
4. Métricas secundárias (UTM/alcance)
5. **← NOVA POSIÇÃO** `lives-section-title` "Comparação de períodos" + `DashCard` full com
   `PeriodComparison` ou `WeeklyBars`
6. `lives-section-title` "Performance por merchan" + grid (`MerchanBars` + `MerchanScatter`)
7. `DashCard` full do `Heatmap`
8. `lives-section-title` "Histórico de lives" + filtros + `LivesTable`

(A seção antiga "Tendência temporal" entre 7 e 8 deixa de existir.)

---

## 4. Detalhes finos importantes

### 4.1 `connectNulls={false}` na Area (period=7)
No filtro de 7 dias, dias **futuros da semana atual** (quarta-feira em diante, se hoje for terça)
têm `cur: null`. O `connectNulls={false}` faz a área parar visualmente no último dia já ocorrido —
em vez de cair pra zero e voltar. É o detalhe que faz o gráfico não mentir.

### 4.2 Badge oculto quando não há comparação
Se `cmp.delta === null` (sem dados em um dos lados), o `CmpBadge` não renderiza (return `null`).
Não exibe "0%" nem "—" — só some.

### 4.3 Cor do badge
- Positivo (`up`): verde — **mesma cor do status "Realizada"** (`oklch(0.42 0.13 150)`). Consistente
  com o resto da UI.
- Negativo (`down`): vermelho (`oklch(0.5 0.15 25)`).

### 4.4 90 dias agrega por semana
Não tente mostrar 90 pontos no eixo X (vira papelão). A função `periodComparison` já faz a agregação
de 13 semanas — confie nos `points` que ela devolve.

### 4.5 O cálculo do `dow` no filtro de 7 dias
```ts
const dow = (today.getDay() + 6) % 7  // 0 = segunda
```
Converte de "domingo=0" (`Date.getDay()`) pra "segunda=0". A semana exibida é **Seg→Dom**, e a
âncora é a segunda da semana de hoje. Se hoje for sexta, mostra Seg/Ter/Qua/Qui/Sex (com valor) +
Sáb/Dom (`null` em `cur`).

---

## 5. Verificação

1. `npx tsc --noEmit` — deve passar (a função TS já foi adicionada e tipechada).
2. Abrir a view de Lives e mudar o filtro:
   - **7 dias** → título "Esta semana vs semana passada", X-axis Seg…Dom, área + linha tracejada.
   - **30 dias** → "Últimos 30 dias vs 30 anteriores", X-axis "Dia 1"…"Dia 30".
   - **90 dias** → "Últimos 90 dias vs 90 anteriores", X-axis "Sem 1"…"Sem 13".
   - **12 meses / Tudo** → "Receita semanal" (barras), sem badge.
3. Conferir que o badge **fica verde** em períodos de crescimento e **vermelho** em queda.
4. Conferir que "Mês atual vs anterior" **não aparece mais** na view (era um card duplicado em
   função).
5. Hover no gráfico mostra ambos os valores (atual + anterior) no tooltip com os swatches certos.
