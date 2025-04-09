import { useQuasar } from 'quasar';
import { ID_COLUMN_NAME } from 'src/composables/useIdColumn';
import { useQueryArg } from 'src/composables/useQueryArg';
import { toKebabCase } from 'src/utils/stringUtils';
import { watch, toValue, type MaybeRef, computed } from 'vue';

export function useEntityTableColumns({
  defaultColumns,
  entityType,
}: {
  defaultColumns: MaybeRef<string[]>;
  entityType: MaybeRef<string>;
}) {
  const defaultColumnsWithoutId = toValue(defaultColumns).filter(
    (column) => column !== ID_COLUMN_NAME,
  );

  const { queryArg: visibleColumns } = useQueryArg<string[]>({
    key: 'col',
    defaultValue: defaultColumnsWithoutId,
    replace: true,
  });

  const { localStorage } = useQuasar();
  const localStorageKey = computed(
    () => `breedersdb-${toKebabCase(toValue(entityType))}-visible-columns`,
  );
  watch(visibleColumns, (vc) => localStorage.set(localStorageKey.value, vc));

  // set again to force the adapted url if non default columns are set
  visibleColumns.value =
    localStorage.getItem<string[]>(localStorageKey.value) ??
    defaultColumnsWithoutId;

  return {
    visibleColumns,
  };
}
