# Chattermill App Deep Links

## Script Usage

Run `node scripts/generate_url.js` to generate deep links. Never construct URLs or compress payloads manually.

### Link type by MCP tool

| MCP tool used | Link type | Command |
|---------------|-----------|---------|
| `get_metrics` | Analytics chart | `node scripts/generate_url.js analytics '<json>'` |
| `search_observations` or `generate_highlights` | Observations list | `node scripts/generate_url.js feedback '<json>'` with `"tab": "observations"` |
| `get_feedback` | Verbatim feedback | `node scripts/generate_url.js feedback '<json>'` with `"tab": "feedback"` |
| Specific observation | Observation sidebar | `node scripts/generate_url.js observation '<json>'` |

### Batch mode

Generate all links for a response in one call using `batch` — pass an array where each item has a `type` and optional `label`:

```bash
node scripts/generate_url.js batch '[
  {
    "label": "nps_trend", "type": "analytics", "project_id": "1014",
    "chart_type": "line", "title": "NPS Trend", "frequency": "month",
    "date_range_filter": {"type": "between", "start_date": "2025-01-01", "end_date": "2025-06-30"},
    "series": [{"id": "s1", "metric_type": "nps", "filters": []}],
    "breakdowns": [{"type": "filter_group"}]
  },
  {
    "label": "top_issues", "type": "feedback", "project_id": "1014", "tab": "observations",
    "filters": [{"type": "date_range", "params": {"operation": "is", "value": {"type": "between", "start_date": "2025-01-01", "end_date": "2025-06-30"}}}]
  }
]'
# → {"nps_trend": "https://...", "top_issues": "https://..."}
```

Analytics batch entries use `chart_type`, `series[]`, `date_range_filter`, and `breakdowns` at the top level. Do **not** wrap them in `chart_config`. For period comparisons, add `"comparison_date_range": {...}`.

Pass `"debug": true` to return the decompressed payload alongside the URL.

### Link placement

Put each link immediately after the table, chart, or finding it supports. Use one link per distinct view and keep the same filters/date range in the link as in the write-up.

## URL Pattern

```
https://app.chattermill.com/{path}?project={projectId}#{paramsKey}={compressed}
```

## Screen Mapping

| Analysis type | Path | Hash key |
|--------------|------|----------|
| Metrics / charts | `/analytics` | `analyticsParams` |
| Individual verbatims | `/feedback` | `feedbackParams` |
| Issue/praise observation list | `/feedback` | `feedbackParams` |
| Specific observation (sidebar open) | `/feedback` | `feedbackParams` + `insightAssistantParams` |

**There is no `/observations` route.** Use `/feedback` with `active_tab_id: "observations"`.

## Compression

```
lzString.compressToEncodedURIComponent(JSON.stringify(payload))
```

> **Do NOT use `lz.compressToBase64`** — it produces unencoded `+`/`/` characters. Always use `compressToEncodedURIComponent`.
>
> **Always use `generate_url.js`** — never compress and assemble the URL manually. The output of `compressToEncodedURIComponent` is already URL-safe; calling `encodeURIComponent` on it will double-encode the `+` characters to `%2B`, silently breaking the link.

## Analytics Parameters — `generate_url.js` Input

Pass these fields to `node generate_url.js analytics '<json>'` (or as a batch item with `"type": "analytics"`):

```jsonc
{
  "project_id": "1014",
  "chart_type": "line",            // "line", "column", "bar", "table"
  "title": "NPS Trend",
  "frequency": "month",            // "day", "week", "month", "quarter" — omit for non-time charts
  "date_range_filter": {           // omit for all-time; also accepted as "date_range"
    "type": "between",
    "start_date": "2025-10-01",
    "end_date": "2025-12-31"
  },
  "series": [
    {
      "metric_type": "nps",        // "nps", "volume", "net_sentiment", "csat",
                                   //  "average_score", "positive_sentiment", "negative_sentiment"
      "filters": []                // Format B filters scoped to this series
    }
  ],
  "breakdowns": [{"type": "filter_group"}]  // or [{"type": "category"}], [{"type": "segment", "key": "country"}]
}
```

