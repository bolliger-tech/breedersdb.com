import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { FilterRuleColumn } from './filterRuleColumn';
import { BaseTable } from './queryTypes';
import type { TFunc } from 'src/composables/useI18n';
import { FilterRuleType, type FilterRuleTypeSchema } from './filterRule';
import { getEntityName } from './getEntityName';

export function getBaseFilterOptions({
  baseTable,
  t,
}: {
  baseTable: BaseTable;
  t: TFunc;
}) {
  const tableLabel = getEntityName({ table: baseTable, t, capitalize: true });

  return options[baseTable].map((data) => {
    return new FilterRuleColumn({
      tableName: data.table,
      tableColumnName: data.column,
      tableLabel,
      tableColumnLabel: uppercaseFirstLetter(t(data.labelKey)),
      schema: data.schema,
    });
  });
}

type FilterColumnConstructorData = {
  table: string;
  column: string;
  labelKey: Parameters<TFunc>[0];
  schema: FilterRuleTypeSchema;
};

// TODO:
const crossing: FilterColumnConstructorData[] = [];

// TODO:
const lot: FilterColumnConstructorData[] = [];

const cultivar: FilterColumnConstructorData[] = [
  {
    table: 'cultivar',
    column: 'id',
    labelKey: 'filter.id',
    schema: {
      type: FilterRuleType.Integer,
      allowEmpty: false,
      validation: {
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'name',
    labelKey: 'filter.name',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: false,
      validation: {
        maxLen: 58,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'common_name',
    labelKey: 'filter.commonName',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'acronym',
    labelKey: 'filter.acronym',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 10,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'breeder',
    labelKey: 'filter.breeder',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'registration',
    labelKey: 'filter.registration',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'note',
    labelKey: 'filter.note',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 2047,
        pattern: null,
      },
    },
  },
  {
    table: 'cultivar',
    column: 'created',
    labelKey: 'filter.created',
    schema: {
      type: FilterRuleType.DateTime,
      allowEmpty: false,
    },
  },
];

// TODO:
const tree: FilterColumnConstructorData[] = [];

const options = {
  [BaseTable.Crossings]: crossing,
  [BaseTable.Lots]: lot,
  [BaseTable.Cultivars]: cultivar,
  [BaseTable.Trees]: tree,
};
