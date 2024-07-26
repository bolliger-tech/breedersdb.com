<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', { entity: t('attributionForms.title', 1) })
    "
    :error="error"
    :fetching="deleting"
    @delete="deleteAttributionForm"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface AttributionFormButtonDeleteProps {
  attributionFormId: number;
}
const props = defineProps<AttributionFormButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  executeMutation: executeDeleteAttributionForm,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteAttributionForm($id: Int!) {
      delete_attribution_forms_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteAttributionForm() {
  executeDeleteAttributionForm({ id: props.attributionFormId }).then(
    (result) => {
      if (!result.data?.delete_attribution_forms_by_pk) {
        console.error(
          `Failed to delete attribution form ${props.attributionFormId}`,
        );
      } else {
        emit('deleted');
      }
    },
  );
}

const { t } = useI18n();
</script>
