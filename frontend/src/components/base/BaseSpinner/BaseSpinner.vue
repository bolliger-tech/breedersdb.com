<template>
  <figure class="column items-center">
    <BaseSpinnerIcon :size="props.size" />
    <figcaption class="text-muted">{{ label || t('base.loading') }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import BaseSpinnerIcon from './BaseSpinnerIcon.vue';
import { useI18n } from 'src/composables/useI18n';
const { t } = useI18n();

const props = defineProps({
  size: {
    type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl' | string>,
    default: 'md' as const,
  },
  label: {
    type: String,
    default: null,
  },
});
</script>
