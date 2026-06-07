<template>
  <EntitySelect
    ref="selectRef"
    :model-value="selectedOption"
    :label="undefined"
    :options="visibleOptions"
    option-value="id"
    option-label="label"
    @update:model-value="(opt) => emit('update:modelValue', opt?.id ?? null)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import EntitySelect from 'src/components/Entity/Edit/EntitySelect.vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import type { ComponentExposed } from 'vue-component-type-helpers';

type EnumOption = AttributeFragment['enum_options'][number];

const props = defineProps<{
  options: readonly EnumOption[];
  modelValue: number | null;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

const selectRef = ref<ComponentExposed<typeof EntitySelect> | null>(null);
defineExpose({
  validate: () => selectRef.value?.validate(),
  focus: () => selectRef.value?.focus(),
});

// show enabled options, plus the currently selected one even if it was disabled
const visibleOptions = computed(() =>
  props.options
    .filter((o) => !o.disabled || o.id === props.modelValue)
    .slice()
    .sort((a, b) => a.position - b.position),
);

const selectedOption = computed<EnumOption | null>(
  () => props.options.find((o) => o.id === props.modelValue) ?? null,
);
</script>
