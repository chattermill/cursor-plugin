# Chattermill MCP Filter Types — Complete Reference

## Base Structure

Every filter object follows this structure:

```json
{ "type": "<filter_type_string>", "params": { ... } }
```

Both `type` (string) and `params` (hash) are **required**.

Filters are passed as an array to the `filters` parameter of any Chattermill MCP tool.
All filters in the array are combined with AND logic.

## CRITICAL: String vs Integer Types

**All IDs and array values must be strings** unless explicitly noted otherwise. The only exception
is `score_range`, where `from` and `to` are integers.

---

## Validated Filter Types (15 total)

The following 15 filter types are fully validated. Filter types not in this list still pass the
basic `{type, params}` check but have no type-specific validation.

| Type string | Description |
|---|---|
| `category_theme` | Theme/category filter |
| `comment` | Has comment filter |
| `data_source` | Feedback source filter |
| `data_type` | Response type filter |
| `date_range` | Time period filter |
| `has_themes` | Has theme tags filter |
| `has_turns` | Multi-turn conversation filter |
| `observation_id` | Specific observations filter |
| `observation_status` | Observation status filter |
| `observation_theme` | Theme/category filter at observation level (preferred on `search_observations`) |
| `observation_type` | Issue/praise/suggestion filter |
| `score_range` | NPS/CSAT score filter |
| `search_query` | Full-text search filter |
| `segment_id` | Custom segment filter |
| `sentiment` | Sentiment polarity filter |

---

## category_theme

**Example:**
```json
{
  "type": "category_theme",
  "params": {
    "operation": "match_any",
    "categories": [
      {
        "category_id": "123",
        "themes": [
          { "theme_id": "456" },
          { "theme_id": "789", "sentiment": "negative" }
        ]
      }
    ]
  }
}
```

**Key rules:**
- `category_id` — **string** (required)
- `theme_id` — **string** (required)
- `sentiment` — **string** (optional): `"positive"`, `"negative"`, `"neutral"`, or omit
- `operation` — **string** (required): `"match_any"` (OR) or `"match_all"` (AND)

---

## comment

**Example:**
```json
{
  "type": "comment",
  "params": {
    "value": true
  }
}
```

**Key rules:**
- `value` — **boolean** (required). `true` = has comment, `false` = no comment
- No `operation` field

---

## data_source

**Example:**
```json
{
  "type": "data_source",
  "params": {
    "operation": "is",
    "value": ["101", "102"]
  }
}
```

**Key rules:**
- `value` — **array of strings** (required). Data source IDs as strings.
- `operation` — **string** (required)

---

## data_type

**Example:**
```json
{
  "type": "data_type",
  "params": {
    "value": ["10", "11"],
    "operation": "is"
  }
}
```

**Key rules:**
- `value` — **array of strings** (required). Data type IDs as strings.
- `operation` — **string** (required)

---

## date_range

Always use `"date_range"` as the type string in filter objects.

The `value` hash structure depends on the date range type:

### Last N units
```json
{
  "type": "date_range",
  "params": {
    "operation": "is",
    "value": {
      "type": "last",
      "unit": "month",
      "duration": 3,
      "is_complete": true
    }
  }
}
```
- `unit`: `"day"` | `"week"` | `"month"` | `"quarter"` | `"year"`
- `duration`: positive integer
- `is_complete`: boolean — `true` for complete calendar units, `false` for rolling

### Between two dates
```json
{
  "type": "date_range",
  "params": {
    "operation": "is",
    "value": {
      "type": "between",
      "start_date": "2025-01-01",
      "end_date": "2025-03-31"
    }
  }
}
```

### This calendar period
```json
{
  "type": "date_range",
  "params": {
    "operation": "is",
    "value": {
      "type": "this",
      "unit": "quarter"
    }
  }
}
```

### Since a date
```json
{
  "type": "date_range",
  "params": {
    "operation": "is",
    "value": {
      "type": "since",
      "start_date": "2025-01-01"
    }
  }
}
```

**Key rules:**
- `operation` — **string** (required)
- `value` — **hash** (required). Must match one of the structures shown above.

---

## has_themes

**Example:**
```json
{
  "type": "has_themes",
  "params": {
    "value": true,
    "operation": "is"
  }
}
```

---

## has_turns

**Example:**
```json
{
  "type": "has_turns",
  "params": {
    "value": true,
    "operation": "is"
  }
}
```

---

## observation_id

**Example:**
```json
{
  "type": "observation_id",
  "params": {
    "operation": "is",
    "value": ["1001", "1002", "1003"]
  }
}
```

**Key rules:**
- `value` — **array of strings** (required). Observation IDs as strings.
- Useful when you've identified specific observations from `fetch_observations` and want to
  drill into raw feedback for just those clusters.

---

## observation_status

**Example:**
```json
{
  "type": "observation_status",
  "params": {
    "values": ["insightful"]
  }
}
```

**Key rules:**
- `values` — **array of strings** (required). Note: plural `values`, not `value`.
- Valid values: `"insightful"`, `"not_insightful"`
- No `operation` field

