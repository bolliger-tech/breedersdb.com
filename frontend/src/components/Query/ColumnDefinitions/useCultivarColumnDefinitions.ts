import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';
import type { FilterColumnConstructorData } from './useFilterColumns';
import { ref } from 'vue';

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
    table: 'cultivars',
    column: 'name',
    labelKey: 'entity.name',
    schema: {
      type: ColumnType.String,
      allowEmpty: false,
      validation: {
        maxLen: 58,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivars',
    column: 'common_name',
    labelKey: 'cultivars.fields.commonName',
    schema: {
      type: ColumnType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivars',
    column: 'acronym',
    labelKey: 'cultivars.fields.acronym',
    schema: {
      type: ColumnType.String,
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
      type: ColumnType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivars',
    column: 'registration',
    labelKey: 'cultivars.fields.registration',
    schema: {
      type: ColumnType.String,
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
    table: 'cultivars',
    column: 'created',
    labelKey: 'entity.created',
    schema: {
      type: ColumnType.DateTime,
      allowEmpty: false,
    },
  },
];
