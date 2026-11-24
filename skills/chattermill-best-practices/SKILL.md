---
name: chattermill-best-practices
metadata:
  version: 0.3.1
description: MUST USE when calling any Chattermill MCP tool (get_feedback, search_observations, generate_highlights, get_metrics, list_themes, list_attributes, search_attributes). Teaches agents the correct discovery workflow, filter construction, and deep-linking patterns for accurate customer feedback analysis. Triggers on any Chattermill MCP tool usage, feedback analysis, or customer insights work.
---
# Chattermill MCP Best Practices
## Tools
| Tool | Purpose | Use when |
|------|---------|----------|
| `list_themes` | Discover category/theme IDs | Before filtering by theme |
| `list_attributes` | Discover segment IDs and types | Before filtering by segment |
| `search_attributes` | Find specific segment values | Looking up segment values (returns values not IDs) |
| `list_metric_options` | Discover chart config options | Before calling `get_metrics` |
| `get_metrics` | Quantitative trends and breakdowns | Metric charts and trends |
| `get_feedback` | Individual verbatim comments | Raw customer quotes |
| `search_observations` | Issue/praise clusters by theme or keyword | Clustered issues/praise with volumes |
| `generate_highlights` | AI-generated feedback summary | Summarising a topic |
## Before You Respond — Recipe Gate (mandatory)

**You MUST select a recipe before calling any MCP tool.** Match the user's question to a recipe below, then state the recipe number in your response (e.g. "Using Recipe 3 — emerging issues"). If no recipe fits, state "No recipe — using Discovery Workflow directly."

| # | User intent | Key signal | Lines |
|---|-------------|------------|-------|
| 1 | Understand a topic broadly (sentiment + issues + praise) | Names a specific topic — "delivery", "pricing" | 51–94 |
| 2 | Find bugs and technical defects | Bugs, glitches, errors, crashes | 96–139 |
| 3 | Detect what's changing (new or growing issues) | Trends, spikes, "what's new", monitoring | 141–185 |
| 4 | Discover what customers want built | Feature requests, suggestions, wishlist | 187–229 |
| 5 | Understand what customers appreciate | Praise, strengths, "what's working" | 231–274 |
| 6 | Detect positive trends (growing praise) | "What's improving", bright spots | 276–313 |
| 7 | Diagnose why a metric changed between periods | "Why did NPS drop", root cause | 315–409 |
| 8 | Explain why a metric differs between segments | "Why is NPS higher in X than Y" | 411–462 |
| 9 | Detect churn signals and competitor mentions | Churn risk, customers leaving, competitor | 464–526 |
| 10 | Audit data quality and integrity | Fake reviews, duplicates, volume drops | 528–576 |
| 11 | Explain why a theme's share/proportion changed | "Why did X grow as a driver", mix effect | 578–643 |

After selecting a recipe, read **only that recipe's section** from `references/recipes.md` using the line range above (e.g. for Recipe 3, read lines 141–185). Do not load the full 643-line file. Also read lines 1–48 on first use for the shared presentation rules. Follow the recipe's Steps and Presentation instructions exactly.

**Output checklist** — verify before sending:
- Verbatim customer quotes to support findings (see **Using Verbatims** and `references/recipes.md` presentation rules).
- Deep link after every table and chart (see **Linking to the Chattermill App**; script usage in `references/linking.md`).
- Business framing on each finding — "so what?", not just numbers (see **Presentation Rules**).

