<template>
  <EntityButtonDelete
    :disabled="me?.id === props.rootstockId"
    :message="
      t('base.deleteConfirmation', { entity: t('rootstocks.entityName') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteRootstock"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useMe } from 'src/composables/useMe';

export interface RootstockButtonDeleteProps {
  rootstockId: number;
}
const props = defineProps<RootstockButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  executeMutation: executeDeleteRootstock,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteRootstock($id: Int!) {
      delete_rootstocks_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteRootstock() {
  executeDeleteRootstock({ id: props.rootstockId }).then((result) => {
    if (!result.data?.delete_rootstocks_by_pk) {
      console.error(`Failed to delete rootstock ${props.rootstockId}`);
    } else {
      emit('deleted');
    }
  });
}

const me = useMe();

const { t } = useI18n();
</script>
