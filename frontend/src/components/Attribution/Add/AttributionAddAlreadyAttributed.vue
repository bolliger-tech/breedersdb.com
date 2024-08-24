<template>
  <q-separator spaced />
  <BaseMessage
    type="warning"
    :message="t('attributions.add.alreadyAttributed', { timeAgo, entity })"
    icon-size="xl"
  />
  <q-separator spaced />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import { toLocaleRelativeTimeString } from 'src/utils/dateUtils';
import type { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { useAttributableEntityName } from 'src/components/Attribution/useAttributableEntityName';
import BaseMessage from 'src/components/Base/BaseMessage.vue';

export interface AttributionAddAlreadyAttributedProps {
  date: Date;
  entityType: AttributableEntities;
}

const props = defineProps<AttributionAddAlreadyAttributedProps>();

const { t, locale } = useI18n();

const timeAgo = computed(() =>
  toLocaleRelativeTimeString(props.date, locale.value).replace(/\.$/, ''),
);

const { entity } = useAttributableEntityName({ entityType: props.entityType });
</script>
