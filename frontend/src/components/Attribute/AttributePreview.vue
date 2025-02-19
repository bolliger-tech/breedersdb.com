<template>
  <q-card style="max-width: 592px">
    <q-card-section v-if="!attribute.disabled">
      <AttributionInput
        v-model="previewModelValue"
        :attribute="attribute"
        :exceptional="false"
        :has-same-again="false"
        hide-notes
      />
    </q-card-section>
    <q-card-section v-else>
      {{ t('attributes.disabledPreviewMsg') }}
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import AttributionInput, {
  type AttributionInputValue,
} from 'src/components/Attribution/Input/AttributionInput.vue';
import { ref } from 'vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';
import { useI18n } from 'src/composables/useI18n';

export interface AttributePreviewProps {
  attribute: DistributiveOmit<AttributeFragment, 'created' | 'modified'>;
}

defineProps<AttributePreviewProps>();

const previewModelValue = ref<AttributionInputValue | undefined>(undefined);

const { t } = useI18n();
</script>
