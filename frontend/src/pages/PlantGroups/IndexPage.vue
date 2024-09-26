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
      @scanned-qr="onScannedQr"
    >
      <template #body-cell-label_id="cellProps">
        <q-td :props="cellProps">
          <EntityLabelId :label-id="cellProps.value" entity-type="plantGroup" />
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery, UseQueryArgs } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { UnwrapRef, computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useRouter } from 'vue-router';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import { plantGroupLabelIdUtils } from 'src/utils/labelIdUtils';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';

const { t } = useI18n();

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
      plant_groups_aggregate(where: $where) {
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

const {
  search,
  pagination,
  variables: _variables,
} = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'display_name',
  searchColumns: ['display_name', 'label_id'], // ! is where overridden below
  subset,
});

const variables = computed(() => {
  const where: UseQueryArgs<typeof query>['variables'] = { _and: [] };

  if (subset) {
    if (subset.value === 'active') {
      where._and.push({ disabled: { _eq: false } });
    } else if (subset.value === 'disabled') {
      where._and.push({ disabled: { _eq: true } });
    }
  }

  if (search.value) {
    const or: UseQueryArgs<typeof query>['variables'] = { _or: [] };

    or._or.push({
      display_name: { _ilike: `%${search.value.replaceAll('.', '%.%')}%` },
    });

    if (search.value.match(/^G?\d+$/i)) {
      const labelId = plantGroupLabelIdUtils.addPrefix(
        plantGroupLabelIdUtils.zeroFill(search.value.toLocaleUpperCase()),
      );
      or._or.push({
        label_id: {
          _eq: labelId,
        },
      });
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
  context: { additionalTypenames: ['plant_groups'] },
});

const plantGroupsCount = computed(
  () => data.value?.plant_groups_aggregate?.aggregate?.count || 0,
);

const columns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'display_name',
    sortable: true,
  },
  {
    name: 'label_id',
    label: t('plantGroups.fields.labelId'),
    align: 'left' as const,
    field: 'label_id',
    sortable: true,
  },
  {
    name: 'cultivar_name',
    label: t('plantGroups.fields.cultivar'),
    align: 'left' as const,
    field: 'cultivar_name',
    sortable: true,
  },
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
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'plantGroups',
  defaultColumns: columns.map((column) => column.name),
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
  query PlantGroupIdByLabelId($labelId: citext!) {
    plant_groups(where: { label_id: { _eq: $labelId } }) {
      id
    }
  }
`);
const queryPlantGroupIdByPlantLabelId = graphql(`
  query PlantGroupIdByPlantLabelId($labelId: citext!) {
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
