<template>
  <q-btn
    flat
    dense
    :icon="getAttachmentIcon(fileName)"
    padding="none"
    :round="false"
    :size="buttonSize || 'sm'"
    color="primary"
    :label="t('base.show')"
    :href="url"
    target="_blank"
    rel="noopener"
    @click.stop
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QBtnProps } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import {
  getAttachmentIcon,
  getAttachmentUrlRelative,
} from 'src/utils/assetUtils';

export interface AttributionAttachmentLinkProps {
  fileName: string;
  downloadFileName: string;
  buttonSize?: QBtnProps['size'];
}

const props = defineProps<AttributionAttachmentLinkProps>();

const { t } = useI18n();

const url = computed(() => getAttachmentUrlRelative(props));
</script>
