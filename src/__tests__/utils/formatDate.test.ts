import { describe, expect, it } from '@jest/globals';

import {
  formatMonthLabel,
  formatQuarterLabel,
  formatRelativeDateLabel,
  formatYearLabel,
  getDateString
} from '@/utils/formatDate';

describe('formatDate utilities', () => {
  it('formats Chinese year, month, and quarter labels', () => {
    expect(formatYearLabel(2026)).toBe('2026年');
    expect(formatMonthLabel(2026, 6)).toBe('2026年6月');
    expect(formatQuarterLabel(2026, 2)).toBe('2026年第2季度');
  });

  it('formats local dates as YYYY-MM-DD', () => {
    expect(getDateString(new Date(2026, 5, 20))).toBe('2026-06-20');
  });

  it('formats today and yesterday labels', () => {
    const today = new Date(2026, 5, 20);

    expect(formatRelativeDateLabel('2026-06-20', today)).toBe('今天');
    expect(formatRelativeDateLabel('2026-06-19', today)).toBe('昨天');
    expect(formatRelativeDateLabel('2026-06-18', today)).toBe('2026-06-18');
  });

  it('does not leak unicode escape text in visible date labels', () => {
    const outputs = [
      formatYearLabel(2026),
      formatMonthLabel(2026, 6),
      formatQuarterLabel(2026, 2),
      formatRelativeDateLabel('2026-06-20', new Date(2026, 5, 20))
    ];

    outputs.forEach((output) => {
      expect(output).not.toContain('\\u5e74');
      expect(output).not.toContain('\\u6708');
      expect(output).not.toContain('\\u65e5');
    });
  });
});
