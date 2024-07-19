<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('plants.title', 2)"
      :tabs="tabs"
      :search-placeholder="t('plants.searchPlaceholder')"
      :rows="data?.plants || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/plants"
      add-entity-path="/plants/new"
      :view-entity-path-getter="(id) => `/plants/${id}`"
    />
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { UseQueryArgs, useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch, UnwrapRef } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { usePagination } from 'src/components/Entity/List/usePagination';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { plantFragment } from 'src/components/Plant/plantFragment';

const { t, d } = useI18n();

const query = graphql(
  `
    query Plants(
      $limit: Int!
      $offset: Int!
      $orderBy: [plants_order_by!]
      $where: plants_bool_exp = { disabled: { _eq: false } }
      $withAttributions: Boolean = false
      $withSegments: Boolean = false
    ) {
      plants_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      plants(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

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
  { value: 'active', label: t('entity.tabs.active') },
  { value: 'disabled', label: t('entity.tabs.disabled') },
  { value: 'all', label: t('entity.tabs.all') },
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
    return { [column]: { name: order } };
  }

  return { [column]: order };
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
  orderBy: [orderBy.value, { id: 'asc' }],
  where: where.value,
}));

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['plants'] },
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

watch(
  error,
  (newValue) => {
    if (newValue) {
      throw newValue;
    }
  },
  { immediate: true },
);

watch(
  plantsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

watch(search, (newValue) => {
  if (newValue.startsWith('#') && subset.value === 'active') {
    // give the browser a moment to update the URL before changing again (race condition)
    window.setTimeout(() => (subset.value = 'all'), 20);
  }
});
</script>
