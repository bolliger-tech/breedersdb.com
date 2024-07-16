<template>
  <PageLayout>
    <BaseGraphqlError v-if="error" :error="error" />
    <QueryContainer
      v-else
      v-model:name="name"
      v-model:note="note"
      :initial-base-filter="getBaseFilter()"
      :initial-attribution-filter="getAttributionFilter()"
      :base-table="BaseTable.Cultivars"
      :saving="saving"
      :save-error="saveError"
      @save="save"
      @base-filter-changed="(filter) => (baseFilter = filter)"
      @attribution-filter-changed="(filter) => (attributionFilter = filter)"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import QueryContainer from 'src/components/Query/QueryContainer.vue';
import { graphql } from 'src/graphql';
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { analyzeFiltersFragment } from 'src/components/Query/analyzeFiltersFragment';
import { useQuasar } from 'quasar';
import { BaseTable } from 'src/components/Query/Filter/filterNode';

const BASE_FILTER_LOCAL_STORAGE_KEY = 'breedersdb-base-filter--cultivars';
const ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY =
  'breedersdb-attribution-filter--cultivars';

export interface AnalyzeViewPageProps {
  queryId: 'new' | number;
}

const props = defineProps<AnalyzeViewPageProps>();

const $q = useQuasar();

const query = graphql(
  `
    query Query($id: Int!) {
      analyze_filters_by_pk(id: $id) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const variables = computed(() => ({ id: parseInt(props.queryId.toString()) }));

const { data, error } = await useQuery({
  query,
  variables,
  pause: props.queryId === 'new',
});

const name = ref<string>(data.value?.analyze_filters_by_pk?.name || '');
const note = ref<string | null>(
  data.value?.analyze_filters_by_pk?.note || null,
);

const baseFilter = ref<string | undefined>(undefined);
const attributionFilter = ref<string | undefined>(undefined);
watch(baseFilter, (filter) => {
  if (filter) {
    $q.localStorage.set(BASE_FILTER_LOCAL_STORAGE_KEY, filter);
  } else {
    $q.localStorage.remove(BASE_FILTER_LOCAL_STORAGE_KEY);
  }
});
watch(attributionFilter, (filter) => {
  if (filter) {
    $q.localStorage.set(ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY, filter);
  } else {
    $q.localStorage.remove(ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY);
  }
});

function getBaseFilter() {
  const filter =
    props.queryId === 'new'
      ? $q.localStorage.getItem(BASE_FILTER_LOCAL_STORAGE_KEY)
      : data.value?.analyze_filters_by_pk?.base_filter;

  if (!filter) {
    return undefined;
  }

  return typeof filter !== 'string' ? JSON.stringify(filter) : filter;
}
function getAttributionFilter() {
  const filter =
    props.queryId === 'new'
      ? $q.localStorage.getItem(ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY)
      : data.value?.analyze_filters_by_pk?.attribution_filter;

  if (!filter) {
    return undefined;
  }

  return typeof filter !== 'string' ? JSON.stringify(filter) : filter;
}

const editMutation = graphql(
  `
    mutation EditQuery(
      $id: Int!
      $name: String!
      $note: String
      $baseFilter: jsonb
      $attributionFilter: jsonb
    ) {
      update_analyze_filters_by_pk(
        pk_columns: { id: $id }
        _set: {
          name: $name
          note: $note
          base_table: "CULTIVARS"
          base_filter: $baseFilter
          attribution_filter: $attributionFilter
        }
      ) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const insertMutation = graphql(
  `
    mutation InsertQuery(
      $name: String!
      $note: String
      $baseFilter: jsonb
      $attributionFilter: jsonb
    ) {
      insert_analyze_filters_one(
        object: {
          name: $name
          note: $note
          base_table: "CULTIVARS"
          base_filter: $baseFilter
          attribution_filter: $attributionFilter
        }
      ) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

async function save() {
  const variables = {
    name: name.value,
    note: note.value,
    baseFilter: parseFilter(baseFilter.value),
    attributionFilter: parseFilter(attributionFilter.value),
  };

  if (props.queryId === 'new') {
    await executeInsertMutation(variables);
  } else {
    await executeEditMutation({
      id: parseInt(props.queryId.toString()),
      ...variables,
    });
  }
}

function parseFilter(filter: string | undefined) {
  try {
    return filter ? JSON.parse(filter) : null;
  } catch (e) {
    console.error('Failed to parse filter', e);
    return null;
  }
}

const saving = computed(() => savingInsert.value || savingEdit.value);
const saveError = computed(() => saveInsertError.value || saveEditError.value);
</script>
