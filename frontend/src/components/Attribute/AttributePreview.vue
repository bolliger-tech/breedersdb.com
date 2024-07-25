<template>
  <q-card style="max-width: calc(592px + 2 * 16px)">
    <q-card-section>
      <AttributionFormInput
        v-model="previewModelValue"
        :attribute="attribute"
        :exceptional="false"
        :has-same-again="false"
        hide-notes
      />
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
