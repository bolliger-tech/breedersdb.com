<template>
  <BaseMessage
    :type="collision.behavior === 'BLOCK' ? 'warning' : 'info'"
    class="q-mb-sm attribution-add-collision-hint"
  >
    {{
      t(
        collision.behavior === 'BLOCK'
          ? 'attributions.add.uniqueBlocked'
          : 'attributions.add.uniqueReplaced',
        {
          date: d(collision.existingValue.date_attributed, 'Ymd'),
          author: collision.existingValue.author,
          value,
        },
      )
    }}
    <q-btn
      v-if="collision.behavior === 'BLOCK'"
      :label="t('attributions.add.editExisting')"
      color="primary"
      size="sm"
      flat
      dense
      @click="$emit('edit', collision.existingValue.attribution_id)"
    />
  </BaseMessage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
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
}

const props = defineProps<AttributionAddCollisionHintProps>();

defineEmits<{
  edit: [attributionId: number];
}>();

const { t, d, n } = useI18n();

const value = computed(() => {
  const type = dataTypeToColumnTypes(props.collision.existingValue.data_type);

  if (type === ColumnTypes.Photo) return t('analyze.result.photo');
  if (type === ColumnTypes.Attachment) return t('analyze.result.attachment');

  return formatResultColumnValue({
    value: getAttributionValue(props.collision.existingValue),
    type,
    d,
    n,
  });
});
</script>
