# Performance Profiling Notes

This note describes the lightweight development-only performance log flow for
the app.

## Scope

Performance logs are collected only when `__DEV__` is true. Production builds do
not collect, store, export, or display these logs.

The current logger keeps an in-memory rolling buffer. It is intended for short
true-device profiling sessions, not long-term telemetry.

## Recommended True-Device Path

Use one short session per investigation:

1. Open the app on the ledger tab.
2. Switch to the statistics tab.
3. Switch statistics ranges: month, quarter, year.
4. Open the statistics filter sheet, confirm a filter, then reset it.
5. Open all ledger records.
6. Search ledger records.
7. Open quick expense.
8. Select a category and save one record.
9. Open category management.
10. Open the cost tab.

Avoid running very long sessions before exporting, because the logger keeps only
the most recent entries.

## Exporting Logs

In development builds:

1. Open `我的`.
2. Open `数据管理`.
3. In the development diagnostics area, tap `导出性能日志`.
4. Share the generated JSON file.
5. Send the JSON file back to Codex for analysis.

You can also tap `清空性能日志` before a fresh run.

## Export Format

The exported file is JSON:

```json
{
  "appName": "算得值",
  "exportedAt": "2026-07-07T12:00:00.000Z",
  "total": 10,
  "logs": [
    {
      "id": "perf-...",
      "label": "insights.chartBuckets",
      "durationMs": 2.14,
      "timestamp": "2026-07-07T12:00:00.000Z",
      "type": "measure",
      "meta": {
        "recordsCount": 120
      }
    }
  ]
}
```

File name pattern:

```text
suandezhi-perf-log-YYYYMMDD-HHmmss.json
```

## Reading Thresholds

- `< 5ms`: normal
- `5-16ms`: worth watching
- `16-50ms`: may affect a frame
- `> 50ms`: prioritize optimization
- `> 100ms`: severe

## Current Measurement Points

- `insights.rangeRecords`
- `insights.filteredRecords`
- `insights.summary`
- `insights.chartBuckets`
- `insights.categoryStats`
- `insights.detailGroups`
- `ledger.monthSummary`
- `ledger.recentRecords`
- `ledger.recentRecordGroups`
- `ledger.budgetStatus`
- `ledgerAll.availableMonths`
- `ledgerAll.categoryOptions`
- `ledgerAll.monthRecords`
- `ledgerAll.filteredRecords`
- `ledgerAll.sections`
- `quickExpense.sortedCategories`
- `quickExpense.saveRecord`
- `categories.groups`
- `categories.saveDraft`
- `categories.storage.getExpenseCategories`
- `categories.storage.saveExpenseCategories`

