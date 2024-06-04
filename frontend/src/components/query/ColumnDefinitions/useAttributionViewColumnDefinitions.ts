import { ref } from 'vue';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';
import type { FilterColumnConstructorData } from './useFilterColumns';

export function useAttributionViewColumnDefinitions() {
  const data = ref<FilterColumnConstructorData[]>([]);
  const fetching = ref(false);
  const error = ref(undefined);

  return {
    activate: () => {
      data.value = columnData;
    },
    data,
    fetching,
    error,
  };
}

const columnData: FilterColumnConstructorData[] = [
  {
    table: 'attributions_view',
    column: 'id',
    labelKey: 'entity.id',
    schema: {
      type: ColumnType.Integer,
      allowEmpty: false,
      validation: {
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
      },
    },
  },
  {
    table: 'attributions_view',
    column: 'note',
    labelKey: 'entity.note',
    schema: {
      type: ColumnType.String,
      allowEmpty: true,
      validation: {
        maxLen: 2047,
        pattern: null,
      },
    },
  },
  {
    table: 'attributions_view',
    column: 'exceptional_attribution',
    labelKey: 'attributions.columns.exceptional_attribution',
    schema: {
      type: ColumnType.Boolean,
      allowEmpty: false,
    },
  },
];