The script auto-fills `id`, colors, legend, and labels — omit them.

### Period comparison charts

To compare two date ranges, add `comparison_date_range`. The script generates the comparison series automatically:

```jsonc
{
  "project_id": "1014",
  "chart_type": "bar",
  "title": "NPS Jul–Aug vs May–Jun 2025",
  "metric_type": "nps",
  "date_range_filter":      {"type": "between", "start_date": "2025-07-01", "end_date": "2025-08-31"},
  "comparison_date_range":  {"type": "between", "start_date": "2025-05-01", "end_date": "2025-06-30"}
}
```

Alternatively, pass two series manually — set `is_for_comparison: true` and `compare_date_range_filter` on the second:

```jsonc
"series": [
  {"metric_type": "nps", "is_for_comparison": false, "filters": []},
  {"metric_type": "nps", "is_for_comparison": true,
   "compare_date_range_filter": {"type": "between", "start_date": "2025-05-01", "end_date": "2025-06-30"},
   "filters": []}
]
```

## Format A vs Format B Filters

**Format A** — used inside `analyticsParams`:
```json
{"property": "data_source", "operatorType": "is", "values": ["149"]}
```

**Format B** — used inside `feedbackParams`, `insightAssistantParams`, and inside `series[].filters` in analytics:
```json
{"type": "data_source", "params": {"operation": "is", "value": ["149"]}}
```

Format B is identical to the MCP filter structure.

**MCP filter → Format A mapping:**

| MCP filter type | Format A `property` |
|----------------|---------------------|
| `category_theme` | `category_theme` |
| `observation_type` | `observation_type` |
| `data_source` | `data_source` |
| `data_type` | `data_type` |
| `segment_id` | `organization_segment_string` (or `_number`/`_date`) |
| `search_query` | `keyword` |
| `score_range` | `score_range` |
| `date_range` | — (use `date_range_filter` top-level field) |

## Feedback Parameters — Verbatims Tab (Format B)

```jsonc
{
  "filters": [/* Format B filters */],
  "sorting": {"property": "createdAt", "direction": "desc"},
  "original_comments": false,
  "active_tab_id": "feedback"
}
```

## Feedback Parameters — Observations Tab (Format B)

```jsonc
{
  "filters": [
    {"type": "date_range", "params": {"operation": "is", "value": {"type": "between", "start_date": "2025-12-01", "end_date": "2025-12-31"}}},
    {"type": "has_themes", "params": {"value": true, "operation": "is"}},
    {"type": "observation_type", "params": {"operation": "is", "values": ["issue"]}}
  ],
  "original_comments": false,
  "sorting": {"type": "field", "field": "insight_rank", "order": "desc"},
  "active_tab_id": "observations"
}
```

The `has_themes` filter with `value: true` is required for the observations tab to populate.

## Observation Detail Sidebar — `insightAssistantParams`

Include alongside `feedbackParams` to open the observation detail sidebar with snippets.

```jsonc
{
  "insightAssistantDataItems": [{
    "type": "observation",
    "observationListItem": {
      "id": "<observation_id>",
      "title": "<title>",
      "description": "<description>",
      "themeIds": ["<theme_id>"],
      "status": "insightful",
      "type": "<issue|praise>",
      "aspect": null,
      "opinion": null,
      "responsesCount": 47,
      "isMerging": false
    },
    "filters": [
      {"type": "date", "dateRange": {"type": "between", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}, "operator": "is", "id": "<uuid>"},
      {"type": "observationId", "value": ["<obs_id>"], "operator": "is", "id": "<uuid>"},
      {"type": "textAnalytics", "isProcessed": true, "operator": "is", "id": "<uuid>"},
      {"type": "observationStatus", "operator": "is", "values": ["insightful"], "id": "<uuid>"}
    ]
  }]
}
```

Always include `observationId`, `textAnalytics`, and `observationStatus` filters. The sidebar URL format:

```
https://app.chattermill.com/feedback?project={id}#feedbackParams={fp}&insightAssistantParams={iap}
```
