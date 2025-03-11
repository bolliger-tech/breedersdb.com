<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.crossing') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteCrossing"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface CrossingButtonDeleteProps {
  crossingId: number;
}
const props = defineProps<CrossingButtonDeleteProps>();

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
    mutation DeleteCrossing($id: Int!) {
      delete_crossings_by_pk(id: $id) {
        id
      }
    }
  `),
);

async function deleteCrossing() {
  await urql.executeMutation({ id: props.crossingId }).then((result) => {
    if (!result.data?.delete_crossings_by_pk) {
      console.error(`Failed to delete crossing ${props.crossingId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
