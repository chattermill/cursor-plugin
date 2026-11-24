# Statistical Comparison Skill
## POST-PROCESSING Filter Applied AFTER Any Comparison

### 🚨 CRITICAL: This Runs AFTER Any Skill Does a Comparison
**This filter is applied AFTER any skill fetches comparison data, filtering noise BEFORE showing results to users.**

```
Flow: Skill gets data → THIS FILTER APPLIES → User sees only significant results
```

### ⚡ Optimized for Product Management Decisions

**IMPORTANT**: This skill uses **p ≤ 0.1 (90% confidence)** as the significance threshold, optimized for product management contexts where:
- **Early detection matters more than perfect certainty** - catching trends early prevents bigger issues
- **Directional insights are valuable** - 90% confidence is sufficient for most product decisions
- **Cost of investigation is low** - better to investigate a potential issue than miss a real one
- **Speed matters** - product teams can't wait for 95% certainty to act

*Note: This is more permissive than academic research (p < 0.05) but appropriate for business contexts where the cost of missing a real change (Type II error) often exceeds the cost of investigating a false positive (Type I error).*

### Overview
This skill provides a comprehensive framework for detecting statistically significant changes in ANY metric over time or between groups, with automatic noise filtering. Whether comparing observation volumes, NPS scores, net sentiment, satisfaction ratings, or any other metric with underlying volume, this skill ensures only meaningful differences are reported.

**Universal Application**: Works with any metric that has:
1. A measurable value (percentage, score, count, rate)
2. Underlying sample size/volume
3. Two or more points/groups to compare

**Built-in Statistical Rigor**: All comparisons use appropriate statistical tests (p ≤ 0.1) behind the scenes, calibrated for product management decisions. Users receive clean insights without statistical complexity.

---

## Supported Comparison Types

### 1. **Time-Based Comparisons**
- Week-over-Week (WoW)
- Month-over-Month (MoM)
- Quarter-over-Quarter (QoQ)
- Year-over-Year (YoY)
- Custom periods

### 2. **Segment Comparisons**
- Promoters vs Detractors
- New vs Existing customers
- Geographic regions
- Product lines
- Customer tiers

### 3. **Metric Types Supported**
| Metric Type | Examples | Statistical Test | MCP Function |
|------------|----------|------------------|--------------|
| **Volume/Count** | Observation counts, issue frequency | Z-test for proportions | fetch_observations |
| **Net Sentiment** | -100 to +100 scale | T-test for means | fetch_quantitative_insight |
| **NPS Score** | -100 to +100 | T-test with clustering | fetch_quantitative_insight |
| **Satisfaction %** | 0-100% satisfied | Z-test for proportions | fetch_quantitative_insight |
| **Average Ratings** | 1-5 stars | T-test for means | fetch_quantitative_insight |
| **Response Rate** | % who responded | Z-test for proportions | fetch_quantitative_insight |
| **Conversion Rate** | % who converted | Z-test for proportions | fetch_quantitative_insight |

---

## Comprehensive Statistical Testing Framework (Internal Use Only)

**CRITICAL**: All statistical calculations below are performed automatically behind the scenes. Users NEVER see test names, p-values, or statistical details - only clean insights.

### Complete Test Selection Decision Tree

