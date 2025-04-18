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
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
      @scanned-qr="onScannedQr"
    >
      <template #body-cell-label_id="cellProps">
        <q-td :props="cellProps">
          <EntityLabelId :label-id="cellProps.value" entity-type="plant" />
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import type { UseQueryArgs } from '@urql/vue';
import { useQuery } from '@urql/vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import type { UnwrapRef } from 'vue';
import { computed, watch, ref, nextTick } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { useRouter } from 'vue-router';
import { plantLabelIdUtils } from 'src/utils/labelIdUtils';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { useExport } from 'src/composables/useExport';
import { useIdColumn } from 'src/composables/useIdColumn';

const { t, n, d } = useI18n();

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

const { queryArg: subset } = useQueryArg<'active' | 'disabled' | 'all'>({
  key: 'tab',
  defaultValue: 'active',
  replace: true,
});
const tabs = computed<{ value: UnwrapRef<typeof subset>; label: string }[]>(
  () => [
    { value: 'active', label: t('entity.tabs.active') },
    { value: 'disabled', label: t('entity.tabs.disabled') },
    { value: 'all', label: t('entity.tabs.all') },
  ],
);

const {
  search,
  pagination,
  variables: _variables,
} = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'label_id',
  subset,
});

const variables = computed(() => {
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
      or._or.push({
        label_id: { _eq: `${plantLabelIdUtils.zeroFill(search.value)}` },
      });
    }

    if (search.value === '#') {
      or._or.push({ label_id: { _like: '#%' } });
    }

    where._and.push(or);
  }

  return {
    ..._variables.value,
    where,
  };
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['plants'] },
});

const plantsCount = computed(
  () => data.value?.plants_aggregate?.aggregate?.count || 0,
);

type Plant = ResultOf<typeof query>['plants'][0];

const columns = computed(() => [
  useIdColumn(),
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
    name: 'rootstock.name',
    label: t('plants.fields.rootstock'),
    align: 'left' as const,
    field: (row: Plant) => row.rootstock?.name,
    sortable: true,
  },
  {
    name: 'grafting.name',
    label: t('plants.fields.grafting'),
    align: 'left' as const,
    field: (row: Plant) => row.grafting?.name,
    sortable: true,
  },
  {
    name: 'plant_row.orchard.name',
    label: t('orchards.title', 1),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.orchard?.name,
    sortable: true,
  },
  {
    name: 'plant_row.name',
    label: t('plants.fields.plantRow'),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.name,
    sortable: true,
  },
  {
    name: 'distance_plant_row_start',
    label: t('plants.fields.distancePlantRowStart'),
    align: 'right' as const,
    field: 'distance_plant_row_start',
    format: (v: Plant['distance_plant_row_start']) =>
      typeof v === 'number' ? n(v) : '',
    sortable: true,
  },
  {
    name: 'date_grafted',
    label: t('plants.fields.dateGrafted'),
    align: 'left' as const,
    field: 'date_grafted',
    sortable: true,
    format: (v: Plant['date_grafted']) => (v ? d(v, 'Ymd') : ''),
  },
  {
    name: 'date_planted',
    label: t('plants.fields.datePlanted'),
    align: 'left' as const,
    field: 'date_planted',
    sortable: true,
    format: (v: Plant['date_planted']) => (v ? d(v, 'Ymd') : ''),
  },
  {
    name: 'date_labeled',
    label: t('plants.fields.dateLabeled'),
    align: 'left' as const,
    field: 'date_labeled',
    sortable: true,
    format: (v: Plant['date_labeled']) => (v ? d(v, 'Ymd') : ''),
  },
  ...(subset.value === 'disabled'
    ? [
        {
          name: 'date_eliminted',
          label: t('plants.fields.dateEliminated'),
          align: 'left' as const,
          field: 'date_eliminated',
          sortable: true,
          format: (v: Plant['date_eliminated']) => (v ? d(v, 'Ymd') : ''),
        },
      ]
    : []),
  {
    name: 'note',
    label: t('entity.commonColumns.note'),
    align: 'left' as const,
    field: 'note',
    sortable: true,
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  ...useTimestampColumns(),
]);

const { visibleColumns } = useEntityTableColumns({
  entityType: 'plants',
  defaultColumns: columns.value.map((column) => column.name),
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
    query PlantIdByLabelId($labelId: citext!) {
      plants(where: { label_id: { _eq: $labelId } }) {
        id
      }
    }
  `,
  [plantFragment],
);

const urql = await useQuery({
  query: queryPlantByLabelId,
  variables: variablesPlantByLabelId,
  pause: true,
  context: { additionalTypenames: ['plants'] },
});

async function onScannedQr(code: string) {
  variablesPlantByLabelId.value.labelId = code;
  await nextTick();
  const result = await urql.executeQuery();
  if (result.data.value?.plants.length === 1 && result.data.value.plants[0]) {
    await router.push({ path: `/plants/${result.data.value.plants[0].id}` });
  } else {
    search.value = code;
  }
}

const {
  exportDataAndWriteNewXLSX: onExport,
  isExporting,
  exportProgress,
} = useExport<
  ResultOf<typeof query>['plants'][0],
  typeof query,
  typeof variables.value
>({
  entityName: 'plants',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('plants.title', 2),
  subsetLabel: computed(
    () => tabs.value.find((t) => t.value === subset.value)?.label,
  ),
});
</script>
