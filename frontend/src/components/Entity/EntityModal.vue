<template>
  <q-dialog
    v-model="visible"
    no-route-dismiss
    no-refocus
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

const visible = defineModel<boolean>();
defineEmits<{
  'before-hide': [];
  hide: [];
}>();

const persistent = ref(false);

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
