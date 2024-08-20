<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.lot') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteLot"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface LotButtonDeleteProps {
  lotId: number;
}
const props = defineProps<LotButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  executeMutation: executeDeleteLot,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteLot($id: Int!) {
      delete_lots_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteLot() {
  executeDeleteLot({ id: props.lotId }).then((result) => {
    if (!result.data?.delete_lots_by_pk) {
      console.error(`Failed to delete lot ${props.lotId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
