<template>
  <q-dialog
    v-model="visible"
    no-route-dismiss
    no-refocus
    @before-hide="() => $emit('before-hide')"
    @hide="() => $emit('hide')"
  >
    <slot></slot>
  </q-dialog>
</template>

<script setup lang="ts">
const visible = defineModel<boolean>();
defineEmits<{
  'before-hide': [];
  hide: [];
}>();
</script>
