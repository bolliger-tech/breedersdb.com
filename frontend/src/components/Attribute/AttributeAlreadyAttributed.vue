<template>
  <q-separator spaced />
  <div class="row align-center">
    <q-icon name="warning" color="warning" size="50px" class="col-auto" />
    <div class="col q-ml-md">
      {{ t('attribute.alreadyAttributed', { timeAgo, entity }) }}
    </div>
  </div>
  <q-separator spaced />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import { toLocaleRelativeTimeString } from 'src/utils/dateUtils';
import type { AttributableEntities } from './attributableEntities';
import { useAttributableEntityName } from 'src/components/Attribute/useAttributableEntityName';

export interface AttributeAlreadyAttributedProps {
  date: Date;
  entityType: AttributableEntities;
}

const props = defineProps<AttributeAlreadyAttributedProps>();

const { t, locale } = useI18n();

const timeAgo = computed(() =>
  toLocaleRelativeTimeString(props.date, locale.value).replace(/\.$/, ''),
);

const { entity } = useAttributableEntityName({ entityType: props.entityType });
</script>
