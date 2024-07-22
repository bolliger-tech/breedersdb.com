<template>
  <q-banner class="text-white bg-negative">
    {{ t('attribute.noEntitySelected', { entity }) }}
    <template #action>
      <q-btn
        flat
        color="white"
        :label="t('attribute.selectEntity', { entity })"
        @click="$emit('click')"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { AttributableEntities } from 'src/components/ToAttribute/attributableEntities';
import { useAttributableEntityName } from 'src/components/ToAttribute/useAttributableEntityName';

export interface ToAttributeNoEntityErrorProps {
  entityType: AttributableEntities;
}

const props = defineProps<ToAttributeNoEntityErrorProps>();

defineEmits<{
  click: [];
}>();

const { t } = useI18n();
const { entity } = useAttributableEntityName({ entityType: props.entityType });
</script>
