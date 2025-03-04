<template>
  <p class="text-weight-bold q-mb-xs q-mt-lg">
    {{ title }}
  </p>

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
    class="analyze-filter-root-node__filter-placeholder"
  >
    <q-spinner color="primary" />&nbsp;{{ t('base.loading') }}
  </div>

  <div v-else-if="isEmpty">
    <div
      class="analyze-filter-root-node__filter-placeholder"
      data-test="analyze-filter-root-node__filter-placeholder"
    >
      {{
        t('analyze.filter.noFilter', {
          entity: isAttributionsFilter
            ? t('base.entityName.attribution', 2)
            : entityName,
        })
      }}
    </div>
    <AnalyzeFilterRuleAddButton
      :node="filter"
      :conjunction="FilterConjunction.And"
    />
  </div>

  <template v-else>
    <AnalyzeFilterNode
      :node="filter"
      :conjunction="filter.getChildrensConjunction() || FilterConjunction.And"
      :columns="columns"
    />
    <div style="margin: -26px 0 0 36px">
      <BaseMessage
        v-if="!isValid"
        type="error"
        :message="t('analyze.filter.invalid')"
        message-color="negative"
        class="q-mb-sm"
      />
      <BaseMessage
        v-else-if="isSimplifiable"
        type="warning"
        class="q-mb-sm text-warning"
      >
        {{ t('analyze.filter.simplifiable') }}&nbsp;&nbsp;
        <q-btn
          size="sm"
          color="warning"
          dense
          class="q-px-md"
          unelevated
          @click="simplify()"
        >
          {{ t('analyze.filter.simplify') }}
        </q-btn>
      </BaseMessage>
      <BaseMessage
        v-else
        type="success"
        :message="t('analyze.filter.valid')"
        message-color="positive"
        class="q-mb-sm"
      />
    </div>
  </template>
</template>

<script lang="ts" setup>
import AnalyzeFilterRuleAddButton from './AnalyzeFilterRuleAddButton.vue';
import AnalyzeFilterNode from './AnalyzeFilterNode.vue';
import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';
import { FilterNode, FilterConjunction, BaseTable } from './filterNode';
import { useI18n } from 'src/composables/useI18n';
import type { FilterRuleColumn } from './filterRuleColumn';
import { useEntityName } from 'src/composables/useEntityName';
import { useFilterDragNode } from './useFilterDragNode';
import BaseMessage from 'src/components/Base/BaseMessage.vue';

const { t } = useI18n();

export interface AnalyzeFilterRootNodeProps {
  title: string;
  baseTable: BaseTable;
  columns: FilterRuleColumn[];
  fetching: boolean;
  serializedFilter: string | undefined;
}

const props = defineProps<AnalyzeFilterRootNodeProps>();

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

const { provide: provideDragObj } = useFilterDragNode();
provideDragObj();
</script>

<style scoped lang="scss">
.analyze-filter-root-node__simplify {
  color: $negative;
  background: none;
  padding: 0;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.analyze-filter-root-node__simplify:hover,
.analyze-filter-root-node__simplify:focus {
  filter: brightness(125%);
  text-decoration: none;
}

.analyze-filter-root-node__filter-placeholder {
  background: var(--q-shade);
  width: 100%;
  min-height: 48px;
  border-left: solid 3px var(--q-primary);
  display: flex;
  align-items: center;
  padding: 4px 12px;
}
</style>
