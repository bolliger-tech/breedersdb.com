import type { Locale } from 'src/composables/useI18n';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_MONTH * 12;

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
  const interval = getRelativeTimeInterval(date, secondsPrecision);

  const diffDivisor = Math.round(diff / interval);

  switch (interval) {
    case ONE_SECOND:
      return rtf.format(-diffDivisor, 'second');
    case ONE_MINUTE:
      return rtf.format(-diffDivisor, 'minute');
    case ONE_HOUR:
      return rtf.format(-diffDivisor, 'hour');
    case ONE_DAY:
      return rtf.format(-diffDivisor, 'day');
    case ONE_MONTH:
      return rtf.format(-diffDivisor, 'month');
    case ONE_YEAR:
      return rtf.format(-diffDivisor, 'year');
    default:
      throw new Error('Invalid interval');
  }
}

export function getRelativeTimeInterval(
  date: Date,
  secondsPrecision: boolean | undefined = false,
) {
  const diff = new Date().getTime() - date.getTime();

  if (secondsPrecision && Math.abs(diff) < ONE_MINUTE) {
    return ONE_SECOND;
  }
  if (Math.abs(diff) < ONE_HOUR) {
    return ONE_MINUTE;
  }
  if (Math.abs(diff) < ONE_DAY) {
    return ONE_HOUR;
  }
  if (Math.abs(diff) < ONE_MONTH) {
    return ONE_DAY;
  }
  if (Math.abs(diff) < ONE_YEAR) {
    return ONE_MONTH;
  }
  return ONE_YEAR;
}

// 2024-09-26T19_07_05.532Z -> 2024-09-26T21:07:05
export function getFileNameDateTime(input?: Date | string) {
  // toISOString is always UTC, create a date that has local time but utc timezone
  // then convert to iso string and shorten
  const date = input ? new Date(input) : new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('.')[0];
}
