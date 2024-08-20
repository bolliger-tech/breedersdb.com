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
      :has-qr-scanner="true"
      @scanned-qr="onScannedQr"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { UseQueryArgs, useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch, UnwrapRef, ref, nextTick } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { usePagination } from 'src/components/Entity/List/usePagination';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { useRouter } from 'vue-router';
import { zeroFill } from 'src/utils/labelIdUtils';

const { t, d } = useI18n();

const query = graphql(
  `
    query Plants(
      $limit: Int!
      $offset: Int!
      $orderBy: [plants_order_by!]
      $where: plants_bool_exp = { disabled: { _eq: false } }
      $PlantWithSegments: Boolean = false
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

    if (search.value.match(/^#?\d+$/)) {
      or._or.push({ label_id: { _eq: `${zeroFill(search.value)}` } });
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
    label: t('plants.fields.labelId'),
    align: 'left' as const,
    field: 'label_id',
    sortable: true,
  },
  {
    name: 'cultivar_name',
    label: t('plants.fields.cultivarName'),
    align: 'left' as const,
    field: 'cultivar_name',
    sortable: true,
  },
  {
    name: 'plant_group_name',
    label: t('plants.fields.groupName'),
    align: 'left' as const,
    field: 'plant_group_name',
    sortable: true,
  },
  {
    name: 'rootstock',
    label: t('plants.fields.rootstock'),
    align: 'left' as const,
    field: (row: Plant) => row.rootstock?.name,
    sortable: true,
  },
  {
    name: 'grafting',
    label: t('plants.fields.grafting'),
    align: 'left' as const,
    field: (row: Plant) => row.grafting?.name,
    sortable: true,
  },
  {
    name: 'plant_row',
    label: t('plants.fields.plantRow'),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.name,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
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

const router = useRouter();

const variablesPlantByLabelId = ref({ labelId: '' });
const queryPlantByLabelId = graphql(
  `
    query PlantIdByLabelId($labelId: String!) {
      plants(where: { label_id: { _eq: $labelId } }) {
        id
      }
    }
  `,
  [plantFragment],
);

const { executeQuery } = await useQuery({
  query: queryPlantByLabelId,
  variables: variablesPlantByLabelId,
  pause: true,
});

async function onScannedQr(code: string) {
  variablesPlantByLabelId.value.labelId = code;
  await nextTick();
  const result = await executeQuery();
  if (result.data.value?.plants.length === 1) {
    router.push({ path: `/plants/${result.data.value.plants[0].id}` });
  } else {
    search.value = code;
  }
}
</script>
