<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('graftings.entityName') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteGrafting"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface GraftingButtonDeleteProps {
  graftingId: number;
}
const props = defineProps<GraftingButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  executeMutation: executeDeleteGrafting,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteGrafting($id: Int!) {
      delete_graftings_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteGrafting() {
  executeDeleteGrafting({ id: props.graftingId }).then((result) => {
    if (!result.data?.delete_graftings_by_pk) {
      console.error(`Failed to delete grafting ${props.graftingId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
