#!/usr/bin/env node
/**
 * Chattermill URL Generator
 *
 * Usage:
 *   node generate_url.js analytics   '<json>'   — /analytics chart link
 *   node generate_url.js feedback    '<json>'   — /feedback verbatims or observations tab
 *   node generate_url.js observation '<json>'   — /feedback with observation sidebar open
 *   node generate_url.js batch       '<array>'  — multiple links in one call (each item needs "type")
 *
 * All commands output JSON: { "url": "https://..." }
 * Pass "debug": true in any input to also return the decompressed payload.
 * Batch with labels returns an object keyed by label instead of an array.
 */

// ─── lz-string (vendored) ─────────────────────────────────────────────────────

const lz = require('./lz-string');

const crypto = require('crypto');

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://app.chattermill.com';

const VALID_CHART_TYPES   = ['line', 'column', 'bar', 'table'];
const VALID_METRIC_TYPES  = ['nps', 'net_sentiment', 'volume', 'csat', 'average_score', 'positive_sentiment', 'negative_sentiment'];
const VALID_FREQUENCIES   = ['day', 'week', 'month', 'quarter'];
const VALID_DATE_RANGE_TYPES = ['all_time', 'between', 'last', 'this', 'since'];
const VALID_FILTER_TYPES  = [
  'category_theme', 'comment', 'data_source', 'data_type', 'date_range',
  'has_themes', 'has_turns', 'observation_id', 'observation_status',
  'observation_type', 'score_range', 'search_query', 'segment_id',
];
const SERIES_COLORS = ['#0196ED', '#C14E92', '#A9B450', '#F5A623', '#7ED321', '#9013FE', '#4A90E2', '#D0021B'];

// ─── Errors ───────────────────────────────────────────────────────────────────

function fatal(msg) { process.stderr.write(`Error: ${msg}\n`); process.exit(1); }
class ValidationError extends Error {}
function assert(condition, msg) { if (!condition) throw new ValidationError(msg); }
function assertEnum(value, valid, field) {
  assert(valid.includes(value), `${field} must be one of [${valid.join(', ')}], got: "${value}"`);
}

// ─── Shared validation ────────────────────────────────────────────────────────

function validateDateRange(dr, field = 'date_range') {
  assert(dr && typeof dr === 'object', `${field} must be an object`);
  assert(dr.type, `${field}.type is required`);
  assertEnum(dr.type, VALID_DATE_RANGE_TYPES, `${field}.type`);
  if (dr.type === 'between') {
    assert(dr.start_date, `${field}.start_date is required`);
    assert(dr.end_date, `${field}.end_date is required`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(dr.start_date), `${field}.start_date must be YYYY-MM-DD`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(dr.end_date), `${field}.end_date must be YYYY-MM-DD`);
  } else if (dr.type === 'last') {
    assert(dr.unit, `${field}.unit is required`);
    assert(dr.duration, `${field}.duration is required`);
    assertEnum(dr.unit, ['day', 'week', 'month', 'quarter', 'year'], `${field}.unit`);
  } else if (dr.type === 'this') {
    assert(dr.unit, `${field}.unit is required`);
    assertEnum(dr.unit, ['day', 'week', 'month', 'quarter', 'year'], `${field}.unit`);
  } else if (dr.type === 'since') {
    assert(dr.start_date, `${field}.start_date is required`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(dr.start_date), `${field}.start_date must be YYYY-MM-DD`);
  }
}

