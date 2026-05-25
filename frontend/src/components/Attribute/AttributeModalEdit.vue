<template>
  <EntityModalEdit
    :entity="attribute"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    :with-insert-data="transformInsertData"
    :with-edit-data="transformEditData"
    :edit-mutation-context="{
      additionalTypenames: ['cached_attributions', 'attribute_enum_options'],
    }"
    :insert-mutation-context="{
      additionalTypenames: ['attribute_enum_options'],
    }"
    index-path="/attributes"
    sprite-icon="form"
    :subtitle="t('attributes.title', 1)"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/attributes/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <AttributeEntityForm
        :ref="(el) => setFormRef(el)"
        :attribute="attribute"
        @change="
          (data) => {
            Object.assign(previewAttribute, { id: -1 }, data);
            // @ts-ignore - data is transformed in transformInsertData/transformEditData
            onChange(data);
          }
        "
      />
      <h3 class="q-my-md">{{ t('attributes.preview') }}</h3>
      <AttributePreview :attribute="previewAttribute" />
    </template>

    <template #action-left>
      <AttributeButtonDelete
        v-if="'id' in attribute && !attribute.disabled"
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
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { attributeFragment } from 'src/components/Attribute/attributeFragment';
import type { VariablesOf } from 'src/graphql';
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
    mutation UpdateAttribute(
      $id: Int!
      $entity: attributes_set_input!
      $deleteOptionIds: [Int!]!
      $updateOptions: [attribute_enum_options_updates!]!
      $insertOptions: [attribute_enum_options_insert_input!]!
    ) {
      update_attributes_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...attributeFragment
      }
      delete_attribute_enum_options(where: { id: { _in: $deleteOptionIds } }) {
        affected_rows
      }
      update_attribute_enum_options_many(updates: $updateOptions) {
        affected_rows
      }
      insert_attribute_enum_options(objects: $insertOptions) {
        affected_rows
      }
    }
  `,
  [attributeFragment],
);

function transformInsertData(
  data: unknown,
): VariablesOf<typeof insertMutation> {
  const d = data as AttributeInsertInput;
  const isEnum = d.data_type === 'ENUM';
  return {
    entity: {
      name: d.name,
      description: d.description,
      disabled: d.disabled,
      data_type: d.data_type,
      attribute_type: d.attribute_type,
      validation_rule: d.validation_rule,
      default_value: d.default_value as object | null,
      legend: d.legend,
      ...(isEnum && {
        enum_options: {
          data: (d.enum_options ?? []).map((o, position) => ({
            label: o.label,
            position,
            disabled: o.disabled,
            is_default: o.is_default,
          })),
        },
      }),
    },
  };
}

function transformEditData(data: unknown): VariablesOf<typeof editMutation> {
  const d = data as AttributeEditInput;
  if (!('id' in props.attribute)) {
    // this should never happen
    throw new Error('Entity ID is missing');
  }
  const id = props.attribute.id;
  const isEnum = d.data_type === 'ENUM';
  const original =
    ('enum_options' in props.attribute ? props.attribute.enum_options : []) ??
    [];
  const current = isEnum ? (d.enum_options ?? []) : [];

  // derive position from the index in the full current array so the saved order
  // matches the on-screen order even when new and existing options are interleaved
  const positioned = current.map((o, position) => ({ o, position }));

  const insertOptions = positioned
    .filter(({ o }) => o.id === undefined || o.id === null)
    .map(({ o, position }) => ({
      attribute_id: id,
      label: o.label,
      position,
      disabled: o.disabled,
      is_default: o.is_default,
    }));

  const updateOptions = positioned
    .filter(
      (p): p is { o: typeof p.o & { id: number }; position: number } =>
        typeof p.o.id === 'number',
    )
    .map(({ o, position }) => ({
      where: { id: { _eq: o.id } },
      _set: {
        label: o.label,
        position,
        disabled: o.disabled,
        is_default: o.is_default,
      },
    }))
    // turn defaults off before turning one on, to respect the single-default index
    .sort((a, b) => Number(a._set.is_default) - Number(b._set.is_default));

  const currentIds = new Set(
    current
      .map((o) => o.id)
      .filter((oid): oid is number => typeof oid === 'number'),
  );
  const deleteOptionIds = original
    .map((o) => o.id)
    .filter((oid): oid is number => typeof oid === 'number')
    .filter((oid) => !currentIds.has(oid));

  return {
    id,
    entity: {
      name: d.name,
      description: d.description,
      disabled: d.disabled,
      data_type: d.data_type,
      attribute_type: d.attribute_type,
      validation_rule: d.validation_rule,
      default_value: d.default_value as object | null,
      legend: d.legend,
    },
    deleteOptionIds,
    updateOptions,
    insertOptions,
  };
}

const { t } = useI18n();

const previewAttribute = ref({ id: -1, ...props.attribute });
</script>
