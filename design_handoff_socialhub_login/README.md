# Handoff: SocialHub — Login Screen

## Overview

The **SocialHub login screen** is the first surface users see when accessing the platform. It replaces the previous generic dark-blue centered card with a brand-aligned, on-design page that:

- Uses the official SocialHub logo and the project's warm peach/orange accent system
- Demonstrates what's inside the app (floating post cards, calendar day pills, accent stat pills) without showing real data
- Restricts sign-in to `@gocase.com` Google accounts and communicates that clearly
- Adapts down to mobile gracefully (decorations disappear progressively, central card stays usable)

It uses Google SSO as the only sign-in method — there is no email/password form.

## About the Design Files

The files in this bundle are **design references created in HTML/CSS**, not production code to copy directly. The HTML/CSS is a complete, working static reference showing the intended look, animations, and responsive behavior.

The task is to **recreate this design in the target codebase's existing environment** (likely React/Next.js, given the rest of the SocialHub product) following the project's established patterns. If there is no decided stack yet, React + a CSS solution (Tailwind, CSS Modules, or vanilla CSS with tokens) is a reasonable default.

Reuse design tokens, components (button, pill, gate-note pattern), and the logo assets from this bundle. Drop the demo animations, drop the floating decorations entirely, or keep them — the floating decorations are decorative-only and not functionally required.

## Fidelity

**High-fidelity.** The mockup is pixel-precise: final colors, typography, spacing, animations, and responsive breakpoints. The developer should recreate the UI pixel-perfectly using the codebase's existing libraries and patterns. All design tokens (colors in `oklch`, spacing, radii, etc.) are documented below and live in `login.css`.

---

## Screen / Views

### Login

**Purpose:** Authenticate a Gocase team member via Google SSO before they enter the SocialHub app. Out-of-domain users (anyone whose Google account is not `*@gocase.com`) should be rejected with a clear error.

**Layout — full-viewport stage:**
- `position: relative; width: 100%; height: 100vh; padding: 40px;`
- Background = radial gradient (one of four tone variants — see *Tone variants* below)
- A subtle 72px-grid wash overlays the gradient, masked to a soft vignette
- The central login card is `display: grid; place-items: center` on the stage
- All ornaments (`.float-card`, `.day-card`, `.pill-float`) are `position: absolute`, positioned in percentages, and animated

**Z-index layering (bottom → top):**
1. Stage gradient + grid wash (z 0)
2. Floating decorations (z 2)
3. Central login card (z 5)
4. Corner brand mark, help link, base bar (z 10)

#### Components

##### 1. Corner brand mark (top-left)
- `position: absolute; top: 32px; left: 36px;`
- The official SocialHub wordmark (orange "social" + dark "hub") at 24px tall
- On dark tone, the variant `socialhub-logo-light.png` is shown instead (orange "social" + white "hub")

##### 2. Help link (top-right)
- `position: absolute; top: 36px; right: 36px;`
- Plain text **"Sem acesso?"** in `var(--ink-3)` 12.5px
- Inline link **"Falar com o time"** — bold, underlined with `var(--line-2)`, 1px below baseline
- Target: opens a mailto: or Slack DM to the SocialHub team (TBD with PM)

##### 3. Central login card
- White card, 440px max-width, 22px radius
- Padding: `40px 40px 32px`
- Shadow: stacked `0 32px 80px rgba(40,30,60,.14)` + `0 8px 24px rgba(40,30,60,.06)` + `0 0 0 1px oklch(0.92 0.012 300 / 0.4)`
- Entry animation: `card-in .55s cubic-bezier(.2,.7,.2,1)` — fades + scales from 0.985 + translateY 8px
- Centered text alignment for all contents

Children, top → bottom:

| Element | Size / Style |
|---|---|
| `.seal` — calendar icon on accent-gradient tile | 52×52, 16px radius, accent gradient bg, white 24px icon, has a blurred halo `::after` (-6px inset, 14px blur, 0.15 opacity) and a layered shadow |
| `.brand` — SocialHub logo (h1) | Height 38px, `display: flex; justify-content: center;`, swaps to white-hub variant on dark tone |
| `.sub` — subtitle | 14px, `var(--ink-3)`, line-height 1.45, copy: **"Hub de planejamento de Social Medias · Gocase"** |
| `.g-btn` — Google sign-in CTA | Full-width pill, padding 14×18, `background: var(--ink)`, white text. Has 22×22 white circle holding the multicolor Google "G", center label "Continuar com Google", trailing arrow (opacity 0.55 → 0.9 on hover, translateX 3px on hover) |
| `.gate-note` — domain restriction note | Pill, 6/12/6/8 padding, surface-2 background, line border. Contains a tiny 18px accent-gradient lock circle, plain text **"Apenas contas"**, and a mono `@gocase.com` chip with accent-softer gradient background |