```
START: What type of comparison?
│
├── TWO-GROUP COMPARISONS
│   │
│   ├── Both Non-Zero Values?
│   │   │
│   │   ├── Continuous Data (NPS, Sentiment scores)
│   │   │   ├── Normal Distribution + Equal Variances → Student's t-test
│   │   │   ├── Normal Distribution + Unequal Variances → Welch's t-test
│   │   │   └── Non-Normal Distribution → Mann-Whitney U test
│   │   │
│   │   ├── Proportions/Rates (Satisfaction %, Conversion %)
│   │   │   ├── Large Samples (n≥30, np≥5) → Z-test for proportions
│   │   │   └── Small Samples → Fisher's Exact Test
│   │   │
│   │   └── Count Data (Issue volumes)
│   │       ├── Expected frequencies ≥5 → Chi-square test
│   │       ├── Expected frequencies <5 → Fisher's Exact Test
│   │       └── Very rare events → Poisson test
│   │
│   └── One Value is Zero? → Minimum Threshold Test (no statistics)
│
├── MULTI-GROUP COMPARISONS (3+ groups)
│   │
│   ├── Continuous Data
│   │   ├── Normal + Equal Variances → One-way ANOVA
│   │   ├── Normal + Unequal Variances → Welch's ANOVA
│   │   └── Non-Normal → Kruskal-Wallis test
│   │
│   ├── Proportions → Chi-square test of independence
│   │
│   └── Post-hoc Tests (if significant)
│       ├── ANOVA significant → Tukey HSD or Scheffé
│       └── Kruskal-Wallis significant → Dunn's test
│
└── TIME SERIES/TREND ANALYSIS
    ├── Linear Trend → Linear regression (F-test on slope)
    ├── Seasonal Pattern → Time series decomposition
    └── Change Point → CUSUM or Bayesian change point
```

### Multiple Testing Corrections

When testing multiple hypotheses simultaneously, apply corrections to control false discovery:

#### 1. Bonferroni Correction (Most Conservative)
```
Adjusted α = 0.1 / number_of_tests

Example: Testing 20 observations
- Standard α = 0.1
- Bonferroni α = 0.1/20 = 0.005
- Required p-value becomes much stricter

When to use:
- Testing ≤10 comparisons
- High cost of false positives
- Need maximum confidence
```

#### 2. Holm-Bonferroni (Step-down procedure)
```
1. Order p-values from smallest to largest: p₁ ≤ p₂ ≤ ... ≤ pₘ
2. For the i-th ordered p-value, reject if:
   pᵢ ≤ α/(m-i+1)
3. Stop at first non-rejection

Less conservative than Bonferroni but still controls family-wise error rate
```

#### 3. Benjamini-Hochberg FDR (For many tests)
```
1. Order p-values: p₁ ≤ p₂ ≤ ... ≤ pₘ
2. Find largest i where: pᵢ ≤ (i/m) × α
3. Reject all H₁, H₂, ..., Hᵢ

When to use:
- Testing >10 comparisons
- Exploratory analysis
- Balance between Type I and Type II errors
```

### ANOVA and Post-hoc Tests for Multi-Group Comparisons

#### One-Way ANOVA
```
F = (Between-group variance) / (Within-group variance)
  = MSB / MSW

Where:
- MSB = SSB / (k-1)
- MSW = SSW / (N-k)
- k = number of groups
- N = total sample size

Assumptions:
1. Independence of observations
2. Normality within groups
3. Homogeneity of variances (test with Levene's)
```

#### Post-hoc Tests (After significant ANOVA)

**Tukey's HSD (Honestly Significant Difference)**
```
HSD = q × √(MSW/n)

Where q is studentized range statistic
Use when: All pairwise comparisons needed
```

**Scheffé Test**
```
S = √[(k-1) × F_{α,k-1,N-k} × MSW × (1/n₁ + 1/n₂)]

Most conservative, allows any contrast
Use when: Complex contrasts beyond pairwise
```

**Dunnett's Test**
```
Compare all groups to control group only
t = (x̄ᵢ - x̄control) / √[MSW(1/nᵢ + 1/ncontrol)]
```

### Non-Parametric Alternatives

When assumptions are violated:

#### Mann-Whitney U Test (Wilcoxon Rank-Sum)
```
Replaces: t-test
Use when: Non-normal distribution or ordinal data

U = n₁n₂ + n₁(n₁+1)/2 - R₁
Where R₁ = sum of ranks for group 1
```

#### Kruskal-Wallis Test
```
Replaces: One-way ANOVA
Use when: Non-normal or ordinal data

H = (12/N(N+1)) × Σ(Rᵢ²/nᵢ) - 3(N+1)
Where Rᵢ = sum of ranks for group i
```

