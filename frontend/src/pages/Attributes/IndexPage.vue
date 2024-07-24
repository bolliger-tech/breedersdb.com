<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('attributes.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="attributes"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/attributes"
      add-entity-path="/attributes/new"
      :view-entity-path-getter="(id) => `/attributes/${id}`"
    >
      <template #body-cell-default_value="cellProps">
        <q-td :props="cellProps">
          <q-chip v-if="cellProps.value !== ''" color="grey-7" size="sm">
            {{ cellProps.value }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-description="cellProps">
        <q-td
          :props="cellProps"
          style="
            max-width: clamp(300px, 30svw, 600px);
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          {{ cellProps.value }}
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import {
  AttributeFragment,
  attributeFragment,
} from 'src/components/Attribution/attributeFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import {
  dataTypeToLabel,
  attributeTypeToLabel,
  dataTypeToColumnTypes,
  formatResultColumnValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';

const { t, d } = useI18n();

const query = graphql(
  `
    query Attributes(
      $limit: Int!
      $offset: Int!
      $orderBy: [attributes_order_by!]
      $where: attributes_bool_exp
    ) {
      attributes_aggregate {
        aggregate {
          count
        }
      }
      attributes(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...attributeFragment
      }
    }
  `,
  [attributeFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['attributes'] },
});

const attributesCount = computed(
  () => data.value?.attributes_aggregate?.aggregate?.count || 0,
);

const attributes = computed(
  () => (data.value?.attributes || []) as AttributeFragment[],
);

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'data_type',
    label: t('attributes.columns.dataType'),
    align: 'left' as const,
    field: (row: AttributeFragment) => dataTypeToLabel(row.data_type, t),
    sortable: true,
  },
  {
    name: 'default_value',
    label: t('attributes.columns.defaultValue'),
    align: 'center' as const,
    field: (row: AttributeFragment) => {
      const type = dataTypeToColumnTypes(row.data_type);

      if (type === ColumnTypes.Photo) {
        // photos can't have a default value
        return '';
      }

      const value = row.default_value;
      return formatResultColumnValue({ value, type });
    },
    sortable: true,
  },
  {
    name: 'description',
    label: t('attributes.columns.description'),
    align: 'left' as const,
    field: 'description',
    sortable: true,
  },
  {
    name: 'attribute_type',
    label: t('attributes.columns.attributeType'),
    align: 'left' as const,
    field: (row: AttributeFragment) =>
      attributeTypeToLabel(row.attribute_type, t),
    sortable: true,
  },

  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: AttributeFragment) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: AttributeFragment) => d(row.created, 'ymdHis'),
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
  attributesCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
