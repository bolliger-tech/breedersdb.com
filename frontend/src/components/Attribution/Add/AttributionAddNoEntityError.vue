<template>
  <q-banner class="text-white bg-negative">
    {{ t('attributions.add.noEntitySelected', { entity }) }}
    <template #action>
      <q-btn
        flat
        color="white"
        :label="t('attributions.add.selectEntity', { entity })"
        @click="$emit('click')"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { useAttributableEntityName } from 'src/components/Attribution/useAttributableEntityName';

export interface AttributionNoEntityErrorProps {
  entityType: AttributableEntities;
}

const props = defineProps<AttributionNoEntityErrorProps>();

defineEmits<{
  click: [];
}>();

const { t } = useI18n();
const { entity } = useAttributableEntityName({ entityType: props.entityType });
</script>
