import { ref } from 'vue';
import type { FilterColumnConstructorData } from './useFilterColumns';
import { ColumnTypes } from 'src/utils/columnTypes';
import { MAX_INT_PG } from 'src/utils/constants';

export function usePlantColumnDefinitions() {
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
    table: 'plants',
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
    table: 'plants',
    column: 'label_id',
    labelKey: 'plants.fields.labelId',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: false,
      validation: {
        maxLen: 9,
        pattern: '^#?[0-9]*$',
      },
    },
  },
  {
    table: 'plants',
    column: 'cultivar_name',
    labelKey: 'plants.fields.cultivarName',
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
    table: 'plants',
    column: 'plant_group_name',
    labelKey: 'plants.fields.groupName',
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
    table: 'plants.plant_rows',
    column: 'name',
    labelKey: 'plants.fields.plantRow',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: true,
      validation: {
        maxLen: 45,
        pattern: null,
      },
    },
  },
  {
    table: 'plants',
    column: 'serial_in_plant_row',
    labelKey: 'plants.fields.serialInPlantRow',
    schema: {
      type: ColumnTypes.Integer,
      allowEmpty: true,
      validation: {
        min: 1,
        max: MAX_INT_PG,
        step: 1,
      },
    },
  },
  {
    table: 'plants',
    column: 'distance_plant_row_start',
    labelKey: 'plants.fields.distancePlantRowStart',
    schema: {
      type: ColumnTypes.Float,
      allowEmpty: true,
      validation: {
        min: 0,
        max: MAX_INT_PG,
        step: 0.01,
      },
    },
  },
  {
    table: 'plants',
    column: 'date_grafted',
    labelKey: 'plants.fields.dateGrafted',
    schema: {
      type: ColumnTypes.Date,
      allowEmpty: true,
    },
  },
  {
    table: 'plants',
    column: 'date_planted',
    labelKey: 'plants.fields.datePlanted',
    schema: {
      type: ColumnTypes.Date,
      allowEmpty: true,
    },
  },
  {
    table: 'plants',
    column: 'date_eliminated',
    labelKey: 'plants.fields.dateEliminated',
    schema: {
      type: ColumnTypes.Date,
      allowEmpty: true,
    },
  },
  {
    table: 'plants',
    column: 'date_labeled',
    labelKey: 'plants.fields.dateLabeled',
    schema: {
      type: ColumnTypes.Date,
      allowEmpty: true,
    },
  },
  {
    table: 'plants.rootstocks',
    column: 'name',
    labelKey: 'plants.fields.rootstock',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: true,
      validation: {
        maxLen: 45,
        pattern: null,
      },
    },
  },
  {
    table: 'plants.graftings',
    column: 'name',
    labelKey: 'plants.fields.grafting',
    schema: {
      type: ColumnTypes.Citext,
      allowEmpty: true,
      validation: {
        maxLen: 45,
        pattern: null,
      },
    },
  },
  {
    table: 'plants',
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
    table: 'plants',
    column: 'disabled',
    labelKey: 'entity.commonColumns.disabled',
    schema: {
      type: ColumnTypes.Boolean,
      allowEmpty: false,
    },
  },
  {
    table: 'plants',
    column: 'created',
    labelKey: 'entity.commonColumns.created',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: false,
    },
  },
  {
    table: 'plants',
    column: 'modified',
    labelKey: 'entity.commonColumns.modified',
    schema: {
      type: ColumnTypes.DateTime,
      allowEmpty: false,
    },
  },
];
