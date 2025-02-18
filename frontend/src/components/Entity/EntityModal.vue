<template>
  <q-dialog
    ref="dialog"
    v-model="visible"
    no-route-dismiss
    no-refocus
    :transition-show="transition"
    :transition-hide="transition"
    :transition-duration="transitionDuration"
    :persistent="persistent"
    @before-hide="$emit('before-hide')"
    @hide="$emit('hide')"
  >
    <slot></slot>
  </q-dialog>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from './modalProvideSymbols';
import { useRoute } from 'vue-router';
import type { QDialogProps, QDialog } from 'quasar';

export interface EntityModalProps {
  transition?: QDialogProps['transitionShow'];
  transitionDuration?: number;
}

defineProps<EntityModalProps>();

const visible = defineModel<boolean>();
defineEmits<{
  'before-hide': [];
  hide: [];
}>();

const persistent = ref(false);
const dialog = ref<QDialog | null>(null);

defineExpose({
  persistent,
  shake: () => dialog.value?.shake(),
});

const route = useRoute();
watch(
  () => route.path,
  () => (persistent.value = false),
);

provide(makeModalPersistentSymbol, (value: boolean) => {
  persistent.value = value;
});
provide(closeModalSymbol, () => {
  visible.value = false;
});
</script>
