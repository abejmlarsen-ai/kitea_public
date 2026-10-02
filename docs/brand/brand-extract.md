# Kitea Ao — Brand Extract

Source material for a brand style guide. Everything below is what the site **actually ships today**, read from the code on branch `develop` (2026-10-02). References are `file:line`. Copies of every logo and icon file are in [`assets/`](assets/).

**How the counts were made:** usage counts are approximate. They include every `var(--token)` reference and every raw hex literal in `app/`, `components/` and `lib/` (`.css`, `.ts`, `.tsx`). Token definition lines and the palette reference comment in `components/home/HeroCarousel.tsx:14-19` are left out. "Role" is inferred from the CSS property each reference sits on.

---

## 1. Colour palettes

All brand palettes are defined in `app/globals.css:28-67`. Semantic tokens are defined in `app/globals.css:14-26`.

> **Headline finding:** in practice the site is close to a single palette. **Dune to Deep** carries almost all colour usage. **Organic Coastal** and **Golden Burnt Horizon** are defined but barely used, about 4 and 15 references respectively. Even Dune colours appear as raw hex about 9× more often than as `var(--dune-*)`.

### 1.1 Palette 1 — Dune to Deep (`--dune-*`) · `globals.css:30-37`

| Variable | Hex | Uses (var + raw hex) | Typical role | Notes / main locations |
|---|---|---|---|---|
| `--dune-1` | `#FFFFFF` | ~73 (8 var + ~65 hex) | Background (cards, header, light pages), text on dark | Same hex as `--coastal-1` and `--horizon-1`. Header bg `globals.css:111`; page bg for hiw/faq/opportunities/library `globals.css:2648-2665` |
| `--dune-2` | `#F2EDE3` | ~29 hex + 3 via `--color-bg` (0 direct var) | **Default page background** (body, most page themes), light text on navy | Page themes `globals.css:2637-2700`; footer text `globals.css:351`; hero logo colour `HeroCarousel.tsx:26` |
| `--dune-3` | `#C4B08E` | ~16 (3 var + 13 hex) + 2 via `--color-surface` | Mid-tone section background, input borders | CTA band `globals.css:325`; about buckets `globals.css:2718`; login/signup input border `globals.css:3660,3721`; placeholder caption bg `lib/hunts/placeholderArtwork.ts:10` |
| `--dune-4` | `#8A7A5E` | ~49 (3 var + 46 hex) | Muted text, borders (hunt/account forms), hover fill | Hunt UI `app/hunts/[id]/HuntClient.tsx` (10×), `HuntLocationClient.tsx` (7×); `.hunt-btn-submit:hover` `globals.css:3794`; Our Story section bg `globals.css:2725` |
| `--dune-5` | `#4A7C8C` | ~52 (0 direct var; all raw hex) | **Primary interactive colour**: buttons, active states, links on hover, section bg | `.nav-return-map-btn` `globals.css:4135`; `.map-region-btn` `globals.css:3565`; `.acct-btn-save` `globals.css:4044`; map/about section bg `globals.css:2720,2734`; hunt UI (many inline) |
| `--dune-6` | `#1B4965` | ~16 (10 var + 6 hex) + 9 via `--color-muted` | Button hover background, secondary text, How It Works tiles | Hover for every `#4A7C8C` button (`globals.css:3550,3576,4055,4146`); `--color-muted` headings; `.hiw-flow__tile` `globals.css:2192` |
| `--dune-7` | `#0B2838` | **~128** (24 var + 104 hex) + 11 via `--color-text` | **Primary text colour**, dark background | Header nav links (inline) `components/layout/Header.tsx:52-58`; footer (inline) `components/layout/Footer.tsx:6-34`; `.site-footer` bg `globals.css:350`; hunt pages; shop |

### 1.2 Palette 2 — Organic Coastal (`--coastal-*`) · `globals.css:39-46`

| Variable | Hex | Uses | Typical role | Locations |
|---|---|---|---|---|
| `--coastal-1` | `#FFFFFF` | 0 direct (shared hex with `--dune-1`) | — | — |
| `--coastal-2` | `#FAF3E0` | 0 | — | Defined only |
| `--coastal-3` | `#D4C5A0` | 0 | — | Defined only. A near-duplicate, `#D4C4A0`, is used 3× in hunt pages (see 1.6) |
| `--coastal-4` | `#8BA888` | 0 | — | Defined only |
| `--coastal-5` | `#3D8B7A` | 2 | Accent: hero video frame, badge text | `HeroCarousel.tsx:24` (`FRAME_COLOR`, which also drives the hero text glow); `globals.css:3768` |
| `--coastal-6` | `#1A6B5A` | 0 | — | Defined only |
| `--coastal-7` | `#0F3D35` | 2 | Badge text/border | `globals.css:3758,3763` (collectible badges) |

### 1.3 Palette 3 — Golden Burnt Horizon (`--horizon-*`) · `globals.css:48-55`

| Variable | Hex | Uses | Typical role | Locations |
|---|---|---|---|---|
| `--horizon-1` | `#FFFFFF` | 1 | Background | `.scan-container` `globals.css:634` |
| `--horizon-2` | `#FFF4E0` | 1 | Border | Scan page border `globals.css:695` |
| `--horizon-3` | `#D4A55A` | 4 direct + 3 via `--color-accent` | Accent: nav hover/active, primary auth/scan button bg | `.main-nav a:hover` via `--color-accent` `globals.css:172`; `.login-btn` `globals.css:408`; `.scan-btn` `globals.css:675`; `.dynamic-text:hover` `globals.css:101` |
| `--horizon-4` | `#B86B3A` | 3 | Hover background for horizon-3 buttons | `.login-btn:hover` `globals.css:417`; `.scan-btn:hover` `globals.css:688` |
| `--horizon-5` | `#8A3A2A` | 1 | Text | Scan page text `globals.css:656` |
| `--horizon-6` | `#6B1D3A` | 0 | — | Defined only |
| `--horizon-7` | `#1A0A12` | 2 | Heading text on the scan page | `.scan-container h2` `globals.css:649` |

### 1.4 Semantic tokens · `globals.css:14-26`

