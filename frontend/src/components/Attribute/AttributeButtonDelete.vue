<template>
  <EntityButtonDelete
    :label="attributeHasDependants ? t('base.disable') : t('base.delete')"
    :error="queryError || deleteError || disableError"
    :fetching="queryFetching || deleting || disabling"
    @delete="
      () => (attributeHasDependants ? disableAttribute() : deleteAttribute())
    "
    @reset-errors="resetErrors"
  >
    <template v-if="attributeHasDependants" #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        :message="`${t('attributes.disableExplainer')} ${t('attributes.disableConfirmation')}`"
      />
    </template>
    <template v-else #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        icon-color="negative"
        :message="t('attributes.deleteConfirmation')"
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

export interface AttributeButtonDeleteProps {
  attributeId: number;
}
const props = defineProps<AttributeButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  deleteError.value = undefined;
  disableError.value = undefined;
}

const {
  data: attributeData,
  error: queryError,
  fetching: queryFetching,
} = useQuery({
  query: graphql(`
    query AttributesCountFormsAndValues($id: Int!) {
      attributes_by_pk(id: $id) {
        attribution_form_fields_aggregate {
          aggregate {
            count
          }
        }
        attribution_values_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `),
  variables: { id: props.attributeId },
});

const attributeHasDependants = computed(() => {
  const attribute = attributeData.value?.attributes_by_pk;
  return (
    !!attribute?.attribution_form_fields_aggregate?.aggregate?.count ||
    !!attribute?.attribution_values_aggregate?.aggregate?.count
  );
});

const {
  error: deleteError,
  executeMutation: executeDeleteAttribute,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteAttribute($id: Int!) {
      delete_attributes_by_pk(id: $id) {
        id
      }
    }
  `),
);

const {
  error: disableError,
  executeMutation: executeDisableAttribute,
  fetching: disabling,
} = useMutation(
  graphql(`
    mutation DisableAttribute($id: Int!) {
      update_attributes_by_pk(
        pk_columns: { id: $id }
        _set: { disabled: true }
      ) {
        id
      }
    }
  `),
);

function deleteAttribute() {
  executeDeleteAttribute({ id: props.attributeId }).then((result) => {
    if (!result.data?.delete_attributes_by_pk) {
      console.error(`Failed to delete attribute ${props.attributeId}`);
    } else {
      emit('deleted');
    }
  });
}

function disableAttribute() {
  executeDisableAttribute({ id: props.attributeId }).then((result) => {
    if (!result.data?.update_attributes_by_pk) {
      console.error(`Failed to disable attribute ${props.attributeId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
