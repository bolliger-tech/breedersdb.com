import { useI18n } from 'src/composables/useI18n';

export const ID_COLUMN_NAME = 'id';

export function useIdColumn() {
  const { t } = useI18n();

  return {
    name: ID_COLUMN_NAME,
    label: t('entity.commonColumns.id'),
    align: 'right' as const,
    field: 'id',
    sortable: true,
    monospaced: true,
    muted: true,
  };
}