| Token | Maps to | Resolved | Uses | Used for |
|---|---|---|---|---|
| `--color-bg` | `var(--dune-2)` | `#F2EDE3` | 3 | `body` background `globals.css:80` |
| `--color-surface` | `var(--dune-3)` | `#C4B08E` | 2 | Surfaces |
| `--color-text` | `var(--dune-7)` | `#0B2838` | 11 | `body` text, nav links, headings |
| `--color-muted` | `var(--dune-6)` | `#1B4965` | 9 | `.section_1 h2`, auth headings, form labels |
| `--color-accent` | `var(--horizon-3)` | `#D4A55A` | 3 | Nav hover/active, logout hover |
| `--font-heading` | `'Inter', sans-serif` | — | 55 | Headings, buttons, most UI text |
| `--font-body` | `'Inter', sans-serif` | — | 11 | `body` |
| `--max-width` | `1200px` | — | 3 | `.container`, `.footer-inner` |
| `--section-padding` | `6rem` | — | 8 | Vertical padding of every main section |
| `--header-height` | `80px` | — | 1 | `.page-theme` top padding `globals.css:2630-2634` |
| `--accent-gold` | `#C9A84C` | — | 4 | Added 2026-10-02 for How It Works icons, junction dots and the title underline `globals.css:65-66` |
| `--u` | `calc(min(100cqw,1480px)/1480)` | — | 24 | Scaling unit for the How It Works desktop diagram only |

### 1.5 Legacy aliases (`--kitea-*`) · `globals.css:57-63`

| Alias | Maps to | Resolved | Uses |
|---|---|---|---|
| `--kitea-teal` | `var(--coastal-5)` | `#3D8B7A` | 0 |
| `--kitea-ocean` | `var(--dune-5)` | `#4A7C8C` | 0 |
| `--kitea-sand` | `var(--horizon-3)` | `#D4A55A` | 0 |
| `--kitea-warm` | `var(--horizon-4)` | `#B86B3A` | 0 |
| `--kitea-light` | `var(--dune-2)` | `#F2EDE3` | 0 |
| `--kitea-dark` | `var(--dune-7)` | `#0B2838` | 0 |

None of the aliases are referenced anywhere, so all six can be deleted.

### 1.6 Off-palette hex values in use

These are grouped by where they come from. "Uses" counts occurrences.

**Gold highlight** (not in any palette)
| Hex | Uses | Locations |
|---|---|---|
| `#C9A84C` | 10 | Now `--accent-gold`. Raw hex in opportunities card `globals.css:2410,2418,2440`; hunt glow keyframes `globals.css:3466,3495-3496`; `app/library/LibraryClient.tsx:161`; `app/shop/ShopClient.tsx:201,254` |
| `#C9A227` | 3 | `globals.css:1954,1993,2886` (library/wallet) |
| `#C8960C` | 2 | `globals.css:3051,3065` (scan success banner) |
| `#E0AA1A` | 1 | `globals.css:3075` |
| `#FACC15` | 1 | `globals.css:3447` |

**Hunt "parchment" palette** (`globals.css:3778` comment: "#F5F0E8 → #C4A882 (parchment)")
| Hex | Uses | Locations |
|---|---|---|
| `#F5F0E8` | 26 | `.page-theme--hunt`, `--scan` bg `globals.css:2690,2695`; `HuntClient.tsx` (10×), `HuntLocationClient.tsx` (7×), `reveal/page.tsx`, `RevealLocationButton.tsx`, `HuntBackButton.tsx:12`, `HuntNotFound.tsx:6` |
| `#E8DCC8` | 10 | `.page-theme--hunt .hunt-layout` `globals.css:2747`; `HuntClient.tsx:11,311,323,353`; `HuntLocationClient.tsx:11,255`; `RevealLocationButton.tsx:152`; `reveal/page.tsx:110` |
| `#C4A882` | 8 | `.hunt-btn-submit` bg `globals.css:3778-3803`; `HuntClient.tsx:11,393`; `HuntLocationClient.tsx:11,303`; `RevealLocationButton.tsx:121` |
| `#D4C4A0` | 3 | `HuntClient.tsx:11`; `HuntLocationClient.tsx:11`; `reveal/page.tsx:81` (1 digit off `--coastal-3`) |

**Legacy blue system** (shop, map sidebar, contact form, about buckets; predates the palettes)
| Hex | Uses | Locations |
|---|---|---|
| `#0169AA` | 20 | Map sidebar & location buttons `globals.css:484-521`; shop `832,887,974,1030`; contact button/focus; `.bucket h3`; contact email template `app/api/contact/route.ts:69` |
| `#015A91` | 2 | Hover for the above `globals.css:1042,2973` |
| `#CCE4F7`, `#E8F4FB`, `#C0DFF5` | 2 / 1 / 1 | Sidebar country buttons `globals.css:506,2849-2861` |
| `#F4F8FF` | 5 | `globals.css:1094`; email template `app/api/contact/route.ts:72-84` |
| `#F0F4F8`, `#DDE5F0`, `#E8EEF5`, `#E8F0F8`, `#DDE4EA`, `#F6F9FC` | 3 / 1 / 1 / 1 / 1 / 1 | Shop cart & contact form `globals.css:780,983,995,799,2107,2934,2493` |

**Neutrals: black and greys**
| Hex | Uses | Locations |
|---|---|---|
| `#0A0A0A` | 15 | Shop buttons/text `globals.css:819-1135`; `theme_color` & `background_color` in `app/layout.tsx:29` and `public/manifest.json` |
| `#000000` | 11 | Shadows `globals.css:542-543,2887-2888`; settings icon stroke `Header.tsx:71` |
| `#888888` | 7 | `globals.css:583,860,933,3452,3461`; `app/hunts/MapComponent.tsx:335,347` |
| `#555555`, `#333333`, `#444444`, `#666666`, `#111111` | 4 / 4 / 3 / 2 / 2 | Shop, contact, opportunity copy |
| `#999`, `#AAA`, `#BBB`, `#CCC`, `#F0F0F0`, `#E0E0E0`, `#F8F8F8` | 1–3 each | Shop, library tile bg `LibraryClient.tsx:173` |
| `#081515`, `#01111E` | 1 / 1 | Home values text `globals.css:264,272` |