#### Friedman Test
```
Replaces: Repeated measures ANOVA
Use when: Related samples, non-normal

χ²_F = (12/Nk(k+1)) × ΣRⱼ² - 3N(k+1)
```

### Effect Size Calculations (Internal Reporting)

#### Cohen's d (for t-tests)
```
d = (μ₁ - μ₂) / s_pooled

Interpretation:
- d = 0.2: Small effect
- d = 0.5: Medium effect
- d = 0.8: Large effect
```

#### Cohen's h (for proportions)
```
h = 2 × (arcsin√p₁ - arcsin√p₂)

Same thresholds as Cohen's d
```

#### Eta-squared (η²) for ANOVA
```
η² = SSB / SST

Interpretation:
- η² = 0.01: Small
- η² = 0.06: Medium
- η² = 0.14: Large
```

### Power Analysis (Pre-test Planning)

#### Sample Size Calculation
```
n = 2σ² × (z_α + z_β)² / δ²

Where:
- σ² = variance
- z_α = critical value for significance level
- z_β = critical value for power (typically 0.84 for 80% power)
- δ = minimum detectable difference
```

### Normality Testing (Behind the Scenes)

#### Shapiro-Wilk Test (n < 50)
```
W = (Σaᵢx₍ᵢ₎)² / Σ(xᵢ - x̄)²
```

#### Anderson-Darling Test (n ≥ 50)
```
A² = -n - Σ[(2i-1)/n × (ln Fᵢ + ln(1-F_{n+1-i}))]
```

### Variance Homogeneity Testing

#### Levene's Test
```
W = ((N-k)/(k-1)) × (Σnᵢ(Z̄ᵢ - Z̄..)²) / (ΣΣ(Zᵢⱼ - Z̄ᵢ)²)
```

#### Bartlett's Test (sensitive to normality)
```
B = (N-k)ln(s²_p) - Σ(nᵢ-1)ln(s²ᵢ)
```

### Automatic Test Selection by Scenario (Hidden from Users)

#### Scenario 1: Weekly Observation Comparison
```
User sees: "Missing ingredients up 200%"

Behind the scenes:
1. Check sample sizes (n₁=50, n₂=150)
2. Test normality → Likely non-normal for count data
3. Apply Chi-square test (expected frequencies >5)
4. Calculate p-value = 0.02
5. Check Bonferroni (testing 20 observations)
   - Adjusted α = 0.1/20 = 0.005
   - p = 0.02 > 0.005, but < 0.1
6. Report as "Directional" trend
```

#### Scenario 2: Multi-Segment NPS Comparison
```
User sees: "NPS varies significantly by customer tier"

Behind the scenes:
1. Groups: Premium, Standard, Basic (k=3)
2. Test normality → Approximately normal
3. Levene's test → p=0.23 (equal variances)
4. One-way ANOVA → F=12.4, p<0.001
5. Tukey HSD post-hoc:
   - Premium vs Standard: p=0.002 ✓
   - Premium vs Basic: p<0.001 ✓
   - Standard vs Basic: p=0.08 (directional)
```

#### Scenario 3: Time Series Trend Detection
```
User sees: "Declining satisfaction trend detected"

Behind the scenes:
1. 12 monthly data points
2. Linear regression on time
3. Slope = -0.8% per month
4. F-test on slope: p=0.04
5. Durbin-Watson = 1.9 (no autocorrelation)
6. Report trend with confidence level
```

### Implementation Pseudocode (Never Shown to Users)

