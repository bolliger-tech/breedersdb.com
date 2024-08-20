<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('plantGroups.title', 2)"
      :tabs="tabs"
      :search-placeholder="t('plantGroups.searchPlaceholderName')"
      :rows="data?.plant_groups || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/groups"
      add-entity-path="/groups/new"
      :view-entity-path-getter="(id) => `/groups/${id}`"
      :has-qr-scanner="true"
      @scanned-qr="onScannedQr"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { UnwrapRef, computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import { useRouter } from 'vue-router';

const { t, d } = useI18n();

const query = graphql(
  `
    query PlantGroups(
      $limit: Int!
      $offset: Int!
      $orderBy: [plant_groups_order_by!]
      $where: plant_groups_bool_exp
      $PlantGroupWithCultivar: Boolean! = false
      $CultivarWithLot: Boolean! = false
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      plant_groups_aggregate {
        aggregate {
          count
        }
      }
      plant_groups(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);

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

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'display_name',
  searchColumns: ['display_name', 'label_id'],
  subset,
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['plant_groups'] },
});

const plantGroupsCount = computed(
  () => data.value?.plant_groups_aggregate?.aggregate?.count || 0,
);

type PlantGroup = ResultOf<typeof query>['plant_groups'][0];

const { localizedSortPredicate } = useLocalizedSort();

const columns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'display_name',
    sortable: true,
    sort: (a: PlantGroup['display_name'], b: PlantGroup['display_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'label_id',
    label: t('plantGroups.fields.labelId'),
    align: 'left' as const,
    field: 'label_id',
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: PlantGroup) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: PlantGroup) => d(row.created, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 4),
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
  plantGroupsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

const router = useRouter();

const queryPlantGroupIdByLabelId = graphql(`
  query PlantGroupIdByLabelId($labelId: String!) {
    plant_groups(where: { label_id: { _eq: $labelId } }) {
      id
    }
  }
`);
const queryPlantGroupIdByPlantLabelId = graphql(`
  query PlantGroupIdByPlantLabelId($labelId: String!) {
    plants(where: { label_id: { _eq: $labelId } }) {
      id
      plant_group_id
    }
  }
`);
const scannedLabelId = ref({ labelId: '' });
const queryPlantGroupId = computed(() =>
  scannedLabelId.value.labelId.startsWith('G')
    ? queryPlantGroupIdByLabelId
    : queryPlantGroupIdByPlantLabelId,
);

const { executeQuery } = await useQuery({
  query: queryPlantGroupId,
  variables: scannedLabelId,
  pause: true,
});

async function onScannedQr(code: string) {
  scannedLabelId.value.labelId = code;
  await nextTick();
  const { data } = await executeQuery();
  const id =
    data.value?.plant_groups?.[0]?.id ||
    (data.value as unknown as ResultOf<typeof queryPlantGroupIdByPlantLabelId>)
      ?.plants?.[0]?.plant_group_id;

  if (id) {
    router.push({ path: `/groups/${id}` });
  } else {
    search.value = code;
  }
}
</script>
