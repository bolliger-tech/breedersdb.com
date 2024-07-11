<template>
  <q-date
    v-model:model-value="modelValue"
    first-day-of-week="1"
    mask="YYYY-MM-DD"
    minimal
    @update:model-value="(val) => updateModelValue(val?.toString() ?? null)"
  />
</template>
<script setup lang="ts">
const modelValue = defineModel<string | null>({ required: true });

function updateModelValue(value: string | null) {
  if (value === '' || value === null) {
    modelValue.value = null;
    return;
  }

  modelValue.value = value;
}
</script>
