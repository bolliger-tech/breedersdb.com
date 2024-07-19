<template>
  <div v-if="deserializationError">
    <div class="row align-center text-negative">
      <q-icon name="warning" class="col-auto q-mr-xs" />
      <div class="col">
        {{ deserializationError }}
      </div>
    </div>
  </div>

  <div
    v-if="fetching || !filter"
    class="query-filter-root-node__filter-placeholder"
  >
    <q-spinner color="primary" />&nbsp;{{ t('base.loading') }}
  </div>

  <div v-else-if="isEmpty">
    <div
      class="query-filter-root-node__filter-placeholder"
      data-test="query-filter-root-node__filter-placeholder"
    >
      {{
        t('analyze.filter.noFilter', {
          entity: isAttributionsFilter
            ? t('base.entityName.attribution', 2)
            : entityName,
        })
      }}
    </div>
    <QueryFilterRuleAddButton
      :node="filter"
      :conjunction="FilterConjunction.And"
    />
  </div>

  <template v-else>
    <div v-if="isSimplifiable" class="text-negative q-mb-sm">
      <q-icon name="warning" />
      {{ t('analyze.filter.simplifiable') }}&nbsp;&nbsp;
      <q-btn
        size="sm"
        color="negative"
        dense
        class="q-px-md"
        unelevated
        @click="simplify()"
      >
        {{ t('analyze.filter.simplify') }}
      </q-btn>
    </div>
    <div v-else-if="!isValid" class="text-negative q-mb-sm">
      <q-icon name="warning" />
      {{ t('analyze.filter.invalid') }}
    </div>
    <div v-else class="text-positive q-mb-sm">
      <q-icon name="check" />
      {{ t('analyze.filter.valid') }}
    </div>

    <QueryFilterNode
      :node="filter"
      :conjunction="filter.getChildrensConjunction() || FilterConjunction.And"
      :columns="columns"
    />
  </template>
</template>

<script lang="ts" setup>
import QueryFilterRuleAddButton from './AnalyzeFilterRuleAddButton.vue';
import QueryFilterNode from './AnalyzeFilterNode.vue';
import { computed, Ref, ref, watch } from 'vue';
import { FilterNode, FilterConjunction, BaseTable } from './filterNode';
import { useI18n } from 'src/composables/useI18n';
import { FilterRuleColumn } from './filterRuleColumn';
import { useEntityName } from 'src/composables/useEntityName';

const { t } = useI18n();

export interface QueryFilterRootNodeProps {
  baseTable: BaseTable;
  columns: FilterRuleColumn[];
  fetching: boolean;
  serializedFilter: string | undefined;
}

const props = defineProps<QueryFilterRootNodeProps>();

const emit = defineEmits<{
  changed: [filter: FilterNode | undefined];
}>();

const filter: Ref<FilterNode | undefined> = ref(undefined);
watch(filter, (value) => emit('changed', value), { deep: true });

const deserializationError = ref<string | null>(null);

watch(
  [() => props.serializedFilter, () => props.columns],
  ([value, columns]) => {
    if (!columns) return;
    if (value) {
      try {
        filter.value = FilterNode.FromJSON(value, null, props.columns);
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          deserializationError.value = e.message;
        } else {
          throw e;
        }
      }
    }
    if (!filter.value) {
      filter.value = FilterNode.FilterRoot({
        childrensConjunction: FilterConjunction.And,
        baseTable: props.baseTable,
      });
    }
  },
  { immediate: true },
);

const isSimplifiable = computed(() => filter.value?.isSimplifiable());
const isEmpty = computed(() => !filter.value?.hasChildren());
const isValid = computed(() => filter.value?.isValid());
const isAttributionsFilter = computed(
  () => filter.value?.getBaseTable() === BaseTable.Attributions,
);

const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: props.baseTable, plural: true }),
);

function simplify() {
  let maxIterations = 10;
  while (isSimplifiable.value && maxIterations--) {
    filter.value?.simplify();
  }
}
</script>

<style scoped lang="scss">
.query-filter-root-node__simplify {
  color: $negative;
  background: none;
  padding: 0;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.query-filter-root-node__simplify:hover,
.query-filter-root-node__simplify:focus {
  filter: brightness(125%);
  text-decoration: none;
}

.query-filter-root-node__filter-placeholder {
  background: var(--q-shade);
  width: 100%;
  min-height: 48px;
  border-left: solid 3px var(--q-primary);
  display: flex;
  align-items: center;
  padding: 4px 12px;
}
</style>
