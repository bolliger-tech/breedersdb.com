import { useI18n } from 'src/composables/useI18n';

export function useTimestampColumns() {
  const { t } = useI18n();

  return [
    {
      name: 'modified',
      label: t('entity.commonColumns.modified'),
      align: 'left' as const,
      field: 'modified',
      sortable: true,
      timestamp: true,
    },
    {
      name: 'created',
      label: t('entity.commonColumns.created'),
      align: 'left' as const,
      field: 'created',
      sortable: true,
      timestamp: true,
    },
  ];
}
