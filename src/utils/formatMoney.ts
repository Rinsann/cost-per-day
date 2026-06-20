type MoneySign = 'auto' | 'expense' | 'income' | 'none';

type FormatMoneyOptions = {
  sign?: MoneySign;
  symbol?: boolean;
};

function getSignPrefix(value: number, sign: MoneySign) {
  if (sign === 'income') {
    return '+';
  }

  if (sign === 'expense') {
    return '-';
  }

  if (sign === 'auto') {
    if (value > 0) {
      return '+';
    }

    if (value < 0) {
      return '-';
    }
  }

  return '';
}

export function formatMoney(value: number, options: FormatMoneyOptions = {}) {
  const { sign = 'none', symbol = true } = options;
  const signPrefix = getSignPrefix(value, sign);
  const amount = Math.abs(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });

  return `${signPrefix}${symbol ? '¥' : ''}${amount}`;
}
