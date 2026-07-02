import { describe, expect, it } from '@jest/globals';

import { formatCompactMoney, formatMoney, formatMoneyFull } from '@/utils/formatMoney';

describe('formatMoney', () => {
  it('formats zero and standard money with yen symbol and thousand separators', () => {
    expect(formatMoney(0)).toBe('¥0.00');
    expect(formatMoney(8999)).toBe('¥8,999.00');
  });

  it('keeps negative values readable by default', () => {
    expect(formatMoney(-33.25)).toBe('-¥33.25');
  });

  it('formats standard money with yen symbol and thousand separators', () => {
    expect(formatMoney(8999)).toBe('¥8,999.00');
  });

  it('formats expense and income signs', () => {
    expect(formatMoney(33.25, { sign: 'expense' })).toBe('-¥33.25');
    expect(formatMoney(9000, { sign: 'income' })).toBe('+¥9,000.00');
  });

  it('formats compact chart money for large values', () => {
    expect(formatCompactMoney(999.99)).toBe('¥999.99');
    expect(formatCompactMoney(10000)).toBe('¥1.00万');
    expect(formatCompactMoney(123456)).toBe('¥12.35万');
    expect(formatCompactMoney(1234567.89)).toBe('¥123.46万');
    expect(formatCompactMoney(10000100)).toBe('¥1000.01万');
    expect(formatCompactMoney(-9999900)).toBe('-¥999.99万');
  });

  it('formats compact income and expense signs', () => {
    expect(formatCompactMoney(12345, { sign: 'income' })).toBe('+¥1.23万');
    expect(formatCompactMoney(12345, { sign: 'expense' })).toBe('-¥1.23万');
  });

  it('keeps full money different from compact money', () => {
    expect(formatMoneyFull(1234567.89)).toBe('¥1,234,567.89');
    expect(formatCompactMoney(1234567.89)).toBe('¥123.46万');
  });

  it('does not leak common mojibake or escaped currency text', () => {
    const outputs = [
      formatMoney(8999),
      formatMoney(-33.25, { sign: 'auto' }),
      formatCompactMoney(129000)
    ];

    outputs.forEach((output) => {
      expect(output).not.toContain('\\uffe5');
      expect(output).not.toContain('￥');
      expect(output).not.toContain('Â¥');
    });
  });
});
