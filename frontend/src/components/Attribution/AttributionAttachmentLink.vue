<template>
  <a :href="url" target="_blank" rel="noopener" @click.stop>
    <q-icon :name="getAttachmentIcon(fileName)" class="q-mr-xs" />{{
      displayName
    }}
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  getAttachmentFileName,
  getAttachmentIcon,
  getAttachmentUrlRelative,
} from 'src/utils/attachmentUtils';

export interface AttributionAttachmentLinkProps {
  fileName: string;
  attributeName: string;
  entityName?: string | undefined;
  dateAttributed: string;
}

const props = defineProps<AttributionAttachmentLinkProps>();

const displayName = computed(() => getAttachmentFileName(props));

const url = computed(() =>
  getAttachmentUrlRelative({
    fileName: props.fileName,
    desiredFileName: displayName.value,
  }),
);
</script>
