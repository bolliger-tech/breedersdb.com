<template>
  <EntityButtonDelete
    :label="hasDependants ? t('base.disable') : t('base.delete')"
    :error="queryError || deleteError || disableError"
    :fetching="queryFetching || deleting || disabling"
    @delete="
      () =>
        hasDependants ? disableAttributionAddForm() : deleteAttributionAddForm()
    "
    @reset-errors="resetErrors"
  >
    <template v-if="hasDependants" #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        :message="`${t('attributionForms.disableExplainer')} ${t('attributionForms.disableConfirmation')}`"
      />
    </template>
    <template v-else #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        icon-color="negative"
        :message="
          t('base.deleteConfirmation', {
            entity: t('attributionForms.title', 1),
          })
        "
      />
    </template>
  </EntityButtonDelete>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import BaseMessage from '../Base/BaseMessage.vue';

export interface AttributionAddFormButtonDeleteProps {
  attributionFormId: number;
}
const props = defineProps<AttributionAddFormButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  deleteError.value = undefined;
  disableError.value = undefined;
}

const {
  data: attributionFormData,
  error: queryError,
  fetching: queryFetching,
} = useQuery({
  query: graphql(`
    query AttributionFormsCountAttributions($id: Int!) {
      attribution_forms_by_pk(id: $id) {
        attributions_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `),
  variables: { id: props.attributionFormId },
  requestPolicy: 'network-only',
});

const hasDependants = computed(() => {
  const form = attributionFormData.value?.attribution_forms_by_pk;
  return !!form?.attributions_aggregate?.aggregate?.count;
});

const {
  error: deleteError,
  executeMutation: executeDeleteAttributionForm,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteAttributionForm($id: Int!) {
      delete_attribution_form_fields(
        where: { attribution_form_id: { _eq: $id } }
      ) {
        affected_rows
      }
      delete_attribution_forms_by_pk(id: $id) {
        id
      }
    }
  `),
);

const {
  error: disableError,
  executeMutation: executeDisableAttributionForm,
  fetching: disabling,
} = useMutation(
  graphql(`
    mutation DisableAttributionForm($id: Int!) {
      update_attribution_forms_by_pk(
        pk_columns: { id: $id }
        _set: { disabled: true }
      ) {
        id
      }
    }
  `),
);

function deleteAttributionAddForm() {
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

function disableAttributionAddForm() {
  executeDisableAttributionForm({ id: props.attributionFormId }).then(
    (result) => {
      if (!result.data?.update_attribution_forms_by_pk) {
        console.error(
          `Failed to disable attribution form ${props.attributionFormId}`,
        );
      } else {
        emit('deleted');
      }
    },
  );
}

const { t } = useI18n();
</script>
