<template>
  <EntityModalEdit
    :entity="attributionForm"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    :with-insert-data="transformInsertData"
    :with-edit-data="transformEditData"
    index-path="/attribution-forms"
    sprite-icon="form"
    :subtitle="t('attributionForms.title', 1)"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/attribution-forms/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <AttributionFormEntityForm
        :ref="(el) => setFormRef(el)"
        :attribution-form="attributionForm"
        @change="
          (data) => {
            previewAttributionForm = { id: -1, ...data };
            onChange(data);
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
  </EntityModalEdit>
</template>

<script setup lang="ts">
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { graphql, VariablesOf } from 'src/graphql';
import AttributionFormButtonDelete from 'src/components/AttributionForm/AttributionFormButtonDelete.vue';
import AttributionFormEntityForm from 'src/components/AttributionForm/AttributionFormEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import AttributionFormPreview from 'src/components/AttributionForm/AttributionFormPreview.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';

export type AttributionFormEditInput = Omit<
  AttributionFormFragment,
  'created' | 'modified'
>;
export type AttributionFormInsertInput = Omit<AttributionFormEditInput, 'id'>;

export interface AttributionFormModalEditProps {
  attributionForm: AttributionFormEditInput | AttributionFormInsertInput;
}

const props = defineProps<AttributionFormModalEditProps>();

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

function transformInsertData(
  data: unknown,
): VariablesOf<typeof insertMutation> {
  const d = data as AttributionFormInsertInput;
  return {
    entity: {
      name: d.name,
      description: d.description,
      disabled: d.disabled,
      attribution_form_fields: {
        data: d.attribution_form_fields
          .filter((field) => !!field.attribute)
          .map((field, index) => ({
            priority: index,
            attribute_id: field.attribute.id,
          })),
      },
    },
  };
}

function transformEditData(data: unknown): VariablesOf<typeof editMutation> {
  const d = data as AttributionFormEditInput;
  if (!('id' in props.attributionForm)) {
    // this should never happen
    throw new Error('Entity ID is missing');
  }
  const formId = props.attributionForm.id;
  return {
    id: formId,
    entity: {
      name: d.name,
      description: d.description,
      disabled: d.disabled,
    },
    fields: d.attribution_form_fields
      .filter((field) => !!field.attribute)
      .map((field, index) => ({
        priority: index,
        attribute_id: field.attribute.id,
        attribution_form_id: formId,
      })),
  };
}
</script>
