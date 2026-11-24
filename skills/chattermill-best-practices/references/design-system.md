# Chattermill Design System — MCP Output Styling Reference

Source: Chattermill Design System 2.0. Use these tokens when styling HTML report artifacts (tables, cards, charts, badges) to match the Chattermill product. Supports light and dark mode via `[data-theme="dark"]`.

## Colour Palette

### Light Mode (default)

#### Neutrals

| Token | Hex | Semantic var | Usage |
|---|---|---|---|
| `white` | `#FFFFFF` | `--color-surface-neutral-default` | Page/card background |
| `neutral-00` | `#FAFCFD` | `--color-surface-neutral-subtle-default` | Subtle background, table header bg |
| `neutral-10` | `#F5F8FC` | `--color-surface-neutral-medium-default` | Medium surface |
| `neutral-30` | `#EBF1F8` | `--color-surface-neutral-medium-hover` | Row hover bg |
| `neutral-40` | `#E6EEF7` | `--color-border-neutral-subtle-default` | Borders, dividers |
| `neutral-130` | `#6F87A1` | `--color-text-action-medium-inactive` | Labels, meta text, placeholders |
| `neutral-150` | `#4F6173` | `--color-text-neutral-subtle` | Secondary text, captions |
| `neutral-160` | `#3F4D5C` | `--color-text-neutral-medium` | Body text |
| `neutral-180` | `#20272E` | `--color-text-neutral-strong` | Headings, high-emphasis text |

#### Primary (Blue — interactive elements only)

| Token | Hex | Semantic var | Usage |
|---|---|---|---|
| `primary-10` | `#E7F3FF` | `--color-surface-action-medium-default` | Selected row bg |
| `primary-110` | `#107AE3` | `--color-border-action-strong` | Focus border, icon action |
| `primary-120` | `#0E6CCA` | `--color-surface-action-strong-default` | Primary button bg, active nav text |

#### Sentiment / Status

| Sentiment | Background | Text |
|---|---|---|
| Positive | `#EAF9EE` — `--color-surface-positive-subtle-default` | `#197731` — `--color-text-positive-medium` |
| Negative | `#FDEAF1` — `--color-surface-negative-subtle-default` | `#A72051` — `--color-surface-negative-strong-hover` |
| Warning | `#FEF8E6` — `--color-surface-warning-subtle-default` | `#7B5C00` — `--color-text-warning-medium` |
| Neutral | `#E0EAF5` — `--color-border-neutral-subtle-default` | `#3F4D5C` — `--color-text-neutral-medium` |

### Dark Mode (`[data-theme="dark"]`)

All semantic vars override automatically — use the same var names in both themes, never hard-code hex for a specific mode.

| Role | Dark hex | Notes |
|---|---|---|
| Page bg | `#111820` | Cool dark blue-grey, not pure black |
| Subtle bg | `#0D1218` | |
| Medium bg | `#182029` | |
| Row hover | `#1E2A36` | |
| Borders | `#1E2A36` | |
| Headings | `#E6EEF7` | Inverted from light |
| Body text | `#B8CCDF` | |
| Secondary text | `#8DA3B8` | |
| Labels/meta | `#7390AB` | |
| Links/active | `#5AADFF` | Brighter blue for dark bg |
| Focus/action border | `#3B9CF5` | |
| Primary button bg | `#1570C8` | |
| Positive text | `#4ADB6E` | |
| Negative text | `#F06898` | |
| Warning text | `#F5C518` | |
| Positive bg | `#0F2015` | |
| Negative bg | `#2A1018` | |
| Warning bg | `#1E1A0D` | |
| Selected row | `#112030` | |

**Design decisions:** base surface is blue-tinted (not pure black); neutral ramp stays blue-tinted; primary blue lightens for AA contrast on dark surfaces; sentiment text/icons lighten to maintain contrast; tooltips unchanged (`#1D2744` is already dark); warning strong stays `#F5B700`.

## Typography

**Font:** Outfit (variable); load via Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap');
```
Fallback stack: `'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`

> App UI uses **Outfit** — never use Inter or Poppins in product interfaces.

