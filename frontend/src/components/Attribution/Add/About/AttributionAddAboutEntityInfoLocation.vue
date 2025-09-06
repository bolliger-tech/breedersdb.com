<template>
  <q-icon name="o_place" class="text-muted" />
  {{ location.map((loc) => loc || '&mdash;').join(' ') }}
  <span
    v-if="showOrchard"
    class="text-muted text-body2"
    :class="{ 'text-italic': !orchard }"
    >{{ orchard || t('base.notAvailable') }}</span
  >
</template>
<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';

export interface AttributionAddAboutEntityInfoLocationProps {
  location: (string | null)[];
  showOrchard: boolean;
  orchard: string | null;
}

defineProps<AttributionAddAboutEntityInfoLocationProps>();

const { t } = useI18n();
</script>
