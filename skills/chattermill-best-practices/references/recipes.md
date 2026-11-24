# Business Question Recipes

Each recipe follows: **Trigger → Inputs → Steps → Presentation**.

All output is format-agnostic — present results as tables, summaries, and charts inline. No assumptions about Excel, PDF, or PowerPoint.

**Four rules apply to every recipe's presentation step:**

1. **Always include sample quotes.** Every table of issues or praise must include 1–3 representative customer quotes per item. Select diverse, specific quotes that add colour — avoid generic one-liners like "terrible" or "great". Prefer quotes that name specific features, describe a concrete experience, or reveal the customer's context. Quotes come from observation snippets (via `search_observations` with `snippets_per_observation`) or from `get_feedback` verbatims.

2. **Include working app deep links for every table and chart — mandatory.** See `linking.md`. Present links inline after the relevant table, not bundled at the end.

3. **Keep language measured.** Do not use `collapse`, `crisis`, `exploded`, `alarming`, `devastating`, `plummeted`, or `skyrocketed` in the write-up. Prefer literal descriptions like "declined sharply" or "large increase".

4. **Do not offer recommendations unless asked.** One exception is allowed: you may ask whether the user wants an interactive report/dashboard. If they say yes, build it using the Chattermill design system.

## Recipe selection guide

| User intent | Recipe | Key signal in the request |
|-------------|--------|--------------------------|
| Understand a topic broadly (sentiment + issues + praise) | **1** | Names a specific topic/area — "delivery", "app experience", "pricing" |
| Find bugs and technical defects | **2** | Mentions bugs, glitches, errors, crashes, technical problems |
| Detect what's changing (new or growing issues) | **3** | Asks about trends, changes, spikes, "what's new", monitoring |
| Discover what customers want built | **4** | Asks about feature requests, suggestions, wishlist, roadmap input |
| Understand what customers appreciate | **5** | Asks about praise, strengths, "what's working", positive feedback |
| Detect positive trends (new or growing praise) | **6** | Asks about improvements, "what's getting better", bright spots |
| Diagnose why a metric changed between periods | **7** | Asks "why did [metric] drop/rise", root cause, "what happened" |
| Explain why a metric differs between segments | **8** | Asks "why is NPS higher in X than Y", segment gap, cross-segment comparison |
| Detect churn signals and competitor mentions | **9** | Asks about churn risk, customers leaving, competitor mentions, retention |
| Audit data quality and integrity | **10** | Asks about suspicious reviews, duplicates, data anomalies, volume drops, fake feedback |
| Explain why a theme's share/proportion changed | **11** | Asks "why did X grow as a driver", mix effect, relative vs absolute change |

**Disambiguation tips:**
- "What's wrong with delivery?" → Recipe 1 (topic overview, not just bugs)
- "Are there any new delivery issues?" → Recipe 3 (change detection, issues)
- "What bugs are there in the app?" → Recipe 2 (technical defects)
- "What delivery features do customers want?" → Recipe 4 (suggestions)
- "What do customers love about delivery?" → Recipe 5 (praise)
- "Is anything improving in delivery?" → Recipe 6 (positive trends)
- "Why did NPS drop last month?" → Recipe 7 (metric change diagnosis)
- "Why is NPS higher in UK than US?" → Recipe 8 (cross-segment diagnosis)
- "Are customers threatening to leave over delivery?" → Recipe 9 (churn signals)
- "Are there fake reviews in our data?" → Recipe 10 (data quality audit)
- "Why did delivery become a bigger negative driver?" → Recipe 11 (share decomposition)
- "Give me the good news and the bad news" → Recipe 3 + Recipe 6 combined

If the user's request spans multiple recipes (e.g. "give me everything on delivery — issues, trends, and feature requests"), run the relevant recipes in sequence and combine the output.

---

### Recipe 1: "What do customers say about [TOPIC]?"

**Trigger phrases:** "what do customers say about...", "how do customers feel about...", "customer sentiment on...", "feedback about...", "opinions on...", "deep dive into...", "topic analysis for...", "what are people saying about...", "voice of customer on...", "customer perception of...", "tell me about [topic]", "summarise feedback on...", "NPS/sentiment for [topic]"

**Use this recipe when:** The user wants a comprehensive overview of a specific topic — combining volume, sentiment trend, top issues, and top praise. This is the general-purpose "tell me everything about X" recipe.

**Inputs:**
- `project_id` (required)
- `TOPIC` — the surface area of interest (e.g. "delivery", "app performance")
- `date_range` — default: last 30 days

**Steps:**

1. **Discover theme.** Call `list_themes`. Find the category/theme matching TOPIC. If no match, fall back to `search_query` filter with TOPIC as the keyword. Build explicit filters — do not rely on natural-language query extraction.

