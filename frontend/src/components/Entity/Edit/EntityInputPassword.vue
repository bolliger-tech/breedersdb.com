<template>
  <EntityInput
    ref="inputRef"
    v-bind="{
      ...$props,
      type: showPassword ? 'text' : 'password',
    }"
  >
    <template #append>
      <q-icon
        :name="showPassword ? 'visibility' : 'visibility_off'"
        class="cursor-pointer"
        @click="showPassword = !showPassword"
      />
    </template>
    <template
      v-for="slot in slotNames.filter((s) => s in $slots)"
      :key="slot"
      #[slot]
    >
      <slot :name="slot"></slot>
    </template>
  </EntityInput>
</template>

<script setup lang="ts">
import type { InputRef } from 'src/composables/useEntityForm';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import { ref } from 'vue';
import { focusInView } from 'src/utils/focusInView';
import type { EntityInputProps, EntityInputSlots } from './EntityInput.vue';

export interface EntityInputPasswordProps
  extends Omit<EntityInputProps, 'type' | 'onUpdate:modelValue'> {
  // quasar typescript fix
  'onUpdate:modelValue'?: (
    value: string | number | FileList | null | undefined,
  ) => void;
}
defineProps<EntityInputPasswordProps>();

const slots = defineSlots<Omit<EntityInputSlots, 'append'>>();
const slotNames = Object.keys(slots) as (keyof typeof slots)[];

const inputRef = ref<InputRef | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const showPassword = ref(false);
</script>
