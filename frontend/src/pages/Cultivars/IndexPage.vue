<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('cultivars.title', 2)"
      :tabs="tabs"
      :search-placeholder="searchPlaceholder"
      :rows="data?.cultivars || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/cultivars"
      add-entity-path="/cultivars/new"
      :view-entity-path-getter="(id) => `/cultivars/${id}`"
      :has-qr-scanner="true"
      @scanned-qr="onScannedQr"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch, ref, nextTick, UnwrapRef } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useRouter } from 'vue-router';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';

const { t, d } = useI18n();

const query = graphql(
  `
    query Cultivars(
      $limit: Int!
      $offset: Int!
      $orderBy: [cultivars_order_by!]
      $where: cultivars_bool_exp
      $CultivarWithLot: Boolean = true
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      cultivars_aggregate {
        aggregate {
          count
        }
      }
      cultivars(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);

const { queryArg: subset } = useQueryArg<
  'breeders_cultivars' | 'varieties' | 'all'
>({
  key: 'tab',
  defaultValue: 'breeders_cultivars',
  replace: true,
});
const tabs: { value: UnwrapRef<typeof subset>; label: string }[] = [
  {
    value: 'breeders_cultivars',
    label: uppercaseFirstLetter(t('cultivars.breedersCultivar', 2)),
  },
  {
    value: 'varieties',
    label: uppercaseFirstLetter(t('cultivars.variety', 2)),
  },
  { value: 'all', label: t('entity.tabs.all') },
];

const searchPlaceholder = computed(() => {
  if (subset.value === 'breeders_cultivars') {
    return t('cultivars.searchPlaceholder.subset', {
      subset: t('cultivars.breedersCultivar', 2),
    });
  } else if (subset.value === 'varieties') {
    return t('cultivars.searchPlaceholder.subset', {
      subset: t('cultivars.variety', 2),
    });
  }
  return t('cultivars.searchPlaceholder.all');
});

const {
  search,
  pagination,
  variables: _variables,
} = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'display_name',
  searchColumns: ['display_name', 'acronym'],
});

const variables = computed(() => {
  const where = { _and: [_variables.value.where] };
  if (subset.value === 'breeders_cultivars') {
    where._and.push({ is_variety: { _eq: false } });
  } else if (subset.value === 'varieties') {
    where._and.push({ is_variety: { _eq: true } });
  }

  return {
    ..._variables.value,
    where,
  };
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['cultivars'] },
});

const cultivarsCount = computed(
  () => data.value?.cultivars_aggregate?.aggregate?.count || 0,
);

type Cultivar = ResultOf<typeof query>['cultivars'][0];

const columns = computed(() => [
  {
    name: 'display_name',
    label: t('entity.commonColumns.displayName'),
    align: 'left' as const,
    field: 'display_name',
    sortable: true,
  },
  {
    name: 'acronym',
    label: t('cultivars.fields.acronym'),
    align: 'left' as const,
    field: 'acronym',
    sortable: true,
  },
  ...(subset.value === 'breeders_cultivars'
    ? []
    : [
        {
          name: 'breeder',
          label: t('cultivars.fields.breeder'),
          align: 'left' as const,
          field: 'breeder',
          sortable: true,
        },
        {
          name: 'registration',
          label: t('cultivars.fields.registration'),
          align: 'left' as const,
          field: 'registration',
          sortable: true,
        },
      ]),
  ...(subset.value === 'varieties'
    ? []
    : [
        {
          name: 'lot',
          label: t('cultivars.fields.lot'),
          align: 'left' as const,
          field: (row: Cultivar) =>
            row.is_variety ? '' : row.lot?.display_name,
          sortable: true,
        },
      ]),
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Cultivar) => (row.modified ? d(row.modified, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Cultivar) => d(row.created, 'ymdHis'),
    sortable: true,
  },
]);

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.value.map((column) => column.name).slice(0, 6),
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
  cultivarsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

const router = useRouter();

const queryCultivarIdByPlantGroupLabelId = graphql(`
  query CultivarIdByPlantGroupLabelId($labelId: String!) {
    plant_groups(where: { label_id: { _eq: $labelId } }) {
      id
      cultivar_id
    }
  }
`);
const queryCultivarIdByPlantLabelId = graphql(`
  query CultivarIdByPlantLabelId($labelId: String!) {
    plants(where: { label_id: { _eq: $labelId } }) {
      id
      plant_group {
        id
        cultivar_id
      }
    }
  }
`);
const scannedLabelId = ref({ labelId: '' });
const queryCultivarId = computed(() =>
  scannedLabelId.value.labelId.startsWith('G')
    ? queryCultivarIdByPlantGroupLabelId
    : queryCultivarIdByPlantLabelId,
);

const { executeQuery } = await useQuery({
  query: queryCultivarId,
  variables: scannedLabelId,
  pause: true,
});

async function onScannedQr(code: string) {
  scannedLabelId.value.labelId = code;
  await nextTick();
  const { data } = await executeQuery();
  const id =
    data.value?.plant_groups?.[0]?.cultivar_id ||
    (data.value as unknown as ResultOf<typeof queryCultivarIdByPlantLabelId>)
      ?.plants?.[0]?.plant_group.cultivar_id;

  if (id) {
    router.push({ path: `/cultivars/${id}` });
  } else {
    search.value = code;
  }
}
</script>