2. **Check volume (sample size gate).** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "bar", "metric_type": "volume", "title": "Feedback volume"}`
   - Filters: `date_range` + `category_theme` (or `search_query`)
   - **Verify** `applied_filters` in the response matches your intent.
   - If < 10 results, warn the user that the sample is insufficient and ask whether to proceed.

3. **Get sentiment trend.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "line", "metric_type": "net_sentiment", "title": "Net sentiment trend", "frequency": "day"}`
   - Same filters as step 2.
   - **Verify** `applied_filters` in the response.

4. **Get top issues.** Call `search_observations` with:
   - `observation_theme` filter (preferred) or `theme_id` (top-level integer) or `category_theme` filter
   - Additional filter: `{"type": "observation_type", "params": {"operation": "is", "values": ["issue"]}}`
   - `limit`: 100, `snippets_per_observation`: 3
   - **Verify** `applied_filters` in the response.

5. **Get top praise.** Same as step 4 but with `"values": ["praise"]`.

6. **Merge duplicate observations.** In both the issues and praise lists, combine observations that clearly describe the same thing. Use highest-volume name as representative, sum volumes, note which were merged.

7. **Present results:**
   - **Volume headline:** "[N] pieces of feedback in the last 30 days."
   - **Sentiment trend:** Net sentiment line chart. Include analytics deep link (see `linking.md`).
   - **Top 10 Issues by volume** — table: Rank, Issue, Volume, Sample Quote(s). Include feedback observations link.
   - **Top 10 Praise by volume** — table: Rank, Praise, Volume, Sample Quote(s). Include feedback observations link.
   - **50-word summary** of key findings. Do not repeat lists — synthesize.

---

### Recipe 2: "What bugs/technical issues have users been reporting?"

**Trigger phrases:** "what bugs...", "technical issues", "glitches", "errors users are seeing", "app problems", "site issues", "digital experience issues", "what's broken", "UX bugs", "platform stability", "crash reports", "technical complaints", "product defects", "system errors"

**Use this recipe when:** The user specifically wants a bug/defect report — a ranked table of technical issues with period-over-period comparison. Narrower than Recipe 1: focuses only on issues (no praise, no sentiment trend), scoped to a bug-related theme.

**Inputs:**
- `project_id` (required)
- `date_range` — default: last 30 days

**Steps:**

1. **Discover bug-related theme.** Call `list_themes`. Look for themes named "Bugs / Glitches / Errors" or similar. If no exact match, pick the theme(s) that best describe website/app/digital experience issues. Build explicit `category_theme` filter.

2. **Check volume (sample size gate).** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "bar", "metric_type": "volume", "title": "Bug feedback volume"}`
   - Filters: `date_range` + `category_theme`
   - **Verify** `applied_filters` in the response.
   - If < 10, warn the user that the sample is insufficient.

3. **Get top 20 issues.** Call `search_observations` with:
   - `observation_theme` filter (preferred) or `theme_id` from step 1 (top-level integer)
   - Filter: `observation_type` = `["issue"]` + `date_range`
   - `limit`: 20, `snippets_per_observation`: 3
   - **Verify** `applied_filters` in the response.

4. **Get comparison volumes.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Issue volumes", "breakdown": {"type": "observation", "observation_type": "issue"}}`
   - Filters: same `category_theme` + `date_range`
   - `comparison_date_range`: previous symmetric period
   - **Verify** `applied_filters` in the response.

5. **Compute % change.** For each issue: `((current - previous) / previous) * 100`. Mark items with `previous = 0` as **NEW**.

6. **Merge obvious duplicates.** Combine issues that describe the same problem. Use highest-volume name, sum volumes, recompute delta. Note which were merged.

7. **Sort and trim.** Sort by % change descending, **NEW** items on top. Keep top 10.

8. **Present results** as a single table. Include feedback observations link after the table.

   | # | Issue | Summary (50 words) | Sample Quotes (1–3) | Current Count | Previous Count | % Change |
   |---|-------|--------------------|--------------------|-------------:|---------------:|---------:|

---

### Recipe 3: "What are the emerging/growing issues?"

**Trigger phrases:** "emerging issues", "trending issues", "what's growing", "top growing issues", "new problems", "largest increases", "what's getting worse", "anomaly detection", "alert me to changes", "what's spiking", "issue trends", "new complaints", "rising issues", "what changed", "what's new", "monitor issues", "issue velocity", "hottest issues"

**Use this recipe when:** The user wants to detect *change* — issues that are new or growing fast compared to a previous period. Unlike Recipe 1 (broad topic overview) or Recipe 2 (bug-specific), this surfaces any issue type that is accelerating, regardless of topic.

**Inputs:**
- `project_id` (required)
- `date_range` — default: last 30 days
- `TOPIC` / `theme_filter` (optional) — category or theme name to scope
- `additional_filters` (optional) — dataset, channel, country, segment

