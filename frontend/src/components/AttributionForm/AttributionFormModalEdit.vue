<template>
  <EntityModalContent
    :loading="savingEdit || savingInsert"
    :save-error="saveError"
    :validation-error="validationError"
    sprite-icon="form"
    :title="t('base.edit')"
    :subtitle="t('attributionForms.title', 1)"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <AttributionFormEntityForm
        ref="formRef"
        :attribution-form="attributionForm"
        @change="
          (data) => {
            previewAttributionForm = { id: -1, ...data };
            changedData = data;
          }
        "
      />
      <h3 class="q-my-md">{{ t('attributionForms.preview') }}</h3>
      <AttributionFormPreview
        :disabled="previewAttributionForm.disabled"
        :form-fields="previewFormFields"
      />
    </template>

    <template #action-left>
      <AttributionFormButtonDelete
        v-if="'id' in attributionForm && !attributionForm.disabled"
        :attribution-form-id="attributionForm.id"
        @deleted="
          () =>
            $router.push({ path: '/attribution-forms', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { graphql, VariablesOf } from 'src/graphql';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import AttributionFormButtonDelete from 'src/components/AttributionForm/AttributionFormButtonDelete.vue';
import AttributionFormEntityForm from 'src/components/AttributionForm/AttributionFormEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { computed, nextTick, ref } from 'vue';
import AttributionFormPreview from 'src/components/AttributionForm/AttributionFormPreview.vue';
import { useCancel } from 'src/composables/useCancel';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useMutation } from '@urql/vue';

/**
 * NOTE: Because we need to edit associated data (attribution_form_fields), we
 * can not use the EntityModalEdit component.
 */

export type AttributionFormEditInput = Omit<
  AttributionFormFragment,
  'created' | 'modified'
>;
export type AttributionFormInsertInput = Omit<AttributionFormEditInput, 'id'>;

export interface AttributionFormModalEditProps {
  attributionForm: AttributionFormEditInput | AttributionFormInsertInput;
}

const props = defineProps<AttributionFormModalEditProps>();
const formRef = ref<InstanceType<typeof AttributionFormEntityForm> | null>(
  null,
);

const { cancel } = useCancel({ path: '/attribution-forms' });

const insertMutation = graphql(
  `
    mutation InsertAttributionForm($entity: attribution_forms_insert_input!) {
      insert_attribution_forms_one(object: $entity) {
        ...attributionFormFragment
      }
    }
  `,
  [attributionFormFragment],
);

const editMutation = graphql(
  `
    mutation UpdateAttributionForm(
      $id: Int!
      $entity: attribution_forms_set_input!
      $fields: [attribution_form_fields_insert_input!]!
    ) {
      delete_attribution_form_fields(
        where: { attribution_form_id: { _eq: $id } }
      ) {
        affected_rows
      }
      update_attribution_forms_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...attributionFormFragment
      }
      insert_attribution_form_fields(objects: $fields) {
        affected_rows
      }
    }
  `,
  [attributionFormFragment],
);

const { t } = useI18n();

const previewAttributionForm = ref({ id: -1, ...props.attributionForm });
const previewFormFields = computed(() =>
  previewAttributionForm.value.attribution_form_fields.map((field) => ({
    ...field,
    exceptional: false,
  })),
);

const changedData = ref<
  AttributionFormInsertInput | AttributionFormEditInput | null
>();

function getInsertData(): VariablesOf<typeof insertMutation>['entity'] | null {
  if (!changedData.value) {
    return null;
  }

  return {
    name: changedData.value.name,
    description: changedData.value.description,
    disabled: changedData.value.disabled,
    attribution_form_fields: {
      data: changedData.value.attribution_form_fields
        .filter((field) => !!field.attribute)
        .map((field, index) => ({
          priority: index,
          attribute_id: field.attribute.id,
        })),
    },
  };
}

function getEditData(): VariablesOf<typeof editMutation> | null {
  if (!('id' in props.attributionForm)) {
    // this should never happen
    throw new Error('Entity ID is missing');
  }
  if (!changedData.value) {
    return null;
  }
  const formId = props.attributionForm.id;
  return {
    id: formId,
    entity: {
      name: changedData.value.name,
      description: changedData.value.description,
      disabled: changedData.value.disabled,
    },
    fields: changedData.value.attribution_form_fields
      .filter((field) => !!field.attribute)
      .map((field, index) => ({
        priority: index,
        attribute_id: field.attribute.id,
        attribution_form_id: formId,
      })),
  };
}

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);

const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

async function save() {
  const isValid = await formRef.value?.validate();
  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid) {
    return;
  }

  if ('id' in props.attributionForm) {
    await saveEdit();
  } else {
    await saveInsert();
  }

  await nextTick();

  if (!saveError.value) {
    makeModalPersistent(false);
    closeModal();
  }
}

async function saveInsert() {
  const insertData = getInsertData();
  if (!insertData) {
    closeModal();
    return;
  }

  return executeInsertMutation({
    entity: insertData,
  });
}

async function saveEdit() {
  const editedData = getEditData();
  if (!editedData) {
    closeModal();
    return;
  }

  return executeEditMutation(editedData);
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);

function resetErrors() {
  saveInsertError.value = undefined;
  saveEditError.value = undefined;
  validationError.value = null;
}
</script>
