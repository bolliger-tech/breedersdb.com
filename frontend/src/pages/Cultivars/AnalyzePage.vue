<template>
  <PageLayout :title="t('cultivars.analyze.title')">
    <QueryFilter />
    <details>
      <summary><h3>Base Filter</h3></summary>
      <pre style="font-size: 12px">{{
        JSON.stringify(store.baseFilter, undefined, 2)
      }}</pre>
    </details>
    <details open>
      <summary><h3>Query</h3></summary>
      <pre style="font-size: 12px" data-test="query">{{ query }}</pre>
      <pre style="font-size: 12px" data-test="variables">{{ variables }}</pre>
    </details>

    <details open>
      <summary><h3>Results</h3></summary>
      <p>Count: {{ data?.cultivars.length || 0 }}</p>
      <pre style="font-size: 12px">{{ fetching || error || data }}</pre>
    </details>
  </PageLayout>
</template>

<script setup lang="ts">
import QueryFilter from 'src/components/query/Filter/QueryFilter.vue';
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryStore } from 'src/components/query/Filter/queryStore';
import { computed } from 'vue';
import { filterToQuery } from 'src/components/query/Result/filterToQuery';
import { FilterNode } from 'src/components/query/Filter/filterNode';
import { useQuery } from '@urql/vue';

const { t } = useI18n();
const store = useQueryStore();

const queryData = computed(() => {
  const { query, variables } = filterToQuery({
    filter: store.baseFilter as FilterNode,
    baseTable: store.baseTable,
  });
  return { query: query, variables: variables };
});

const query = computed(() => queryData.value.query);
const variables = computed(() => queryData.value.variables);

const { data, fetching, error } = await useQuery({
  query,
  variables,
});
</script>