**Steps:**

1. **Resolve filters.** If TOPIC or `theme_filter` is specified, call `list_themes` to resolve to category/theme IDs. If segments are specified, discover IDs via `list_attributes` / `search_attributes`. Build the filters array.

2. **Quantitative pull.** Call `get_metrics` with explicit filters (`date_range`, `category_theme` if scoped) requesting top 100 issues by volume with comparison to the previous symmetric period. Compute delta, % change, and `previously_inactive` flag (previous = 0, current > 0). Verify `applied_filters` in the response.

3. **Observation snippets.** Call `search_observations` with same filters (use `observation_theme` instead of `category_theme` if theme-scoped) + `observation_type` = issue. Capture `observation_id` for each observation — these enable precise verbatim fetching later.

4. **Threshold filtering.** Apply volume-aware adaptive thresholds:

   | Total volume | Threshold |
   |-------------|-----------|
   | > 50,000 | delta > 50, or (delta > 20 and % change > 20%) |
   | > 10,000 | delta > 20, or (delta > 10 and % change > 30%) |
   | > 1,000 | delta > 10, or (delta > 5 and % change > 40%) |
   | ≤ 1,000 | delta > 0, and (% change > 40% or previously inactive) |

   Exclude previously inactive issues with current < 5 (noise). Exclude negative deltas.

   Sort by composite score: `(delta × 0.6) + (pct_change × 0.4 × (current_volume / 100))`.

5. **Merge similar issues.** Combine observations that clearly describe the same problem. Use highest-volume name, sum volumes, recompute delta/% change. Note which were merged.

6. **Enrich with verbatims.** Call `get_feedback` with `observation_id` filter or use `search_observations` snippets. Select 3 representative quotes per issue. Add ~50-word factual summary per issue.

7. **Quality gate.** Target 3–10 issues. If < 3, relax thresholds by 50% and re-run step 4. If > 10, keep top 10 by composite score.

8. **Present results** as a table sorted by composite score, **NEW** on top. Include feedback observations link after the table.

   | # | Issue | Summary (50 words) | Sample Quotes (1–3) | Current Count | Previous Count | % Change |
   |---|-------|--------------------|--------------------|-------------:|---------------:|---------:|

---

### Recipe 4: "What feature requests are customers making?"

**Trigger phrases:** "feature requests", "customer suggestions", "what do customers want", "product wishlist", "what should we build", "user requests", "customer ideas", "improvement suggestions", "what are people asking for", "requested features", "enhancement requests", "customer demand", "product feedback for roadmap", "what features are missing"

**Use this recipe when:** The user wants to find constructive suggestions — what customers are *asking for*, not what they're *complaining about*. Filters for forward-looking requests ("I wish you would...", "please add...") and excludes pure complaints.

**Inputs:**
- `project_id` (required)
- `categories` (optional) — specific categories to analyse. If not specified, analyse across all categories.
- `date_range` — default: last 30 days

**Steps:**

1. **Discover categories.** Call `list_themes` to find relevant categories. If the user specified categories, resolve their names to IDs. Build explicit `category_theme` filters.

2. **Check volume (sample size gate).** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "bar", "metric_type": "volume", "title": "Feedback volume"}`
   - Filters: `date_range` + `category_theme` (if scoped)
   - **Verify** `applied_filters` in the response.

3. **Fetch feature request observations.** For each category (or across all), call `search_observations` with:
   - `query`: "suggestions for new features — users requesting new functionality, wanting additional options"
   - Filters: `date_range` + `observation_theme` (if scoped, preferred) or `category_theme` + `observation_type` = `["praise"]`
   - `limit`: 50, `snippets_per_observation`: 5
   - **Verify** `applied_filters` in the response.
   - **Filter for actionable requests** — keep observations where customers are asking for something new. **Exclude complaints** — discard observations that are pure dissatisfaction without a constructive request.

4. **Get comparison volumes.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Feature request volumes", "breakdown": {"type": "observation", "observation_type": "praise"}}`
   - `comparison_date_range`: previous symmetric period
   - **Verify** `applied_filters` in the response.
   - Compute delta and % change for each observation.

5. **Fetch verbatims with attribution.** Call `get_feedback` with `date_range` + `category_theme` filters. Extract country/segment attribution for each quote.

6. **Merge duplicate requests.** Combine observations that describe the same feature request. Use highest-volume name, sum volumes. Note which were merged.

7. **Rank and organise.** For each category, rank the top 5 feature requests by volume. For each request, compile: name, volume, trend, description (what users want and why), 3 representative quotes with attribution, segment breakdown.

8. **Present results.** Group by category. Include feedback observations link per category table.

---

