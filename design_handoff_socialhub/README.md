# Handoff: SocialHub — Plataforma de Organização de Conteúdo

## Overview

**SocialHub** is a content-organization platform for the Gocase Social Marketing team. It replaces a spreadsheet-based content calendar with a visual, interactive product that unifies post planning across all social platforms (Instagram, TikTok, YouTube/Canal, Twitter), special-date planning (commemorative dates, football events), and campaign management.

The goal is to remove the monthly drudgery of duplicating spreadsheet rows and give the team a clear, fast, visually-readable view of what is going out, when, on which channel, by whom.

## About the Design Files

The files in this bundle are **design references created in HTML/JSX**, not production code to copy directly. They are a working, clickable prototype showing the intended look, structure, and interactions.

The task is to **recreate these designs in the target codebase's existing environment** (likely React/Next.js + a CSS solution, or whatever stack Gocase is already using internally) following the project's established patterns. If there is no existing environment, choose an appropriate stack — React + Tailwind or React + CSS Modules are reasonable defaults — and implement the designs there.

The HTML prototype uses inline `<script type="text/babel">` for fast iteration. **Do not ship this approach.** Convert to proper JSX/TSX files, real component imports, and your codebase's styling system.

## Fidelity

**High-fidelity.** The mockups are pixel-precise with final colors, typography, spacing, and interactions. The developer should recreate the UI pixel-perfectly using the codebase's existing libraries and patterns. All design tokens (colors in `oklch`, spacing, radii, etc.) are documented below and live in `styles.css`.

---

## Screens / Views

The app uses a fixed sidebar + main content layout. The sidebar has two sections (Calendários, Planejamento) and a user widget at the bottom that opens the profile view.

### 1. Calendário do mês (Monthly Calendar)

**Purpose:** The default landing screen. Shows every scheduled/produced/published post across all platforms in a traditional month grid.

