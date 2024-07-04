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

    <q-card-actions align="between">
      <div>
        <slot name="action-left">
          <EntityButtonDelete @delete="() => $emit('delete')" />
        </slot>
      </div>
      <div>
        <slot name="action-right">
          <q-btn
            flat
            :label="t('base.edit')"
            color="primary"
            @click="() => $emit('edit')"
          />
          <q-btn v-close-popup flat :label="t('base.close')" color="primary" />
        </slot>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityButtonDelete from './EntityButtonDelete.vue';

export interface EntityModalContentProps {
  title?: string;
}

defineProps<EntityModalContentProps>();
defineSlots<{
  title: [];
  default: [];
  'action-left': [];
  'action-right': [];
}>();
defineEmits<{
  edit: [];
  delete: [];
}>();

const { t } = useI18n();
</script>
