import { useI18n } from 'src/composables/useI18n';
import { FilterRuleType } from '../filterRule';
import type { FilterColumnConstructorData } from './useColumnDefinitions';
import { FilterRuleColumn } from '../filterRuleColumn';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { BaseTable } from '../queryTypes';
import { useEntityName } from 'src/composables/useEntityName';
import { computed, ref } from 'vue';

export function useCultivarColumns() {
  const { t } = useI18n();
  const { getEntityName } = useEntityName();

  const data = ref<FilterColumnConstructorData[] | undefined>(undefined);

  const columns = computed(() => {
    if (!data.value) {
      return [];
    }

    const tableLabel = getEntityName({
      table: BaseTable.Cultivars,
      capitalize: true,
    });

    return data.value.map((data) => {
      return new FilterRuleColumn({
        tableName: data.table,
        tableColumnName: data.column,
        tableLabel,
        tableColumnLabel: uppercaseFirstLetter(t(data.labelKey)),
        schema: data.schema,
      });
    });
  });

  const fetching = ref(false);
  const error = ref(undefined);

  return {
    activate: () => {
      data.value = columnData;
    },
    data: columns,
    fetching,
    error,
  };
}

const columnData: FilterColumnConstructorData[] = [
  {
    table: 'cultivar',
    column: 'id',
    labelKey: 'entity.id',
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
    labelKey: 'entity.name',
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
    labelKey: 'cultivars.columns.commonName',
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
    labelKey: 'cultivars.columns.acronym',
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
    labelKey: 'cultivars.columns.breeder',
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
    labelKey: 'cultivars.columns.registration',
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
    labelKey: 'entity.note',
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
    labelKey: 'entity.created',
    schema: {
      type: FilterRuleType.DateTime,
      allowEmpty: false,
    },
  },
];