### Recipe 5: "What are customers praising?"

**Trigger phrases:** "what do customers love", "what's working well", "positive feedback", "what are we doing right", "customer praise", "strengths", "what do customers like", "top praise", "what are people happy about", "customer highlights", "best performing areas", "what's going well", "positive themes", "customer compliments", "wins"

**Use this recipe when:** The user wants to understand what customers appreciate. Focuses exclusively on praise observations, ranked by volume with period-over-period comparison.

**Inputs:**
- `project_id` (required)
- `TOPIC` / `theme_filter` (optional) — category or theme to scope. If not specified, analyse across all categories.
- `date_range` — default: last 30 days

**Steps:**

1. **Resolve filters.** If TOPIC is specified, call `list_themes` to find the matching category/theme. Build explicit `category_theme` filter.

2. **Check volume (sample size gate).** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "bar", "metric_type": "volume", "title": "Praise feedback volume"}`
   - Filters: `date_range` + `category_theme` (if scoped) + `observation_type` = `["praise"]`
   - **Verify** `applied_filters` in the response.

3. **Get top 20 praise observations.** Call `search_observations` with:
   - `observation_theme` filter (preferred) or `theme_id` (if scoped, top-level integer) or no theme filter (all categories)
   - Filter: `observation_type` = `["praise"]` + `date_range`
   - `limit`: 20, `snippets_per_observation`: 3
   - **Verify** `applied_filters` in the response.

4. **Get comparison volumes.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Praise volumes", "breakdown": {"type": "observation", "observation_type": "praise"}}`
   - Filters: `date_range` + `category_theme` (if scoped)
   - `comparison_date_range`: previous symmetric period
   - **Verify** `applied_filters` in the response.

5. **Compute % change.** For each praise observation: `((current - previous) / previous) * 100`. Mark items with `previous = 0` as **NEW**.

6. **Merge obvious duplicates.** Combine praise observations that describe the same positive experience. Note which were merged.

7. **Sort and trim.** Sort by volume descending. Keep top 10.

8. **Present results** as a single table. Include feedback observations link after the table.

   | # | Praise | Summary (50 words) | Sample Quotes (1–3) | Current Count | Previous Count | % Change |
   |---|--------|--------------------|--------------------|-------------:|---------------:|---------:|

---

### Recipe 6: "What's improving in customer experience?"

**Trigger phrases:** "what's improving", "positive trends", "growing praise", "what's getting better", "emerging strengths", "upward trends", "gains", "improvements", "good news", "bright spots", "momentum", "what improved", "areas of progress", "where are we winning"

**Use this recipe when:** The user wants to detect positive change — praise observations that are new or growing fast. The positive counterpart to Recipe 3.

**Inputs:**
- `project_id` (required)
- `date_range` — default: last 30 days
- `TOPIC` / `theme_filter` (optional) — category or theme name to scope
- `additional_filters` (optional) — dataset, channel, country, segment

**Steps:**

1. **Resolve filters.** If TOPIC is specified, call `list_themes` to resolve category/theme IDs. Build explicit filters array.

2. **Quantitative pull.** Call `get_metrics` with explicit filters requesting top 100 praise observations by volume with comparison to the previous symmetric period:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Praise volume changes", "breakdown": {"type": "observation", "observation_type": "praise"}, "results_limit": 100}`
   - `comparison_date_range`: previous symmetric period
   - **Verify** `applied_filters` in the response.
   - Compute delta, % change, and `previously_inactive` flag.

3. **Observation snippets.** Call `search_observations` with same filters + `observation_type` = praise. Capture `observation_id` for each observation.

4. **Threshold filtering.** Apply the same adaptive thresholds as Recipe 3 step 4. Exclude negative deltas (declining praise). Sort by composite score.

5. **Merge similar observations.** Combine praise observations that describe the same positive experience. Note which were merged.

6. **Enrich with verbatims.** Use `search_observations` snippets or call `get_feedback` with `observation_id` filter. Select 3 representative quotes per observation. Add ~50-word factual summary.

7. **Quality gate.** Target 3–10 observations. If < 3, relax thresholds by 50%.

8. **Present results** as a table sorted by composite score, **NEW** on top. Include feedback observations link after the table.

   | # | Praise | Summary (50 words) | Sample Quotes (1–3) | Current Count | Previous Count | % Change |
   |---|--------|--------------------|--------------------|-------------:|---------------:|---------:|

---

### Recipe 7: "Why did our [METRIC] change?"

**Trigger phrases:** "why did NPS drop", "why did sentiment fall", "what caused the CSAT decline", "explain the NPS change", "root cause of metric shift", "what drove the score down", "why did satisfaction improve", "why is NPS lower this month", "what happened to our score", "metric change analysis", "diagnose the drop/rise"