**Admin dark theme** (scoped under `.admin-page`, `globals.css:1400-1933`)
`#8892A4` (11), `#2D3142` (11), `#E8ECF4` (10), `#4A9EFF` (10), `#1A1D27` (4), `#E74C3C` (4), `#27AE60` (3), `#3D4258`, `#3A8EF0`, `#1F2234`, `#7FC4FD` (2 each), `#3A3F56`, `#C8D0E0`, `#0F1117`, `#13151F`, `#B0BAC8`, `#1E2235`, `#3A7BD5`, `#F39C12`, `#95A5A6` (1 each).

**Collectible modal and hunts cards** (dark)
`#13161F` `globals.css:3110`, `#0D1014` `3050`, `#1A1A1A` `3409`, `#2A2A2A` `3410`.

**Status colours**
| Hex | Uses | Locations |
|---|---|---|
| Red `#E30000`, `#B30000`, `#EE0000`, `#CC2200`, `#B52A1A`, named `red` | 5 / 1 / 2 / 2 / 1 / 1 | Map popup button `globals.css:586-592`; map markers `MapComponent.tsx:81`, `MapClient.tsx:90-91`; `.error-message` `globals.css:419` |
| Green `#2E7D32`, `#22C55E`, `#2ECC71`, `#4ADE80` | 2 / 1 / 1 / 1 | `.success-message` `globals.css:420`; scanned marker `MapComponent.tsx:82,308`; `globals.css:3442` |
| `#E63946` | 1 | `public/icons/map-marker.svg` (file is unused) |

**Old "Surfy" palette leftovers**
`#2A9D8F` (4): `app/account/AccountClient.tsx:132,150`, `app/hunts/MapComponent.tsx:319,357`. `#1D3557` (1): `MapComponent.tsx:297`.

**Other one-offs**
`#A8C4CC` `ShopClient.tsx:204`; `#8AAFBA` `ShopClient.tsx:382`.

There are also roughly 60 `rgba()` values. Most are `rgba(0,0,0,…)` shadows or tints of `#4A7C8C`, `#8A7A5E`, `#C4B08E` and white, for example `rgba(74,124,140,0.2)` at `globals.css:4097`.

---

## 2. Logo

### 2.1 The mark

The logo is a **four-point compass star with a stylised "K"** worked into the centre. Lockups put the wordmark **KITEA** (heavy geometric sans, all caps) underneath it. The brand name appears in code as "Kitea" and "Kitea Ao", and the Te Reo meaning is explained in `app/about/page.tsx:20-31`.

### 2.2 Files

All are PNG with an alpha channel unless noted. Copies are in `assets/logos/` and `assets/icons/`.

| File | Px | Content / colour | Used? | Where |
|---|---|---|---|---|
| `public/images/Kitea Logo Only.png` | 527×495 | Star mark only, black on transparent | **Yes, the primary logo asset** | Header `components/layout/Header.tsx:40`; login `components/auth/LoginForm.tsx:64`; signup `SignupForm.tsx:105`; contact `app/contact/page.tsx:12`; under-construction `components/ui/UnderConstruction.tsx:12`; shop `app/shop/ShopClient.tsx:279`; library and hunt placeholder art `LibraryClient.tsx:33,149,278`, `HuntClient.tsx:231`, `HuntLocationClient.tsx:203`; home hero CSS mask `HeroCarousel.tsx:88-89` |
| `public/images/kitea-logo-marker.png` | 64×60 | Star mark, black on transparent (small) | Yes | Map markers `app/hunts/MapComponent.tsx:90` |
| `public/images/Kitea words only.png` | 445×140 | Wordmark "KITEA", black on transparent | No | — |
| `public/images/Kitea-Logo.png` | 1140×922 | Stacked lockup, black on off-white (~`#F3F3F1`) | No | — |
| `public/images/Logo light blue.png` | 700×590 | Stacked lockup, black on pale blue (~`#EDF2FE`) | No | — |
| `public/images/kitea-logo-navy.png` | 1032×696 | Stacked lockup, white mark and wordmark on navy (~`#0E3451`) | No | — |
| `public/images/kitea-logo-orange.png` | 1022×712 | Stacked lockup, black on orange (~`#FF6D00`) | No | — |
| `public/images/kitea-logo-teal.png` | 1044×692 | Stacked lockup, black on teal (~`#6CB8B1`) | No | — |
| `public/images/kitea-logo-white.png` | 1020×716 | Stacked lockup, black on white | No | — |
| `public/icons/icon-192x192.png` | 192×192 | App icon: black star between two horizontal rules, transparent bg | Yes | PWA manifest `public/manifest.json` (purpose `any maskable`) |
| `public/icons/icon-512x512.png` | 512×512 | Same, larger | Yes | PWA manifest |
| `public/icons/apple-touch-icon.png` | **192×192** | Identical file to `icon-192x192.png` | Yes | `app/layout.tsx:17`, **declared as 180×180** |
| `public/icons/icon-192.png`, `icon-512.png` | 192 / 512 | Byte-identical duplicates of the `…x…` files | No | — |
| `public/icons/map-marker.svg` / `.png` | 40×48 | Red (`#E63946`) pin with a white "K" in Arial | No | — |

Background colours marked "~" were sampled from the downscaled file, so they are approximate. There is **no favicon**: no `app/favicon.ico`, no `app/icon.*` and no `icons.icon` in metadata.

### 2.3 How the logo is treated in code (sizing and clear space)

- **Header:** the mark is rendered at **40×40** (`Header.tsx:41-43`, `.logo img` `globals.css:132-135`). It is forced to pure black with `filter: brightness(0)` (`Header.tsx:44`) and followed by the text "Kitea" at 1.25rem/700, `--color-text`, with an **8px gap** (`.logo` `globals.css:121-129`).
- **Home hero:** the mark is used as a **CSS mask** filled with `#F2EDE3` (`LOGO_COLOR`), sized `min(140px, 25vw)`, aspect `527/495`, with a 0.75rem gap above the "KITEA" heading (`HeroCarousel.tsx:76-97`).
- **Map markers:** 32×32, recoloured to white with `brightness(0) invert(1)`, plus a coloured glow from a triple `drop-shadow`: `#CC2200` by default, `#22C55E` once scanned (`MapComponent.tsx:81-100`).
- **Logo hero band:** `max-width: 700px; object-fit: contain` (`.logo-hero img` `globals.css:186-190`).
- **Placeholder art:** the mark sits in a 1:1 box on `#F8F8F8` with `object-fit: contain` (`LibraryClient.tsx:173-178`), captioned "Placeholder design" on `#C4B08E`/`#0B2838` (`lib/hunts/placeholderArtwork.ts:9-12`).
- **Rules:** there are **no explicit clear-space or minimum-size rules** in the code. The smallest rendering is 32px (map marker).