##### 4. Base footer
- `position: absolute; bottom: 24px; left: 36px; right: 36px;`
- `display: flex; justify-content: space-between;`
- Left: mono "Feito pelo time de Growth Intelligence · 2026" at 11.5px, `var(--ink-3)`
- Right: link "Status" (single link, target = status page when one exists)

##### 5. Floating decorations (decorative — hidden on narrow viewports)

Three types of ornament, positioned around the central card via percentage anchors:

**Float cards (`.float-card`)** — Mock post cards by platform
- White card, 12px radius, 200px min-width, layered shadow
- Left: 30×30 platform-colored tile with white icon (`plat-ig`, `plat-tt`, `plat-yt`, `plat-tw`)
- Right: title (13px, weight 600, max 160px ellipsis) + meta (11.5px, mono nums, with a 5px status dot)
- Variant `.status-pub` — green-tinted background, strikethrough title (matches the same convention used in the main app's calendar)

| Position class | Anchor | Rotation | Content (mock) |
|---|---|---|---|
| `.pos-tl` | top 14%, left 6% | -6° | IG · "Drop Vingadores" · hoje · 19:00 |
| `.pos-tr` | top 11%, right 7% | +5° | TT · "Trend Coachella" · amanhã · 14:30 |
| `.pos-bl` | bottom 14%, left 9% | +4° | YT · "Bastidores · estúdio" · quinta · 11:00 · **status-pub** |
| `.pos-br` | bottom 12%, right 6% | -5° | TW · "Thread bastidores" · sex · 16:00 |

**Day cards (`.day-card`)** — Mock calendar day pills
- White card, 14px radius, 100px width, layered shadow
- Top: weekday short (DOW) in uppercase, 10.5px, weight 600, letter-spacing 0.08em
- Middle: big day number, 32px, weight 700, letter-spacing -0.035em
- Bottom: 7×7 platform dots (3 max), with 2px white shadow ring for separation
- Variant `.today` — accent-tinted border + colored shadow, day number rendered with `background-clip: text` on the accent gradient

| Position class | Anchor | Rotation | Content |
|---|---|---|---|
| `.pos-ml` | top 44%, left 3% | -3° | QUI · 15 · today · 3 dots (IG/TT/YT) |
| `.pos-mr` | bottom 38%, right 3% | +5° | SEG · 19 · 2 dots (TT/IG) |

**Pill floats (`.pill-float`)** — Mock stat pills
- Accent gradient background, white text, 999px radius
- Padding 9×16, 12.5px weight 600
- Leading sparkle icon (13×13), trailing label
- Carry a colored shadow + inset highlight

| Position class | Anchor | Rotation | Content |
|---|---|---|---|
| `.pos-pill-tr` | top 30%, right 16% | +7° | "+12 posts agendados" |
| `.pos-pill-bl` | bottom 30%, left 18% | -4° | "3 campanhas ativas" |

##### Tone variants
The stage element accepts one of four tone classes, swapping the background gradient and dark-mode overrides:

| Class | Background | Card |
|---|---|---|
| `tone-warm` (default) | warm white → soft peach | white |
| `tone-cool` | cool white → soft blue-gray | white |
| `tone-paper` | cream white → warm tan | white |
| `tone-dark` | indigo-tinted dark | dark indigo, white text, white-hub logo |

Default for production should be **`tone-paper`** (warm but not too saturated) unless product wants to A/B test.

---

## Interactions & Behavior

### Sign-in flow

| Trigger | Behavior |
|---|---|
| Click "Continuar com Google" | Open Google OAuth popup; on success, post the ID token to the backend |
| Backend returns success | Redirect to `/` (the main app shell — Calendário) |
| Backend returns 403 (out-of-domain account) | Show inline error above the gate-note: **"Essa conta não é @gocase.com. Use sua conta corporativa."** |
| Backend returns 5xx | Show inline error: **"Não conseguimos entrar agora. Tente novamente."** with a retry chevron |
| Click "Falar com o time" | Open mailto:`socialhub-team@gocase.com` (or whatever channel the team prefers) |
| Click "Status" in base bar | Navigate to the status page (TBD; can be `/status` or external) |

### OAuth integration notes
- Restrict the OAuth scope to `email profile`
- Configure the OAuth client with `hd=gocase.com` to *hint* the picker, but **still validate on the backend** (the `hd` query param is not security)
- On the backend, reject any token whose email domain is not `gocase.com` — return 403

### Animations

| Element | Animation | Duration | Easing |
|---|---|---|---|
| `.login-card` (entry) | fade + translateY(8px → 0) + scale(0.985 → 1) | 0.55s | `cubic-bezier(.2,.7,.2,1)` |
| `.float-card`, `.day-card`, `.pill-float` (entry) | fade + translateY(12px → 0) + scale(0.92 → 1), composed with rotation via `--r` | 0.8s, staggered delays 0.15–0.55s | `cubic-bezier(.2,.7,.2,1)` |
| All ornaments (idle drift) | gentle translate loop (±3–6px), 6–7.5s, infinite | — | `ease-in-out` |
| `.g-btn` hover | bg shift + translateY(-1px) + box-shadow | 0.2s | `cubic-bezier(.2,.7,.2,1)` |
| `.g-btn` arrow on hover | translateX(3px) + opacity 0.55 → 0.9 | 0.2s | — |

Animations are gated behind `@media (prefers-reduced-motion: reduce)` — when set, all entry/drift animations are disabled and elements appear immediately at opacity 1.

### Responsive behavior

Decorations drop progressively as the viewport narrows so the central card always has breathing room:

| Breakpoint | Behavior |
|---|---|
| ≥ 1280px | Everything visible |
| < 1280px | `.pill-float` hidden |
| < 1200px | `.day-card` hidden |
| < 1100px | `.float-card` hidden — only the central card + corner brand + help link + base bar |
| < 880px (mobile) | Corner padding tightens to 20px, card padding reduces to `32 28 26` |

---

## State Management

Pure presentation. No client state beyond the OAuth call.

- **Auth state** — handle via your app's existing auth layer (NextAuth, Auth0, Firebase, custom session, whatever's in place). On successful sign-in, redirect to `/`.
- **Error state** — local `useState<string | null>` to hold an inline error message between OAuth callback and redirect.
- **Loading state** — local `useState<boolean>` to disable the button + swap label to "Entrando…" while the OAuth round-trip is in flight.

