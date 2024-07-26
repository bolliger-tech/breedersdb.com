<template>
  <EntityModalEdit
    :entity="attribute"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/attributes"
    sprite-icon="form"
    :subtitle="t('attributes.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <AttributeEntityForm
        :ref="(el) => setFormRef(el)"
        :attribute="attribute"
        @change="
          (data) => {
            previewAttribute = { id: -1, ...data };
            isDisabled = data.disabled;
            onChange({
              ...data,
              default_value: data.default_value as object | null,
            });
          }
        "
      />
      <h3 class="q-my-md">{{ t('attributes.preview') }}</h3>
      <AttributePreview v-if="!isDisabled" :attribute="previewAttribute" />
      <p v-else>{{ t('attributes.disabledPreviewMsg') }}</p>
    </template>

    <template #action-left>
      <AttributeButtonDelete
        v-if="'id' in attribute"
        :attribute-id="attribute.id"
        @deleted="
          () => $router.push({ path: '/attributes', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import {
  AttributeFragment,
  attributeFragment,
} from 'src/components/Attribute/attributeFragment';
import { graphql } from 'src/graphql';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import AttributeButtonDelete from 'src/components/Attribute/AttributeButtonDelete.vue';
import AttributeEntityForm from 'src/components/Attribute/AttributeEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';
import AttributePreview from 'src/components/Attribute/AttributePreview.vue';

export type AttributeEditInput = DistributiveOmit<
  AttributeFragment,
  'created' | 'modified'
>;
export type AttributeInsertInput = DistributiveOmit<AttributeEditInput, 'id'>;

export interface AttributeModalEditProps {
  attribute: AttributeEditInput | AttributeInsertInput;
}

const props = defineProps<AttributeModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertAttribute($entity: attributes_insert_input!) {
      insert_attributes_one(object: $entity) {
        ...attributeFragment
      }
    }
  `,
  [attributeFragment],
);

const editMutation = graphql(
  `
    mutation UpdateAttribute($id: Int!, $entity: attributes_set_input!) {
      update_attributes_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...attributeFragment
      }
    }
  `,
  [attributeFragment],
);

const { t } = useI18n();

const previewAttribute = ref({ id: -1, ...props.attribute });
const isDisabled = ref(props.attribute.disabled);
</script>