---

## 3. Typography

### 3.1 Families and loading

- **Inter** is the only brand typeface. It loads from **Google Fonts via CSS `@import`** with weights **400, 600 and 700** (`globals.css:11`). It is **not** loaded with `next/font`. `--font-heading` and `--font-body` are both Inter (`globals.css:21-22`).
- **Other families in code:**
  - `monospace`: shop session code, `globals.css:1101`.
  - `'Courier New'`: wallet address, `globals.css:1999`.
  - `Arial, sans-serif`: map popup, `app/hunts/MapComponent.tsx:291`.
  - `sans-serif`: contact email template, `app/api/contact/route.ts:69-70`.
  - `Arial`: inside `map-marker.svg`.

### 3.2 Weights in use (globals.css)

| Weight | Declarations | Loaded? |
|---|---|---|
| 700 | 38 | Yes |
| 600 | 31 | Yes |
| 500 | 4 | **No, synthesised** |
| 800 | 1 | **No, synthesised** |
| 900 | 1 | **No, synthesised** |
| 400 | default body | Yes |

### 3.3 Type scale

There is **no global h1–h6 scale**. The reset (`globals.css:71-75`) only zeroes margins, so any heading without a class rule gets **browser default sizes** (h1 2em, h2 1.5em, h3 1.17em, h4 1em, h5 .83em, h6 .67em; bold). Below are the sizes in effect.

| Role | Size | Weight | Line-height | Letter-spacing | Case | Source |
|---|---|---|---|---|---|---|
| Hero display (home "KITEA") | `clamp(2rem, 6vw, 4rem)` | 700 | inherit (1.6) | **0.15em** | Upper (literal) | `HeroCarousel.tsx:100-113` |
| Hero tagline | `clamp(0.85rem, 2vw, 1.1rem)` | 400 | 1.6 | 0.05em | Sentence | `HeroCarousel.tsx:117-130` |
| Page H1 (shop hero) | `clamp(2rem, 6vw, 4rem)` | 700 | — | — | Title | `globals.css:715` |
| Section H2, standard | `clamp(1.5rem, 4vw, 2.5rem)` | 700 | 1.6 | — | Title | hiw/faq/opportunities/about-narrative/cta `globals.css:329,2121,2156,2390,2448` |
| Section H2 in `.section_1` | 1.5em × `clamp(1rem, 5vw, 3rem)` = up to **4.5rem** | 700 (UA bold) | 1.6 | — | Title | `.section_1` `globals.css:197-209`. Mobile overrides `clamp(1.3rem,6vw,2rem)` at `:1211` and `clamp(1.1rem,7vw,1.6rem)` at `:1392` |
| H3, card | 1.25–1.5rem | 700 | — | — | Title | `.opportunity-card h3` `:2411`, `.bucket h3` `:2101`, `.contact-success h3` `:3003` |
| H4, values bubble | 1.6rem (1.2rem mobile) | UA bold | — | — | Title | `:285`, `:1235` |
| Eyebrow / label | 0.7–0.75rem (11px in HIW) | 600–700 | — | 0.05–0.16em | **UPPERCASE** | `.sidebar-group h4` `:492`, `.hiw-flow__label`; 15 `text-transform: uppercase` rules in total |
| Body | 16px (UA default) | 400 | **1.6** | — | Sentence | `body` `globals.css:78-83` |
| Body, secondary | 0.9–0.95rem | 400 | 1.4–1.7 | — | — | Opportunity/FAQ copy, `.value p` |
| Small / caption | 0.8–0.85rem | 400–600 | — | — | — | `.footer-copy` 0.8rem `:2803`; `.error-message` 0.85rem `:419` |
| Nav link | 0.875rem (0.8125 ≤768px, 0.75 ≤480px) | 600 | — | 0.05em | Title | `.main-nav a` `globals.css:162-171`, `:1193`, `:1378` |
| Button | 0.8–1rem (1rem typical) | 600 (700 on contact/map region) | — | 0.02–0.05em | Title | See §4.1 |
| Form label | 0.8–0.9rem | 400 | — | — | Sentence | `.form-group label` `:388` |

---

## 4. UI elements

### 4.1 Buttons

There is **no shared button component or base class**. There are 20+ bespoke button classes. They fall into these families:

