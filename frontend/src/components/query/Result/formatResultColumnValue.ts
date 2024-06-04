import type { TFunc } from 'src/composables/useI18n';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';

export function formatResultColumnValue({
  value,
  type,
  t,
}: {
  value: string | number | Date | null | boolean | undefined;
  type: ColumnType;
  t: TFunc;
}) {
  if (null === value || undefined === value) {
    return '';
  } else if (value instanceof Date) {
    return value.toLocaleDateString();
  } else if (typeof value === 'number') {
    return value.toLocaleString();
  } else if (typeof value === 'boolean') {
    return value ? t('result.yes') : t('result.no');
  } else if (type === ColumnType.Integer || type === ColumnType.Float) {
    return parseInt(value).toLocaleString();
  } else if (type === ColumnType.Date) {
    return new Date(value).toLocaleDateString();
  }

  return value;
}