**Layout:**
- 7-column CSS grid (`grid-template-columns: repeat(7, minmax(0, 1fr))` — `minmax(0, 1fr)` is critical so long post titles don't expand a column past its share)
- 6 rows of cells (42 cells = ~6 weeks)
- Each cell is min-height 148px, has the day number in the top-left and up to 3 post cards stacked below
- "+N mais" link if more than 3 posts on a day
- Today's cell has the day number in an **orange-gradient pill**

**Day number area:**
- Day number (DM Sans, 14px, weight 600)
- If the day has a commemorative or football event, a small colored dot + event name truncated with ellipsis (e.g., "● Dia das Mães"), and "+N" if more than one event
- Otherwise empty

**Post card (inside a cell):**
- Full-width pastel-tinted pill, height ~24px
- 14×14 platform icon tile on the left (background = platform's brand color)
- Time (10px, monospace-tabular, opacity 0.7)
- Title (12px, weight 500, single-line ellipsis)
- Hover: subtle lift + brightness shift
- **Status overrides** (Duda-requested):
  - `pub` (Published) → green pastel background (`oklch(0.93 0.05 150)`) + strikethrough title
  - `cancel` (Cancelled) → muted red-gray + strikethrough + opacity 0.7
  - `prod` / `sched` → platform-native pastel color

**Platform pastel palette (used as card backgrounds):**
- Instagram: `oklch(0.94 0.045 25)` bg / `oklch(0.42 0.13 25)` text (peach)
- TikTok: `oklch(0.93 0.04 195)` bg / `oklch(0.36 0.08 200)` text (mint)
- Canal (YouTube): `oklch(0.93 0.045 18)` bg / `oklch(0.45 0.16 22)` text (coral)
- Twitter: `oklch(0.93 0.045 230)` bg / `oklch(0.4 0.12 230)` text (soft blue)

**Topbar (above the calendar):**
- Title "Calendário" (DM Sans, 22px, weight 700)
- Subtitle "Todos os canais" (separator + 13.5px ink-3 gray)
- Month-nav pill: `<` "Maio 2026" `>` (rounded 999px, on white)
- "Hoje" button (rounded 999px, white, returns to current month/week)
- View toggle "Mês / Semana" (segmented; active = orange gradient on white text)
- Right side: search box + "Novo post" accent button (orange gradient)

**Filter bar (below topbar):**
- Platform pills: "Todas as redes" + 4 platform pills (color tile + name). Active state = solid dark ink with white text.
- Tag chips: "Todas tags" + Campanha / Branding / MH / Futebol. Active state = soft peach background, peach text.
- Right side: "X posts neste mês" count pill (gray bg, rounded 999px)

### 2. Calendário — Semana (Week View)

**Purpose:** Hour-by-hour view of the current week. Triggered by clicking "Semana" in the view toggle.

**Layout:**
- Top sticky header: 7 day columns + 64px left time-zone column. Each day shows weekday short ("DOM."/"SEG.") + big date number (28px, weight 700). Today gets a 40×40 orange-gradient circle around the number.
- Body: scrollable time grid. Left column = hour labels (06:00 → 23:00). Right = 7 day columns, each with hour-cells (56px each), `border-right: 1px solid line` between columns.
- Today column has a faint peachy background tint
- An **orange "now" line** crosses today's column at the current minute, anchored on the left with a 10px dot
- Posts are absolutely positioned within their day column at `top = (hour + min/60 - 6) × 56px`
- Height varies by complexity rating (40px + complexity×6, min 50px). Posts ≥70px tall also show owner + content type
- Same platform-pastel colors as month view

**Navigation:**
- `<` / `>` move ±7 days
- Label changes to a week range, e.g. "10 – 16 Maio 2026" (or "30 Mai – 5 Jun 2026" if it crosses month boundaries)
- "Hoje" returns to current week

### 3. Calendário — Branding / Máquina de Hits

Same layout as Calendário do mês, filtered by tag (`branding` or `mh`). Máquina de Hits has two extras:
- The post modal exposes a **Produto** field
- A note under the filter bar: "Inclui produto + duplicação entre redes"

### 4. Post Modal (Edit/Create)

Triggered by clicking any post card. Centered modal, 740px wide, rounded 20px.

**Header:**
- Square 40×40 platform-color tile with platform icon (left)
- Editable title in DM Sans 18px weight 700 (inline borderless input)
- Below title: status pill + `#0001` ID
- Close X button on the right (round)

**Body — 2-column grid (140px label / flex value):**
| Field | Type |
|---|---|
| Dono | Select from team (Arno, Lu, Pat, Lara, Sâmia) |
| Plataforma | Platform select |
| Data e horário | `<input type="date">` + `<input type="time">` |
| Tipo de conteúdo | Select — IG shows Reels/Carrossel/Imagem/Story; others show Vídeo/Imagem/Texto |
| Complexidade | 1-5 stars (click to set) |
| **Produto** (MH only) | Free text |
| Tags | Multi-select pills with "+ Tag" add button; searchable popover with inline "Criar 'X'" creation |
| Linha editorial | Select with create-new (Escritório, Produtos, Trends, ASMR, Ads) |
| Campanha | Select with create-new (Copa 2026, Linha Care, Dia dos Namorados, Dia das Mães) |
| Link do conteúdo | URL input |
| Link da referência | URL input |
| Observações | Textarea, 3 rows |

**Footer:**
- Left: "Excluir" (subtle text button)
- Then: "Duplicar" (ghost button — opens platform-picker mini-modal that creates a copy of this post on the chosen platform)
- Right: "Cancelar" (ghost) + "Salvar alterações" (accent / orange-gradient)

### 5. Datas Comemorativas (Commemorative Dates)

**Purpose:** Annual planning calendar for holidays, releases, special events.

**Header filter bar:**
- Type pills: Todas / Futebol / Evento / Filme/Série
- View toggle Lista / Calendário
- "Nova data" button

**List view columns:**
| Col | Content |
|---|---|
| (dot) | Type color dot |
| Nome | Event name (DM Sans 17px, weight ~500) |
| Período | Start → End in `dd/mm/yyyy` (tabular nums) |
| Tipo | Soft-tinted pill (background mixed with white 88%) |
| Pacote | PP / P / M / G pill — PP green, P blue, M amber, G coral |
| Potencial | Checkbox cell (20×20, fills orange-gradient when on) |
| Postado | Same checkbox |
| Formato | Story / Estático / Coleção / Reels / Campanha |

**Calendar view:** Same 7-column grid, but cells show events as full-width pill cards tinted with the type color (`color-mix(in oklab, ${color}, white 88%)`), with the pack chip floated right.

### 6. Futebol 2026

Same structure as Datas Comemorativas but with football-specific types: Aniversário (amber), Brasil (green), Jogo Importante (indigo), Copa (red), Final (pink), Premiação (purple). Past events render at 50% opacity.

### 7. Campanhas (Campaigns)

**Purpose:** Higher-level campaign control: who owns what, when it goes live, current progress.

**Filter bar:** Todas / Aguardando / Lançadas + 4 type pills (Institucional / Coleção / Produto / Data Comemorativa). Count pill on the right.

**List columns:**
| Col | Content |
|---|---|
| Chevron | Rotates 90° when row expanded |
| Campanha | Bold name (DM Sans 17px) |
| Pacote | PP/P/M/G pill |
| Dono | 24px gradient avatar + name |
| Tipo | Tinted pill |
| Mês | Mês foco |
| Data Insta | `dd/mm/yyyy` |
| Status | "Lançado" (green) or "Aguardando" (amber) pill |
| Progresso | Inline orange-gradient progress bar + percent |

**Expanded row** reveals a 4-column grid of metadata (Previsão, Data site, Data Instagram, Data comercial, Data final, Mês, Pacote, Conclusão progress bar), and three actions: **Ver posts vinculados** (accent orange button), Editar campanha (ghost), Excluir (ghost, gray).

### 8. Linked Posts Drawer

Slides in from the right (460px wide) when "Ver posts vinculados" is clicked. Shows the campaign name, pack chip, type chip, and post count in the header. Body lists every post whose `campanha` slug matches, sorted chronologically. Each row: large day number + 3-letter month, post title, time/type/owner meta, platform icon tile on the right. Clicking a post opens its edit modal.

### 9. Profile (`/profile`)

Triggered by clicking the user widget at the bottom of the sidebar.

**Hero card:**
- 96px gradient avatar (or uploaded photo). Camera button overlay (own profile only) opens a hidden file input and reads the image as a data URL into local state.
- Name (DM Sans 26px, weight 700) + "você" pill if it's the current user (orange gradient)
- Role + email + "Na equipe desde dd/mm/yyyy" with calendar icon
- Top-right: "Editar perfil" ghost button (own profile only)
- Decorative orange-gradient blob in the top-right corner

**Stats row:** 4 cards — total posts atribuídos / em produção / agendados / publicados. Big numbers (28px weight 700), small label below.

**Tabs:**
- **Atividades atribuídas** — Filter chips by status, then a list of every post `where owner == profileId`. Each row: large date pillar (day + 3-letter month), platform icon tile, title + meta (time · type · campaign), status pill on the right.
- **Equipe** (own profile only) — Grid of cards (`minmax(220px, 1fr)`) for each colleague. Avatar + name + role + posts-count footer. Click a card to view that profile (read-only; activities only, no Equipe tab, with a "Voltar ao meu perfil" button).

---

## Interactions & Behavior

| Interaction | Behavior |
|---|---|
| Click post in any view | Open edit modal centered, animate `slideUp .22s` + backdrop `fadeIn .18s` |
| Modal backdrop click | Close modal without saving |
| Save in modal | Merge draft into posts state, close |
| Duplicate in modal | Open platform-picker popover; on select, clone post with new id, set status to `prod`, and switch type if platform requires it (e.g., IG ↔ others); open the new post |
| Click status pill in modal | Popover with 4 statuses (Em produção, Agendado, Publicado, Cancelado) |
| Click platform in modal | Popover with 4 platforms |
| Click any of Dono / Tipo / Linha / Campanha selects | Popover with searchable list + inline "Criar 'X'" affordance (except Dono — not creatable) |
| Click tag "+ Tag" | Popover with all tags + create-new |
| Star click in Complexidade | Set value to that index (1-5) |
| Click `<` / `>` in month-nav | Move by 1 month (month view) or 7 days (week view) |
| Click "Hoje" | Reset to current month/week (today is mocked as **2026-05-13**) |
| Mês / Semana toggle | Switch calendar render mode |
| Platform filter pills | Filter shown posts by platform (`all` shows everything) |
| Tag chips (month-cal only) | Filter by tag |
| Search input | Filter by title or owner (case-insensitive) |
| Click campaign row chevron | Expand/collapse details |
| Click "Ver posts vinculados" | Open right-side drawer with `slideInRight .25s` |
| Drawer post click | Close drawer + open that post's modal |
| Click user widget in sidebar | Open profile view |
| Click colleague card in Equipe tab | View that colleague's profile (read-only) |
| Click avatar camera button | Trigger hidden file input; on file pick, save data URL into `photos[profileId]` state |
| Datas/Futebol checkbox cells | Toggle `potencial` / `postado` boolean |

### Animations
- Backdrop fade: `fadeIn .18s ease-out`
- Modal entry: `slideUp .22s ease-out` (translateY 10 → 0)
- Drawer entry: `slideInRight .25s ease-out`
- Hover lifts: `transform: translateY(-1px); box-shadow: var(--shadow-sm)` with `transition: all .15s`

---

## State Management

The prototype keeps everything in React `useState` at the top of `<App>`. In production, model this as:

- **Posts** — server-persisted, optimistically updated. Fields: `id, title, owner, platform, date (ISO yyyy-mm-dd), time (HH:mm), status, complexity (1-5 int), type, tags (string[]), linha (slug), campanha (slug | null), link, ref, notes, product (optional)`.
- **Campaigns** — fields: `id, slug, nome, pack ('PP'|'P'|'M'|'G'), dono, tipo, mes, dataInsta, dataSite, dataComercial, dataFinal, previsao, launched (bool), progresso (0-100 int)`. The `slug` is what links posts → campaign.
- **Commemorative dates** — `{ id, type, name, start, end, pack, potencial, postado, format }`.
- **Football events** — `{ id, type, name, date }`.
- **Team profiles** — `{ id, name, role, email, joined, color, initial, isMe }`.
- **Photos** — keyed by team-member id; user-uploaded avatar data URLs (or, in prod, S3/asset-service URLs).

State transitions are straightforward CRUD; nothing tricky. Filter & search are pure derived state from the current filter pills + search input + active view.

**Today is mocked as `2026-05-13`** via a `TODAY_STR` constant. In production, derive it from `new Date()` and pass it down.

---

## Design Tokens

All tokens live in `:root` in `styles.css`.

### Colors (oklch)

**Surfaces & ink**
```
--bg:        oklch(0.985 0.005 300)
--surface:   #ffffff
--surface-2: oklch(0.975 0.006 300)
--surface-3: oklch(0.96  0.008 300)

--ink:       oklch(0.22 0.02 300)
--ink-2:     oklch(0.42 0.015 300)
--ink-3:     oklch(0.62 0.012 300)
--ink-4:     oklch(0.78 0.01 300)

--line:      oklch(0.94 0.01 300)
--line-2:    oklch(0.90 0.012 300)
```

**Accent — warm peach/orange gradient**
```
--accent:        oklch(0.72 0.16 55)
--accent-deep:   oklch(0.62 0.18 50)
--accent-soft:   oklch(0.94 0.05 60)
--accent-softer: oklch(0.975 0.025 65)
--accent-gradient:        linear-gradient(135deg, oklch(0.78 0.13 40) 0%, oklch(0.72 0.16 55) 100%)
--accent-gradient-soft:   linear-gradient(135deg, oklch(0.96 0.04 35) 0%, oklch(0.93 0.07 55) 100%)
--accent-gradient-softer: linear-gradient(135deg, oklch(0.98 0.02 30) 0%, oklch(0.96 0.04 55) 100%)
```

**Platform card backgrounds (pastel pairs)**
```
ig:    bg oklch(0.94 0.045 25)  fg oklch(0.42 0.13 25)
tiktok bg oklch(0.93 0.04 195)  fg oklch(0.36 0.08 200)
canal  bg oklch(0.93 0.045 18)  fg oklch(0.45 0.16 22)
twitter bg oklch(0.93 0.045 230) fg oklch(0.4 0.12 230)
```

**Platform brand dots** (for icon tiles)
```
ig: #E1306C (or Instagram official gradient)
tiktok: #111111
canal (YouTube): #FF0033
twitter: #111111
```

**Status colors**
```
--s-prod:   oklch(0.62 0.13 75)   // amber
--s-sched:  oklch(0.6 0.13 265)   // indigo
--s-pub:    oklch(0.6 0.13 150)   // green
--s-cancel: oklch(0.6 0.05 25)    // muted red-gray
```

**Status pill bg/fg** are computed with `color-mix(in oklab, var, white 92-93%)` for the bg and the raw token for the fg.

### Typography

Single family: **DM Sans** (Google Fonts; weights 400, 500, 600, 700; `opsz 9..40`). Monospace: **JetBrains Mono** for time/date numbers in some contexts (kept minimal — most numbers use DM Sans with `font-variant-numeric: tabular-nums`).

| Style | Family | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Page title (`tb-title`) | DM Sans | 22px | 700 | -0.025em |
| Section heading (`modal-title`, `profile-hero .ph-name`) | DM Sans | 18-26px | 700 | -0.015 to -0.025em |
| Body | DM Sans | 14px | 400 | 0 |
| Small label | DM Sans | 12px | 500 | 0 |
| Uppercase label | DM Sans | 10.5-11px | 500 | 0.04-0.08em |
| Numbers in cells | DM Sans | 14-19px | 600-700 | -0.01 to -0.02em + tabular-nums |

### Spacing scale (informal)
- Inline gaps: 4, 6, 8, 10, 12, 14, 18 px
- Card padding: 12, 16, 20, 22, 26 px
- Section padding: 32px horizontal

### Radii
```
--radius:    14px   (cards, lists)
--radius-md: 10px   (popovers, smaller cards)
--radius-sm: 7px    (inputs, tags)
--radius-xs: 5px    (popover items)
Pills, avatars, today-pill, progress bars, accent buttons: 999px (fully rounded)
```

### Shadows
```
--shadow-sm: 0 1px 2px rgba(40,30,60,.03)
--shadow-md: 0 8px 28px rgba(40,30,60,.06), 0 2px 6px rgba(40,30,60,.03)
--shadow-lg: 0 28px 70px rgba(40,30,60,.18), 0 6px 20px rgba(40,30,60,.08)
```

---

## Assets

- **Fonts:** DM Sans + JetBrains Mono — Google Fonts CDN. In production, self-host or use your existing font loader.
- **Icons:** Custom inline SVGs in `icons.jsx` (calendar, branding star, trending-up, globe, ball, megaphone, plus, search, chevrons, close, check, star, link, trash, copy, camera, mail, settings, user). All 24×24 viewBox, `stroke="currentColor" strokeWidth="1.8"`. Replace with your existing icon library if you have one (Lucide, Phosphor, Heroicons all have equivalents).
- **No raster images.** The platform "logo" tiles are colored squares with a simple stroked SVG of the platform glyph drawn inline.
- **Avatars:** Generated colored gradient circles with the first letter; users can upload a real photo (data URL in prototype; in prod use your asset service).

---

## Files in this Bundle

| File | Purpose |
|---|---|
| `SocialHub.html` | Entry point. Loads fonts, React UMD, Babel, then sources the JSX files. |
| `styles.css` | All tokens + component styles. ~25 KB. Most production work is converting these into your codebase's styling solution. |
| `data.js` | Mock data: team profiles, posts, campaigns, commemorative dates, football events. Replace with your API/data layer. |
| `icons.jsx` | All custom SVG icons exported on `window.Icon`. Swap for your icon library. |
| `calendar.jsx` | Month grid, week view, post card, modal, duplicate menu, popover/select primitives, stars, tag-field. |
| `events.jsx` | Datas comemorativas + Futebol 2026 views (list + mini-calendar). |
| `campaigns.jsx` | Campaigns list with expandable rows + Linked posts drawer. |
| `profile.jsx` | Profile hero, stats, activities tab, team grid, ProfileAvatar with upload. |
| `app.jsx` | Root `<App>` — sidebar, topbar, routing between views, modals state. |

**Other files in the project root** (not strictly needed for re-implementation but useful as reference):
- `SocialHub v1.html` and `*-v1.*` files — earlier design iteration with serif typography and lavender accent. Kept for comparison; ignore for implementation.

## Implementation Notes

- **`grid-template-columns: repeat(7, minmax(0, 1fr))`** — use `minmax(0, 1fr)` everywhere you have a 7-column day grid. Plain `1fr` lets long children expand a column beyond its share. This was a real bug in iteration 1.
- **`color-mix(in oklab, ...)`** is used heavily for tinted backgrounds. All evergreen browsers support it. If you must support older browsers, precompute the tinted values.
- **`oklch()`** is also used throughout. Same support story.
- **No external state library required** — `useState` is sufficient for the demo. In production, lift posts/campaigns to your data layer (React Query, RTK, etc.).
- **Babel-in-the-browser is for prototyping only.** Convert to real JSX/TSX + a bundler.
- **Module scope** — every JSX file in the prototype lives in its own Babel scope and shares via `window.*`. Don't replicate that in production; use real ES imports.

## Open Questions for Product

These were not explicitly answered in design and the developer may want to clarify:

1. **Drag & drop** — should users be able to drag posts between days/times? (Not implemented but a natural follow-up.)
2. **Recurring posts / templates** — anything recurring across months?
3. **Notifications** — do owners get notified when their post status changes / approaches its date?
4. **Comments thread vs. observations field** — the modal has one observations textarea today. Real product may want threaded comments.
5. **Permissions** — does everyone edit everyone's posts? Or only the owner + admins?
6. **Approval workflow** — there is a "Em produção → Agendado → Publicado" implied flow but no formal review/approve gate.
7. **Time zone handling** — currently single TZ assumed (GMT-3); confirm whether the team is fully in Brazil.
