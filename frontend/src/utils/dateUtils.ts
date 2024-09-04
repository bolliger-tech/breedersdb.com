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
