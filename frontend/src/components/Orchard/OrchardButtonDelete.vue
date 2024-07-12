<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('orchards.entityName') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteOrchard"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface OrchardButtonDeleteProps {
  orchardId: number;
}
const props = defineProps<OrchardButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
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

function deleteOrchard() {
  executeDeleteOrchard({ id: props.orchardId }).then((result) => {
    if (!result.data?.delete_orchards_by_pk) {
      console.error(`Failed to delete orchard ${props.orchardId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