| Family | Classes (file:line) | Default | Hover / active | Disabled | Radius | Padding |
|---|---|---|---|---|---|---|
| **Primary: ocean (Dune)** | `.nav-return-map-btn` `globals.css:4130`, `.acct-btn-save` `:4044`, `.map-region-btn` `:3561`, home/about `.btn-secondary` override `:3543,4322` | bg `#4A7C8C`, text white | bg `#1B4965` | opacity 0.6 | 6px (50px on `.btn-secondary`) | 0.45rem 1rem / 8px 16px |
| **Primary: horizon gold** | `.login-btn` `:404`, `.scan-btn` `:675` | bg `--horizon-3` `#D4A55A`, white text | bg `--horizon-4` `#B86B3A`, `scale(1.03)` | opacity 0.6, no transform | 6px / 8px | 0.75rem / 14px 32px |
| **Primary: parchment (hunt)** | `.hunt-btn-submit` `:3781`, `.hunt-btn-submit-sm` `:3798` | bg `#C4A882`, text `#0B2838`, 1px `#8A7A5E` border | bg `#8A7A5E`, white text | opacity 0.6 | 6px | 0.75rem / 0.6rem |
| **Outline pill** | `.btn-secondary` `:335` | Transparent, 2px `--dune-7` border, `--dune-7` text, 600 | bg `--dune-1` | — | **50px** | 1rem 2.5rem |
| **Outline (light on dark)** | `.page-theme--home/about .cta .btn-secondary` `:4330` | bg white, text `#0B2838` | bg `rgba(255,255,255,.85)` | — | 50px | — |
| **Ghost / secondary** | `.acct-btn-cancel` `:4058`, `.map-city-btn` `:3580` | Transparent, 1px `#8A7A5E` border, `#8A7A5E` / `#0B2838` text | Border/text `#4A7C8C`, or bg `#4A7C8C` + white | opacity 0.6 | 6px / 5px | 0.45rem 1rem |
| **Icon / text** | `.acct-btn-edit` `:4071`, `.pw-toggle-btn` `:4159`, `.nav-logout-btn` `:2056`, `.nav-login-link` `:2071` | No bg; `#4A7C8C` / `#8A7A5E` / `--color-text` | `rgba(74,124,140,.12)` bg, or text `--color-accent` | — | 4px | minimal |
| **Legacy black (shop)** | `.shop-card-btn` `:841`, `.shop-result-btn` `:1112`, `--secondary` `:1129` | bg `#0A0A0A`, white text (outline variant: 2px `#0A0A0A`) | bg `#333`, `scale(1.03)` | bg `#CCC`, text `#888` | 8px | 0.6rem 1rem / 0.7rem 1.6rem |
| **Legacy blue** | `.shop-cart-checkout-btn` `:1027`, `.contact-btn` `:2957`, `.location-btn` `:500`, `.sidebar-country-btn` `:2843` | bg `#0169AA` (or light-blue tint), white | bg `#015A91`, `scale(1.02)`, glow shadow | opacity 0.65 | 8–10px / 6px | 0.75–0.9rem |
| **Legacy red** | `.popup-visit-btn` `:586` | bg `#E30000` | bg `#B30000` | — | 6px | 0.45rem 0 |
| **Admin** | `.admin-btn` + `--primary`, `--danger`, `--small` `:1518-1563` | Dark `#2D3142` / blue `#4A9EFF` / red tint | Lighter fill | opacity 0.5 | 7px | 0.55rem 1.1rem |
| **How It Works tiles** (not buttons) | `.hiw-flow__tile` `:2192` | bg `#1B4965`, white; branch: white + 2px dashed `#1B4965` | — | — | 12px (scaled) / 14px | — |

Inline-styled buttons also exist in the hunt flow (`HuntClient.tsx`, `HuntLocationClient.tsx`, `RevealLocationButton.tsx:111`, which uses a `linear-gradient(135deg, #4A7C8C, #0B2838)`).

### 4.2 Cards and panels

| Component | Background | Border | Radius | Shadow | Padding | Source |
|---|---|---|---|---|---|---|
| Auth card (base) | `#FFFFFF` (overridden to `rgba(255,255,255,.92)`) | — | 12px | `0 8px 32px rgba(0,0,0,.2)` | 2.5rem | `globals.css:367,440,4267` |
| Auth card (themed login/signup) | none | none | 0 | none | 2.5rem 1.5rem, max 380px | `:3612,3694` |
| Opportunity card | white | 4px top border `--dune-6` / `#C9A84C` | 16px | `0 4px 20px rgba(0,0,0,.1)` | 2rem | `:2403-2418` |
| About bucket | white → `rgba(255,255,255,.92)` | — | 16px | `0 4px 20px rgba(0,0,0,.08)` | 2rem | `:2095,4263` |
| Shop card | white | — | 14px | `0 4px 20px rgba(0,0,0,.12)` | — | `:754` |
| Account card | `rgba(255,255,255,.72)` → `.92` | 1px `rgba(138,122,94,.35)` | 12px | — | 1.5rem 1.75rem | `:4006,4293` |
| Account stat card | `rgba(74,124,140,.2)` → `rgba(196,176,142,.92)` | 1px `#4A7C8C` | 10px | — | 1.25rem 1rem | `:4097,4298` |
| Hunt questions panel | `rgba(255,255,255,.85)` → `.92` | 1px `#8A7A5E` | 0.75rem | — | 1.25rem | `:3900,4312` |
| Scan / shop-result container | white | — | 16px | `0 8px 40px rgba(0,0,0,.2/.18)` | 48px 32px / 3rem 2.5rem | `:634,1060` |
| Collectible modal (dark) | `#13161F` | 1px `rgba(255,255,255,.1)` | 18px | `0 32px 80px rgba(0,0,0,.72)` | — | `:3109` |
| Hunts card (dark) | `#1A1A1A` | 1px `#2A2A2A` | 0.75rem | — | 1.25rem | `:3408` |
| Values bubble | gradient `#C4B08E → #4A7C8C` → `rgba(196,176,142,.92)` | — | 200px (circle) | `0 10px 30px rgba(0,0,0,.15)` | 4rem | `:262-272,3262,4282` |

### 4.3 Links

- **Nav:** `--color-text` (inline `#0B2838`), 600, 0.875rem, 0.05em tracking, no underline. Hover and active use `--color-accent` `#D4A55A` (`globals.css:162-173`). However, the inline `style={{ color: '#0B2838' }}` on every header link (`Header.tsx:52-58`) **overrides the hover colour**, so hover has no visible effect.
- **Auth links:** `--color-muted`, underline on hover (`:421-429`). On themed pages: `#0B2838`, hover `#4A7C8C` (`:3674-3678`).
- **Footer:** 0.88rem/600, `opacity: .82` → 1 on hover (`:2816-2824`). The inline styles in `Footer.tsx` force `#0B2838` and opacity 1.
- **Gold link:** `.hunts-card-signin a` `#C9A84C`, underline on hover (`:3465-3470`).
- **Settings icon link:** `#000000` at 0.75 opacity (`:4147`).

### 4.4 Form inputs

| Variant | Bg | Border | Radius | Padding | Focus | Source |
|---|---|---|---|---|---|---|
| Base `.form-group input` | `rgba(255,255,255,.8)` | none | 6px | 0.6rem 1rem | bg → white, no outline | `globals.css:394-403` |
| Login/signup themed | `rgba(255,255,255,.8)`, text `#0B2838`, placeholder `rgba(11,40,56,.45)` | 1px `#C4B08E` | 6px | — | border `#8A7A5E`, outline none | `:3657-3668,3718-3729` |
| Hunt / account | `rgba(255,255,255,.85)`, text `#0B2838` | 1px `#8A7A5E` | 6px | 0.75rem 1rem / 0.6rem 0.85rem | border `#4A7C8C` | `.hunt-input` `:3814`, `.acct-input` `:4029` |
| Contact form | white, text `#0A0A0A` | 1.5px `#DDE4EA` | 8px | 0.65rem 0.9rem | border `#0169AA` + `0 0 0 3px rgba(1,105,170,.12)` | `:2932-2947` |
| Admin (dark) | `#0F1117`, text `#E8ECF4` | 1px `#2D3142` | 7px | 0.6rem 0.85rem | border `#4A9EFF` | `:1775-1790` |

