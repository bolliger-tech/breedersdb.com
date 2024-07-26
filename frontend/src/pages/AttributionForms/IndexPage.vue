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
    >
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

      <template #body-cell-fields="cellProps">
        <q-td :props="cellProps" style="max-width: clamp(300px, 30svw, 600px)">
          <q-chip
            v-for="field in cellProps.value"
            :key="field.priority"
            color="grey-7"
            size="sm"
          >
            <div class="ellipsis">{{ field.attribute.name }}</div>
          </q-chip>
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
import { computed, UnwrapRef, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query AttributionForms(
      $limit: Int!
      $offset: Int!
      $orderBy: [attribution_forms_order_by!]
      $where: attribution_forms_bool_exp
    ) {
      attribution_forms_aggregate {
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
  // TODO: check foreign keys
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
  },
  {
    name: 'fields',
    label: t('attributionForms.columns.fields'),
    align: 'left' as const,
    field: 'attribution_form_fields',
    sortable: false,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: AttributionFormFragment) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: AttributionFormFragment) => d(row.created, 'ymdHis'),
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
  attributionFormsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
