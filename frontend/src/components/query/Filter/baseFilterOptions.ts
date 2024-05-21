import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { FilterColumn } from './filterColumn';
import { FilterRuleType, type FilterRuleSchema } from './filterRuleTypes';
import { BaseTable } from './queryTypes';
import type { TFunc } from 'src/composables/useI18n';

export function getBaseFilterOptions({
  baseTable,
  t,
}: {
  baseTable: BaseTable;
  t: TFunc;
}) {
  const prefix = getPrefix({ baseTable, t });

  return options[baseTable].map((data) => {
    return new FilterColumn({
      table: data.table,
      tableColumn: data.column,
      label: prefix + uppercaseFirstLetter(t(data.labelKey)),
      schema: data.schema,
    });
  });
}

function getPrefix({ baseTable, t }: { baseTable: BaseTable; t: TFunc }) {
  switch (baseTable) {
    case BaseTable.Crossings:
      return uppercaseFirstLetter(t('filter.crossing')) + ' > ';
    case BaseTable.Lots:
      return uppercaseFirstLetter(t('filter.lot')) + ' > ';
    case BaseTable.Cultivars:
      return uppercaseFirstLetter(t('filter.cultivar')) + ' > ';
    case BaseTable.Trees:
      return uppercaseFirstLetter(t('filter.tree')) + ' > ';
  }
}

type FilterColumnConstructorData = {
  table: string;
  column: string;
  labelKey: Parameters<TFunc>[0];
  schema: FilterRuleSchema;
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
    labelKey: 'filter.cultivar',
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
      type: FilterRuleType.Datetime,
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