Labels are 0.8–0.9rem, coloured `--color-muted`, `#0B2838` or `#444`. Focus is shown by border colour only: there are **no visible outline/focus rings** on brand inputs.

### 4.5 Border radii (globals.css frequency)

`6px` ×19 · `12px` ×10 · `8px` ×8 · `10px` ×7 · `16px` ×6 · `50%` ×6 · `14px` ×4 · `0.75rem` ×4 · `4px` ×3 · `18px` ×3 · `50px` ×2 · `7px` ×2 · `20px` ×2 · `999px` ×2 · `200px`, `2px`, `5px` ×1.

The de-facto scale is **6px for controls, 12px for cards and panels, 16px for large cards, and pills (50px or 999px) for the outline CTA**.

### 4.6 Shadows

Shadows are all black-based with no tinted elevation system. The most common:
- `0 4px 20px rgba(0,0,0,.08 / .1 / .12 / .15 / .2 / .3)`: cards (8 uses, at 6 different opacities)
- `0 8px 32px rgba(0,0,0,.2)`: auth cards
- `0 8px 40px rgba(0,0,0,.18 / .2)`: result/scan containers
- `0 10px 30px rgba(0,0,0,.15)`: values bubbles
- Dark modals: `0 24px 64px rgba(0,0,0,.6)`, `0 32px 80px rgba(0,0,0,.72)`
- Glows: `drop-shadow(0 0 8–24px #C9A84C)` hunt pulse (`:3495`), contact hover `0 4px 18px rgba(1,105,170,.35)`

### 4.7 Spacing, widths and breakpoints

- **Container:** `max-width: 1200px` (`--max-width`), side padding `2rem`, dropping to `1.1rem` at ≤768px and `0.9rem` at ≤480px (`globals.css:86-90,1170,1357`).
- **Section rhythm:** `--section-padding: 6rem` top and bottom on every main section. The home values section uses `6rem 4rem`.
- **Header height:** 80px (`--header-height`). `.page-theme` pads the top by this amount (`:2630-2634`).
- **Narrow content widths:** 380–500px (forms, modals), 600–720px (text blocks, FAQ list `720px`), 1480px (How It Works diagram).
- **Gaps:** mostly `0.75rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`. There is no spacing token scale.
- **Breakpoints:** max-width **768px** (10 blocks) and **480px** (2), plus one-offs at 1199/1200, 900, 768 (min), 600 and 500px.
- **Motion:** transitions of 0.15–0.3s `ease`. Common hover lifts are `scale(1.02–1.03)` and `translateY(-1px)`.

---

## 5. Page themes

Every page wraps its content in `.page-theme.page-theme--X` (`globals.css:2629-2700`), which sets `min-height: 100vh` and a top padding of `--header-height`. Per-section colours follow in `globals.css:2703-2760`, with text-contrast overrides in `:4178-4339`.

| Theme | Page(s) | Page bg | Section colours / accent usage |
|---|---|---|---|
| `--home` | `/` | `#F2EDE3` | Full-viewport video hero with a 1px `#3D8B7A` frame and white text with a teal glow. `.section_1` `#F2EDE3`; `.cta` `#C4B08E`; `.btn-secondary` `#4A7C8C` → `#1B4965` |
| `--about` | `/about`, `/our-story` | `#F2EDE3` | `.section_1` `#F2EDE3`/navy text; `.about-buckets` `#C4B08E`; `.about-vision`/`.section_2`/`.section_3` **`#4A7C8C` with white text**; `.about-narrative` (Our Story) **`#8A7A5E` with white text**; bucket `h3` in legacy `#0169AA` |
| `--hiw` | `/how-it-works` | `#FFFFFF` (`--dune-1`) | Navy `--dune-7` heading with gold `--accent-gold` underline; `#1B4965` tiles; gold icons and junctions |
| `--opportunities` | `/opportunities` | `#FFFFFF` | Navy text; card accents `--dune-6` (people) / `#C9A84C` (business) |
| `--faq` | `/faq` | `#FFFFFF` | Navy text; `+` toggle in `--dune-7` |
| `--map` | `/map`, `/hunts` | `#F2EDE3` | `.map-section` **`#4A7C8C` with white text**; sidebar white; region buttons `#4A7C8C`; city buttons outline `#8A7A5E` |
| `--library` | `/library` | `#FFFFFF` | Flat white, navy text throughout; 1:1 square tiles |
| `--shop` | `/shop` | `#F2EDE3` | Navy text; legacy black/blue buttons; `#C9A84C` accents inline |
| `--contact` | `/contact` | `#F2EDE3` | Navy text; legacy blue `#0169AA` submit |
| `--login` / `--signup` | `/login`, `/signup` | `#F2EDE3` | Card-less form; `#C4B08E` input borders; `--horizon-3` gold submit |
| `--account` | `/account` | `#F2EDE3` | Translucent white cards; `#4A7C8C` save button; `#8A7A5E` borders |
| `--hunt` | `/hunts/[id]/…` | `#F5F0E8` (parchment) | `.hunt-layout` `#E8DCC8`; `#C4A882` submit; `#4A7C8C` accents; gold `#C9A84C` glow animation (`:3493-3497`) |
| `--scan` | `/scan` | `#F5F0E8` | `.scan-page` `#F5F0E8`, navy text; `--horizon-3` scan button |
| `--admin` | `/admin` | `#F2EDE3` | `.admin-page` is a separate **dark** UI (see §1.6) |

### Header spec

