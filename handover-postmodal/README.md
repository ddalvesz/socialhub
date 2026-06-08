# PostModal — Design Handoff

Handoff completo do **PostModal** (Novo / Editar post) do SocialHub na nova arquitetura de 2 colunas.

> Esta é uma especificação **pixel-perfect**. Use junto com `postmodal-annotated.html` (visual anotado com medidas) e `postmodal.css` (CSS extraído).

---

## 📐 1. Estrutura geral

```
┌─────────────────────────────────────────────────────────────────┐
│  [40px] Título do post                            [34px] ✕     │  ← Header
│         Status pill   #0014                                     │  
├─────────────────────────────────────────────────────────────────┤
│                              │                                   │
│  DETALHES                    │  CONTEÚDO                        │  ← Section heads
│  ─────────                   │  ─────────                       │
│  Dono             [select]   │  Legenda                         │  
│  Plataforma       [select]   │  ┌─────────────────────────────┐ │  
│  Data e hora      [in][in]   │  │                             │ │  
│  Tipo             [select]   │  │  textarea grande            │ │  
│  Produto          [input ]   │  │                             │ │  
│  Linha editorial  [select]   │  └─────────────────────────────┘ │  
│  Campanha         [select]   │                                  │  
│  Tags             [chips ]   │  Link da mídia                   │  
│  Complexidade     ★★★☆☆    │  [▶ https://...                ] │  
│                              │                                   │  
│  background:                 │  Link da capa  (se Reels)        │  
│  --surface-2                 │  [🖼  https://...               ] │  
│                              │                                   │  
│                              │  Link de referência              │  
│                              │  [📄 https://...               ] │  
│                              │                                   │  
│                              │  Link do Post                    │  
│                              │  [🌐 https://...               ] │  
│                              │                                   │  
│                              │  Observações                     │  
│                              │  [textarea pequeno          ]    │  
│                              │                                   │  
├──────────────────────────────┴──────────────────────────────────┤
│  🗑 Excluir   📋 Duplicar              Cancelar [Salvar→]      │  ← Footer
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 2. Dimensões do container

| Propriedade | Valor |
|---|---|
| Width | `min(1000px, calc(100vw - 40px))` |
| Max height | `calc(100vh - 60px)` |
| Border-radius | **20px** |
| Box-shadow | `0 28px 70px rgba(40,30,60,.18), 0 6px 20px rgba(40,30,60,.08)` |
| Animation entrada | `slideUp .22s ease-out` (opacity + 10px translateY) |
| Z-index | 50 |

**Backdrop:** `rgba(30,20,50,.35)` + `backdrop-filter: blur(2px)`

---

## 🎨 3. Cores das superfícies

Diferença sutil de cor entre as 3 áreas (header/footer/left vs right):

| Área | Token | OKLCH | Hex aprox |
|---|---|---|---|
| **Modal base (header, RIGHT col)** | `--surface` | `#ffffff` | `#FFFFFF` |
| **LEFT col (Detalhes), Footer** | `--surface-2` | `oklch(0.975 0.006 300)` | `#F8F6F8` |
| **Linhas/divisores** | `--line` | `oklch(0.94 0.01 300)` | `#EFEDF0` |

A diferença é intencional e sutil — não é cinza forte. Cria uma sensação de "metadata vs conteúdo" sem brigar com a hierarquia.

---

## 📏 4. Header (modal-head)

```
┌──────────────────────────────────────────────────┐
│ ↕22px                                            │
│ [40px] Título do post ←  flex:1            [✕]  │
│  ↕14px                                           │
│        [Em produção ▼]   #0014                   │
│ ↕18px                                            │
├──────────────────────────────────────────────────┤
```

| Item | Valor |
|---|---|
| Padding | **22px 26px 18px** |
| Gap horizontal | 14px |
| Align-items | flex-start |
| Border-bottom | `1px solid --line` |

### Platform mark (ícone canto superior esquerdo)
- Tamanho: **40×40 px**
- Border-radius: **12 px**
- Background: cor da plataforma (`--c-ig-fg`, `--c-tt-fg`, etc.)
- Ícone interno: 20×20, white

### Título input
- Font: **18 px / 700 / DM Sans / -0.015em letter-spacing**
- Border: none (apenas `border-bottom: 1px solid --accent` no focus)
- Padding: `2px 0`
- Color: `--ink`

### Status pill + código
- Status pill: `5px 12px` padding, `999px` radius, **12 px** font, peso 500
- Status pill dot: **7×7 px**, mesma cor do status
- Código: **11 px / JetBrains Mono / --ink-3**, prefixo `#` + 4 dígitos

### Botão fechar
- Tamanho: **34×34 px**
- Border-radius: **999px**
- Hover: bg `--accent-softer`, color `--ink`
- Ícone X: 18×18

---

## 🗂 5. Body — Grid de 2 colunas