---

## observation_theme

Same structure as `category_theme` but operates at the observation level. **Preferred on `search_observations`** — the enrichment layer auto-converts `category_theme` to `observation_theme` on that tool, but passing `observation_theme` directly is more explicit. Use `category_theme` on `get_feedback` and `get_metrics`.

**Example:**
```json
{
  "type": "observation_theme",
  "params": {
    "operation": "match_any",
    "categories": [
      {
        "category_id": "123",
        "themes": [
          { "theme_id": "456" },
          { "theme_id": "789", "sentiment": "negative", "excluded": false }
        ]
      }
    ]
  }
}
```

**Key rules:**
- `category_id` — **string** (required)
- `theme_id` — **string** (required)
- `sentiment` — **string** (optional): `"positive"`, `"negative"`, `"neutral"`, or omit
- `excluded` — **boolean** (optional): `true` to exclude the theme, `false` or omit to include
- `operation` — **string** (required): `"match_any"` (OR) or `"match_all"` (AND)

---

## observation_type

**Example:**
```json
{
  "type": "observation_type",
  "params": {
    "operation": "is",
    "values": ["issue"]
  }
}
```

**Key rules:**
- `values` — **array of strings** (required). Note: plural `values`, not `value`.
- Valid values: `"issue"`, `"praise"` only — `"suggestion"` and `"question"` are rejected by the schema
- `operation` — **string** (required)

---

## score_range

**Example:**
```json
{
  "type": "score_range",
  "params": {
    "from": 9,
    "to": 10,
    "operation": "is"
  }
}
```

**Key rules:**
- `from` — **integer** (required). 0–10 range.
- `to` — **integer** (required). 0–10 range.
- `operation` — **string** (required)
- **This is the only filter with integer params.** All other filters use strings.

Common NPS segments:
- Promoters: `{ "from": 9, "to": 10 }`
- Passives: `{ "from": 7, "to": 8 }`
- Detractors: `{ "from": 0, "to": 6 }`

---

## search_query

**Example:**
```json
{
  "type": "search_query",
  "params": {
    "value": "chili con carne",
    "fields": ["comment"],
    "operation": "is"
  }
}
```

**Key rules:**
- `value` — **string** (required). The search term.
- `fields` — **array of strings** (required). Which fields to search.
  Common: `["comment"]`, `["comment", "original_comment"]`
- `operation` — **string** (required)

---

## sentiment

**Example:**
```json
{
  "type": "sentiment",
  "params": {
    "value": "all_negative",
    "operation": "is"
  }
}
```

**Key rules:**
- `value` — **string** (required). One of: `"all_positive"`, `"all_negative"`, `"all_neutral"`, `"any"`, `"at_least_one_is_positive"`, `"at_least_one_is_negative"`, `"at_least_one_is_neutral"`
- `operation` — **string** (required): `"is"`
- The `all_*` values require every theme on the feedback item to match. The `at_least_one_is_*` values require at least one theme to match.

---

## segment_id

Always use `"segment_id"` as the type string.

**Example:**
```json
{
  "type": "segment_id",
  "params": {
    "segment_id": "42",
    "type": "text",
    "value": ["iOS", "Android"],
    "operation": "is"
  }
}
```

**Key rules:**
- `segment_id` — **string** (required). The segment definition ID.
- `type` — **string** (required). Usually `"text"`.
- `value` — **array of strings** (required). Values to match (OR logic within one filter).
- `operation` — **string** (required). `"is"` (include) or `"is_not"` (exclude).

---

## Filter Aliases

Some filter types accept alternative type strings:

| Use this (recommended) | Also accepted |
|------------------------|---------------|
| `date_range` | `date` |
| `score_range` | `score` |
| `search_query` | `query_string` |
| `segment_id` | — |

Always use the recommended (left column) type strings in your filter objects.

---

## Unvalidated Filter Types

These filter types are accepted but do **not** have full validation. They may still work but
are not formally guaranteed:

- `keyword` — `{ "value": "search_term" }`
- `tag_id` — `{ "value": ["tag_id_1"] }`
- `hidden` — `{ "value": false, "operation": "is" }`
- `chat_operator` — `{ "value": ["agent_only"] }`
- `insight_rank_range` — `{ "value": ["most_insightful"] }`
- `snippet_search` — `{ "value": "search_term" }`
- `phrase_clusters` — `{ "value": ["cluster_id_1"] }`
- `cluster_parents` — `{ "value": ["parent_id_1"] }`
- `user_segment` — `{ "value": ["user_segment_id_1"] }`

Prefer the 15 validated types. Use unvalidated types only when the validated set doesn't cover
your use case.

---

## Supported Operations

| Operation | Meaning | Used By |
|-----------|---------|---------|
| `"is"` | Match / include | Most filters |
| `"is_not"` | Exclude | segment_id, data_source |
| `"contains"` | Text contains | search_query |
| `"match_any"` | OR logic across categories | category_theme |
| `"match_all"` | AND logic across categories | category_theme |
