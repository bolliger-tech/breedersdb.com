<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.rootstock') })
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
  fetching: deleting,
  ...urql
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
  void urql.executeMutation({ id: props.rootstockId }).then((result) => {
    if (!result.data?.delete_rootstocks_by_pk) {
      console.error(`Failed to delete rootstock ${props.rootstockId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
