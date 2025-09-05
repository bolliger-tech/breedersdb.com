<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.attribution') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteAttribution"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';

export interface AttributionButtonDeleteProps {
  attributionId: number;
  attributionValueId: number;
}
const props = defineProps<AttributionButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

const {
  error: attributionValueCountError,
  fetching: fetchingAttributionValueCount,
  ...urqlFetch
} = useQuery({
  query: graphql(`
    query AttributionValueCount($attributionId: Int!) {
      attribution_values_aggregate(
        where: { attribution_id: { _eq: $attributionId } }
      ) {
        aggregate {
          count
        }
      }
    }
  `),
  variables: { attributionId: props.attributionId },
  requestPolicy: 'network-only',
});

const {
  error: deleteAttributionValueError,
  fetching: deletingAttributionValue,
  ...urqlDeleteAttributionValue
} = useMutation(
  graphql(`
    mutation DeleteAttributionValue($attributionValueId: Int!) {
      delete_attribution_values_by_pk(id: $attributionValueId) {
        id
      }
    }
  `),
);

const {
  error: deleteAttributionValueAndAttributionError,
  fetching: deletingAttributionValueAndAttribution,
  ...urqlDeleteAttributionValueAndAttribution
} = useMutation(
  graphql(`
    mutation DeleteAttributionValueAndAttribution(
      $attributionValueId: Int!
      $attributionId: Int!
    ) {
      delete_attribution_values_by_pk(id: $attributionValueId) {
        id
      }
      delete_attributions_by_pk(id: $attributionId) {
        id
      }
    }
  `),
);

function resetErrors() {
  attributionValueCountError.value = undefined;
  deleteAttributionValueError.value = undefined;
  deleteAttributionValueAndAttributionError.value = undefined;
}

const error = computed(
  () =>
    attributionValueCountError.value ||
    deleteAttributionValueError.value ||
    deleteAttributionValueAndAttributionError.value,
);

const deleting = computed(
  () =>
    fetchingAttributionValueCount.value ||
    deletingAttributionValue.value ||
    deletingAttributionValueAndAttribution.value,
);

async function deleteAttribution() {
  const { data: countData } = await urqlFetch.executeQuery();

  const executeDelete =
    (countData.value?.attribution_values_aggregate.aggregate?.count || 0) > 1
      ? urqlDeleteAttributionValue.executeMutation(
          {
            attributionValueId: props.attributionValueId,
          },
          { additionalTypenames: ['cached_attributions'] },
        )
      : urqlDeleteAttributionValueAndAttribution.executeMutation(
          {
            attributionValueId: props.attributionValueId,
            attributionId: props.attributionId,
          },
          { additionalTypenames: ['cached_attributions'] },
        );

  await executeDelete.then((result) => {
    if (!result.data?.delete_attribution_values_by_pk) {
      console.error(`Failed to delete attribution ${props.attributionId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
