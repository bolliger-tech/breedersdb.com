<template>
  <q-table
    v-model:pagination="pagination"
    title="Trees"
    :rows="data?.trees || []"
    :columns="columns"
    :visible-columns="visibleColumns"
    row-key="id"
    :loading="fetching"
    :rows-per-page-options="[10, 100, 1000]"
    flat
    binary-state-sort
    :filter="filter"
    @request="onRequest"
  >
    <template #top-right>
      <q-toggle v-model="showDisabled" label="Show eliminated trees" />
      <q-input
        v-model="filter"
        borderless
        dense
        debounce="300"
        placeholder="Search by Public ID or Cultivar Name"
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { UseQueryArgs, useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { QTable } from 'quasar';
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'src/composables/useI18n';

const { d } = useI18n();

const query = graphql(`
  query Trees(
    $limit: Int!
    $offset: Int!
    $orderBy: [trees_order_by!]
    $where: trees_bool_exp = { disabled: { _eq: false } }
  ) {
    trees_aggregate(where: $where) {
      aggregate {
        count
      }
    }
    trees(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
      id
      label_id
      cultivar_name
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

const filter = ref('');
const showDisabled = ref(false);

const pagination = ref({
  sortBy: 'label_id',
  descending: false,
  page: 1,
  rowsPerPage: 10,
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

  if (!showDisabled.value) {
    where._and.push({ disabled: { _eq: false } });
  }

  if (filter.value) {
    const or: UseQueryArgs<typeof query>['variables'] = { _or: [] };

    or._or.push({
      cultivar_name: { _ilike: `%${filter.value.replaceAll('.', '%.%')}%` },
    });

    if (filter.value.match(/^\d+$/)) {
      or._or.push({ label_id: { _eq: `${filter.value.padStart(8, '0')}` } });
    }

    if (filter.value.match(/^#\d+$/)) {
      or._or.push({
        label_id: { _eq: `#${filter.value.replace('#', '').padStart(8, '0')}` },
      });
    }

    if (filter.value === '#') {
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

const treesCount = computed(
  () => data.value?.trees_aggregate?.aggregate?.count || 0,
);

type Tree = ResultOf<typeof query>['trees'][0];

const columns = [
  {
    name: 'label_id',
    label: 'Label ID',
    align: 'left' as const,
    field: 'label_id',
    sortable: true,
    required: true,
  },
  {
    name: 'cultivar_name',
    label: 'Cultivar Name',
    align: 'left' as const,
    field: 'cultivar_name',
    sortable: true,
  },
  {
    name: 'rootstock',
    label: 'Rootstock',
    align: 'left' as const,
    field: (row: Tree) => row.rootstock?.name,
    sortable: true,
  },
  {
    name: 'grafting',
    label: 'Grafting',
    align: 'left' as const,
    field: (row: Tree) => row.grafting?.name,
    sortable: true,
  },
  {
    name: 'plant_row',
    label: 'Plant Row',
    align: 'left' as const,
    field: (row: Tree) => row.plant_row?.name,
    sortable: true,
  },
  {
    name: 'created',
    label: 'Created',
    align: 'left' as const,
    field: (row: Tree) => d(row.created as string, 'ymdHis'),
    sortable: true,
  },
];

const visibleColumns = columns.map((column) => column.name);

function onRequest({
  pagination: params,
}: Parameters<Required<QTable>['onRequest']>[0]) {
  pagination.value = Object.assign(pagination.value, params);
}

watch(error, (error) => {
  if (error) {
    throw error;
  }
});

watch(treesCount, () => {
  pagination.value.rowsNumber = treesCount.value;
});

watch(filter, (val) => {
  if (val.startsWith('#')) {
    showDisabled.value = true;
  }
});

onMounted(() => {
  pagination.value.rowsNumber = treesCount.value;
});
</script>