## Tool-Specific Requirements
### `get_metrics` — chart_config
`chart_config` is **required** and must never contain `null` values — the schema uses `additionalProperties: false`. Call `list_metric_options` first.
```json
{"chart_type": "line", "metric_type": "net_sentiment", "title": "Net Sentiment trend"}
```
- `chart_type`, `metric_type`, `title` are all required
- `breakdown.segment_key` is only valid when `breakdown.type` is `"segment"` — omit otherwise
- Omit `comparison_date_range` and `results_limit` entirely when not needed — do **not** set them to `null`
### `search_observations` — limitations
- `theme_id` is a **top-level integer parameter**, not a filter — omit entirely when unused, do **not** pass `null`. Prefer the `observation_theme` filter for new queries; `theme_id` still works
- At least one of `query`, `theme_id`, or a theme filter (`observation_theme`/`category_theme`) is required
- Supports theme filtering via `observation_theme` (preferred) or `category_theme` (auto-converted to `observation_theme` by the enrichment layer). Both work reliably
- `query` and `filters` can be combined: `filters` scope the data, `query` ranks results within that scope
- Narrow date windows (< 2 weeks) may return 0 — observations need sufficient clustering volume
## Discovery Workflow
Always discover IDs before filtering — do not guess IDs. Load `references/filter-types.md` when building non-trivial filters (segments, score ranges, combined patterns).
1. **Discover themes** — call `list_themes` to get category/theme IDs
2. **Discover segments** — call `list_attributes` to see available segments; call `search_attributes` for specific values. If `list_attributes` returns an oversized response, skip segment discovery and proceed with theme-based filtering
3. **Build explicit filters** using discovered IDs (see `references/filter-types.md` for the complete 15-type specification)
4. **Query** — call the appropriate fetch tool
5. **Verify** — check `applied_filters` in the response matches your intent
## Filter Construction
Use explicit `filters` whenever you know the theme, date range, segment, or data source. Fall back to `query` only before discovery.
**The rule:** prefer explicit `filters` over `query`. Both can be combined on any tool: `filters` scope the data, `query` ranks results within that scope.
`generate_highlights` has **no `query` parameter** — use `filters` only. It is self-contained; do not follow up with `get_feedback`.
### CRITICAL: All IDs Must Be Strings
**Wrong:** `"category_id": 123`, `"segment_id": 42`
**Right:** `"category_id": "123"`, `"segment_id": "42"`
The only integer params are `score_range.from` and `score_range.to`.
### Date Range Filter
Always include a date range — without it, results default to the last 12 months.
```json
{"type": "date_range", "params": {"operation": "is", "value": {"type": "between", "start_date": "2025-01-01", "end_date": "2025-03-31"}}}
```
Other date range types (`last`, `this`, `since`) are in `references/filter-types.md`.
### Category Theme Filter
```json
{
  "type": "category_theme",
  "params": {
    "operation": "match_any",
    "categories": [
      {
        "category_id": "123",
        "themes": [
          {"theme_id": "456"},
          {"theme_id": "789", "sentiment": "negative"}
        ]
      }
    ]
  }
}
```

