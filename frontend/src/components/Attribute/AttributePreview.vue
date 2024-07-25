<template>
  <q-card
    :style="`max-width: ${attribute.data_type === 'RATING' ? 'min(100svw - 80px, calc(528px))' : '592px'}`"
  >
    <q-card-section :class="{ 'q-py-xs': attribute.data_type === 'RATING' }">
      <div :class="{ scale: attribute.data_type === 'RATING' }">
        <AttributionFormInput
          v-model="previewModelValue"
          :attribute="attribute"
          :exceptional="false"
          :has-same-again="false"
          hide-notes
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import AttributionFormInput from 'src/components/Attribution/Add/AttributionFormInput.vue';
import type { AttributionValueWithPhoto } from 'src/components/Attribution/Add/AttributionForm.vue';
import { ref } from 'vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';

export interface AttributePreviewProps {
  attribute: DistributiveOmit<AttributeFragment, 'created' | 'modified'>;
}

defineProps<AttributePreviewProps>();

const previewModelValue = ref<AttributionValueWithPhoto | undefined>(undefined);
</script>

<style scoped>
.scale {
  /* this is exactly as hacky as it looks like and far from perfect 😅
   * but any other solution would involve calculating the width of the
   * rating with js and watching the window size, which is an overkill.
   */
  transform: scale(0.8) translate(-10%);
}
</style>
