<template>
  <q-stepper
    v-model="modelValue"
    animated
    header-nav
    contracted
    :transition-duration="transitionDuration"
    class="base-stepper"
    @transition="handleTransition"
  >
    <slot></slot>
  </q-stepper>
</template>

<script setup lang="ts">
import { type Slot } from 'vue';

export interface AttributionAddStepsProps {
  transitionDuration?: number;
}

const props = withDefaults(defineProps<AttributionAddStepsProps>(), {
  transitionDuration: 300,
});

const modelValue = defineModel<string | number>({ required: true });

defineSlots<{
  default: Slot;
}>();

const emit = defineEmits<{
  afterTransition: [to: string | number];
}>();

const WAIT_AFTER_TRANSITION = 10;

function handleTransition(to: string | number) {
  setTimeout(() => {
    emit('afterTransition', to);
  }, props.transitionDuration + WAIT_AFTER_TRANSITION);
}
</script>

<style scoped>
:global(.base-stepper .q-stepper__tab--active) {
  background: color-mix(in srgb, currentColor 9%, white 5%);
}
:global(
    .base-stepper :is(.q-stepper__tab--active, .q-stepper__tab--done) .q-icon
  ) {
  color: white;
}

:global(.base-stepper .q-stepper__header) {
  min-height: 50px;
}
:global(.base-stepper .q-stepper__header .q-stepper__tab) {
  min-height: clamp(50px, 7svw, 72px);
}

/* Center center the icons */
:global(
    .base-stepper
      .q-stepper__header
      .q-stepper__tab:is(:last-child, :first-child)
  ) {
  justify-content: center;
}
:global(
    .base-stepper
      .q-stepper__header
      .q-stepper__tab:is(:last-child, :first-child)
      .q-stepper__dot
  ) {
  transform: none;
}
</style>
