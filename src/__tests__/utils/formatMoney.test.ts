import { describe, expect, it } from '@jest/globals';

import { formatCompactMoney, formatMoney } from '@/utils/formatMoney';

describe('formatMoney', () => {
  it('formats standard money with yen symbol and thousand separators', () => {
    expect(formatMoney(8999)).toBe('¥8,999.00');
  });

  it('formats expense and income signs', () => {
    expect(formatMoney(33.25, { sign: 'expense' })).toBe('-¥33.25');
    expect(formatMoney(9000, { sign: 'income' })).toBe('+¥9,000.00');
  });

  it('formats compact chart money for large values', () => {
    expect(formatCompactMoney(129000)).toBe('¥12.9万');
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
