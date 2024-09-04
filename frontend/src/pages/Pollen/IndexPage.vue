<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('pollen.title', 2)"
      :search-placeholder="t('pollen.searchPlaceholder')"
      :rows="data?.pollen || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/pollen"
      add-entity-path="/pollen/new"
      :view-entity-path-getter="(id) => `/pollen/${id}`"
    />
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';

const { t, d } = useI18n();

const query = graphql(
  `
    query Pollen(
      $limit: Int!
      $offset: Int!
      $orderBy: [pollen_order_by!]
      $where: pollen_bool_exp
      $PollenWithCultivar: Boolean = true
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      pollen_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      pollen(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...pollenFragment
      }
    }
  `,
  [pollenFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  searchColumns: ['name', 'cultivar.display_name'],
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['pollen'] },
});

const pollenCount = computed(
  () => data.value?.pollen_aggregate?.aggregate?.count || 0,
);

type Pollen = ResultOf<typeof query>['pollen'][0];

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'cultivar.display_name',
    label: t('pollen.fields.cultivarName'),
    align: 'left' as const,
    field: (row: Pollen) => row.cultivar?.display_name,
    sortable: true,
  },
  {
    name: 'date_harvested',
    label: t('pollen.fields.dateHarvested'),
    align: 'left' as const,
    field: 'date_harvested',
    format: (v: Pollen['date_harvested']) => (v ? d(v, 'Ymd') : ''),
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
  entityType: 'pollen',
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
  pollenCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