**Use this recipe when:** The user observes a metric change between two periods and wants to understand *why*. This is a diagnostic recipe — it confirms the change is real, then decomposes it by category and by observation to identify the drivers.

**Inputs:**
- `project_id` (required)
- `METRIC` — the metric that changed (e.g. NPS, CSAT, net_sentiment, volume, average_score)
- `date_range` — the period where the change was observed
- `comparison_date_range` (optional) — the baseline period. If not specified, use the previous symmetric period.

**Steps:**

1. **Confirm the change.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "bar", "metric_type": "{METRIC}", "title": "{METRIC} with comparison"}`
   - Filters: `date_range`
   - **Verify** `applied_filters` in the response.
   - Record: current value, comparison value, delta, and sample sizes for both periods.

2. **Decompose by category with Impact ranking.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "{METRIC}", "title": "{METRIC} by category", "breakdown": {"type": "category"}}`
   - Same filters and `comparison_date_range` as step 1.
   - **Verify** `applied_filters` in the response.
   - For each category: record current value, comparison value, delta, and sample sizes for both periods.

   **Compute volume-weighted Impact for each category:**

   ```
   Share_current  = volume_current / total_volume_current
   Share_previous = volume_previous / total_volume_previous

   Gap_current    = PERFECT − metric_current
   Gap_previous   = PERFECT − metric_previous

   Pain_current   = Share_current × Gap_current
   Pain_previous  = Share_previous × Gap_previous

   Impact         = Pain_current − Pain_previous
   Share_delta    = Share_current − Share_previous
   ```

   Where PERFECT depends on the metric:
   - **net_sentiment, NPS:** PERFECT = 100
   - **CSAT (1–5 scale):** PERFECT = 5 (or the scale maximum)
   - **average_score:** PERFECT = MaxScore (e.g. 5 or 10). The scale maximum must be known — if it cannot be determined from the project context, skip Impact calculation and fall back to sorting by absolute delta.
   - **volume:** skip Impact calculation; sort by absolute delta instead
   - **Any other metric** (e.g. positive_sentiment, negative_sentiment): skip Impact calculation; sort by absolute delta instead

   **Sort by absolute Impact descending.** This replaces the previous "sort by absolute delta" and ensures categories where the metric held steady but volume surged are ranked correctly.

   **Flag volume amplifiers:** any category where |Impact| is in the top 5 but |Delta| < 5 points. These are categories whose growing (or shrinking) share of feedback changed their overall influence, even though the score itself barely moved.

3. **Identify top growing issues.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Issue volume changes", "breakdown": {"type": "observation", "observation_type": "issue"}, "results_limit": 50}`
   - Same filters and `comparison_date_range`.
   - **Verify** `applied_filters` in the response.
   - Compute delta and % change. Keep issues with significant growth (≥ 20% volume change) or NEW items.
   - Sort by absolute delta descending.
   - **Prioritise observations from the top Impact-ranked categories in Step 2.** When selecting the top issues to present, favour those belonging to categories that ranked highest by Impact. This ensures the observation drill-down explains the categories that matter most to the overall metric change, not just the categories with the largest raw volume shifts. (Do not apply the Pain/Impact decomposition to observations themselves — metrics by observation breakdown is not reliable enough for that calculation.)

4. **Identify praise shifts.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Praise volume changes", "breakdown": {"type": "observation", "observation_type": "praise"}, "results_limit": 50}`
   - Same filters and `comparison_date_range`.
   - **Verify** `applied_filters` in the response.
   - If metric worsened: keep praise with significant *decline* (these represent positive experiences that faded).
   - If metric improved: keep praise with significant *growth*.
   - **Apply the same category prioritisation as Step 3** — favour praise from top Impact-ranked categories.

5. **Enrich top drivers with verbatims.** For the top 5 issues and top 3 praise shifts, call `search_observations` to get a 50-word summary and 3 example customer snippets per observation.

6. **Merge duplicate observations.** Combine observations that describe the same underlying issue or praise point. Note which were merged.

7. **Present results:**
   - **Headline:** "{METRIC} moved from [X] to [Y] (delta [Z])."
   - **Top category drivers** — table sorted by absolute Impact. Include analytics deep link.

     | Category | Current | Previous | Delta | Vol (curr) | Vol (prev) | Share Δ | Impact | Flag |
     |----------|--------:|--------:|------:|-----------:|-----------:|--------:|-------:|------|

     *Flag column shows "⚡ Volume amplifier" for categories with high Impact but low Delta.*

   - **Top issue drivers** — table with 1–3 sample quotes per issue. Include feedback observations link.

     | # | Issue | Summary | Sample Quotes | Current Count | Previous Count | % Change |
     |---|-------|---------|--------------|-------------:|---------------:|---------:|

   - **Praise shifts** — table with 1–3 sample quotes per item. Include feedback observations link.

     | # | Praise | Summary | Sample Quotes | Current Count | Previous Count | % Change |
     |---|--------|---------|--------------|-------------:|---------------:|---------:|

   - **Synthesis** — 50-word narrative connecting the category drivers to the specific observations. **Explicitly call out any volume amplifiers** — explain that the category's score didn't change but its growing share of feedback increased its overall pull on the metric.