---

## Design Tokens

All tokens are in `:root` in `login.css`.

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

**Accent — warm peach/orange (Gocase brand)**
```
--accent:                 oklch(0.72 0.16 55)
--accent-deep:            oklch(0.62 0.18 50)
--accent-soft:            oklch(0.94 0.05 60)
--accent-softer:          oklch(0.975 0.025 65)

--accent-gradient:        linear-gradient(135deg, oklch(0.78 0.13 40) 0%, oklch(0.72 0.16 55) 100%)
--accent-gradient-soft:   linear-gradient(135deg, oklch(0.96 0.04 35) 0%, oklch(0.93 0.07 55) 100%)
--accent-gradient-softer: linear-gradient(135deg, oklch(0.98 0.02 30) 0%, oklch(0.96 0.04 55) 100%)
```

**Platform brand dots (used on `.platico` tiles inside `.float-card`)**
```
--c-ig-fg: #E1306C            /* Instagram */
--c-tt-fg: oklch(0.36 0.08 200) /* TikTok */
--c-yt-fg: oklch(0.45 0.16 22)  /* YouTube */
--c-tw-fg: oklch(0.40 0.12 230) /* Twitter */
```

**Status tint — published**
- Background: `oklch(0.97 0.025 150)`
- Border: `oklch(0.88 0.045 150)`
- Text strikethrough color: `oklch(0.7 0.06 150)`
- Text color: `oklch(0.45 0.06 150)`

### Typography

| Style | Family | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Brand mark (logo) | (image — height 24px corner, 38px in card) | — | — | — |
| Card subtitle (`.sub`) | DM Sans | 14px | 400 | 0 |
| Google button label | DM Sans | 14.5px | 500 | -0.005em |
| Gate note | DM Sans | 12px | 500 | 0 |
| Gate note domain chip | JetBrains Mono | 11.5px | 500 | 0 |
| Corner right text | DM Sans | 12.5px | 400 | 0 |
| Help link | DM Sans | 12.5px | 600 | 0 |
| Base bar version | JetBrains Mono | 11.5px | 500 | 0.05em |
| Float card title | DM Sans | 13px | 600 | -0.005em |
| Float card meta | DM Sans (`tabular-nums`) | 11.5px | 500 | 0 |
| Day card weekday | DM Sans | 10.5px | 600 | 0.08em uppercase |
| Day card number | DM Sans | 32px | 700 | -0.035em |
| Pill float | DM Sans | 12.5px | 600 | -0.005em |

Fonts are loaded from Google Fonts CDN in the prototype. In production, **self-host** DM Sans (weights 400, 500, 600, 700) and JetBrains Mono (weights 400, 500) — or use your existing font loader.

