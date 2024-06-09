<template>
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
        t('filter.noFilter', {
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
      {{ t('filter.simplifiable') }}&nbsp;&nbsp;
      <q-btn
        size="sm"
        color="negative"
        dense
        class="q-px-md"
        unelevated
        @click="simplify()"
      >
        {{ t('filter.simplify') }}
      </q-btn>
    </div>
    <div v-else-if="!isValid" class="text-negative q-mb-sm">
      <q-icon name="warning" />
      {{ t('filter.invalid') }}
    </div>
    <div v-else class="text-positive q-mb-sm">
      <q-icon name="check" />
      {{ t('filter.valid') }}
    </div>

    <QueryFilterNode
      :node="filter"
      :conjunction="filter.getChildrensConjunction() || FilterConjunction.And"
      :columns="columns"
    />
  </template>
</template>

<script lang="ts" setup>
import QueryFilterRuleAddButton from './QueryFilterRuleAddButton.vue';
import QueryFilterNode from './QueryFilterNode.vue';
import { computed } from 'vue';
import { FilterNode, FilterConjunction, BaseTable } from './filterNode';
import { useI18n } from 'src/composables/useI18n';
import { useQueryStore } from '../useQueryStore';
import { FilterRuleColumn } from './filterRuleColumn';
import { useEntityName } from 'src/composables/useEntityName';

const { t } = useI18n();
const store = useQueryStore();

export interface QueryFilterRootNodeProps {
  filter?: FilterNode;
  columns: FilterRuleColumn[];
  fetching: boolean;
}

const props = defineProps<QueryFilterRootNodeProps>();

const isSimplifiable = computed(() => props.filter?.isSimplifiable());
const isEmpty = computed(() => !props.filter?.hasChildren());
const isValid = computed(() => props.filter?.isValid());
const isAttributionsFilter = computed(
  () => props.filter?.getBaseTable() === BaseTable.Attributions,
);

const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: store.baseTable, plural: true }),
);

function simplify() {
  let maxIterations = 10;
  while (isSimplifiable.value && maxIterations--) {
    props.filter?.simplify();
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
  background: $grey-3;
  width: 100%;
  min-height: 48px;
  border-left: solid 3px var(--q-primary);
  display: flex;
  align-items: center;
  padding: 4px 12px;
}

.body--dark {
  .query-filter-root-node__filter-placeholder {
    background: $grey-9;
  }
}
</style>