- `operation`: `"match_any"` (OR) or `"match_all"` (AND)
- `sentiment`: optional per theme — `"positive"`, `"negative"`, `"neutral"`, or omit for all
- Do NOT combine `category_theme` and `observation_id` filters — they overlap
### Observation Type Filter
`{"type": "observation_type", "params": {"operation": "is", "values": ["issue"]}}` — valid values: `"issue"`, `"praise"` (note: plural `values`). Use instead of sentiment words in queries.
### Combining Filters
Filters combine with AND logic. For the complete filter specification (`segment_id`, `score_range`, `search_query`, `data_source`, `data_type`, and combined examples), read `references/filter-types.md`.
## Anti-Patterns
1. **Stuffing filter intent into `query`** — use explicit `filters` instead
2. **Using sentiment words as keywords** — use `observation_type` filter
3. **Omitting a date range** — always include `date_range`
4. **Integer IDs** — all IDs must be strings except `score_range.from`/`to`
5. **Combining `category_theme` and `observation_id`** — they overlap
6. **Building URLs manually** — always use `generate_url.js`; hand-built payloads silently break
7. **Nulling optional chart_config fields** — `additionalProperties: false` rejects `null` values; omit unused fields entirely
8. **Passing `theme_id: null` to `search_observations`** — omit the field entirely when not scoping to a theme
## Using Verbatims
Include verbatim customer quotes alongside AI-generated summaries — summaries alone lack evidence and feel generic. Place quotes inline after the finding they support, not bundled at the end.
- Prefer quotes from observation snippets (`snippets_per_observation`) over a separate `get_feedback` call when the data is already available.
- When presenting multiple quotes, choose diverse examples — different customers, use cases, or facets of the issue.
- Prefer quotes that are representative of the broader finding but still specific and detailed. Skip generic one-liners like "terrible" or "great".
- Pure metric responses (e.g. "what's our NPS?") and discovery steps don't need quotes.
## Linking to the Chattermill App
Always generate deep links alongside results. **Use the bundled script only — never construct the URL or payload manually.**
Load `references/linking.md` before generating any deep link — it contains script usage, tool→link-type mapping, batch mode, input schemas, and filter format details.
## Presentation Rules
- Keep tone measured. Do not use `collapse`, `crisis`, `exploded`, `alarming`, `devastating`, `plummeted`, or `skyrocketed`. Prefer literal phrasing like "declined sharply", "major issue", or "large increase".
- Do not give unsolicited recommendations.
- You may offer one follow-up: ask whether the user wants an interactive report/dashboard. If they accept, build it with the Chattermill app design system, preserve the same filters/date ranges, and include working deep links.
### Design system essentials (for HTML artifacts)
Load `references/design-system.md` when building any HTML report, dashboard, or UI component. The key points:
- **Font:** Outfit (not Inter). Load via `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap')`. Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`.
- **Dark mode:** Activate via `[data-theme="dark"]` on `<html>`. All semantic CSS vars (`--color-*`) are overridden automatically — use the same var names in both themes, never hard-code hex for a specific mode. Include a theme toggle in every artifact. Dark base surface is `#111820` (cool blue-grey, not pure black).
- **Radii:** 4px (tooltips, tags), 8px (inputs, buttons, cards, modals), 100px (pills, badges).
- **Sentiment colours:** Positive bg `#EAF9EE` / text `#197731`; Negative bg `#FDEAF1` / text `#A72051`; Warning bg `#FEF8E6` / text `#7B5C00`; Neutral bg `#E0EAF5` / text `#3F4D5C`.
- **Charts (Highcharts):** Transparent bg, axis labels 12px/500 `--color-text-neutral-subtle`, grid `--color-border-neutral-subtle-default`, tooltip bg `#1D2744` (same in dark mode). Sentiment: positive `#29c752`, negative `#ef2e74`, neutral `#9ec1e6`.
### PDF and document output
When the user requests PDF, Word, or printable output, apply these brand defaults instead of the HTML design system:
- **Font:** Poppins (Regular, SemiBold, ExtraBold). Fallback: Arial. Never use Outfit (that's for in-app HTML only).
- **Colours:** Headings and body text `#332e5e` (navy). Secondary/meta text `#666666`. Links `#1155cc`. Never use `#000000` for text.
- **Tables:** Header row `#332e5e` fill with white SemiBold text. Data rows white fill, navy Regular text. Thin navy borders.
- **Scale:** Section headers 28pt ExtraBold, subsections 14pt ExtraBold, body 10pt Regular, captions 9pt Regular.
- **Footer:** "Chattermill · Confidential" left, "Page [n]" right, 9pt Regular `#666666`, thin navy rule above.
- **Logo:** Place `assets/logo-primary.png` in the header or cover on light backgrounds; use `assets/logo-whiteout.png` on dark/navy backgrounds. Scale proportionally, max width ~150px.
- **Sentiment badges:** Use the same positive/negative/warning/neutral colour pairs from the design system — they work in both HTML and print.
## Reference Loading Phases
Load references on demand at the right phase — do not skip these reads.

**Phase 1 — Recipe selection (before any MCP tool call):**
- `references/recipes.md` — read only the matched recipe section (see Recipe Gate above)

**Phase 2 — Filter construction (after discovery, before querying):**
- `references/filter-types.md` — complete filter specification (all 15 types, combining patterns). Load when building segment, score range, data source, or other non-trivial filters.

**Phase 3 — Results presentation (after data is returned):**
- `references/linking.md` — deep-link generation, script usage, batch mode, URL schemas. Load before generating any deep link.
- `references/statistical-significance/for-agents.md` — comparison logic, significance thresholds, calculator usage. Load when comparing periods or segments.

**Phase 4 — Artefact creation (only when building HTML/PDF output):**
- `references/design-system.md` — HTML report styling, tokens, dark mode. Load when building any Chattermill-branded HTML artifact.
- PDF/document output uses the brand defaults in **Presentation Rules** above (Poppins font, navy palette).