### Spacing
- Stage padding: 40px (20px on mobile)
- Card padding: `40 40 32` (32 28 26 on mobile)
- Inline gaps: 5, 7, 8, 10, 11, 12, 14, 16, 18 px
- Corner offsets: 32/36 px (18/20 px on mobile)

### Radii
- Login card: 22px
- Float cards / day cards: 12–14px
- Seal: 16px
- Pills / Google button / domain chip / lock circle: 999px

### Shadows
- Login card: `0 32px 80px rgba(40,30,60,.14), 0 8px 24px rgba(40,30,60,.06), 0 0 0 1px oklch(0.92 0.012 300 / 0.4)`
- Floats: `0 18px 40px rgba(40,30,60,.10), 0 3px 10px rgba(40,30,60,.05)`
- Day card today: `0 18px 40px oklch(0.7 0.17 50 / 0.25), 0 3px 10px rgba(40,30,60,.05)`
- Pill float: `0 14px 30px oklch(0.7 0.17 50 / 0.4), inset 0 1px 0 rgba(255,255,255,0.3)`
- Seal: `0 12px 30px oklch(0.7 0.17 50 / 0.4), inset 0 1px 0 rgba(255,255,255,0.3)` + a blurred `::after` halo

---

## Assets

| File | Purpose |
|---|---|
| `socialhub-logo.png` | Official SocialHub wordmark — orange "social" + dark "hub", 898×233, transparent PNG. Used on all light tones. |
| `socialhub-logo-light.png` | Same wordmark, but the "hub" portion is recolored white. Auto-generated by recoloring dark pixels in the original. Used on `tone-dark` only. |

All icons (calendar, Google G, arrow, lock, sparkle, platform glyphs) are **inline SVG** in `login.html`. Each is small (10–24px) and uses `currentColor` or hardcoded brand colors (the Google G is the only multicolor icon).

In production, replace the inline SVGs with your existing icon library if you have one (Lucide, Phosphor, Heroicons). The platform glyphs are simplified — match whatever convention the main SocialHub app uses (see `design_handoff_socialhub/icons.jsx` in the sibling handoff for the full set).

---

## Files in this Bundle

| File | Purpose |
|---|---|
| `login.html` | Static HTML page — the design reference. Pure HTML + CSS, no JS, no framework. |
| `login.css` | All design tokens + component styles (~17 KB). Self-contained — the tokens are duplicated from the main SocialHub `styles.css` for this bundle. |
| `socialhub-logo.png` | Brand wordmark, dark "hub" variant |
| `socialhub-logo-light.png` | Brand wordmark, white "hub" variant (dark tone only) |
| `README.md` | This document |

## Implementation Notes

- **`oklch()`** and **`color-mix(in oklab, ...)`** are used in the design system. All evergreen browsers support both — if you must support older browsers, precompute the values.
- **Logo as `<img>`, not SVG.** The PNG is what the brand team uses; don't redraw it from scratch. Both `.logo-dark` and `.logo-light` variants are shipped — the CSS swaps which is visible based on the `tone-*` class.
- **The "Google G" inside the button** uses Google's official multicolor mark. This is allowed under Google's sign-in branding guidelines as long as you don't add their wordmark or impersonate their UI. Keep the rest of the button styled to your brand (dark pill, custom typography) — do **not** copy Google's button verbatim.
- **`prefers-reduced-motion: reduce`** disables all entry + drift animations. Don't skip this.
- **Decorations are decorative.** Treat the floating cards/days/pills as a single "ornament" block that can be feature-flagged off entirely if A/B tests prefer a cleaner page.
- **Auth gating is server-enforced.** The `@gocase.com` chip is communication, not security — your backend must validate the token's email domain and reject foreign tokens with 403.
- **The animation classes `.pos-tl` … `.pos-pill-bl`** each carry their own `animation` shorthand that composes the entry and drift loops. If you split entry vs. drift into two separate elements (or use a CSS-in-JS solution that prefers single-purpose classes), preserve the staggered `animation-delay` values — they're what makes the ornaments feel alive rather than swarming in unison.

## Open Questions for Product

1. **Help link target** — does "Falar com o time" open a mailto, Slack DM, internal Notion page, or a contact form?
2. **Status link target** — is there a public status page yet, or should this link be hidden until one exists?
3. **Sign-out and session expiry** — what does the user see when their session expires? Should they land back here with a toast, or with a pre-filled "session expired" banner?
4. **Out-of-domain error copy** — the proposed copy is "Essa conta não é @gocase.com. Use sua conta corporativa." Should it also link to IT for guests who think they should have access?
5. **Brand tone default** — `tone-paper` is the proposed default. Confirm with brand team, or A/B test against `tone-warm`.
6. **Floating decorations** — keep, soften, or remove entirely for production? They're decorative, so it's a brand call.