```css
.modal.modal-post .modal-body {
  display: grid;
  grid-template-columns: 1fr 1.05fr;   /* RIGHT levemente maior */
  padding: 0;                          /* cols cuidam do próprio padding */
  gap: 0;
  overflow: hidden;
}
```

**Divisor entre colunas:** `border-right: 1px solid --line` na LEFT.

Cada coluna tem `overflow-y: auto` — rolam **independentemente**.

---

## 📋 6. Section heads ("DETALHES" / "CONTEÚDO")

| Propriedade | Valor |
|---|---|
| Font | **10.5 px / 600 / DM Sans** |
| Letter-spacing | `0.08em` |
| Text-transform | `uppercase` |
| Color | `--ink-3` |
| Margin-bottom | **16 px** |
| Ícone | 13×13, mesma cor (`--ink-3`), gap 8px |

Ícones usados:
- **Detalhes** → `Icon.settings` (engrenagem)
- **Conteúdo** → `Icon.branding` (estrela)

---

## ◀️ 7. Coluna LEFT — DETALHES

| Propriedade | Valor |
|---|---|
| Background | `--surface-2` |
| Padding | **20px 24px 22px** |
| Border-right | `1px solid --line` |
| Grid template | `110px 1fr` |
| Row gap | **12 px** |
| Column gap | **14 px** |

### Campos (ordem):
1. **Dono** — `GenericSelect`, width 100%
2. **Plataforma** — `PlatformSelect` envolto em `.field-wrap`, width 100%
3. **Data e hora** — `.field-inline` com `flex-wrap: nowrap`:
   - Date input: `flex: 1 1 0` (preenche)
   - Time input: `flex: 0 0 100px` (fixo)
4. **Tipo** — `GenericSelect`
5. **Produto** — `<input class="field">`, placeholder "ex: Carteira Care..."
6. **Linha editorial** — `GenericSelect`
7. **Campanha** — `GenericSelect`, placeholder "Sem campanha"
8. **Tags** — `TagsField` (label alinhado ao topo, `align-self: flex-start; padding-top: 8px`)
9. **Complexidade** — Stars (5×24px) + texto "N/5" em 12px/ink-3

### Override importante:
Todos os campos/buttons direto do grid forçam `width: 100%` (override de `width` default do GenericSelect/PlatformSelect):

```css
.modal.modal-post .col.left .modal-grid > .field { width: 100% !important; min-width: 0; }
.modal.modal-post .col.left .modal-grid > .field-wrap button.field {
  width: 100% !important; justify-content: space-between;
}
```

---

## ▶️ 8. Coluna RIGHT — CONTEÚDO

| Propriedade | Valor |
|---|---|
| Background | `--surface` |
| Padding | **20px 24px 22px** |
| Estrutura | `.stacked` por campo (label em cima, field embaixo) |
| Gap entre campos | **14 px** (`.stacked + .stacked { margin-top: 14px }`) |
| Margin entre label e field | **6 px** |

### Campos (ordem):
1. **Legenda** — `<textarea class="field legenda">`, min-height **140 px**
2. **Link da mídia** — link-field, ícone `Icon.media` (play triangle)
3. **Link da capa** — *condicional* `draft.type === 'Reels'`, ícone `Icon.cover` (image), label tem hint "capa do Reels" em ink-4/11px
4. **Link de referência** — link-field, ícone `Icon.ref` (document)
5. **Link do Post** — link-field, ícone `Icon.post` (globe)
6. **Observações** — `<textarea>`, rows={2}, min-height 80 px

### Link field (com ícone)

```
┌─────────────────────────────────────────────────┐
│  [▶  ] 10px gap  https://...                    │
│ ┌───┬─────────────────────────────────────────┐ │
│ │14×│ borderless transparent input            │ │
│ │14 │                                          │ │
│ └───┴─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
   ↑                                            ↑
   padding-left: 12px              padding-right: 12px
```

| Propriedade | Valor |
|---|---|
| Display | `flex`, align-items center |
| Gap | **10 px** |
| Padding | `9px 12px` (mesmo do `.field` base) |
| Ícone | **14×14 px**, `--ink-3`, `flex: 0 0 14px` |
| Input | borderless, transparent, font 13.5px, padding 0 |
| Focus-within | border-color → `--accent` |

---

## 🔣 9. Anatomia do `.field` (base)

```
┌────────────────────────────────┐
│ ↕9px                           │
│ ↔12px     content     ↔12px   │
│ ↕9px                           │
└────────────────────────────────┘

border: 1px solid var(--line)
border-radius: 7px
background: white
font: 13.5px DM Sans
transition: border-color .15s

:focus → border-color: var(--accent)
```

---

## 🦶 10. Footer (modal-foot)

| Propriedade | Valor |
|---|---|
| Padding | **16px 26px** |
| Border-top | `1px solid --line` |
| Background | `--surface-2` |
| Display | flex, align-items center, gap **10 px** |

