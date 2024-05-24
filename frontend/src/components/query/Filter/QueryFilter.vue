<template>
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('cultivars.analyze.filter.cultivarFilter') }}
  </p>
  <q-toggle v-model="store.explain" :label="t('filter.showExplanation')" />
  <QueryFilterRootNode
    :filter="baseFilterDefault"
    :options="baseFilterOptions"
  />
  <!-- <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.attributionFilter') }}
  </p>
  <QueryFilterRootNode
    :filter="attributionFilterDefault"
    :options="attributionOptions"
  /> -->
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './QueryFilterRootNode.vue';
import { useAttributionFilterOptions } from './useAttributionFilterOptions';
import { computed, ref, watch } from 'vue';
import { useQueryStore } from '../useQueryStore';
import { getBaseFilterOptions } from './baseFilterOptions';

const { t } = useI18n();

const store = useQueryStore();

const baseFilterDefault = computed(() => store.getBaseFilter);

const { fetchOptions: fetchAttributionFilterOptions } =
  useAttributionFilterOptions({ tableLabel: t('filter.attribute') });

const { data: attributionFilterOptions, error } =
  await fetchAttributionFilterOptions();

const baseFilterOptions = ref([
  ...getBaseFilterOptions({ baseTable: store.baseTable, t }),
  ...attributionFilterOptions,
]);

watch(error, (error) => {
  if (error) {
    throw error;
  }
});
</script>
