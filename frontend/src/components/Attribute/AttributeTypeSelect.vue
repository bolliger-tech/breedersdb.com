<template>
  <EntitySelect
    ref="attributeTypeRef"
    v-model="attributeType"
    :label="t('attributes.columns.attributeType')"
    :options="attributeTypeOptions"
    option-value="value"
    option-label="label"
    :required="required"
    :clearable="false"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { AttributeTypes } from 'src/graphql';
import type { ComponentExposed } from 'vue-component-type-helpers';

export interface AttributeTypeSelectProps {
  required?: boolean;
}
defineProps<AttributeTypeSelectProps>();

const attributeTypeRef = ref<ComponentExposed<typeof EntitySelect> | null>(
  null,
);

defineExpose({
  validate: () => attributeTypeRef.value?.validate(),
  focus: () => attributeTypeRef.value && focusInView(attributeTypeRef.value),
});

const modelValue = defineModel<AttributeTypes | null>({ required: true });

const { t } = useI18n();

const attributeTypeOptions: { value: AttributeTypes; label: string }[] = [
  { value: 'OBSERVATION', label: t('attributes.attributeTypes.observation') },
  { value: 'SAMPLE', label: t('attributes.attributeTypes.sample') },
  { value: 'TREATMENT', label: t('attributes.attributeTypes.treatment') },
  { value: 'OTHER', label: t('attributes.attributeTypes.other') },
];

const attributeType = computed({
  get: () => attributeTypeOptions.find((o) => o.value === modelValue.value),
  set: (AttributeType) => (modelValue.value = AttributeType?.value ?? null),
});
</script>
