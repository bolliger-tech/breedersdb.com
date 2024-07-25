<template>
  <EntitySelect
    ref="attributeDataTypeRef"
    v-model="attributeDataType"
    :label="t('attributes.columns.dataType')"
    :options="attributeDataTypeOptions"
    option-value="value"
    option-label="label"
    :required="required"
    :clearable="false"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { AttributeDataTypes } from 'src/graphql';

export interface AttributeDataTypeSelectProps {
  required?: boolean;
}
defineProps<AttributeDataTypeSelectProps>();

const attributeDataTypeRef = ref<EntitySelectInstance<{
  value: string;
  label: string;
}> | null>(null);

defineExpose({
  validate: () => attributeDataTypeRef.value?.validate(),
  focus: () =>
    attributeDataTypeRef.value && focusInView(attributeDataTypeRef.value),
});

const modelValue = defineModel<AttributeDataTypes | null>({ required: true });

const { t } = useI18n();

const attributeDataTypeOptions: { value: AttributeDataTypes; label: string }[] =
  [
    { value: 'TEXT', label: t('attributes.dataTypes.text') },
    { value: 'INTEGER', label: t('attributes.dataTypes.integer') },
    { value: 'FLOAT', label: t('attributes.dataTypes.float') },
    { value: 'BOOLEAN', label: t('attributes.dataTypes.boolean') },
    { value: 'DATE', label: t('attributes.dataTypes.date') },
    { value: 'PHOTO', label: t('attributes.dataTypes.photo') },
    { value: 'RATING', label: t('attributes.dataTypes.rating') },
  ];

const attributeDataType = computed({
  get: () => attributeDataTypeOptions.find((o) => o.value === modelValue.value),
  set: (attributeDataType) =>
    (modelValue.value = attributeDataType?.value ?? null),
});
</script>