```python
def select_and_apply_test(data1, data2, metric_type, comparison_type):
    """
    Automatically selects and applies appropriate statistical test
    Returns only user-friendly interpretation, no statistics
    """

    # Step 1: Handle zero comparisons first
    if data1['value'] == 0:
        return check_minimum_threshold(data2['value'], period)

    # Step 2: Check sample size requirements
    if data1['n'] < 30 or data2['n'] < 30:
        test = select_small_sample_test(metric_type)
    else:
        test = select_large_sample_test(metric_type)

    # Step 3: Check assumptions
    if requires_normality(test):
        if not is_normal(data1) or not is_normal(data2):
            test = get_nonparametric_alternative(test)

    # Step 4: Apply test
    p_value = apply_test(test, data1, data2)

    # Step 5: Apply multiple testing correction if needed
    if num_comparisons > 1:
        p_value = apply_correction(p_value, num_comparisons, method='bonferroni')

    # Step 6: Calculate effect size
    effect_size = calculate_effect_size(data1, data2, test)

    # Step 7: Determine significance level
    if p_value <= 0.001 and effect_size >= 'large':
        significance = 'critical'
    elif p_value <= 0.01 and effect_size >= 'medium':
        significance = 'major'
    elif p_value <= 0.05 and effect_size >= 'small':
        significance = 'notable'
    elif p_value <= 0.1 and effect_size >= 'small':
        significance = 'directional'
    else:
        return None  # Filter as noise

    # Step 8: Return ONLY user-friendly message
    return format_for_user(significance, change_magnitude, metric)
    # NEVER return p_value, test_name, or statistical details
```

---

## Simplified Framework for Users (What They Actually See)

While the comprehensive statistical machinery runs behind the scenes, users only interact with simple, clean outputs:

### User Sees Only:
- ✅ "Significant increase detected"
- 🔍 "Directional trend emerging"
- 🆕 "New issue identified"
- ❌ Nothing (filtered as noise)

### User Never Sees:
- ❌ "p = 0.043"
- ❌ "Welch's t-test applied"
- ❌ "Bonferroni correction used"
- ❌ "F(2,97) = 5.43"
- ❌ "Mann-Whitney U = 234"
- ❌ Any statistical terminology

---

## Statistical Testing Framework by Metric Type (Simplified Reference)

### For Percentage/Rate Metrics (0-100%)
**Examples**: Satisfaction rate, conversion rate, churn rate

**Z-Test for Proportions:**
```
z = (p₁ - p₂) / √[p_pooled × (1 - p_pooled) × (1/n₁ + 1/n₂)]

Where:
- p₁ = Current period rate
- p₂ = Previous period rate
- p_pooled = (successes₁ + successes₂) / (n₁ + n₂)
```

**Minimum Sample Requirements:**
- Each group: n ≥ 30
- Expected values: np ≥ 5 AND n(1-p) ≥ 5

### For Continuous Metrics (-∞ to +∞)
**Examples**: Net sentiment, NPS, average ratings

**T-Test for Means:**
```
t = (μ₁ - μ₂) / √[(s₁²/n₁) + (s₂²/n₂)]

Where:
- μ₁, μ₂ = means
- s₁, s₂ = standard deviations
- n₁, n₂ = sample sizes
```

