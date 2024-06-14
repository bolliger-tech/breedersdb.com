<template>
  <q-btn to="/plants/new" primary unelevated color="primary">Add new</q-btn>

  <q-card class="bg-shade q-my-md" flat>
    <q-card-section>
      <q-input
        v-model="filter"
        outlined
        :bg-color="inputBgColor"
        dense
        debounce="300"
        placeholder="Search by Label ID or Cultivar Name"
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>
  </q-card>

  <q-tabs
    v-model="subset"
    class="q-ml-xs"
    breakpoint="320"
    align="left"
    no-caps
    dense
    active-bg-color="shade"
  >
    <q-tab class="tab" name="active" label="Active" />
    <q-tab class="tab" name="disabled" label="Disabled" />
    <q-tab class="tab" name="all" label="All" />
  </q-tabs>

  <CRUDListTable
    v-model:pagination="pagination"
    :visible-columns="visibleColumns"
    :rows="data?.plants || []"
    :loading="fetching"
    :all-columns="columns"
    :row-click-navigates-to="(row) => `/plants/${row.id}`"
  ></CRUDListTable>
</template>

<script setup lang="ts">
import { UseQueryArgs, useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import CRUDListTable from './CRUD/List/CRUDListTable.vue';
import { useInputBackground } from 'src/composables/useInputBackground';

const { d } = useI18n();

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

const filter = ref('');
const subset = ref<'active' | 'disabled' | 'all'>('active');

const pagination = ref({
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

const visibleColumns = columns.map((column) => column.name);

watch(error, (error) => {
  if (error) {
    throw error;
  }
});

watch(plantsCount, () => {
  pagination.value.rowsNumber = plantsCount.value;
});

watch(filter, (val) => {
  if (val.startsWith('#') && subset.value === 'active') {
    subset.value = 'all';
  }
});

onMounted(() => {
  pagination.value.rowsNumber = plantsCount.value;
});

const { inputBgColor } = useInputBackground();
</script>

<style scoped lang="scss">
.tab {
  border-radius: 3px 3px 0 0;
}
</style>
