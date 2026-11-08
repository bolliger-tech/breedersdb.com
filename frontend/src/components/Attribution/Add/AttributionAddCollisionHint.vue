<template>
  <i18n-t
    :keypath="keypath"
    scope="global"
    tag="span"
    class="attribution-add-collision-hint"
  >
    <template #date>{{ date }}</template>
    <template #author>{{ collision.existingValue.author }}</template>
    <template #once
      ><strong>{{ t('attributions.add.uniqueOnce') }}</strong></template
    >
    <template #blocking
      ><strong>{{
        t('attributions.add.uniqueBlocked.blocking')
      }}</strong></template
    >
    <template #replaces
      ><strong>{{
        t('attributions.add.uniqueReplace.replaces')
      }}</strong></template
    >
    <template #value>{{ value }}</template>
  </i18n-t>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import type { Collision } from './findCollisions';
import { formatAttributionValue } from 'src/utils/attributeUtils';

export interface AttributionAddCollisionHintProps {
  collision: Collision<CachedAttributionsFragment>;
  locked: boolean;
}

const props = defineProps<AttributionAddCollisionHintProps>();

const { t, d, n } = useI18n();

const keypath = computed(() => {
  if (props.collision.behavior === 'BLOCK') {
    return 'attributions.add.uniqueBlocked.base';
  }
  return props.locked
    ? 'attributions.add.uniqueReplace.locked'
    : 'attributions.add.uniqueReplace.unlocked';
});

const date = computed(() =>
  d(props.collision.existingValue.date_attributed, 'Ymd'),
);

const value = computed(() =>
  props.collision.existingValue.data_type === 'PHOTO'
    ? t('analyze.result.photo')
    : formatAttributionValue({
        attribution: props.collision.existingValue,
        d,
        n,
      }),
);
</script>