| Role | Size | Weight | Colour var |
|---|---|---|---|
| Display / Hero | 32px | 700 Bold | `--color-text-neutral-strong` |
| Heading 1 | 24px | 700 Bold | `--color-text-neutral-strong` |
| Heading 2 | 20px | 700 Bold | `--color-text-neutral-strong` |
| Heading 3 | 16px | 500 Medium | `--color-text-neutral-strong` |
| Heading 4 | 14px | 500 Medium | `--color-text-neutral-strong` |
| Body default | 14px | 400 Regular | `--color-text-neutral-medium` |
| Body small | 13px | 400 Regular | `--color-text-neutral-medium` |
| Label | 12px | 500 Medium | `--color-text-neutral-subtle` |
| Caption | 11px | 400 Regular | `--color-text-neutral-subtle` |
| Overline | 11px | 500 Medium | `--color-text-action-medium-inactive` |

**Weights:** 400 (body), 500 (labels, nav, headings H3–H4, table headers), 700 (page titles, headings H1–H2, buttons).

**Colour pairing:** Headings → `--color-text-neutral-strong`; body → `--color-text-neutral-medium`; labels/captions → `--color-text-neutral-subtle`; placeholders → `--color-text-action-medium-inactive`; links → `--color-text-action-strong-default`. All resolve automatically per theme.

## Component Patterns

### Tables

- **Container:** 1px `--color-border-neutral-subtle-default`, border-radius 8px
- **Header row:** 40px height, bg `--color-surface-neutral-subtle-default`, 12px SemiBold `--color-text-neutral-subtle`, 1px bottom border
- **Body row:** 48px height (36px compact), 13px Regular `--color-text-neutral-medium`, 1px bottom border
- **Cell padding:** 0 16px; numbers right-aligned, `font-variant-numeric: tabular-nums`
- **Hover row:** bg `--color-surface-neutral-medium-hover`; selected row: bg `--color-surface-action-medium-default`

### Cards

- **Background:** `--color-surface-neutral-default`; **border:** 1px `--color-border-neutral-subtle-default`; **border-radius:** 8px
- **Padding:** 16px (compact) / 20px (default) / 24px (spacious)
- **Title:** 14px SemiBold `--color-text-neutral-strong`
- **Hover shadow:** `0 2px 8px rgba(0,0,0,0.08)`

### Badges (sentiment)

