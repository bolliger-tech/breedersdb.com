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
    table: 'cached_attributions',
    column: 'text_note',
    labelKey: 'attributions.columns.textNoteLong',
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
    table: 'cached_attributions',
    column: 'photo_note',
    labelKey: 'attributions.columns.photoNoteLong',
    schema: {
      type: ColumnTypes.Photo,
      allowEmpty: true,
    },
  },
  {
    table: 'cached_attributions',
    column: 'exceptional_attribution',
    labelKey: 'attributions.columns.exceptionalAttribution',
    schema: {
      type: ColumnTypes.Boolean,
      allowEmpty: false,
    },
  },
  {
    table: 'cached_attributions',
    column: 'author',
    labelKey: 'attributions.columns.author',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: false,
      validation: {
        maxLen: 45,
        pattern: null,
      },
    },
  },
  {
    table: 'cached_attributions',
    column: 'date_attributed',
    labelKey: 'attributions.columns.dateAttributed',
    schema: {
      type: ColumnTypes.Date,
      allowEmpty: false,
    },
  },
];
