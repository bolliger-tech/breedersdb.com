<template>
  <i18n-t
    v-if="collision.behavior === 'BLOCK'"
    keypath="attributions.add.uniqueBlocked.base"
    scope="global"
    tag="span"
    class="attribution-add-collision-hint"
  >
    <template #date>{{ date }}</template>
    <template #author>{{ collision.existingValue.author }}</template>
    <template #once
      ><strong>{{ t('attributions.add.uniqueBlocked.once') }}</strong></template
    >
    <template #blocking
      ><strong>{{
        t('attributions.add.uniqueBlocked.blocking')
      }}</strong></template
    >
  </i18n-t>
  <i18n-t
    v-else-if="locked"
    keypath="attributions.add.uniqueReplace.locked"
    scope="global"
    tag="span"
    class="attribution-add-collision-hint"
  >
    <template #date>{{ date }}</template>
    <template #author>{{ collision.existingValue.author }}</template>
    <template #once
      ><strong>{{ t('attributions.add.uniqueReplace.once') }}</strong></template
    >
  </i18n-t>
  <i18n-t
    v-else
    keypath="attributions.add.uniqueReplace.unlocked"
    scope="global"
    tag="span"
    class="attribution-add-collision-hint"
  >
    <template #replaces
      ><strong>{{
        t('attributions.add.uniqueReplace.replaces')
      }}</strong></template
    >
    <template #value>{{ value }}</template>
    <template #date>{{ date }}</template>
  </i18n-t>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import type { Collision } from './findCollisions';
import {
  dataTypeToColumnTypes,
  formatResultColumnValue,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';

export interface AttributionAddCollisionHintProps {
  collision: Collision<CachedAttributionsFragment>;
  locked: boolean;
}

const props = defineProps<AttributionAddCollisionHintProps>();

const { t, d, n } = useI18n();

const date = computed(() =>
  d(props.collision.existingValue.date_attributed, 'Ymd'),
);

const value = computed(() => {
  const type = dataTypeToColumnTypes(props.collision.existingValue.data_type);

  if (type === ColumnTypes.Photo) return t('analyze.result.photo');

  return formatResultColumnValue({
    value: getAttributionValue(props.collision.existingValue),
    type,
    d,
    n,
  });
});
</script>
