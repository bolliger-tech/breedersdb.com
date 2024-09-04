export const datetimeFormats = ({
  ymd: {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  },
  Ymd: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  },
  ymdHis: {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  },
  YmdHis: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  },
  His: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
} as const);