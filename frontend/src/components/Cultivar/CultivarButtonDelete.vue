<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.cultivar') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteCultivar"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface CultivarButtonDeleteProps {
  cultivarId: number;
}
const props = defineProps<CultivarButtonDeleteProps>();

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
    mutation DeleteCultivar($id: Int!) {
      delete_cultivars_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteCultivar() {
  void urql.executeMutation({ id: props.cultivarId }).then((result) => {
    if (!result.data?.delete_cultivars_by_pk) {
      console.error(`Failed to delete cultivar ${props.cultivarId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
