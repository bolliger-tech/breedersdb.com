<template>
  <div class="pedigree-node" :style="{ height: `${layout.height}px` }">
    <div v-if="node.parent" class="pedigree-node__elbow">
      <div
        :class="`pedigree-node__elbow-${node.parent}`"
        :style="
          node.parent === 'mother'
            ? { top: `${stemTop}px` }
            : { height: `${stemTop + 1}px` }
        "
      />
    </div>

    <div :style="{ paddingTop: `${layout.center - PEDIGREE_SLOT / 2}px` }">
      <div
        class="pedigree-node__card"
        :class="{
          'pedigree-node__card--unknown text-muted': node.cultivarId === null,
        }"
      >
        <span v-if="node.parent" class="text-muted">
          {{ node.parent === 'mother' ? '♀' : '♂' }}
        </span>
        <span v-if="node.cultivarId === null">
          {{ t('cultivars.pedigree.unknown') }}
        </span>
        <RouterLink
          v-else-if="node.parent"
          :to="{ path: `/cultivars/${node.cultivarId}`, query: $route.query }"
          :title="node.name"
          class="undecorated-link nowrap-ellipsis pedigree-node__name"
        >
          {{ node.name }}
        </RouterLink>
        <span
          v-else
          :title="node.name"
          class="nowrap-ellipsis pedigree-node__name"
        >
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
          @load="(ancestor) => emit('load', ancestor)"
        />
      </div>
    </template>
    <div
      v-else-if="node.expandable"
      class="pedigree-node__more row items-center no-wrap"
    >
      <div class="pedigree-node__stub" />
      <q-spinner v-if="node.loading" color="primary" size="24px" />
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
  PEDIGREE_CARD_HEIGHT,
  PEDIGREE_CARD_MARGIN,
  PEDIGREE_SLOT,
  type PedigreeLayout,
  type PedigreeTree,
} from './pedigree';

const props = defineProps<{
  node: PedigreeTree;
  layout: PedigreeLayout;
}>();

const emit = defineEmits<{
  load: [node: PedigreeTree];
}>();

const { t } = useI18n();

// Centers the 1px connector lines on the card. Borders are drawn inside the
// box (border-box), so the father elbow, whose line is its bottom border,
// needs 1px more height.
const stemTop = computed(() => props.layout.center - 0.5);

// The layout math depends on these sizes.
const cardHeight = `${PEDIGREE_CARD_HEIGHT}px`;
const cardMargin = `${PEDIGREE_CARD_MARGIN}px`;
const slotHeight = `${PEDIGREE_SLOT}px`;
</script>

<style lang="scss" scoped>
$line: 1px solid $separator-color;

.pedigree-node {
  display: flex;
  align-items: flex-start;
  width: max-content;
}

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
  height: v-bind(cardHeight);
  margin: v-bind(cardMargin) 0;
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

// lets the flex item shrink, so the ellipsis applies
.pedigree-node__name {
  min-width: 0;
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
  height: v-bind(slotHeight);
}

.pedigree-node__stub {
  width: 12px;
  border-top: 1px dashed $separator-color;
}
</style>