- **Shape:** pill (100px border-radius), 11px SemiBold, padding 0 8px, height 20px (small) / 24px (default)
- **Positive:** bg `--color-surface-positive-subtle-default`, text `--color-text-positive-medium`
- **Negative:** bg `--color-surface-negative-subtle-default`, text `--color-surface-negative-strong-hover`
- **Warning:** bg `--color-surface-warning-subtle-default`, text `--color-text-warning-medium`
- **Neutral:** bg `--color-border-neutral-subtle-default`, text `--color-text-neutral-medium`
- **Primary:** bg `--color-surface-action-medium-default`, text `primary-140` (#0B5197)

### Charts (Highcharts)

- **Background:** transparent (inherits card bg)
- **Axis labels:** 12px / 500, `--color-text-neutral-subtle`
- **Grid lines:** `--color-border-neutral-subtle-default`
- **Tooltip:** bg `#1D2744` (unchanged in dark mode — already dark), white text, 10px radius, no border
- **Sentiment colours:** positive `#29c752`, negative `#ef2e74`, neutral `#9ec1e6`
- **Primary data colour:** `#0196ED`

## Spacing

All spacing snaps to a **4px grid**: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 px.

## Border Radius

| Token | Value | Used for |
|---|---|---|
| `r-1` | 4px | Tooltips, small tags, checkboxes |
| `r-2` | 8px | Inputs, buttons, dropdowns, modals, cards, toasts |
| `r-full` | 100px | Pills, badges, toggles, avatars |

## CSS Custom Properties Template

```css
:root {
  /* Surfaces */
  --color-surface-neutral-default: #FFFFFF;
  --color-surface-neutral-subtle-default: #FAFCFD;
  --color-surface-neutral-medium-default: #F5F8FC;
  --color-surface-neutral-medium-hover: #EBF1F8;
  --color-surface-neutral-medium-active: #E6EEF7;
  --color-surface-action-medium-default: #F1F8FF;
  --color-surface-action-strong-default: #0E6CCA;
  --color-surface-positive-subtle-default: #EAF9EE;
  --color-surface-negative-subtle-default: #FDEAF1;
  --color-surface-warning-subtle-default: #FEF8E6;
  --color-surface-inverted-strong: #20272E;

  /* Borders */
  --color-border-neutral-subtle-default: #E6EEF7;
  --color-border-neutral-subtle-active: #107AE3;
  --color-border-neutral-strong-default: #CCDCEE;
  --color-border-action-strong: #107AE3;
  --color-border-negative-strong: #D72968;

  /* Text */
  --color-text-neutral-strong: #20272E;
  --color-text-neutral-medium: #3F4D5C;
  --color-text-neutral-subtle: #4F6173;
  --color-text-action-strong-default: #0E6CCA;
  --color-text-action-medium-inactive: #6F87A1;
  --color-text-disabled: #8EAECF;
  --color-text-inverted-strong: #FFFFFF;
  --color-text-positive-medium: #197731;
  --color-text-negative-medium: #BF255D;
  --color-text-warning-medium: #7B5C00;

  /* Icons */
  --color-icon-neutral-strong: #20272E;
  --color-icon-neutral-medium: #6F87A1;
  --color-icon-action-strong: #107AE3;
  --color-icon-action-inactive: #8EAECF;

  /* Typography */
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-8: 32px; --sp-12: 48px;

  /* Radii */
  --radius-sm: 4px; --radius-md: 8px; --radius-full: 100px;

  /* Shadows */
  --shadow-1: 0 1px 4px rgba(0,0,0,0.08);
  --shadow-2: 0 2px 8px rgba(0,0,0,0.10);
  --shadow-3: 0 4px 12px rgba(0,0,0,0.12);
  --shadow-4: 0 8px 32px rgba(0,0,0,0.20);
}

[data-theme="dark"] {
  /* Surfaces */
  --color-surface-neutral-default: #111820;
  --color-surface-neutral-subtle-default: #0D1218;
  --color-surface-neutral-subtle-hover: #151D27;
  --color-surface-neutral-medium-default: #182029;
  --color-surface-neutral-medium-hover: #1E2A36;
  --color-surface-neutral-medium-active: #243140;
  --color-surface-action-medium-default: #112030;
  --color-surface-action-strong-default: #1570C8;
  --color-surface-positive-subtle-default: #0F2015;
  --color-surface-negative-subtle-default: #2A1018;
  --color-surface-warning-subtle-default: #1E1A0D;
  --color-surface-inverted-strong: #E6EEF7;

  /* Borders */
  --color-border-neutral-subtle-default: #1E2A36;
  --color-border-neutral-subtle-active: #3B9CF5;
  --color-border-neutral-strong-default: #2A3A4D;
  --color-border-action-strong: #3B9CF5;
  --color-border-negative-strong: #F04D8A;

  /* Text */
  --color-text-neutral-strong: #E6EEF7;
  --color-text-neutral-medium: #B8CCDF;
  --color-text-neutral-subtle: #8DA3B8;
  --color-text-action-strong-default: #5AADFF;
  --color-text-action-medium-inactive: #7390AB;
  --color-text-disabled: #334557;
  --color-text-inverted-strong: #111820;
  --color-text-positive-medium: #4ADB6E;
  --color-text-negative-medium: #F06898;
  --color-text-warning-medium: #F5C518;

  /* Icons */
  --color-icon-neutral-strong: #E6EEF7;
  --color-icon-neutral-medium: #6F87A1;
  --color-icon-action-strong: #3B9CF5;
  --color-icon-action-inactive: #3D5062;

  /* Shadows (stronger on dark) */
  --shadow-1: 0 1px 4px rgba(0,0,0,0.24);
  --shadow-2: 0 2px 8px rgba(0,0,0,0.32);
  --shadow-3: 0 4px 12px rgba(0,0,0,0.36);
  --shadow-4: 0 8px 32px rgba(0,0,0,0.48);
}
```