### Botões (ordem):
1. **Excluir** — `.danger`: ink-3, sem borda, padding `8px 12px`, radius 7px, hover bg `--surface-3` + color red
2. **Duplicar** — `.btn .btn-ghost`: borda `1px solid --line`, padding `9px 16px`, radius **999px**
3. `flex: 1` spacer
4. **Cancelar** — `.btn .btn-ghost`
5. **Salvar alterações** — `.btn .btn-accent`: background `linear-gradient(135deg, oklch(0.78 0.13 40), oklch(0.72 0.16 55))`, color white

Ícones nos botões: 14×14 px, gap 6-7px.

---

## 📱 11. Responsivo

```css
@media (max-width: 900px) {
  .modal.modal-post { width: calc(100vw - 24px) }
  .modal.modal-post .modal-body {
    grid-template-columns: 1fr;       /* colapsa pra 1 coluna */
  }
  .modal.modal-post .col.left {
    border-right: none;
    border-bottom: 1px solid var(--line);   /* divisor passa pra horizontal */
  }
}
```

Comportamento: abaixo de 900px, as duas colunas viram seções empilhadas. Detalhes em cima, Conteúdo embaixo.

---

## 🎨 12. Tokens de design completos

```css
/* Superfícies */
--surface:   #ffffff;
--surface-2: oklch(0.975 0.006 300);    /* LEFT col, footer */
--surface-3: oklch(0.96  0.008 300);

/* Tipografia (ink scale) */
--ink:   oklch(0.22 0.02  300);   /* texto principal */
--ink-2: oklch(0.42 0.015 300);   /* texto secundário */
--ink-3: oklch(0.62 0.012 300);   /* labels, section heads */
--ink-4: oklch(0.78 0.01  300);   /* hints, placeholders */

/* Linhas */
--line:   oklch(0.94 0.01  300);
--line-2: oklch(0.90 0.012 300);

/* Accent (laranja-coral da marca) */
--accent:        oklch(0.72 0.16 55);
--accent-deep:   oklch(0.62 0.18 50);
--accent-soft:   oklch(0.94 0.05 60);
--accent-softer: oklch(0.975 0.025 65);
--accent-gradient: linear-gradient(135deg, oklch(0.78 0.13 40) 0%, oklch(0.72 0.16 55) 100%);

/* Status */
--s-prod:   oklch(0.62 0.13 75);   /* amarelo  */
--s-sched:  oklch(0.6  0.13 265);  /* azul     */
--s-pub:    oklch(0.6  0.13 150);  /* verde    */
--s-cancel: oklch(0.6  0.05 25);   /* cinza-red */

/* Radii */
--radius:    14px;
--radius-md: 10px;
--radius-sm:  7px;
--radius-xs:  5px;

/* Fonts */
--font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
```

---

## 📁 13. Arquivos neste pacote

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Este documento |
| `postmodal-annotated.html` | **Visual com cotas e medidas anotadas** — abra no navegador |
| `postmodal.css` | Bloco CSS relevante (extraído do `socialhub.css`) |
| `postmodal.jsx` | Componente `PostModal` (extraído) |

---

## 🔧 14. Como integrar / replicar

### No projeto SocialHub (já está aplicado):
Os arquivos no projeto principal já contêm essa versão. A mudança vive em:
- `socialhub-modal.jsx` → função `PostModal` (linhas ~155-275)
- `socialhub.css` → bloco "PostModal — 2-column variant" (linhas ~770-870)
- `socialhub-icons.jsx` → ícones `Icon.media`, `Icon.cover`, `Icon.ref`, `Icon.post`

### Em outro projeto / produção:
1. Importar `postmodal.css` ou copiar o bloco específico
2. Implementar o componente seguindo `postmodal.jsx`
3. Replicar tokens em `:root` se ainda não existem

---

## ⚙️ 15. Estados especiais

- **`Tipo === 'Reels'`** → "Link da capa" aparece entre "Link da mídia" e "Link de referência"
- **`viewport < 900px`** → modal colapsa pra 1 coluna empilhada
- **Focus em qualquer field** → border-color vira `--accent`
- **Hover no botão fechar / status pill** → `--accent-softer` bg
- **Backdrop click** → fecha o modal (`onClose`)
- **Tecla Escape** → fecha o modal (`addEventListener('keydown')`)

---

## ✅ 16. Acessibilidade — pontos a confirmar

- [ ] Foco do teclado precisa ficar visível em todos os `button.field` (talvez adicionar `outline: 2px solid --accent` no focus-visible)
- [ ] Trap de foco dentro do modal quando aberto
- [ ] `aria-label` no botão de fechar (atualmente: "Fechar" via title)
- [ ] Labels associadas via `htmlFor`/`id` (hoje são `<label>` sem associação)
- [ ] Escape funciona ✓
- [ ] Animação respeitar `prefers-reduced-motion`

