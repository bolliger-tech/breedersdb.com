import { ref } from 'vue';
import type { FilterColumnConstructorData } from './useFilterColumns';
import { ColumnTypes } from 'src/utils/columnTypes';
import { MAX_INT_PG } from 'src/utils/constants';

export function usePlantGroupsColumnDefinitions() {
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
    table: 'plant_groups',
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
    table: 'plant_groups',
    column: 'label_id',
    labelKey: 'plantGroups.fields.labelId',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: false,
      validation: {
        maxLen: 9,
        pattern: '^G[0-9]{0,9}$',
      },
    },
  },
  {
    table: 'plant_groups',
    column: 'cultivar_name',
    labelKey: 'plantGroups.fields.cultivar',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: false,
      validation: {
        maxLen: 51,
        pattern: null,
      },
    },
  },
  {
    table: 'plant_groups',
    column: 'display_name',
    labelKey: 'entity.commonColumns.displayName',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: false,
      validation: {
        maxLen: 77,
        pattern: null,
      },
    },
  },
  {
    table: 'plant_groups',
    column: 'full_name',
    labelKey: 'entity.commonColumns.fullName',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: false,
      validation: {
        maxLen: 77,
        pattern: null,
      },
    },
  },
  // This field is never exposed to the user, let's hide it here as well.
  // {
  //   table: 'plant_groups',
  //   column: 'name_override',
  //   labelKey: 'entity.commonColumns.nameOverride',
  //   schema: {
  //     type: ColumnTypes.String,
  //     allowEmpty: true,
  //     validation: {
  //       maxLen: 77,
  //       pattern: null,
  //     },
  //   },
  // },
  {
    table: 'plant_groups',
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
    table: 'plant_groups',
    column: 'disabled',
    labelKey: 'entity.commonColumns.disabled',
    schema: {
      type: ColumnTypes.Boolean,
      allowEmpty: false,
    },
  },
  {
    table: 'plant_groups',
    column: 'created',
    labelKey: 'entity.commonColumns.created',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: false,
    },
  },
  {
    table: 'plant_groups',
    column: 'modified',
    labelKey: 'entity.commonColumns.modified',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: true,
    },
  },
];
