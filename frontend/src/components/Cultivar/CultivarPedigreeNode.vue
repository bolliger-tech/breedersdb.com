<template>
  <div class="pedigree-node" :style="{ height: `${layout.height}px` }">
    <div v-if="node.parent" class="pedigree-node__elbow">
      <div
        :class="`pedigree-node__elbow-${node.parent}`"
        :style="
          node.parent === 'mother'
            ? { top: `${stemTop}px` }
            : { height: `${stemTop}px` }
        "
      />
    </div>

    <div :style="{ paddingTop: `${layout.center - PEDIGREE_SLOT / 2}px` }">
      <div
        v-if="node.parent && node.cultivarId === null"
        class="pedigree-node__card pedigree-node__card--unknown text-muted"
      >
        <span>{{ marker }}</span>
        <span>{{ t('cultivars.pedigree.unknown') }}</span>
      </div>
      <div v-else class="pedigree-node__card">
        <template v-if="node.parent">
          <span class="text-muted">{{ marker }}</span>
          <RouterLink
            :to="{ path: `/cultivars/${node.cultivarId}`, query: $route.query }"
            :title="node.name"
            class="undecorated-link pedigree-node__name"
            @click="emit('navigate')"
          >
            {{ node.name }}
          </RouterLink>
        </template>
        <span v-else :title="node.name" class="pedigree-node__name">
          {{ node.name }}
        </span>
      </div>
    </div>

    <template v-if="node.parents && layout.parents">
      <div class="pedigree-node__stem" :style="{ marginTop: `${stemTop}px` }" />
      <div class="column no-wrap">
        <CultivarPedigreeNode
          v-for="(parent, index) in node.parents"
          :key="parent.key"
          :node="parent"
          :layout="layout.parents[index]!"
          :loading-keys="loadingKeys"
          @load="(ancestor) => emit('load', ancestor)"
          @navigate="emit('navigate')"
        />
      </div>
    </template>
    <div
      v-else-if="node.expandable"
      class="pedigree-node__more row items-center no-wrap"
    >
      <div class="pedigree-node__stub" />
      <q-spinner v-if="loadingKeys.has(node.key)" color="primary" size="24px" />
      <q-btn
        v-else
        flat
        dense
        color="primary"
        icon-right="chevron_right"
        :label="t('cultivars.pedigree.parents')"
        :aria-label="t('cultivars.pedigree.showParents', { name: node.name })"
        @click="emit('load', node)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import {
  PEDIGREE_SLOT,
  type PedigreeLayout,
  type PedigreeTree,
} from './pedigree';

const props = defineProps<{
  node: PedigreeTree;
  layout: PedigreeLayout;
  loadingKeys: ReadonlySet<string>;
}>();

const emit = defineEmits<{
  load: [node: PedigreeTree];
  navigate: [];
}>();

const { t } = useI18n();

const marker = computed(() => (props.node.parent === 'mother' ? '♀' : '♂'));
// Centers the 1px connector lines on the card.
const stemTop = computed(() => props.layout.center - 0.5);
</script>

<style lang="scss" scoped>
$line: 1px solid $separator-color;

.pedigree-node {
  display: flex;
  align-items: flex-start;
  width: max-content;
}

// All lines of the chart.
.pedigree-node__card,
.pedigree-node__stem,
.pedigree-node__elbow > div,
.pedigree-node__stub {
  .body--dark & {
    border-color: $separator-dark-color;
  }
}

.pedigree-node__card {
  width: 144px;
  height: 36px;
  margin: 4px 0;
  box-sizing: border-box;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  white-space: nowrap;
  border: $line;
  border-radius: 4px;

  &--unknown {
    border-style: dashed;
    background-color: var(--q-bg-muted);

    // bg-muted has no dark value
    .body--dark & {
      background-color: transparent;
    }
  }
}

.pedigree-node__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pedigree-node__stem {
  width: 12px;
  border-top: $line;
}

.pedigree-node__elbow {
  position: relative;
  align-self: stretch;
  width: 16px;
  flex: none;

  > div {
    position: absolute;
    left: 0;
    right: 0;
    border-left: $line;
  }
}

.pedigree-node__elbow-mother {
  bottom: 0;
  border-top: $line;
}

.pedigree-node__elbow-father {
  top: 0;
  border-bottom: $line;
}

.pedigree-node__more {
  height: 44px; // PEDIGREE_SLOT
}

.pedigree-node__stub {
  width: 12px;
  border-top: 1px dashed $separator-color;
}
</style>
