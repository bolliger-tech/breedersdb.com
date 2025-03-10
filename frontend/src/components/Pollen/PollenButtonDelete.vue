<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.pollen') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deletePollen"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface PollenButtonDeleteProps {
  pollenId: number;
}
const props = defineProps<PollenButtonDeleteProps>();

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
    mutation DeletePollen($id: Int!) {
      delete_pollen_by_pk(id: $id) {
        id
      }
    }
  `),
);

async function deletePollen() {
  await urql.executeMutation({ id: props.pollenId }).then((result) => {
    if (!result.data?.delete_pollen_by_pk) {
      console.error(`Failed to delete pollen ${props.pollenId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
