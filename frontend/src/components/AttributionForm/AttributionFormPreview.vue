<template>
  <q-card style="max-width: 636px">
    <q-card-section v-if="!disabled">
      <AttributionAddFormFieldList
        v-if="formFields.length"
        v-model="attributionValues"
        :fields="formFields"
        no-bottom-border
      />
      <p v-else class="q-ma-none">
        {{ t('attributionForms.noFieldsMsg') }}
      </p>
    </q-card-section>
    <q-card-section v-else>
      {{ t('attributionForms.disabledPreviewMsg') }}
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import AttributionAddFormFieldList from 'src/components/Attribution/Add/AttributionAddFormFieldList.vue';
import type { AttributionValueWithPhoto } from 'src/components/Attribution/Add/AttributionAddForm.vue';
import { ref } from 'vue';
import { type AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { useI18n } from 'src/composables/useI18n';

export interface AttributionFormPreviewProps {
  disabled: boolean;
  formFields: {
    priority: number;
    attribute: AttributeFragment;
    exceptional: boolean;
  }[];
}

defineProps<AttributionFormPreviewProps>();

const attributionValues = ref<{ [key: number]: AttributionValueWithPhoto }>({});

const { t } = useI18n();
</script>