function validateFilters(filters, field = 'filters') {
  assert(Array.isArray(filters), `${field} must be an array`);
  filters.forEach((f, i) => {
    assert(f && typeof f === 'object', `${field}[${i}] must be an object`);
    assert(f.type, `${field}[${i}].type is required`);
    assert(f.params !== undefined, `${field}[${i}].params is required`);
    if (!VALID_FILTER_TYPES.includes(f.type)) {
      process.stderr.write(`Warning: ${field}[${i}].type "${f.type}" is not a validated filter type\n`);
    }
    if (f.type === 'segment_id') {
      assert(typeof f.params.segment_id === 'string', `${field}[${i}].params.segment_id must be a string, not a number`);
    }
    if (f.type === 'category_theme') {
      assert(Array.isArray(f.params.categories), `${field}[${i}].params.categories must be an array`);
      // FE requires sentiment on every theme object — default to null if omitted
      f.params.categories.forEach(cat => {
        if (Array.isArray(cat.themes)) {
          cat.themes.forEach(t => {
            if (t.sentiment === undefined) t.sentiment = null;
          });
        }
      });
    }
    if (f.type === 'score_range') {
      assert(Number.isInteger(f.params.from), `${field}[${i}].params.from must be an integer`);
      assert(Number.isInteger(f.params.to), `${field}[${i}].params.to must be an integer`);
    }
    if (['data_source', 'data_type', 'observation_id'].includes(f.type) && f.params.value) {
      assert(
        Array.isArray(f.params.value) && f.params.value.every(v => typeof v === 'string'),
        `${field}[${i}].params.value must be an array of strings`
      );
    }
  });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function compress(obj) {
  return lz.compressToEncodedURIComponent(JSON.stringify(obj));
}

function buildDateRangeFilter(dr) {
  if (!dr) return { type: 'all_time' };
  switch (dr.type) {
    case 'all_time': return { type: 'all_time' };
    case 'between':  return { type: 'between', start_date: dr.start_date, end_date: dr.end_date };
    case 'last':     return { type: 'last', unit: dr.unit, duration: dr.duration, is_complete: dr.is_complete !== false };
    case 'this':     return { type: 'this', unit: dr.unit };
    case 'since':    return { type: 'since', start_date: dr.start_date };
    default:         return { type: 'all_time' };
  }
}

// ─── analyticsUrl ─────────────────────────────────────────────────────────────

function analyticsUrl(input) {
  const base = input.base_url || BASE_URL;

  assert(input.project_id != null, 'project_id is required');
  assert(input.chart_type, 'chart_type is required');
  assertEnum(input.chart_type, VALID_CHART_TYPES, 'chart_type');

  const hasSeries = Array.isArray(input.series) && input.series.length > 0;
  assert(hasSeries || input.metric_type, 'Either series[] or metric_type must be provided');
  if (input.metric_type) assertEnum(input.metric_type, VALID_METRIC_TYPES, 'metric_type');
  if (input.frequency) assertEnum(input.frequency, VALID_FREQUENCIES, 'frequency');
  // Accept date_range_filter (preferred, matches payload field) or date_range (alias)
  const dateRangeInput = input.date_range_filter !== undefined ? input.date_range_filter : input.date_range;
  if (dateRangeInput) validateDateRange(dateRangeInput);
  if (input.comparison_date_range) validateDateRange(input.comparison_date_range, 'comparison_date_range');
  if (input.filters) validateFilters(input.filters);
  if (hasSeries) {
    input.series.forEach((s, i) => {
      assert(s.metric_type, `series[${i}].metric_type is required`);
      assertEnum(s.metric_type, VALID_METRIC_TYPES, `series[${i}].metric_type`);
      if (s.filters) validateFilters(s.filters, `series[${i}].filters`);
    });
  }

  let rawSeries = hasSeries
    ? input.series
    : [{ metric_type: input.metric_type, filters: input.filters || [] }];

  // comparison_date_range shorthand: auto-generate a comparison series for each main series
  if (input.comparison_date_range && !rawSeries.some(s => s.is_for_comparison)) {
    const compRange = buildDateRangeFilter(input.comparison_date_range);
    rawSeries = [
      ...rawSeries,
      ...rawSeries.map(s => ({
        metric_type: s.metric_type,
        title: s.title,
        is_for_comparison: true,
        compare_date_range_filter: compRange,
        filters: s.filters || [],
      })),
    ];
  }

  const series = rawSeries.map((s, i) => ({
    id: s.id || crypto.randomUUID(),
    metric_type: s.metric_type,
    title: s.title || `Filter group ${i + 1}`,
    color: s.color || SERIES_COLORS[i % SERIES_COLORS.length],
    is_for_comparison: s.is_for_comparison || false,
    compare_date_range_filter: s.compare_date_range_filter || null,
    filters: s.filters || [],
  }));

  const payload = {
    chart_type: input.chart_type,
    title: input.title || null,
    frequency: input.frequency || null,
    date_range_filter: buildDateRangeFilter(dateRangeInput),
    series,
    breakdowns: input.breakdowns || [{ type: 'filter_group' }],
    aggregation_type: input.aggregation_type || 'total',
    show_labels: input.show_labels !== undefined ? input.show_labels : true,
    show_volume: input.show_volume || false,
    is_autoscaling: input.is_autoscaling || false,
    is_grouping_swapped: false,
    results_limit: null,
    legend: { series: series.map(s => ({ id: s.id, is_active: true })) },
    sorting_v2: [],
    show_description: false,
    show_category: false,
  };

  const output = { url: `${base}/analytics?project=${input.project_id}#analyticsParams=${compress(payload)}` };
  if (input.debug) output.payload = payload;
  return output;
}

// ─── feedbackUrl ──────────────────────────────────────────────────────────────

function feedbackUrl(input) {
  const base = input.base_url || BASE_URL;

  assert(input.project_id != null, 'project_id is required');
  assert(input.tab, 'tab is required ("feedback" or "observations")');
  assertEnum(input.tab, ['feedback', 'observations'], 'tab');
  if (input.filters) validateFilters(input.filters);

  const filters = input.filters || [];

  let payload;
  if (input.tab === 'observations') {
    const withHasThemes = filters.some(f => f.type === 'has_themes')
      ? filters
      : [...filters, { type: 'has_themes', params: { value: true, operation: 'is' } }];
    payload = {
      filters: withHasThemes,
      original_comments: false,
      sorting: { type: 'field', field: 'insight_rank', order: 'desc' },
      active_tab_id: 'observations',
    };
  } else {
    payload = {
      filters,
      sorting: { property: 'createdAt', direction: 'desc' },
      original_comments: false,
      active_tab_id: 'feedback',
    };
  }

  const output = { url: `${base}/feedback?project=${input.project_id}#feedbackParams=${compress(payload)}` };
  if (input.debug) output.payload = payload;
  return output;
}

// ─── observationUrl ───────────────────────────────────────────────────────────

function observationUrl(input) {
  const base = input.base_url || BASE_URL;

  assert(input.project_id != null, 'project_id is required');
  assert(input.observation && typeof input.observation === 'object', 'observation object is required');
  const o = input.observation;
  assert(o.id != null, 'observation.id is required');
  assert(o.title, 'observation.title is required');
  assert(o.type, 'observation.type is required');
  assertEnum(o.type, ['issue', 'praise'], 'observation.type');
  if (input.filters) validateFilters(input.filters);

  const filters = input.filters || [];

  const feedbackFilters = [
    ...filters,
    { type: 'observation_id', params: { operation: 'is', value: [String(o.id)] } },
    ...(filters.some(f => f.type === 'has_themes')
      ? []
      : [{ type: 'has_themes', params: { value: true, operation: 'is' } }]),
  ];

  const feedbackPayload = {
    filters: feedbackFilters,
    original_comments: false,
    sorting: { type: 'field', field: 'insight_rank', order: 'desc' },
    active_tab_id: 'observations',
  };

  const sidebarFilters = [
    { type: 'observationId', value: [String(o.id)], operator: 'is', id: crypto.randomUUID() },
    { type: 'textAnalytics', isProcessed: true, operator: 'is', id: crypto.randomUUID() },
    { type: 'observationStatus', operator: 'is', values: ['insightful'], id: crypto.randomUUID() },
  ];

  const dateFilter = filters.find(f => f.type === 'date_range');
  if (dateFilter?.params?.value?.type === 'between') {
    const dv = dateFilter.params.value;
    sidebarFilters.unshift({
      type: 'date',
      dateRange: { type: 'between', startDate: dv.start_date, endDate: dv.end_date },
      operator: 'is',
      id: crypto.randomUUID(),
    });
  }

  const insightAssistantPayload = {
    insightAssistantDataItems: [{
      type: 'observation',
      observationListItem: {
        id: String(o.id),
        title: o.title,
        description: o.description || '',
        themeIds: (o.theme_ids || []).map(String),
        status: 'insightful',
        type: o.type,
        aspect: null,
        opinion: null,
        responsesCount: o.responses_count || 0,
        isMerging: false,
      },
      filters: sidebarFilters,
    }],
  };

  const output = {
    url: `${base}/feedback?project=${input.project_id}#feedbackParams=${compress(feedbackPayload)}&insightAssistantParams=${compress(insightAssistantPayload)}`,
  };
  if (input.debug) {
    output.feedback_payload = feedbackPayload;
    output.insight_assistant_payload = insightAssistantPayload;
  }
  return output;
}

// ─── batch ────────────────────────────────────────────────────────────────────

function batch(items) {
  const COMMANDS = { analytics: analyticsUrl, feedback: feedbackUrl, observation: observationUrl };

  const results = items.map((item) => {
    try {
      const fn = COMMANDS[item.type];
      if (!fn) throw new ValidationError(`Unknown type: "${item.type}". Must be "analytics", "feedback", or "observation"`);
      return { label: item.label || null, url: fn(item).url };
    } catch (e) {
      if (e instanceof ValidationError) return { label: item.label || null, error: e.message };
      throw e;
    }
  });

  const allLabelled = results.every(r => r.label);
  if (allLabelled) {
    const out = {};
    for (const { label, url, error } of results) out[label] = error ? { error } : url;
    return out;
  }
  return results.map(({ url, error }) => error ? { error } : url);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const COMMANDS = { analytics: analyticsUrl, feedback: feedbackUrl, observation: observationUrl };

  const cmd = process.argv[2];
  const raw = process.argv[3] || (() => {
    try { return require('fs').readFileSync('/dev/stdin', 'utf8').trim(); }
    catch (e) { fatal(`Usage: node generate_url.js <analytics|feedback|observation|batch> '<json>'`); }
  })();

  if (!cmd) fatal(`Usage: node generate_url.js <analytics|feedback|observation|batch> '<json>'`);

  let input;
  try { input = JSON.parse(raw); }
  catch (e) { fatal(`Invalid JSON: ${e.message}`); }

  try {
    let output;
    if (cmd === 'batch') {
      assert(Array.isArray(input), 'batch input must be an array');
      output = batch(input);
    } else {
      const fn = COMMANDS[cmd];
      if (!fn) fatal(`Unknown command: "${cmd}". Must be analytics, feedback, observation, or batch`);
      output = fn(input);
    }
    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (e) {
    if (e instanceof ValidationError) fatal(e.message);
    throw e;
  }
}

module.exports = {
  ValidationError,
  analyticsUrl,
  feedbackUrl,
  observationUrl,
  batch,
  buildDateRangeFilter,
  validateDateRange,
  validateFilters,
};

if (require.main === module) {
  main();
}
