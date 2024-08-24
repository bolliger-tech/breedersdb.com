import { ColumnTypes } from 'src/utils/columnTypes';
import type { FilterColumnConstructorData } from './useFilterColumns';
import { ref } from 'vue';
import { MAX_INT_PG } from 'src/utils/constants';

export function useCultivarColumnDefinitions() {
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
    table: 'cultivars',
    column: 'id',
    labelKey: 'entity.commonColumns.id',
    schema: {
      type: ColumnTypes.Integer,
      allowEmpty: false,
      validation: {
        min: 1,
        max: MAX_INT_PG,
        step: 1,
      },
    },
  },
  {
    table: 'cultivars',
    column: 'display_name',
    labelKey: 'entity.commonColumns.displayName',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: false,
      validation: {
        maxLen: 58,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivars',
    column: 'full_name',
    labelKey: 'entity.commonColumns.fullName',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: false,
      validation: {
        maxLen: 58,
        pattern: null,
      },
    },
  },
  // This field is never exposed to the user, let's hide it here as well.
  // {
  //   table: 'cultivars',
  //   column: 'name_override',
  //   labelKey: 'entity.commonColumns.nameOverride',
  //   schema: {
  //     type: ColumnTypes.String,
  //     allowEmpty: true,
  //     validation: {
  //       maxLen: 58,
  //       pattern: null,
  //     },
  //   },
  // },
  {
    table: 'cultivars',
    column: 'acronym',
    labelKey: 'cultivars.fields.acronym',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: true,
      validation: {
        maxLen: 10,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivars',
    column: 'breeder',
    labelKey: 'cultivars.fields.breeder',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivars',
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
    table: 'cultivars',
    column: 'created',
    labelKey: 'entity.commonColumns.created',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: false,
    },
  },
];
