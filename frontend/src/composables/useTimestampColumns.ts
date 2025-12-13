import { useI18n } from 'src/composables/useI18n';

export function useTimestampColumns(
  {
    modified = true,
    created = true,
  }: { modified?: boolean; created?: boolean } = {
    modified: true,
    created: true,
  },
) {
  const { t } = useI18n();

  const timestampColumns = [];

  if (modified) {
    timestampColumns.push({
      name: 'modified',
      label: t('entity.commonColumns.modified'),
      align: 'left' as const,
      field: 'modified',
      sortable: true,
      timestamp: true,
    });
  }

  if (created) {
    timestampColumns.push({
      name: 'created',
      label: t('entity.commonColumns.created'),
      align: 'left' as const,
      field: 'created',
      sortable: true,
      timestamp: true,
    });
  }

  return timestampColumns;
}
