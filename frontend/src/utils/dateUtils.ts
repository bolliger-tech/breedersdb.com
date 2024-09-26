import type { Locale } from 'src/composables/useI18n';

// get a relative time string
// examples:
// now
// (in 5 seconds)
// this minute
// in 1 min.
// 1 min. ago
// in 2 hr.
// 2 hr. ago
// tomorrow
// yesterday
// in 2 days
// 2 days ago
export function toLocaleRelativeTimeString(
  date: Date,
  locale: Locale,
  options: Intl.RelativeTimeFormatOptions | undefined = {
    numeric: 'auto',
    style: 'short',
  },
  secondsPrecision: boolean | undefined = false,
) {
  const rtf = new Intl.RelativeTimeFormat(locale, options);
  const diff = new Date().getTime() - date.getTime();

  const diffSeconds = Math.trunc(diff / 1000);
  const diffMinutes = Math.trunc(diff / 1000 / 60);
  const diffHours = Math.trunc(diff / 1000 / 60 / 60);
  const diffDays = Math.trunc(diff / 1000 / 60 / 60 / 24);

  if (secondsPrecision && Math.abs(diffSeconds) < 60) {
    return rtf.format(-diffSeconds, 'second');
  }

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, 'hour');
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(-diffDays, 'day');
  }

  const diffMonths = Math.trunc(diff / 1000 / 60 / 60 / 24 / 30);
  const diffYears = Math.trunc(diff / 1000 / 60 / 60 / 24 / 30 / 12);

  if (Math.abs(diffMonths) < 12) {
    return rtf.format(-diffMonths, 'month');
  }
  return rtf.format(-diffYears, 'year');
}

// 2024-09-26T19_07_05.532Z -> 2024-09-26T21:07:05
export function getFileNameDateTime(input?: Date | string | undefined) {
  // toISOString is always UTC, create a date that has local time but utc timezone
  // then convert to iso string and shorten
  const date = input ? new Date(input) : new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('.')[0];
}