**Degrees of Freedom (Welch's correction):**
```
df = [(s₁²/n₁ + s₂²/n₂)²] / [(s₁²/n₁)²/(n₁-1) + (s₂²/n₂)²/(n₂-1)]
```

### For Count/Volume Metrics
**Examples**: Number of complaints, issue frequency

**Poisson Test for Rare Events:**
```
When average count < 10:
P(X ≥ k) = Σ[e^(-λ) × λ^x / x!] for x = k to ∞
```

**Chi-Square for Larger Counts:**
```
χ² = Σ[(Observed - Expected)² / Expected]
```

---

## Chattermill MCP Implementation Examples

### Example 1: Compare Net Sentiment Over Time
```python
# Using fetch_quantitative_insight for net sentiment comparison
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "net sentiment this month vs last month"
Project_id: 27

# Returns data structure with:
{
  "current_period": {
    "value": -30.5,  # Net sentiment
    "volume": 5000,  # Sample size
    "std_dev": 45.2  # For t-test
  },
  "previous_period": {
    "value": -25.1,
    "volume": 4800,
    "std_dev": 43.7
  }
}

# Statistical test applied (behind the scenes):
t = (-30.5 - (-25.1)) / √[(45.2²/5000) + (43.7²/4800)]
t = -5.4 / 0.91 = -5.93
p < 0.001 ✅ Significant deterioration
```

### Example 2: Compare NPS Across Segments
```python
# Using fetch_quantitative_insight for segment comparison
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "NPS score by customer segment"
Project_id: 27

# Returns:
{
  "segments": [
    {"name": "VIP", "nps": 45, "volume": 500, "std_dev": 28},
    {"name": "Regular", "nps": 12, "volume": 3000, "std_dev": 35},
    {"name": "New", "nps": -5, "volume": 800, "std_dev": 40}
  ]
}

# Pairwise comparisons with Bonferroni correction:
# VIP vs Regular: t = 19.8, p < 0.001 ✅
# VIP vs New: t = 24.5, p < 0.001 ✅
# Regular vs New: t = 10.2, p < 0.001 ✅
```

### Example 3: Track Observation Volume Changes
```python
# Using fetch_observations for volume comparison
Tool: mcp__chattermill__fetch_observations
Query: "delivery issues last 7 days"
Limit: 20

Tool: mcp__chattermill__fetch_observations
Query: "delivery issues 14 to 7 days ago"
Limit: 20

# Compare volumes with z-test for proportions
# If statistically significant, report change
```

### Example 4: Multi-Metric Dashboard Comparison
```python
# Comprehensive metric comparison
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "compare all key metrics this quarter vs last quarter"

# Returns multiple metrics:
{
  "metrics": [
    {
      "name": "Net Sentiment",
      "current": -15.2,
      "previous": -22.8,
      "change_%": +33.3,
      "p_value": 0.002,  # Internal only
      "significant": true,
      "direction": "improving"
    },
    {
      "name": "NPS",
      "current": 23,
      "previous": 18,
      "change": +5,
      "p_value": 0.031,
      "significant": true,
      "direction": "improving"
    },
    {
      "name": "Response Rate",
      "current": 0.45,
      "previous": 0.43,
      "change_%": +4.7,
      "p_value": 0.124,
      "significant": false,
      "filtered": true  # Not shown to user
    }
  ]
}
```

### Example 5: Geographic Comparison
```python
# Compare metrics across regions
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "net sentiment by country for Europe"
Project_id: 27

# Statistical testing for multi-group comparison (ANOVA):
# F-statistic = Between-group variance / Within-group variance
# If p < 0.1, perform post-hoc pairwise tests
```

---

## Practical Significance Thresholds by Metric

### Combined Statistical + Practical Significance (Product-Optimized)

| Metric Type | Statistical Significance | Minimum Practical Change | Report As |
|-------------|-------------------------|-------------------------|-----------|
| **NPS** | p ≤ 0.1 | ≥2 points | 🔍 Directional |
| **NPS** | p ≤ 0.05 | ≥3 points | 🟡 Notable |
| **NPS** | p ≤ 0.01 | ≥5 points | 🟠 Major |
| **NPS** | p ≤ 0.001 | ≥8 points | 🔴 Critical |
| **Net Sentiment** | p ≤ 0.1 | ≥3% | 🔍 Directional |
| **Net Sentiment** | p ≤ 0.05 | ≥5% | 🟡 Notable |
| **Net Sentiment** | p ≤ 0.01 | ≥10% | 🟠 Major |
| **Net Sentiment** | p ≤ 0.001 | ≥15% | 🔴 Critical |
| **Satisfaction %** | p ≤ 0.1 | ≥2% | 🔍 Directional |
| **Satisfaction %** | p ≤ 0.05 | ≥3% | 🟡 Notable |
| **Volume/Count** | p ≤ 0.1 | ≥20% | 🔍 Directional |
| **Volume/Count** | p ≤ 0.05 | ≥30% | 🟡 Notable |
| **Conversion Rate** | p ≤ 0.1 | ≥1.5% | 🔍 Directional |
| **Conversion Rate** | p ≤ 0.05 | ≥2.5% | 🟡 Notable |

**🔍 Directional (p ≤ 0.1)**: Worth investigating, potential trend emerging
**🟡 Notable (p ≤ 0.05)**: Confident change, requires attention
**🟠 Major (p ≤ 0.01)**: Strong evidence, priority action needed
**🔴 Critical (p ≤ 0.001)**: Extremely confident, immediate action required

---

## Execution Templates

### Template 1: Time-Based Metric Comparison
```markdown
## [Metric] Trend Analysis
Period: [Current] vs [Previous]

### Query Structure:
fetch_quantitative_insight(
  query: "[metric] [current period] vs [previous period]",
  project_id: [id]
)

### Results (User Sees):
| Metric | Previous | Current | Change | Significance |
|--------|----------|---------|--------|--------------|
| Net Sentiment | -25.3% | -18.7% | +6.6% | 🟢 Improving |
| NPS | 15 | 22 | +7 | 🟢 Major Win |

### Hidden Calculations:
- t-test/z-test performed
- p-values calculated
- Only significant changes shown
```

### Template 2: Segment Comparison
```markdown
## Cross-Segment [Metric] Analysis

### Query Structure:
fetch_quantitative_insight(
  query: "[metric] by [segment dimension]",
  project_id: [id]
)

### Results Matrix:
| Segment | [Metric] | vs Baseline | Significance |
|---------|----------|-------------|--------------|
| Premium | 67% | +22% | 🟢 Significant |
| Standard | 45% | Baseline | - |
| Basic | 31% | -14% | 🔴 Significant |
```

### Template 3: Multi-Metric Health Check
```markdown
## Product Health Metrics

### Query Structure:
fetch_quantitative_insight(
  query: "key metrics dashboard [time period]",
  project_id: [id]
)

### Scorecard (Only Significant Changes):
✅ Improving:
- Net Sentiment: +8.2% (p < 0.01)
- Response Rate: +3.1% (p < 0.05)

🔴 Declining:
- NPS: -4 points (p < 0.05)

→ Stable (5 metrics filtered as noise)
```

---

## Advanced Comparison Scenarios

### Scenario 1: A/B Test Analysis
```python
# Compare test vs control group
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "net sentiment test_group:A vs test_group:B"

# Applies two-sample t-test
# Reports only if p < 0.1 and practical significance met
```

### Scenario 2: Cohort Analysis
```python
# Compare customer cohorts
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "NPS by signup_month last 6 months"

# Performs trend analysis with regression
# Tests for significant trend (p-value of slope)
```

### Scenario 3: Pre/Post Product Change
```python
# Impact measurement
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "all metrics 30 days before vs 30 days after [launch date]"

# Comprehensive before/after comparison
# Multiple testing correction applied
```

### Scenario 4: Competitive Benchmarking
```python
# Compare against industry
Tool: mcp__chattermill__fetch_quantitative_insight
Query: "our NPS vs industry benchmark"

# One-sample t-test against known benchmark
# Confidence interval calculation
```

---

## Critical Decision Framework: When to Use Which Test

### 📋 Simple Decision Tree:

```
Is Previous Value = 0?
│
├── YES (New Issue) → Use MINIMUM THRESHOLDS
│   └── Weekly ≥5, Monthly ≥10, etc.
│       └── No statistical test needed
│
└── NO (Change Detection) → Use STATISTICAL TESTING
    └── Calculate p-value
        └── Report if p ≤ 0.1 AND practical significance met
```

### Examples:

| Comparison | Previous | Current | Method | Result |
|------------|----------|---------|--------|--------|
| **Late deliveries** | 8 | 14 | Statistical test (p=0.08) | ✅ Report (p ≤ 0.1) |
| **Wrong address** | 0 | 6 | Volume threshold (≥5 weekly) | ✅ Report |
| **Website issues** | 0 | 2 | Volume threshold (<5 weekly) | ❌ Filter |
| **Missing items** | 3 | 10 | Statistical test (p=0.02) | ✅ Report |
| **Ice melted** | 0 | 4 | Volume threshold (<5 weekly) | ❌ Filter |
| **Too expensive** | 285 | 224 | Statistical test (p=0.03) | ✅ Report |

**Key Point**: We NEVER do statistical testing on 0 → X comparisons. We ALWAYS do statistical testing on X → Y comparisons where both are non-zero.

---

## Noise Filtering in Action

### What Gets Filtered (Not Shown to Users):
1. **Statistically Insignificant Changes** (p > 0.1)
   - NPS: 20 → 21 with n=50 (p = 0.15) ❌
   - Sentiment: -30% → -28% with n=100 (p = 0.12) ❌

2. **Below Practical Threshold** (even if p ≤ 0.1)
   - NPS: 20 → 20.8 with p = 0.08 (below 2-point threshold) ❌
   - Volume: 100 → 115 with p = 0.09 (below 20% threshold) ❌

3. **Small Sample Warnings**
   - Any comparison with n < 30 requires larger effect
   - Automatic switch to Fisher's Exact or Mann-Whitney

### What Gets Reported (Users See):

#### Two Different Decision Rules:

1. **For Non-Zero Comparisons (X → Y)** - Use Statistical Significance Testing
   - Example: Late deliveries 8 → 14
   - Apply: Z-test or T-test
   - Report if: p ≤ 0.1 AND meets practical threshold
   - NPS: 20 → 28 with n=1000 (p < 0.001) ✅
   - Sentiment: -30% → -15% with n=500 (p < 0.01) ✅

2. **For Zero Comparisons (0 → X)** - Use Minimum Volume Thresholds ONLY

   **NO statistical test needed for new issues - just volume thresholds:**

   | Time Period | Absolute Min | OR % of Responses | Example (1000 responses) |
   |-------------|--------------|-------------------|-------------------------|
   | **Daily** | ≥3 mentions | ≥0.5% | MIN(3, 5) = 5 needed |
   | **Weekly** | ≥5 mentions | ≥0.3% | MIN(5, 3) = 5 needed |
   | **Monthly** | ≥10 mentions | ≥0.2% | MIN(10, 2) = 10 needed |
   | **Quarterly** | ≥20 mentions | ≥0.1% | MIN(20, 1) = 20 needed |

   Formula: `Report if volume ≥ MAX(absolute_min, response_rate × total_responses)`

   Examples:
   - Wrong address: 0 → 2 (weekly) = ❌ FILTERED (below 5 threshold)
   - Wrong address: 0 → 6 (weekly) = ✅ REPORTED as new issue
   - Damaged boxes: 0 → 1 (daily) = ❌ FILTERED (below 3 threshold)
   - New segment with 50+ responses = ✅ REPORTED

3. **Critical Thresholds Crossed**
   - NPS dropping below 0 ✅
   - Sentiment turning negative ✅

---

## Quick Execution Commands

### Basic Comparisons
```
"Compare [metric] this [period] vs last [period]"
"Show [metric] by [dimension]"
"Track [metric] trend over [timeframe]"
```

### Advanced Comparisons
```
"Compare all metrics between [group A] and [group B]"
"Show significant changes in [metric] across [dimension]"
"Benchmark our [metric] against [comparison point]"
```

### Specific Chattermill Queries
```
"fetch_quantitative_insight: NPS this month vs last month"
"fetch_observations: top issues with significant volume changes"
"fetch_highlights: sentiment shifts by product area"
```

---

## Statistical Power Considerations

### Minimum Sample Sizes for 80% Power

| Metric Type | Small Effect | Medium Effect | Large Effect |
|------------|--------------|---------------|--------------|
| **NPS** (±100 scale) | n=400 per group | n=100 per group | n=40 per group |
| **Net Sentiment** (±100) | n=400 per group | n=100 per group | n=40 per group |
| **Satisfaction %** | n=800 per group | n=200 per group | n=80 per group |
| **Binary (Yes/No)** | n=400 per group | n=100 per group | n=40 per group |

### Effect Size Guidelines

**Small Effect (d=0.2)**
- NPS: 3-5 point difference
- Sentiment: 5-8% difference
- Satisfaction: 3-5% difference

**Medium Effect (d=0.5)**
- NPS: 8-12 point difference
- Sentiment: 12-18% difference
- Satisfaction: 8-12% difference

**Large Effect (d=0.8)**
- NPS: 15+ point difference
- Sentiment: 20%+ difference
- Satisfaction: 15%+ difference

---

## Response Format for Users

### Standard Mode: Clean Reporting (What Users See)
```markdown
## Significant Changes Detected

📈 Improvements:
• Net Sentiment improved from -25% to -18% (+28% relative)
• NPS increased by 7 points to 22

📉 Concerns:
• Response rate declined 12% (from 45% to 39%)

✅ Stable:
• Customer satisfaction holding at 72%
```

### VERBOSE Mode: Complete Filtering Transparency
When user explicitly requests `VERBOSE=true` or says "show me what was filtered":

```markdown
## Statistical Filtering Report

### ✅ PASSED FILTER (Reported)
| Metric | Previous | Current | Change | p-value | Status |
|--------|----------|---------|--------|---------|--------|
| Net Sentiment | -25.3% | -18.7% | +6.6% | 0.002 | Significant |
| NPS Score | 15 | 22 | +7 | 0.031 | Significant |
| Missing items | 50 | 150 | +200% | <0.001 | Critical |
| Late deliveries | 8 | 14 | +75% | 0.08 | Directional |

### ❌ FAILED FILTER (Hidden)
| Metric | Previous | Current | Change | p-value | Reason |
|--------|----------|---------|--------|---------|--------|
| Satisfaction | 72% | 73% | +1% | 0.42 | p > 0.1 |
| Wrong address | 0 | 2 | New | N/A | Below threshold (min 5) |
| Response rate | 45% | 44% | -2% | 0.31 | Not significant |
| Damaged items | 15 | 17 | +13% | 0.65 | Random variation |
| Cold food | 3 | 4 | +33% | 0.71 | Small sample noise |

### 📊 Noise Reduction Summary
- Total comparisons: 9
- Passed filter: 4 (44%)
- Failed filter: 5 (56%)
- **Noise reduction: 56%**

### 🎯 Filter Criteria Applied
- Statistical significance: p ≤ 0.1
- New issues: ≥5 weekly mentions
- Practical thresholds: Met for all reported items
```

**IMPORTANT**: Verbose mode ONLY shows the filtering process. The skill does NOT:
- Add interpretation beyond "significant/not significant"
- Create narratives about what changes "mean"
- Suggest actions or implications
- Add fancy language or embellishment

The skill is a **FILTER**, not an analyst.

### What's Hidden (Never Shown in Standard Mode)
- p-values, z-scores, t-statistics
- Confidence intervals
- Standard deviations
- Test names or statistical jargon
- Non-significant changes

---

## Implementation Checklist

When implementing any comparison:

- [ ] Identify metric type (continuous, percentage, count)
- [ ] Confirm adequate sample size (n ≥ 30 per group)
- [ ] Select appropriate statistical test
- [ ] Calculate test statistic internally
- [ ] Apply significance threshold (p < 0.1 for product decisions)
- [ ] Check practical significance threshold
- [ ] Apply multiple testing correction if needed
- [ ] Filter out non-significant results
- [ ] Report only meaningful changes clearly
- [ ] Never show statistical details to users

---

## Conclusion

This universal comparison skill enables:
1. **Any metric comparison** with statistical validity
2. **~50% noise reduction** through significance testing (p ≤ 0.1) and new issue thresholds
3. **Clean, actionable reporting** without statistical complexity
4. **Flexible application** across time, segments, and dimensions
5. **Automated significance testing** calibrated for product decisions
6. **Integration with Chattermill MCP** for seamless execution
7. **Early trend detection** with directional insights at 90% confidence

Whether comparing NPS scores, sentiment trends, observation volumes, or any other metric, this skill ensures only real, meaningful changes are surfaced to decision-makers.