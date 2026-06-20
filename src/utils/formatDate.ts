export function formatYearLabel(year: number) {
  return `${year}年`;
}

export function formatMonthLabel(year: number, month: number) {
  return `${year}年${month}月`;
}

export function formatQuarterLabel(year: number, quarter: number) {
  return `${year}年第${quarter}季度`;
}

export function formatMonthOnlyLabel(month: number) {
  return `${month}月`;
}

export function formatDayRangeLabel(startDay: number, endDay: number) {
  return `${startDay}-${endDay}日`;
}

export function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLocalDateFromString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isValidDateString(value: string) {
  return getLocalDateFromString(value) !== null;
}

export function isFutureDateString(value: string, today = new Date()) {
  const date = getLocalDateFromString(value);

  if (!date) {
    return false;
  }

  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return date.getTime() > currentDate.getTime();
}

export function formatRelativeDateLabel(date: string, today = new Date()) {
  const todayString = getDateString(today);
  const yesterdayString = getDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  );

  if (date === todayString) {
    return '今天';
  }

  if (date === yesterdayString) {
    return '昨天';
  }

  return date;
}
