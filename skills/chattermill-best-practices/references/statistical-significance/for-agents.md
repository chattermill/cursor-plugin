# FOR AGENTS/LLMs: How to Use This Statistical Filter

## 🚨 CRITICAL: This is a POST-PROCESSING Step

**ALWAYS apply this filter AFTER getting comparison data, BEFORE showing results to users**

---

## The Golden Rule

```
WHENEVER you do a comparison:
1. Get the data (from MCP or any source)
2. THEN apply Statistical Filter (this skill)
3. Show ONLY filtered results to user
```

---

## Step-by-Step Process

### When User Asks for ANY Comparison:

```markdown
1. YOU: "I'll compare [X vs Y]"
2. YOU: Call mcp__chattermill__fetch_quantitative_insight()
3. YOU: Get raw comparison data
4. **CRITICAL**: Invoke statistical_calculator.py to calculate p-value
5. YOU: Check if p ≤ 0.1 (calculator returns "significant": true/false)
6. YOU: Show ONLY significant results
7. YOU: "After filtering, here are the significant changes..."
```

### How to Use the Calculator:

```bash
# Format data and call calculator
echo '{
  "type": "mean",
  "current": {"value": 25, "n": 1000, "std": 15},
  "previous": {"value": 20, "n": 950, "std": 14}
}' | python3 references/statistical-significance/statistical_calculator.py

# Returns:
{
  "p_value": 0.001,
  "significant": true
}
```

### Example Implementation:

```markdown
User: "Compare NPS this week vs last week"

Agent Process:
1. Fetch data → NPS this week: 25, last week: 24
2. Calculate significance → p = 0.31
3. Apply filter → p > 0.1, so FILTER OUT
4. Tell user → "No significant change in NPS"

NOT: "NPS increased from 24 to 25"
```

---

## Decision Tree for Agents

```
Got comparison data?
│
├── Is previous value = 0?
│   ├── YES → Check volume threshold
│   │   ├── Weekly ≥5? → SHOW
│   │   └── Weekly <5? → FILTER
│   │
│   └── NO → Calculate p-value
│       ├── p ≤ 0.1? → SHOW
│       └── p > 0.1? → FILTER
```

---

## What to Say to Users

### When Applying Filter (Standard):
```markdown
"I'll compare [metric] and show significant changes..."
"Applying statistical filtering to remove noise..."
"Here are the meaningful differences..."
```

### When Showing Results:
```markdown
"After filtering, X significant changes were found"
"No significant changes detected (all filtered as noise)"
"3 of 10 comparisons showed significant differences"
```

### In Verbose Mode:
```markdown
"Showing all comparisons including filtered items:
- Significant (4): [list]
- Filtered as noise (6): [list]
- Noise reduction: 60%"
```

---

## Examples for Different MCP Functions

### fetch_quantitative_insight
```markdown
1. Get metric comparison
2. APPLY FILTER: Check if p ≤ 0.1
3. Show only if significant
```

### fetch_observations
```markdown
1. Get volume comparisons
2. APPLY FILTER: Check thresholds
3. Show only if above minimum
```

### fetch_highlights
```markdown
1. Get highlighted changes
2. APPLY FILTER: Test significance
3. Show only meaningful shifts
```

---

## Rules to ALWAYS Follow

### 1. **This Runs AFTER, Not Before**
- ❌ DON'T: "I'll use filtered MCP functions"
- ✅ DO: "I'll get data, then apply filtering"

### 2. **Filter Before Showing**
- ❌ DON'T: Show raw data then mention filtering
- ✅ DO: Filter first, show only significant results

### 3. **Be Transparent**
- ✅ Say: "After statistical filtering..."
- ✅ Say: "X items filtered as noise"
- ✅ Offer: "Want to see filtered items? (verbose mode)"

### 4. **Apply Consistently**
- **EVERY comparison** gets filtered
- **SAME thresholds** for all (p ≤ 0.1)
- **NO exceptions** unless user asks for raw data

---

## Quick Reference for Agents

### Standard Thresholds:
- **Statistical**: p ≤ 0.1 (90% confidence)
- **New Issues**: ≥5 weekly mentions
- **NPS Change**: ≥2 points (at p ≤ 0.1)
- **Sentiment Change**: ≥3% (at p ≤ 0.1)

### Expected Outcomes:
- **~50% filtered** as noise
- **~50% shown** as significant
- **100% consistent** application

### User Commands:
- "Show verbose" → Include filtered items
- "No filter" → Show raw data
- "What was filtered?" → Explain what didn't pass

---

## The Key Message

**This skill is a MANDATORY POST-PROCESSOR for ALL comparisons:**

```
RAW DATA → STATISTICAL FILTER → USER
          ↑
    YOU APPLY THIS
```

**Never show unfiltered comparisons unless explicitly requested!**