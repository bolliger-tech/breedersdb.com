<template>
  <q-card style="max-width: 592px">
    <q-card-section v-if="!attribute.disabled">
      <AttributionInput
        v-model="previewModelValue"
        :attribute="attribute"
        :exceptional="false"
        :required="false"
        hide-notes
      >
        <template v-if="attribute.cardinality !== 'REPEATABLE'" #hint>
          <AttributionAddUniqueHint
            :cardinality="attribute.cardinality"
            :locked="false"
          />
        </template>
      </AttributionInput>
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
import AttributionAddUniqueHint from 'src/components/Attribution/Add/AttributionAddUniqueHint.vue';
import { ref } from 'vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';
import { useI18n } from 'src/composables/useI18n';

export interface AttributePreviewProps {
  attribute: DistributiveOmit<AttributeFragment, 'created' | 'modified'>;
}

defineProps<AttributePreviewProps>();

const previewModelValue = ref<AttributionInputValue>();

const { t } = useI18n();
</script>
