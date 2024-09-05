<template>
  <EntityButtonDelete
    :label="orchardHasDependencies ? t('base.disable') : t('base.delete')"
    :error="queryError || deleteError || disableError"
    :fetching="queryFetching || deleting || disabling"
    @delete="
      () => (orchardHasDependencies ? disableOrchard() : deleteOrchard())
    "
    @reset-errors="resetErrors"
  >
    <template v-if="orchardHasDependencies" #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        :message="t('orchards.disableConfirmation')"
      />
    </template>
    <template v-else #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        icon-color="negative"
        :message="t('orchards.deleteConfirmation')"
      />
    </template>
  </EntityButtonDelete>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import BaseMessage from '../Base/BaseMessage.vue';

export interface OrchardButtonDeleteProps {
  orchardId: number;
}
const props = defineProps<OrchardButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  deleteError.value = undefined;
  disableError.value = undefined;
}

const {
  data: orchardData,
  error: queryError,
  fetching: queryFetching,
} = useQuery({
  query: graphql(`
    query OrchardsCountPlantRowsAndLots($id: Int!) {
      orchards_by_pk(id: $id) {
        plant_rows_aggregate {
          aggregate {
            count
          }
        }
        lots_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `),
  variables: { id: props.orchardId },
});

const orchardHasDependencies = computed(() => {
  return (
    !!orchardData.value?.orchards_by_pk?.plant_rows_aggregate?.aggregate
      ?.count ||
    !!orchardData.value?.orchards_by_pk?.lots_aggregate?.aggregate?.count
  );
});

const {
  error: deleteError,
  executeMutation: executeDeleteOrchard,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteOrchard($id: Int!) {
      delete_orchards_by_pk(id: $id) {
        id
      }
    }
  `),
);

const {
  error: disableError,
  executeMutation: executeDisableOrchard,
  fetching: disabling,
} = useMutation(
  graphql(`
    mutation DisableOrchard($id: Int!) {
      update_orchards_by_pk(pk_columns: { id: $id }, _set: { disabled: true }) {
        id
      }
    }
  `),
);

function deleteOrchard() {
  executeDeleteOrchard({ id: props.orchardId }).then((result) => {
    if (!result.data?.delete_orchards_by_pk) {
      console.error(`Failed to delete orchard ${props.orchardId}`);
    } else {
      emit('deleted');
    }
  });
}

function disableOrchard() {
  executeDisableOrchard({ id: props.orchardId }).then((result) => {
    if (!result.data?.update_orchards_by_pk) {
      console.error(`Failed to disable orchard ${props.orchardId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
