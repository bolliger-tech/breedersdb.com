<template>
  <figure class="column items-center">
    <q-icon name="img:/icons/spinner.svg" :size="props.size" />
    <figcaption class="text-muted">{{ label || t('base.loading') }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { QIconProps } from 'quasar';
const { t } = useI18n();

export interface BaseSpinnerProps {
  size?: QIconProps['size'];
  label?: string;
}

const props = defineProps<BaseSpinnerProps>();
</script>
