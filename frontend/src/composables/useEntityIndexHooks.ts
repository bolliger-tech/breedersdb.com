import { usePagination } from 'src/components/Entity/List/usePagination';
import { useQueryArg } from './useQueryArg';
import { computed, toValue, type MaybeRef, type Ref } from 'vue';
import type { UseQueryArgs } from '@urql/vue';

// { "key": "payload" } -> { "key": "payload" }
// { "key.subkey": "payload" } -> { "key": { "subkey": "payload" } }
type StringObj = { [key: string]: unknown };
function nestObject(object: StringObj): StringObj {
  return Object.entries(object).reduce((acc, [key, value]) => {
    const [first, ...rest] = key.split('.');

    if (rest.length === 0) {
      return { ...acc, [first!]: value };
    }

    return {
      ...acc,
      [first!]: nestObject({ [rest.join('.')]: value }),
    };
  }, {});
}

export function useEntityIndexHooks<T>({
  defaultSortBy = 'name',
  defaultSortOrderDesc = false,
  searchColumns = ['name'], // use 'nested.entity.column' for nested columns
  subset,
}: {
  defaultSortBy?: string;
  defaultSortOrderDesc?: boolean;
  searchColumns?: MaybeRef<string[]>;
  subset?: Ref<'active' | 'disabled' | 'all'>;
} = {}) {
  const { queryArg: search } = useQueryArg<string>({
    key: 's',
    defaultValue: '',
    replace: true,
  });

  const { pagination } = usePagination({
    sortBy: defaultSortBy,
    descending: defaultSortOrderDesc,
    page: 1,
    rowsPerPage: 100,
    rowsNumber: 0,
  });

  const orderBy = computed(() => {
    const order = pagination.value.descending ? 'desc' : 'asc';
    const column = pagination.value.sortBy;

    return [nestObject({ [column]: order }), { id: 'asc' }];
  });

  const where = computed(() => {
    const where: UseQueryArgs<T>['variables'] = { _and: [] };

    if (subset) {
      if (subset.value === 'active') {
        where._and.push({ disabled: { _eq: false } });
      } else if (subset.value === 'disabled') {
        where._and.push({ disabled: { _eq: true } });
      }
    }

    const searchColumnsValue = toValue(searchColumns);

    if (search.value) {
      if (searchColumnsValue.length === 1 && searchColumnsValue[0]) {
        where._and.push(
          nestObject({
            [searchColumnsValue[0]]: { _ilike: `%${search.value}%` },
          }),
        );
      } else {
        where._and.push({
          _or: searchColumnsValue.map((column) =>
            nestObject({
              [column]: { _ilike: `%${search.value}%` },
            }),
          ),
        });
      }
    }

    return where;
  });

  const variables = computed(() => ({
    limit: pagination.value.rowsPerPage,
    offset: (pagination.value.page - 1) * pagination.value.rowsPerPage,
    orderBy: orderBy.value,
    where: where.value,
  }));

  return {
    search,
    pagination,
    variables,
  };
}
