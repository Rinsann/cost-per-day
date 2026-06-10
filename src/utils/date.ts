const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function getUsedDays(purchaseDate: string, now = new Date()) {
  const start = new Date(`${purchaseDate}T00:00:00`);
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((current.getTime() - start.getTime()) / DAY_IN_MS) + 1;

  return Math.max(1, diff);
}

export function formatDate(date: string) {
  return date.replaceAll('-', '.');
}
