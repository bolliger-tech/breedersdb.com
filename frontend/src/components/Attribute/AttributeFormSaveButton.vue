<template>
  <q-page-sticky :offset="[18, 18]" position="bottom-right" style="z-index: 1">
    <slot name="error"></slot>
    <div
      class="row align-center shadow-3 attribute-form-save-btn"
      :class="{
        'bg-grey-10': !$q.dark.isActive && !showProgress && !disable,
        'bg-grey-9':
          ($q.dark.isActive && !showProgress) ||
          (!$q.dark.isActive && !showProgress && disable),
        'bg-primary': showProgress,
        'attribute-form-save-btn--progress': showProgress,
        'attribute-form-save-btn--counter': $slots.counter && !loading,
      }"
    >
      <div class="q-pl-md q-pr-sm attribute-form-save-btn__progress-container">
        <q-linear-progress
          v-if="showProgress"
          size="1.5em"
          track-color="white"
          :value="progress / 100"
          style="width: 100%"
          rounded
          dark
          class="attribute-form-save-btn__progress"
        >
          <div class="absolute-full flex flex-center">
            <q-badge color="white" text-color="black">
              {{
                t('attribute.uploading', { percentage: progress.toFixed(0) })
              }}
            </q-badge>
          </div>
        </q-linear-progress>

        <slot v-else name="counter"></slot>
      </div>

      <q-btn
        color="primary"
        icon="save"
        fab
        unelevated
        :disable="disable"
        :loading="loading"
        :style="
          $slots.counter || loading
            ? 'border: 1px solid white; margin: 2px'
            : ''
        "
        @click="$emit('save')"
        @mouseleave="$emit('resetErrors')"
        @focusout="$emit('resetErrors')"
      />
    </div>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';

const props = defineProps<{
  disable: boolean;
  loading: boolean;
  showProgress: boolean;
  progress: number;
  transitionDuration: number;
}>();

defineEmits<{
  save: [];
  resetErrors: [];
}>();

defineSlots<{
  counter: void;
  error: void;
}>();

const { t } = useI18n();

const transition = computed(() => `all ${props.transitionDuration}ms ease`);
</script>

<style scoped lang="scss">
.attribute-form-save-btn {
  border-radius: 2rem;
  width: 56px;
  transition: v-bind(transition);

  &--progress {
    width: min(calc(100svw - 36px), 436px);
  }

  &--counter {
    width: min(calc(100svw - 126px), 344px);
  }

  &__progress-container {
    width: calc(100% - 62px);
  }
}

.attribute-form-save-btn__progress.q-linear-progress {
  color: var(--bdb-accent-100);
}
</style>
