<template>
  <EntityList
    v-model:tab="subset"
    v-model:search="search"
    :tabs="tabs"
    :title="t('plants.title', 2)"
    :search-placeholder="t('plants.searchPlaceholder')"
    to-new-entity="/plants/new"
  >
    <template #default>
      <EntityListTable
        v-model:pagination="pagination"
        v-model:visible-columns="visibleColumns"
        :rows="data?.plants || []"
        :loading="fetching"
        :all-columns="columns"
        :row-click-navigates-to="(row) => `/plants/${row.id}`"
      />
    </template>
  </EntityList>
</template>

<script setup lang="ts">
import { UseQueryArgs, useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityList from './Entity/List/EntityList.vue';
import { usePagination } from './Entity/List/usePagination';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityListTable from 'src/components/Entity/List/EntityListTable.vue';
import { UnwrapRef } from 'vue';

const { t, d } = useI18n();

const query = graphql(`
  query Plants(
    $limit: Int!
    $offset: Int!
    $orderBy: [plants_order_by!]
    $where: plants_bool_exp = { disabled: { _eq: false } }
  ) {
    plants_aggregate(where: $where) {
      aggregate {
        count
      }
    }
    plants(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
      id
      label_id
      cultivar_name
      plant_group_name
      serial_in_plant_row
      distance_plant_row_start
      geo_location
      geo_location_accuracy
      date_grafted
      date_planted
      date_eliminated
      date_labeled
      note
      rootstock {
        id
        name
      }
      grafting {
        id
        name
      }
      plant_row {
        id
        name
        orchard {
          id
          name
        }
      }
      created
    }
  }
`);

const { queryArg: search } = useQueryArg<string>({
  key: 's',
  defaultValue: '',
  replace: true,
});

const { queryArg: subset } = useQueryArg<'active' | 'disabled' | 'all'>({
  key: 'tab',
  defaultValue: 'active',
  replace: true,
});
const tabs: { value: UnwrapRef<typeof subset>; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'all', label: 'All' },
];

const { pagination } = usePagination({
  sortBy: 'label_id',
  descending: false,
  page: 1,
  rowsPerPage: 100,
  rowsNumber: 0,
});

const orderBy = computed(() => {
  const order = pagination.value.descending ? 'desc' : 'asc';
  const column = pagination.value.sortBy;

  if (['rootstock', 'grafting', 'plant_row'].includes(column)) {
    return [{ [column]: { name: order } }];
  }

  return [{ [column]: order }];
});

const where = computed(() => {
  const where: UseQueryArgs<typeof query>['variables'] = { _and: [] };

  if (subset.value === 'active') {
    where._and.push({ disabled: { _eq: false } });
  } else if (subset.value === 'disabled') {
    where._and.push({ disabled: { _eq: true } });
  }

  if (search.value) {
    const or: UseQueryArgs<typeof query>['variables'] = { _or: [] };

    or._or.push({
      cultivar_name: { _ilike: `%${search.value.replaceAll('.', '%.%')}%` },
    });

    if (search.value.match(/^\d+$/)) {
      or._or.push({ label_id: { _eq: `${search.value.padStart(8, '0')}` } });
    }

    if (search.value.match(/^#\d+$/)) {
      or._or.push({
        label_id: { _eq: `#${search.value.replace('#', '').padStart(8, '0')}` },
      });
    }

    if (search.value === '#') {
      or._or.push({ label_id: { _like: '#%' } });
    }

    where._and.push(or);
  }
  return where;
});

const variables = computed(() => ({
  limit: pagination.value.rowsPerPage,
  offset: (pagination.value.page - 1) * pagination.value.rowsPerPage,
  orderBy: orderBy.value,
  where: where.value,
}));

const { data, fetching, error } = await useQuery({
  query,
  variables,
});

const plantsCount = computed(
  () => data.value?.plants_aggregate?.aggregate?.count || 0,
);

type Plant = ResultOf<typeof query>['plants'][0];

const columns = [
  {
    name: 'label_id',
    label: 'Label ID',
    align: 'left' as const,
    field: 'label_id',
    sortable: true,
  },
  {
    name: 'cultivar_name',
    label: 'Cultivar Name',
    align: 'left' as const,
    field: 'cultivar_name',
    sortable: true,
  },
  {
    name: 'plant_group_name',
    label: 'Group Name',
    align: 'left' as const,
    field: 'plant_group_name',
    sortable: true,
  },
  {
    name: 'rootstock',
    label: 'Rootstock',
    align: 'left' as const,
    field: (row: Plant) => row.rootstock?.name,
    sortable: true,
  },
  {
    name: 'grafting',
    label: 'Grafting',
    align: 'left' as const,
    field: (row: Plant) => row.grafting?.name,
    sortable: true,
  },
  {
    name: 'plant_row',
    label: 'Plant Row',
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.name,
    sortable: true,
  },
  {
    name: 'created',
    label: 'Created',
    align: 'left' as const,
    field: (row: Plant) => d(row.created as string, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 5),
  replace: true,
});

watch(error, (newValue) => {
  if (newValue) {
    throw newValue;
  }
});

watch(
  plantsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

watch(search, (newValue) => {
  if (newValue.startsWith('#') && subset.value === 'active') {
    subset.value = 'all';
  }
});
</script>
