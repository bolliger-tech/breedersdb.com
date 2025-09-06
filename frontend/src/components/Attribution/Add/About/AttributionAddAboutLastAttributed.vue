<template>
  <i18n-t
    keypath="attributions.add.lastAttributed"
    scope="global"
    class="text-caption text-muted"
    tag="p"
  >
    <template #timeAgo>
      <template v-if="fetching">{{ t('base.loading') }}</template>
      <template v-else-if="error">{{ t('base.error') }}</template>
      <strong v-else :class="$q.dark.isActive ? 'text-white' : 'text-black'">
        <BaseRelativeTime :timestamp="data?.attributions[0]?.created" />.
      </strong>
    </template>
  </i18n-t>
</template>

<script setup lang="ts">
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import BaseRelativeTime from 'src/components/Base/BaseRelativeTime.vue';

const props = defineProps<{
  entityId: number;
  entityType: AttributableEntities;
  formId: number;
}>();

const query = graphql(`
  query GetLastAttributed(
    $formId: Int!
    $plantId: Int = -1
    $plantGroupId: Int = -1
    $cultivarId: Int = -1
    $lotId: Int = -1
  ) {
    attributions(
      where: {
        attribution_form_id: { _eq: $formId }
        _or: [
          { plant_id: { _eq: $plantId } }
          { plant_group_id: { _eq: $plantGroupId } }
          { cultivar_id: { _eq: $cultivarId } }
          { lot_id: { _eq: $lotId } }
        ]
      }
      order_by: { created: desc }
      limit: 1
    ) {
      created
    }
  }
`);

const variables = computed(() => {
  const vars: Record<string, number> = {
    formId: props.formId,
  };
  switch (props.entityType) {
    case AttributableEntities.Plant:
      vars.plantId = props.entityId;
      break;
    case AttributableEntities.PlantGroup:
      vars.plantGroupId = props.entityId;
      break;
    case AttributableEntities.Cultivar:
      vars.cultivarId = props.entityId;
      break;
    case AttributableEntities.Lot:
      vars.lotId = props.entityId;
      break;
  }
  return vars;
});

const pause = ref(false);

const { fetching, data, error } = useQuery({
  query,
  variables,
  context: { additionalTypenames: ['attributions'] },
  requestPolicy: 'cache-and-network',
  pause,
});

const { t } = useI18n();

watch(error, () => {
  if (error.value) {
    // don't capture exception (network errors)
    console.error(error.value);
  }
});

watch(data, () => {
  // don't update on save
  pause.value = true;
});
</script>