From `components/layout/Header.tsx` and `.site-header` (`globals.css:105-173`, `:2611-2627`):
- **Position:** fixed, full width, `min-height: 80px`, `z-index: 10`.
- **Surface:** bg `#FFFFFF`, bottom border `1px solid rgba(0,0,0,.08)`.
- **Layout:** a single row with `padding: 0 2rem`.
  - **Left:** the logo (40px black mark + "Kitea" at 1.25rem/700).
  - **Centre:** nav, absolutely centred, `gap: 1.5rem`. Links are How It Works and Map, plus Library, Shop and Admin when signed in.
  - **Right:** `.header-row1-right`, `gap: .75rem` (`globals.css:4125`). It holds "← Return to map" (a `#4A7C8C` pill, 0.8rem/600, 6px radius, hover `#1B4965`), a 22px black settings icon, and Logout or Login.

### Footer spec

From `components/layout/Footer.tsx` and `.site-footer` (`globals.css:349-357`, `:2763-2836`):
- **CSS:** `.site-footer` sets bg `#0B2838`, text `#F2EDE3`, `padding: 3rem 0`, top border `rgba(74,124,140,.3)`.
- **What renders:** inline styles in `Footer.tsx:6-34` override the CSS to **bg `#FFFFFF`, text `#0B2838`, every opacity forced to 1**, so the live footer is white with navy text.
- **Layout:** `.footer-inner` is a flex row, `max-width: 1200px`, `gap: 1.25rem`.
  - **Left:** an Instagram link (20px stroke icon + "Instagram", 0.88rem/600).
  - **Centre:** "© 2026 Kitea Ao. All rights reserved." at 0.8rem.
  - **Right:** links to About, Our Story, Opportunities, FAQ and Contact (`mailto:`).
- **≤768px:** the row stacks into a centred column.

---

## 6. Imagery

**Where assets live**
- **Logos:** `public/images/` (see §2).
- **Leaflet UI images:** `public/images/leaflet/`.
- **Videos:** `public/videos/`.
  - `kurnell-1.mp4` (16 MB): the **home hero**, `components/home/HeroCarousel.tsx:23`.
  - `opera-1.mp4` (6 MB): not referenced.
  - `eloeura.mp4` (3 MB): not referenced.
- **Collectible and hunt art:** served from Supabase storage via signed URLs (`lib/storage/signedUrlCache.ts`, `art_image_url` / `art_signed_image_url`).

**Treatments in code**
| Treatment | Where |
|---|---|
| Full-bleed video, `object-fit: cover`, 100vh, inside a 1px `#3D8B7A` frame with a 2px radius; centred logo and text overlay with no darkening scrim (legibility comes from a teal + black `text-shadow`) | `HeroCarousel.tsx:41-134` |
| Logo used as a CSS `mask-image` to recolour it | `HeroCarousel.tsx:84-97` |
| `filter: brightness(0)` to force the logo black | `Header.tsx:44` |
| `brightness(0) invert(1)` + coloured `drop-shadow` glow | Map markers `MapComponent.tsx:90-98` |
| Location photo: `aspect-ratio: 1/1`, `object-fit: cover`, **`opacity: 0.7`**, 12px radius, shadow | `.location-photo` `globals.css:602-606` |
| Square product images `aspect-ratio: 1/1`, `object-fit: cover` | Shop card `globals.css:778-798` |
| Collectibles: `object-fit: contain` in 1:1 tiles (`#F8F8F8` bg) or a fixed-height modal | `LibraryClient.tsx:75-81,173-178`; hunt pages |
| Gold pulse glow `drop-shadow(0 0 8px → 24px #C9A84C)` on hunt reveal | `globals.css:3493-3497` |
| Frosted glass `backdrop-filter: blur(4–14px)` on overlays, auth cards, toasts and the PWA banner | `globals.css:369,1671,1988,2036,2899,3096,3335,4269` |
| Gradients: values bubbles `#C4B08E → #4A7C8C`; reveal button `135deg #4A7C8C → #0B2838` | `globals.css:3262`; `RevealLocationButton.tsx:111` |

---

## 7. Voice (verbatim copy)

**Brand lines**
- Hero: **"KITEA"**, then *"Inspire adventure and connection through stories and shared journeys."* (`components/home/HeroCarousel.tsx:113,130`)
- Meta description: *"Kitea — a physical tag scavenger hunt where scanning tags unlocks collectibles and exclusive merchandise."* (`app/layout.tsx:13-14`)
- Manifest: *"Adventure hunt platform. Find NFC tags, earn collectibles, unlock merch."* (`public/manifest.json`)
- About epigraph: *"He tangata kite nui, he tangata whakaaro nui." ~ A person who sees much is a person of great understanding.* (`app/about/page.tsx:11`)
- Vision (`app/about/page.tsx:41-46`): *"A world where clothing empowers people to step into stories bigger than themselves. / Where every journey deepens our connection to each other, the planet, and the stories that shaped us. / We exist because curiosity and connection move us forward. / By transforming branding and technology into a platform for storytelling, / We break patterns and open pathways to exploration, creativity, and impact beyond the everyday."*
- Values (`app/about/page.tsx:56-60`):
  - **Nurture:** "Nurture the growth of people to enhance the quality of life and the environment."
  - **Freedom:** "Inspire people to seize the freedom they have and create the freedom they want."
  - **Connection:** "Facilitate connection with people to each other and their environment."
  - **Dreamers:** "Kick start dreams and open doors for dreamers."
  - **Challenge:** "Challenge norms and challenge people to step outside their comfort zone."
- Our Story closing line: *"This brand is more than clothing. It is a catalyst — a way to nurture growth, inspire freedom, foster connection, ignite dreams, and challenge the ordinary. Through our business model, every garment becomes a gateway: not to more consumption, but to more life."* (`app/our-story/page.tsx`)

