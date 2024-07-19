<template>
  <q-toggle
    v-model="modelValue"
    toggle-indeterminate
    checked-icon="check"
    unchecked-icon="clear"
    :label="
      modelValue === null ? '' : modelValue ? $t('base.yes') : $t('base.no')
    "
  />
</template>
<script setup lang="ts">
const modelValue = defineModel<boolean | null>({ required: true });
</script>
