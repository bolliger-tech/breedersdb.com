export function localizeDate(date: Date | string | null | undefined) {
  if (!date) {
    return null;
  }

  if (typeof date === 'string') {
    date = new Date(date);
  }

  return date.toLocaleDateString();
}
