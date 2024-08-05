<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('base.entityName.motherPlant') })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteMotherPlant"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface MotherPlantButtonDeleteProps {
  motherPlantId: number;
}
const props = defineProps<MotherPlantButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  executeMutation: executeDeleteMotherPlant,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteMotherPlant($id: Int!) {
      delete_mother_plants_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteMotherPlant() {
  executeDeleteMotherPlant({ id: props.motherPlantId }).then((result) => {
    if (!result.data?.delete_mother_plants_by_pk) {
      console.error(`Failed to delete motherPlant ${props.motherPlantId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