**Page headings and taglines**
| Page | Heading | Supporting line |
|---|---|---|
| About | What is Kitea · Kitea · What Does this mean to me? · Kitea Ao · Vision · VALUES | — |
| Our Story | Our Story | — |
| How It Works | How It Works | Steps: Sign in · Find your hunt · Set out · Choose your path · On arrival · On the way · Find the tag · Tap to claim · Admire your find · Shop (`components/how-it-works/HowItWorksFlow.tsx:35-86`) |
| Opportunities | Opportunities · For Adventurers · For Businesses | e.g. "Collect unique collectibles tied to real locations", "Drive foot traffic to physical locations with tag hunts" (`components/opportunities/OpportunitiesSection.tsx:8-27`) |
| FAQ | Frequently Asked Questions | — |
| Shop | The Shop | "Exclusive items unlocked by your adventures." (`app/shop/ShopClient.tsx:80-81`) |
| Contact | Get in Touch | "We'd love to hear from you." (`app/contact/page.tsx:23-24`) |
| Library | Library · Congratulations! | — |
| Account | Account Details · Adventure Stats | — |
| Hunt entry | — | "How do you want to find this?" (`app/hunts/[id]/HuntEntryClient.tsx:34`) |
| Shop success | Order Confirmed! | "Thank you for your purchase. Your order has been placed successfully." |
| Shop cancel | Checkout Cancelled | "Your order was not completed. No charges have been made." |
| Scan | Verifying your scan… · Already Scanned · Scan Failed | — |
| Auth | Login · Create Account | — |
| Placeholder | 🚧 Under Construction 🚧 | — |

**CTA and button labels** (idle label → busy label)
- Login → Logging in… (`components/auth/LoginForm.tsx:102`)
- Create Account → Creating account… (`SignupForm.tsx:210`)
- Send Message → Sending… (`app/contact/ContactForm.tsx:117`)
- Add to Cart → Redirecting... (`app/shop/ShopClient.tsx:392`)
- Coded Clue / Location based Clue → Loading… (`HuntEntryClient.tsx:44,59`)
- Submit → Checking… (`HuntClient.tsx:390`, `HuntLocationClient.tsx:300`)
- Reveal location → Revealing… (`RevealLocationButton.tsx:118`)
- Save → Saving… (`AccountClient.tsx:125`)
- ← Return to map (`components/layout/ReturnToMapButton.tsx:19`)
- ← Back (`HuntBackButton.tsx:20`)
- Continue Shopping (`app/shop/success/page.tsx:35`)
- Return to Shop (`app/shop/cancel/page.tsx:20`)
- Visit Page (`components/map/MapClient.tsx:213`)
- Install (`components/PWAInstallPrompt.tsx:113`)
- Copy collection ID → Copied! (`components/wallet/WalletButton.tsx:35`)

**Nav labels:** How It Works · Map · Library · Shop · Login (header); About · Our Story · Opportunities · FAQ · Contact (footer).

**Tone in practice:**
- **Mission copy:** aspirational, first-person-plural, values-led, with Te Reo Māori grounding.
- **UI copy:** short, sentence- or Title-Case, verb-first CTAs, an ellipsis on loading states, occasional exclamation marks on success.

---

## Inconsistencies worth consolidating

1. **Raw hex instead of tokens.** `#0B2838` appears 104× raw against 24× as `var(--dune-7)`. `#4A7C8C` appears 52× raw and never as a var. The same holds for `#8A7A5E`, `#F2EDE3` and `#C4B08E`. The hunt pages and `ShopClient.tsx` define their own local colour constants (e.g. `HuntClient.tsx:11-12`).
2. **Two of three palettes are effectively unused.** Organic Coastal has 4 real uses and Golden Burnt Horizon about 15. All six `--kitea-*` aliases have 0 uses.
3. **Competing accent colours.**
   - **Gold:** `--horizon-3` `#D4A55A` (the semantic `--color-accent`), `#C9A84C` (`--accent-gold`), `#C9A227`, `#C8960C`, `#E0AA1A` and `#FACC15` all serve as "the gold".
   - **Primary button:** `#4A7C8C` (ocean), `#D4A55A` (gold auth/scan), `#C4A882` (parchment hunt), `#0A0A0A` (shop) and `#0169AA` (contact/checkout).
4. **A legacy blue system (`#0169AA` family) is still live** in the shop cart, contact form, map sidebar and about bucket headings. Remnants of the older "Surfy" palette (`#2A9D8F`, `#1D3557`) are also still present.
5. **Near-duplicates.**
   - `#D4C4A0` vs `--coastal-3` `#D4C5A0`.
   - `#F5F0E8` / `#E8DCC8` / `#C4A882` (parchment) vs `--dune-2` `#F2EDE3` / `--dune-3` `#C4B08E`.
   - `#0A0A0A` vs `#000000` vs `#111111`.
   - Card shadow `0 4px 20px` at six different opacities.
6. **Header and footer colours fight their CSS.**
   - Inline `color: '#0B2838'` on header links cancels the `--color-accent` hover (`Header.tsx:52-58` vs `globals.css:172`).
   - The footer CSS says navy bg, but inline styles render it white (`Footer.tsx:6` vs `globals.css:350`).
   - The `Footer.tsx:2` comment refers to `body:has(.page-theme--X)` rules that don't exist.
   - `<body className="theme-dark">` (`app/layout.tsx:50`) has no matching CSS.
7. **Two coexisting theming systems.** The "Round 2 seamless gradient" comments (`globals.css:2603-2608`) describe a gradient system that later rules replaced with solid sections (`:2703-2706`). Many `.page-theme--X` rules are declared twice, e.g. `--account` at `:2684` and `:2751`, and the library text colour at `:3744` and `:4235`.
8. **No type scale.** There are no global h1–h6 rules, so `.section_1 h2` compounds to as much as 4.5rem. Inter is loaded at 400/600/700, but 500, 800 and 900 are requested and get synthesised. Map popups and the map-marker SVG use Arial.
9. **Radii drift.** 15 distinct values; 6px, 7px, 8px and 10px are used interchangeably for controls, and 12px, 14px, 16px, 18px and 0.75rem for cards.
10. **Logo and icon assets.**
    - Seven of the nine logo files are unused.
    - `icon-192.png` and `icon-512.png` are byte-identical duplicates.
    - `apple-touch-icon.png` is 192×192 but declared as 180×180 (`app/layout.tsx:17`).
    - There is no favicon.
    - `map-marker.svg/.png` are unused and off-brand (red pin, Arial "K").
    - The navy lockup background (~`#0E3451`) doesn't match `--dune-7` `#0B2838`.
    - `theme_color` / `background_color` `#0a0a0a` (manifest, `layout.tsx:29`) isn't a palette colour.
11. **Unused media.** `opera-1.mp4` and `eloeura.mp4` (9 MB combined) aren't referenced anywhere.
12. **No focus styles on brand inputs.** Focus is a border-colour change only, and buttons have no `:focus-visible` style except `.map-region-btn` and `.map-city-btn`.
