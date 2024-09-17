<template>
  <q-btn dense flat no-caps @click="() => $emit('export')">
    <div class="column items-center">
      <q-circular-progress
        v-if="isExporting"
        show-value
        font-size="8px"
        :value="exportProgress"
        :min="0"
        :max="1"
        instant-feedback
        size="sm"
        color="primary"
        track-color="grey-3"
      >
        <template v-if="exportProgress < 1">
          {{ (exportProgress * 100).toFixed() }}%
        </template>
        <template v-else>
          <q-icon name="check" />
        </template>
      </q-circular-progress>
      <q-icon v-else name="file_download" />
      <div class="text-caption">
        {{ t('base.export') }}
      </div>
    </div>
  </q-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';

export interface EntityExportButtonProps {
  isExporting?: boolean;
  exportProgress?: number;
  onExport?: () => void;
}

withDefaults(defineProps<EntityExportButtonProps>(), {
  isExporting: false,
  exportProgress: 0,
  onExport: undefined,
});

defineEmits<{
  export: [];
}>();

const { t } = useI18n();
</script>
