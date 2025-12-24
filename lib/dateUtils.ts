export function getTodayMMDD(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

export function formatDateForDisplay(mmdd: string): string {
  const [month, day] = mmdd.split('-');
  const date = new Date(2024, parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