---

### Recipe 8: "Why is our [METRIC] different across segments?"

**Trigger phrases:** "why is NPS higher in UK than US", "what explains the score gap between segments", "segment comparison", "why does one country score better", "cross-segment analysis", "compare NPS by brand", "why is satisfaction different by channel", "what drives the gap between segments", "segment deep dive", "benchmark segments"

**Use this recipe when:** The user observes that a metric differs between two (or more) customer segments and wants to understand *what drives the gap*.

**Inputs:**
- `project_id` (required)
- `METRIC` — the metric to compare (e.g. NPS, CSAT, net_sentiment)
- `segment_dimension` — the dimension to compare across (e.g. "country", "brand", "channel")
- `segments_to_compare` (optional) — specific segment values. If not specified, compare all values and surface the most significant gaps.
- `date_range` — default: last 30 days

**Steps:**

1. **Discover segment.** Call `list_attributes` to find the segment ID and type for the requested dimension. If specific segment values are named, call `search_attributes` to get the exact casing. Build explicit `segment_id` filters.

2. **Get metric by segment.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "{METRIC}", "title": "{METRIC} by {segment_dimension}", "breakdown": {"type": "segment", "segment_key": "{segment_id}"}}`
   - Filters: `date_range`
   - **Verify** `applied_filters` in the response.
   - Record: metric value and sample size for each segment value. Rank by gap size.

3. **Compare issues between the top and bottom segments.** For each segment in the most significant pair, call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Issues in {segment_value}", "breakdown": {"type": "observation", "observation_type": "issue"}, "results_limit": 20}`
   - Filters: `date_range` + `segment_id` filter for that specific segment value
   - **Verify** `applied_filters` in the response.
   - Compare the two issue lists to find **issues concentrated in the lower-scoring segment** — these are likely driving the gap.

4. **Compare praise between segments.** Same approach as step 3 but with `observation_type` = `["praise"]`. Find praise concentrated in the higher-scoring segment — these explain why one segment scores better.

5. **Enrich differentiators with verbatims.** For the top 5 differentiating observations, call `search_observations` with the relevant `segment_id` filter: 50-word summary + 3 example customer snippets from the relevant segment.

6. **Merge duplicate observations.** Combine observations that describe the same underlying point. Note which were merged.

7. **Present results:**
   - **Headline:** "{METRIC} gap: [Segment A] scores [X] vs [Segment B] scores [Y] (delta [Z])."
   - **Segment overview** — table. Include analytics deep link with segment breakdown config.

     | Segment | {METRIC} | Sample size |
     |---------|--------:|-----------:|

   - **Issues driving the gap** (concentrated in the lower-scoring segment) — table with 1–3 sample quotes. Include feedback observations link with the relevant segment filter.

     | # | Issue | Summary | Sample Quotes | Vol in {low} | Vol in {high} | Concentration ratio |
     |---|-------|---------|--------------|------------:|-------------:|--------------------:|

   - **Praise driving the gap** (concentrated in the higher-scoring segment) — table with 1–3 sample quotes. Include feedback observations link.

   - **Synthesis** — 50-word narrative explaining which issues disproportionately affect the lower-scoring segment.

---

### Recipe 9: "Are customers saying they'll leave?"

**Trigger phrases:** "churn risk", "customers leaving", "switching to competitor", "cancellation feedback", "intent to leave", "customer attrition", "will customers churn", "are we losing customers", "competitor mentions", "loyalty risk", "retention risk", "customers threatening to leave", "who's at risk of churning"

**Use this recipe when:** The user wants to detect churn signals — customers expressing intent to leave, mentioning competitors positively, or stating they've already switched. A complaint about delivery is Recipe 1; "I'm switching to [competitor] because of delivery" is Recipe 9.

**Inputs:**
- `project_id` (required)
- `TOPIC` (optional) — scope to a specific area
- `date_range` — default: last 30 days

**Steps:**

1. **Discover churn-related dimensions.** Call `list_themes` and scan for themes/categories related to:
   - Churn intent ("Churn", "Intent to leave", "Will not return", "Cancellation")
   - Competitor mentions ("Competitor", "Alternative", "Switching")
   - Loyalty/retention ("Loyalty", "Retention", "Repeat purchase")

   Also call `list_attributes` and scan for segments related to: churn risk scores, churn flags, competitor mentioned flags, NPS detractor segments. Record any matching theme IDs, category IDs, and segment IDs.

