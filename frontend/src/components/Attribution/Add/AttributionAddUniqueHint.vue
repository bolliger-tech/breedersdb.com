<template>
  <i18n-t
    :keypath="keypath"
    scope="global"
    tag="span"
    class="attribution-add-unique-hint"
    :class="{ 'text-negative': !collision && check === 'failed' }"
  >
    <template v-if="collision" #date>{{ date }}</template>
    <template v-if="collision" #author>{{
      collision.existingValue.author
    }}</template>
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
    <template #cannot
      ><strong>{{ t('attributions.add.uniqueHint.cannot') }}</strong></template
    >
    <template #overwritable
      ><strong>{{
        t('attributions.add.uniqueHint.overwritable')
      }}</strong></template
    >
    <template v-if="collision" #value>{{ value }}</template>
  </i18n-t>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import type { AttributeCardinalities } from 'src/graphql';
import type { Collision, UniqueValuesCheck } from './findCollisions';
import { formatAttributionValue } from 'src/utils/attributeUtils';

export interface AttributionAddUniqueHintProps {
  cardinality: AttributeCardinalities;
  collision?: Collision<CachedAttributionsFragment> | undefined;
  locked: boolean;
  check?: UniqueValuesCheck | undefined;
}

const props = defineProps<AttributionAddUniqueHintProps>();

const { t, d, n } = useI18n();

const unfilledKeypath = computed(() => {
  const key = {
    UNIQUE_BLOCK: 'attributions.add.uniqueHint.block',
    UNIQUE_REPLACE: 'attributions.add.uniqueHint.replace',
  }[props.cardinality as string];

  if (typeof key === 'undefined') {
    throw Error(
      `No unique hint for attribute.cardinality: ${props.cardinality}`,
    );
  }

  return key;
});

const keypath = computed(() => {
  if (!props.collision) {
    return props.check
      ? `attributions.add.uniqueHint.${props.check}`
      : unfilledKeypath.value;
  }
  if (props.collision.behavior === 'BLOCK') {
    return 'attributions.add.uniqueBlocked.base';
  }
  return props.locked
    ? 'attributions.add.uniqueReplace.locked'
    : 'attributions.add.uniqueReplace.unlocked';
});

const date = computed(() =>
  d(props.collision!.existingValue.date_attributed, 'Ymd'),
);

const value = computed(() => {
  const dataType = props.collision!.existingValue.data_type;

  if (dataType === 'PHOTO') return t('analyze.result.photo');
  if (dataType === 'ATTACHMENT') return t('analyze.result.attachment');

  return formatAttributionValue({
    attribution: props.collision!.existingValue,
    d,
    n,
  });
});
</script>
