<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('attributes.title', 2)"
      :tabs="tabs"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="attributes"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/attributes"
      add-entity-path="/attributes/new"
      :view-entity-path-getter="(id) => `/attributes/${id}`"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    >
      <template #body-cell-default_value="cellProps">
        <q-td :props="cellProps">
          <AttributionValueChip
            v-if="cellProps.value !== ''"
            default
            max-width="clamp(300px, 30svw, 600px)"
            class="vertical-middle"
          >
            {{ cellProps.value }}
          </AttributionValueChip>
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch, type UnwrapRef } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import {
  AttributeFragment,
  attributeFragment,
} from 'src/components/Attribute/attributeFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import {
  dataTypeToLabel,
  attributeTypeToLabel,
  dataTypeToColumnTypes,
  formatResultColumnValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import AttributionValueChip from 'src/components/Attribution/AttributionValueChip.vue';
import { useExport } from 'src/composables/useExport';

const { t } = useI18n();

const query = graphql(
  `
    query Attributes(
      $limit: Int!
      $offset: Int!
      $orderBy: [attributes_order_by!]
      $where: attributes_bool_exp
    ) {
      attributes_aggregate(where: $where) {
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
  subset,
});

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
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  {
    name: 'attribute_type',
    label: t('attributes.columns.attributeType'),
    align: 'left' as const,
    field: (row: AttributeFragment) =>
      attributeTypeToLabel(row.attribute_type, t),
    sortable: true,
  },
  ...useTimestampColumns(),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'attributes',
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
  attributesCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

const {
  exportDataAndWriteNewXLSX: onExport,
  isExporting,
  exportProgress,
} = useExport({
  entityName: 'attributes',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('attributes.title', 2),
  subsetLabel: computed(
    () => tabs.find((t) => t.value === subset.value)?.label,
  ),
});
</script>
