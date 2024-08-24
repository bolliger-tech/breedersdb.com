import { ref } from 'vue';
import type { FilterColumnConstructorData } from './useFilterColumns';
import { ColumnTypes } from 'src/utils/columnTypes';
import { MAX_INT_PG } from 'src/utils/constants';

export function useLotColumnDefinitions() {
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
    table: 'lots',
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
    table: 'lots.crossings',
    column: 'name',
    labelKey: 'lots.fields.crossing',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: false,
      validation: {
        maxLen: 8,
        pattern: null,
      },
    },
  },
  {
    table: 'lots',
    column: 'display_name',
    labelKey: 'entity.commonColumns.displayName',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: false,
      validation: {
        maxLen: 25,
        pattern: null,
      },
    },
  },
  {
    table: 'lots',
    column: 'full_name',
    labelKey: 'entity.commonColumns.fullName',
    schema: {
      type: ColumnTypes.String,
      allowEmpty: false,
      validation: {
        maxLen: 12,
        pattern: null,
      },
    },
  },
  // This field is never exposed to the user, let's hide it here as well.
  // {
  //   table: 'lots',
  //   column: 'name_override',
  //   labelKey: 'entity.commonColumns.nameOverride',
  //   schema: {
  //     type: ColumnTypes.String,
  //     allowEmpty: true,
  //     validation: {
  //       maxLen: 25,
  //       pattern: null,
  //     },
  //   },
  // },
  {
    table: 'lots',
    column: 'date_sowed',
    labelKey: 'lots.fields.dateSowed',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: true,
    },
  },
  {
    table: 'lots',
    column: 'numb_seeds_sowed',
    labelKey: 'lots.fields.numbSeedsSowed',
    schema: {
      type: ColumnTypes.Integer,
      allowEmpty: true,
      validation: {
        min: 0,
        max: MAX_INT_PG,
        step: 1,
      },
    },
  },
  {
    table: 'lots',
    column: 'numb_seedlings_grown',
    labelKey: 'lots.fields.numbSeedlingsGrown',
    schema: {
      type: ColumnTypes.Integer,
      allowEmpty: true,
      validation: {
        min: 0,
        max: MAX_INT_PG,
        step: 1,
      },
    },
  },
  {
    table: 'lots',
    column: 'seed_tray',
    labelKey: 'lots.fields.seedTray',
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
    table: 'lots',
    column: 'date_planted',
    labelKey: 'lots.fields.datePlanted',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: true,
    },
  },
  {
    table: 'lots',
    column: 'numb_seedlings_planted',
    labelKey: 'lots.fields.numbSeedlingsPlanted',
    schema: {
      type: ColumnTypes.Integer,
      allowEmpty: true,
      validation: {
        min: 0,
        max: MAX_INT_PG,
        step: 1,
      },
    },
  },
  {
    table: 'lots',
    column: 'plot',
    labelKey: 'lots.fields.plot',
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
    table: 'lots.orchards',
    column: 'name',
    labelKey: 'lots.fields.orchard',
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
    table: 'lots',
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
    table: 'lots',
    column: 'created',
    labelKey: 'entity.commonColumns.created',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: false,
    },
  },
  {
    table: 'lots',
    column: 'modified',
    labelKey: 'entity.commonColumns.modified',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: true,
    },
  },
];
