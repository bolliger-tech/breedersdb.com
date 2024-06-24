import { ref } from 'vue';
import { ColumnTypes } from 'src/utils/columnTypes';
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
    labelKey: 'entity.commonColumns.note',
    schema: {
      type: ColumnTypes.String,
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
    labelKey: 'attributions.columns.exceptionalAttribution',
    schema: {
      type: ColumnTypes.Boolean,
      allowEmpty: false,
    },
  },
  {
    table: 'attributions_view',
    column: 'author',
    labelKey: 'attributions.columns.author',
    schema: {
      type: ColumnTypes.String,
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
    labelKey: 'attributions.columns.dateAttributed',
    schema: {
      type: ColumnTypes.Date,
      allowEmpty: false,
    },
  },
];
