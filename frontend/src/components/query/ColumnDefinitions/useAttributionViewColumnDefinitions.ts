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
  {
    table: 'attributions_view',
    column: 'author',
    labelKey: 'attributions.columns.author',
    schema: {
      type: ColumnType.String,
      allowEmpty: false,
      validation: {
        maxLen: 45,
        pattern: null,
      },
    },
  },
  {
    table: 'attributions_view',
    column: 'date_attributed',
    labelKey: 'attributions.columns.date_attributed',
    schema: {
      type: ColumnType.Date,
      allowEmpty: false,
    },
  },
];