2. **Build filters based on discovery results.**
   - **If churn-related themes exist:** Build `category_theme` filters. These are the primary signal.
   - **If churn-related segments exist:** Build `segment_id` filters.
   - **If neither exists:** Fall back to keyword search. Use `generate_highlights` with a `search_query` filter containing churn-intent terms: "switching to", "won't use again", "never ordering again", "cancelling my", "last time I", "going back to".
   - If TOPIC is specified, add `category_theme` or keyword filter for the topic scope.

3. **Quantify churn signals.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "bar", "metric_type": "volume", "title": "Churn signal volume"}`
   - Filters: `date_range` + churn filters from step 2
   - `comparison_date_range`: previous symmetric period
   - **Verify** `applied_filters` in the response.
   - Record current vs previous volume and compute % change.

4. **Get churn-related observations.** Call `search_observations` with:
   - `theme_id` (top-level integer) from step 1 if theme found
   - Filter: `observation_type` = `["issue"]` + `date_range`
   - `limit`: 50, `snippets_per_observation`: 3
   - **Verify** `applied_filters` in the response.
   - Classify each observation:
     - **Explicit churn intent** — customer states they will leave ("I'm done with...", "switching to...", "cancelled my account")
     - **Competitor comparison** — customer names a competitor favourably
     - **Conditional churn** — customer threatens to leave if issue persists

5. **Get comparison volumes per observation.** Call `get_metrics` with observation breakdown + `comparison_date_range`. Compute delta and % change.

6. **Enrich with verbatims.** For the top 10 churn-signal observations, use snippets from step 4 or call `get_feedback` with `observation_id` filter. Prefer quotes that include explicit churn language or competitor names.

7. **Merge duplicates.** Combine observations that describe the same churn driver. Note which were merged.

8. **Present results:**
   - **Churn signal headline:** "[N] feedback items containing churn signals in the period."
   - **Top churn drivers** — table sorted by volume:

     | # | Churn Signal | Type | Summary | Sample Quotes (1–3) | Current Count | Previous Count | % Change |
     |---|-------------|------|---------|---------------------|-------------:|---------------:|---------:|

     Type values: "Explicit intent", "Competitor comparison", "Conditional churn"

   - **Competitor mentions** (if any) — table with competitor name, volume, and representative quotes.
   - **50-word synthesis** linking the churn signals to specific pain points.
   - Include feedback observations link after each table.

---

### Recipe 10: "Are there data quality issues in our feedback?"

**Trigger phrases:** "data quality", "suspicious reviews", "fake reviews", "duplicate feedback", "AI-generated reviews", "data anomalies", "volume drop", "missing data", "data pipeline issues", "feedback integrity", "bogus reviews", "spam feedback", "data audit", "why did volume change", "source issues", "data looks wrong"

**Use this recipe when:** The user suspects data quality problems — duplicate records, fake/AI-generated reviews, unexplained volume changes, missing comments, suspicious score distributions, or source-level anomalies. Recipe 7 diagnoses *customer experience* change; Recipe 10 audits the *data itself*.

**Inputs:**
- `project_id` (required)
- `date_range` — the period to audit
- `comparison_date_range` (optional) — default: previous symmetric period
- `data_source` (optional) — specific source to audit. If not specified, audit all sources.

**Steps:**

1. **Discover data sources and segments.** Call `list_attributes` to identify: available data source IDs and names; any segment that could indicate data provenance (e.g. "verified_purchase", "review_source", "language"). If the user specified a data source, call `search_attributes` to resolve the exact source ID.

2. **Volume overview by source.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Volume by data source", "breakdown": {"type": "data_source"}}`
   - Filters: `date_range`, `comparison_date_range`: previous symmetric period
   - **Verify** `applied_filters` in the response.
   - Flag any source with > 50% volume change or a source appearing for the first time.

3. **Volume trend for anomaly detection.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "line", "metric_type": "volume", "title": "Weekly volume trend", "frequency": "week"}`
   - **Verify** `applied_filters` in the response.
   - Scan for: sudden spikes (> 2× weekly average), sudden drops (< 0.5× weekly average), or flat periods (zero volume for a week or more).

4. **Score distribution analysis.** For each major data source, call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Score distribution", "breakdown": {"type": "score"}}`
   - Filters: `date_range` + `data_source` filter
   - Check for: score concentration shift, bimodal distribution (heavy clusters at extremes), mixed scales.

5. **Duplicate detection.** Call `get_feedback` with:
   - Filters: `date_range` + `data_source` (if specified), `limit`: 100
   - **Verify** `applied_filters` in the response.
   - Scan for: exact duplicates (identical comment text with different IDs), near-duplicates, empty comments (flag if > 30% of sample).

