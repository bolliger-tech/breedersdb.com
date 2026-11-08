<template>
  <AttributionPhoto
    v-if="attribution.data_type === 'PHOTO' && attribution.text_value"
    :file-name="attribution.text_value"
    :attribution="attribution"
    :button-size="buttonSize"
  />
  <AttributionAttachmentLink
    v-else-if="attribution.data_type === 'ATTACHMENT' && attribution.text_value"
    :file-name="attribution.text_value"
    :attribute-name="attribution.attribute_name"
    :entity-name="getAttributedEntityName(attribution)"
    :date-attributed="attribution.date_attributed"
    :attribution-id="attribution.id"
    :button-size="buttonSize"
  />
  <!-- all other values -->
  <slot v-else />
</template>

<script setup lang="ts">
import type { QBtnProps } from 'quasar';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import AttributionAttachmentLink from 'src/components/Attribution/AttributionAttachmentLink.vue';
import AttributionPhoto from 'src/components/Attribution/AttributionPhoto.vue';
import { getAttributedEntityName } from 'src/utils/attributeUtils';

export interface AttributionFileValueProps {
  attribution: CachedAttributionsFragment;
  buttonSize?: QBtnProps['size'];
}

defineProps<AttributionFileValueProps>();
</script>
