<template>
  <div v-if="!sortedAttachments.length" class="text-caption q-mx-md">
    {{ t('attributions.noAttachments') }}
  </div>
  <q-list v-else separator class="q-mb-lg entity-view-attachment-list">
    <q-item
      v-for="attachment in sortedAttachments"
      :key="attachment.id"
      tag="a"
      :href="getUrl(attachment)"
      target="_blank"
      rel="noopener"
      clickable
    >
      <q-item-section avatar>
        <q-icon :name="getAttachmentIcon(attachment.text_value ?? '')" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ attachment.attribute_name }}</q-item-label>
        <q-item-label caption>
          {{ d(attachment.date_attributed, 'Ymd') }}, {{ attachment.author }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import { useI18n } from 'src/composables/useI18n';
import { getAttributedEntityName } from 'src/utils/attributeUtils';
import {
  getAttachmentFileName,
  getAttachmentIcon,
  getAttachmentUrlRelative,
} from 'src/utils/attachmentUtils';

export interface EntityViewAttachmentListProps {
  attachments: CachedAttributionsFragment[];
}

const props = defineProps<EntityViewAttachmentListProps>();

const { t, d } = useI18n();

const sortedAttachments = computed(() =>
  [...props.attachments].sort(
    (a, b) =>
      b.date_attributed.localeCompare(a.date_attributed) ||
      b.created.localeCompare(a.created),
  ),
);

function getUrl(attachment: CachedAttributionsFragment) {
  const fileName = attachment.text_value ?? '';
  return getAttachmentUrlRelative({
    fileName,
    desiredFileName: getAttachmentFileName({
      fileName,
      attributeName: attachment.attribute_name,
      entityName: getAttributedEntityName(attachment),
      dateAttributed: attachment.date_attributed,
    }),
  });
}
</script>