6. **Suspicious content patterns.** From the feedback sample in step 5, scan for: timestamp clustering (many records sharing exact same timestamp), formulaic language (template-based reviews), suspicious metadata (null scores, future dates). Call `search_observations` with keyword filter for "fake", "spam", "bot" to check if the system has already clustered such feedback.

7. **Source change detection.** If a volume drop or new source was flagged in step 2, call `get_metrics` with weekly frequency per source to pinpoint the exact transition week.

8. **Present results:**
   - **Data health headline:** "[N] total responses across [M] sources in [period]. [Summary of findings.]"
   - **Source overview** — table with flags column ("New source", "Volume spike", "Volume drop", "High empty rate", etc.).
   - **Issues found** — one section per issue, each with: severity (High/Medium/Low), description with concrete evidence, impact on analysis, sample records.
   - **Checks that came back clean** — briefly list what was checked and found no issues.
   - Include feedback link for any source-specific findings.

---

### Recipe 11: "Why did [THEME] grow as a driver?"

**Trigger phrases:** "why did X become a bigger driver", "why is X a larger share", "mix effect", "proportion change", "why did X grow as a negative driver", "share of voice change", "volume mix analysis", "is X actually getting worse or is everything else getting better", "relative vs absolute change", "driver decomposition"

**Use this recipe when:** The user observes that a theme's *share* of positive or negative feedback changed and wants to understand whether it's because that theme grew in absolute terms, or because other themes shrank (mix effect). Recipe 7 diagnoses a metric's absolute change; Recipe 11 diagnoses a *proportion* change.

**Inputs:**
- `project_id` (required)
- `THEME` — the theme or category whose share changed
- `DIRECTION` — whether it grew as a positive or negative driver
- `segment_filter` (optional) — scope to a specific segment
- `date_range` — the period where the share change was observed
- `comparison_date_range` — the baseline period

**Steps:**

1. **Resolve theme.** Call `list_themes` and find the category/theme matching THEME. Build `category_theme` filter. If a segment filter is specified, call `list_attributes` / `search_attributes` to resolve the segment ID.

2. **Get volume by theme for both periods.** Call `get_metrics` with:
   - `chart_config`: `{"chart_type": "table", "metric_type": "volume", "title": "Volume by category", "breakdown": {"type": "category"}}`
   - Filters: `date_range` + segment filter (if any)
   - `comparison_date_range`: the baseline period
   - **Verify** `applied_filters` in the response.
   - Record: per-category volume for current and comparison periods.

3. **Compute share and decompose the change.** For each category:
   - `current_share` = category volume / total volume (current period)
   - `previous_share` = category volume / total volume (comparison period)
   - `share_delta` = current_share − previous_share
   - For the target THEME, decompose the share change:
     - **Absolute change component:** Did the theme's own volume go up or down?
     - **Mix component:** Did total volume change because other themes shrank or grew?

4. **Quantify the mix effect.**
   - `theme_volume_change` = current theme volume − previous theme volume
   - `other_volume_change` = (current total − current theme) − (previous total − previous theme)
   - If `theme_volume_change ≈ 0` and `other_volume_change < 0`: **Mix effect** — the theme looks bigger because everything else shrank.
   - If `theme_volume_change > 0` and `other_volume_change ≈ 0`: **Real growth** — the theme genuinely increased.
   - If both changed: **Combined** — state both components.

5. **Identify what changed in the other themes.** From the category breakdown in step 2, find the categories with the largest absolute volume drops (or gains). These are the themes whose change created the mix effect.

6. **Get observations for the target theme.** Call `search_observations` with:
   - Filters: `observation_theme` for the target (preferred) or `category_theme` + `date_range` + `observation_type` matching the direction (issue for negative driver, praise for positive)
   - `limit`: 20, `snippets_per_observation`: 3
   - **Verify** `applied_filters` in the response.
   - Check whether the theme's observations changed in volume or whether it's the same observations at similar volumes.

7. **Present results:**
   - **Headline:** "[THEME] grew from [X%] to [Y%] of [positive/negative] feedback — [primary driver: mix effect / real growth / both]."
   - **Decomposition table:**

     | Component | Previous | Current | Change |
     |-----------|--------:|--------:|-------:|
     | {THEME} volume | | | |
     | Other themes' volume | | | |
     | Total volume | | | |
     | {THEME} share | | | |

   - **What drove the mix change** (if mix effect) — table of the other categories that shrank/grew, sorted by absolute volume change:

     | Category | Previous Volume | Current Volume | Delta |
     |----------|---------------:|---------------:|------:|

   - **What's happening inside {THEME}** — top observations within the theme, with volume and sample quotes. Include feedback observations link.
   - **50-word synthesis** clearly stating whether the share change reflects a real change in the theme or a compositional shift.
