<template>
  <q-toggle
    v-model="store.explain"
    :label="t('analyze.filter.showExplanation')"
  />
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('analyze.filter.baseFilter', { entityName }) }}
  </p>
  <QueryFilterRootNode
    :filter="baseFilter"
    :columns="baseFilterColumns"
    :fetching="fetching"
  />

  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('analyze.filter.attributionFilter') }}
  </p>
  <QueryFilterRootNode
    :filter="attributionFilter"
    :columns="attributionFilterColumns"
    :fetching="fetching"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './QueryFilterRootNode.vue';
import { computed } from 'vue';
import { useQueryStore } from '../useQueryStore';
import { useEntityName } from 'src/composables/useEntityName';
import { watch } from 'vue';
import { BaseTable, FilterConjunction, FilterNode } from './filterNode';
import { useQuasar } from 'quasar';
import { FilterRuleColumn } from './filterRuleColumn';

export interface QueryFilterProps {
  baseTable: BaseTable;
  baseFilterColumns: FilterRuleColumn[];
  attributionFilterColumns: FilterRuleColumn[];
  fetching: boolean;
}

const { t } = useI18n();
const store = useQueryStore();
const $q = useQuasar();

const props = defineProps<QueryFilterProps>();
const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: props.baseTable, plural: true }),
);

watch(() => props.baseFilterColumns, initBaseFilter);

function initBaseFilter() {
  const json = $q.localStorage.getItem<string>(
    `breedersdb-base-filter--${props.baseTable}`,
  );
  if (json) {
    store.baseFilter = FilterNode.FromJSON(json, null, props.baseFilterColumns);
  } else {
    store.baseFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: props.baseTable,
    });
  }
}

const baseFilter = computed(() => store.baseFilter as FilterNode | undefined);

watch(
  baseFilter,
  (filter) => {
    if (filter)
      $q.localStorage.set(
        `breedersdb-base-filter--${props.baseTable}`,
        filter.toJSON(),
      );
  },
  { deep: true },
);

watch(() => props.attributionFilterColumns, initAttributionFilter);

function initAttributionFilter() {
  const json = $q.localStorage.getItem<string>(
    `breedersdb-attribution-filter--${props.baseTable}`,
  );
  if (json) {
    store.attributionFilter = FilterNode.FromJSON(
      json,
      null,
      props.attributionFilterColumns,
    );
  } else {
    store.attributionFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    });
  }
}

const attributionFilter = computed(() => store.attributionFilter as FilterNode);

watch(
  attributionFilter,
  (filter) => {
    if (filter)
      $q.localStorage.set(
        `breedersdb-attribution-filter--${props.baseTable}`,
        filter.toJSON(),
      );
  },
  { deep: true },
);
</script>
