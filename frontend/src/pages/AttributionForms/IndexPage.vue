<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('attributionForms.title', 2)"
      :tabs="tabs"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.attribution_forms || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/attribution-forms"
      add-entity-path="/attribution-forms/new"
      :view-entity-path-getter="(id) => `/attribution-forms/${id}`"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    >
      <template #body-cell-fields="cellProps">
        <q-td :props="cellProps">
          <AttributionValueChip
            v-for="field in cellProps.value"
            :key="field.priority"
            default
            max-width="clamp(300px, 30svw, 600px)"
            class="vertical-middle"
          >
            {{ field.attribute.name }}
          </AttributionValueChip>
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { graphql, ResultOf } from 'src/graphql';
import { computed, UnwrapRef, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { attributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import AttributionValueChip from 'src/components/Attribution/AttributionValueChip.vue';
import { TransformDataArgs, useExport } from 'src/composables/useExport';

const { t } = useI18n();

const query = graphql(
  `
    query AttributionForms(
      $limit: Int!
      $offset: Int!
      $orderBy: [attribution_forms_order_by!]
      $where: attribution_forms_bool_exp
    ) {
      attribution_forms_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      attribution_forms(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...attributionFormFragment
      }
    }
  `,
  [attributionFormFragment],
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
  context: { additionalTypenames: ['attribution_forms'] },
});

const attributionFormsCount = computed(
  () => data.value?.attribution_forms_aggregate?.aggregate?.count || 0,
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
    name: 'description',
    label: t('attributionForms.columns.description'),
    align: 'left' as const,
    field: 'description',
    sortable: true,
    maxWidth: 'clamp(300px, 40svw, 600px)',
    ellipsis: true,
  },
  {
    name: 'fields',
    label: t('attributionForms.columns.fields'),
    align: 'left' as const,
    field: 'attribution_form_fields',
    sortable: false,
  },
  ...useTimestampColumns(),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'attributionForms',
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
  attributionFormsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

function transformData({
  data,
  visibleColumns,
}: TransformDataArgs<ResultOf<typeof query>['attribution_forms'][0]>) {
  return {
    visibleColumns,
    data: data.map((row) => {
      return {
        ...row,
        attribution_form_fields: row.attribution_form_fields
          .map((field) => {
            return field.attribute.name;
          })
          .join(', '),
      };
    }),
  };
}

const {
  exportDataAndWriteNewXLSX: onExport,
  isExporting,
  exportProgress,
} = useExport({
  entityName: 'attribution_forms',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('attributionForms.title', 2),
  subsetLabel: computed(
    () => tabs.find((t) => t.value === subset.value)?.label,
  ),
  transformDataFn: transformData,
});
</script>
