# Stories — Handoff

Nova visão de calendário focada em Stories, com modo **Calendário** + modo **Lista**, integrada ao SocialHub.

## 📦 Conteúdo deste pacote

| Arquivo | Estado | O que faz |
|---|---|---|
| `socialhub-stories.jsx` | **novo** | Toda a feature de Stories: dados mock, view, calendário, lista expansível, modal de criação |
| `socialhub.css` | **patch** | Bloco `STORIES VIEW` no final do arquivo + tweak de padding em `.list-row` (escopado em `.stories-list`) |
| `socialhub-app.jsx` | **patch** | Adiciona item "Stories" na sidebar (Calendários), título da view, e route `view === 'stories'` |
| `socialhub-icons.jsx` | **patch** | Adiciona `Icon.stories` (alvo concêntrico tracejado) |
| `SocialHub.html` | **patch** | Carrega `socialhub-stories.jsx` antes de `socialhub-app.jsx` |

> Os 4 arquivos do core (`html`, `app.jsx`, `icons.jsx`, `css`) já refletem o estado final — basta sobrescrever os do projeto.

---

## 🎯 Especificação implementada

### Calendário
Modal de novo / editar story com:
- Data
- Hora
- Produto foco (dropdown)
- Categoria (chips coloridos)
- Status (Não iniciado, Em andamento, Feito, Postado, Não postado)
- Link do conteúdo
- Link CTA

### Lista (card expansível inline, estilo Campanhas)
Colunas: **Código**, Data, Hora, Produto foco, Categoria, Receita, Sessões, Transações, Status, Links, ações.

**Código** = junção da data + hora do post no formato `YYYYMMDDHH`:
- `2026051510` → 15/05/2026, às 10h

Métricas (Receita do Story, Sessões totais, Transações) só aparecem quando `status === 'postado'`.

---

## 🏗️ Estrutura do arquivo `socialhub-stories.jsx`

```
┌─ Constants
│   ├── STORY_CATEGORIES   ← editar lista de categorias aqui
│   ├── STORY_STATUSES     ← 5 status fixos da spec
│   └── PRODUTOS_FOCO      ← lista de produtos foco do dropdown
│
├─ Helpers
│   ├── storyCode(iso, time)        → "2026051510"
│   ├── storyCodePretty(iso, time)  → "15/05/2026, às 10h"
│   ├── fmtBRL(n) / fmtInt(n)
│   └── genMockStories()            ← 30 stories mockados
│
├─ Sub-components
│   ├── <StoryStatusPill />
│   ├── <StoryCategoryChip />
│   ├── <StoryDot />               ← chip dentro de uma cell do calendário
│   ├── <StoriesCalendarGrid />    ← grade mensal
│   ├── <StoryExpandedCard />      ← card de edição inline na lista
│   ├── <StoriesList />            ← lista com expansão inline
│   └── <StoryModal />             ← modal usado só no modo calendário
│
└─ <StoriesView />  ← exportado pra window
```

### Convenções importantes

- `useStateS`, `useMemoS`, `useEffectS` — aliases locais pra evitar colisão de nome com outros arquivos Babel.
- Toda a UI usa o sistema visual existente (`--accent`, `--ink`, `--surface`, classes `.list`, `.list-row`, `.field`, `.btn` etc).
- O componente `GenericSelect` é reaproveitado de `socialhub-modal.jsx`.
- O ícone `Icon.x.x` é reaproveitado de `socialhub-icons.jsx`.

---

## 🔌 Como integrar

Se for portar pra um projeto novo (não-protótipo):

```html
<!-- depois dos outros scripts SocialHub, antes do app principal -->
<script type="text/babel" data-presets="env,react" src="socialhub-stories.jsx"></script>
```

```jsx
// socialhub-app.jsx
{view === 'stories' && <StoriesView />}
```

```jsx
// sidebar — dentro do bloco "Calendários"
{ id: 'stories', label: 'Stories', icon: <Icon.stories /> }
```

---

## 🔀 Pontos de extensão sugeridos

| Quero… | Mexer em… |
|---|---|
| Trocar a lista de produtos foco por dados reais | `PRODUTOS_FOCO` (array de strings) |
| Adicionar/renomear categorias | `STORY_CATEGORIES` (id, label, color em `oklch`) |
| Conectar a um backend / Firebase / API | Substituir `genMockStories()` por um `useEffect` que faz fetch e seta `stories`. `saveStory` / `deleteStory` em `<StoriesView>` são os hooks de mutação |
| Permitir ordenar por click no header da lista | Já existe `sortKey`/`sortDir` em `<StoriesView>`, falta apenas onClick nos `<div className="cell">` do `list-head` |
| Adicionar campo "Pré-visualização" (imagem) | Adicionar coluna na `LIST_GRID_COLS` + campo no `<StoryExpandedCard>` e `<StoryModal>` |
| Exportar CSV | Iterar `sortedList` e juntar com `storyCode()` + `fmtBR()` |

---

## 🎨 Tokens visuais usados

| Categoria | Cor base |
|---|---|
| ASMR | rosa `oklch(0.65 0.16 320)` |
| Trends | roxo `oklch(0.6 0.16 265)` |
| Bastidores | mostarda `oklch(0.65 0.14 60)` |
| Produto | verde `oklch(0.6 0.15 150)` |
| Promoção | vermelho `oklch(0.6 0.18 25)` |
| Branding | violeta `oklch(0.55 0.15 285)` |
| Engajamento | ciano `oklch(0.62 0.13 210)` |

| Status | Cor |
|---|---|
| Não iniciado | cinza |
| Em andamento | amarelo |
| Feito | azul |
| Postado | verde |
| Não postado | vermelho dessaturado |

Todas as cores são derivadas via `color-mix(in oklab, ...)` pra manter contraste consistente com o resto do app.

---

## 📋 Mock data

30 stories distribuídos no mês atual + alguns no próximo mês.

- Stories no passado → status `postado` (ou `naoPostado` em 1/6)
- Hoje → mix de `feito` / `andamento`
- Futuro → `naoIniciado` (maioria), com alguns `andamento` / `feito`
- Apenas stories `postados` têm métricas (Receita, Sessões, Transações)

Pra testar o fluxo da lista expansível, basta clicar numa row.

---

## 🐛 Conhecidos / nice-to-haves

- [ ] Ordenação da lista por clique nos headers (lógica pronta, falta UI)
- [ ] Filtro por produto foco (hoje só categoria + status + busca textual)
- [ ] Bulk actions na lista (selecionar várias, marcar como postado)
- [ ] Validação de formulário no modal (hoje aceita tudo)
- [ ] Sincronizar com o storage de `posts` principal — hoje Stories vivem em estado isolado dentro de `<StoriesView>`
