<template>
  <q-card style="width: clamp(310px, 90vw, 1000px); max-width: unset">
    <q-card-section class="row items-center q-py-sm">
      <slot name="title"
        ><h4 class="q-my-sm">{{ title }}</h4></slot
      >
      <q-space />
      <q-btn v-close-popup icon="close" flat round dense />
    </q-card-section>

    <q-separator />

    <q-card-section style="max-height: calc(100vh - 200px)" class="scroll">
      <slot></slot>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn v-close-popup flat label="Decline" color="primary" />
      <q-btn v-close-popup flat label="Accept" color="primary" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
export interface EntityModalContentProps {
  title?: string;
}

defineProps<EntityModalContentProps>();
defineSlots<{
  title: [];
  default: [];
}>();
</script>
