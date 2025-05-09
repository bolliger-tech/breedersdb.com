<template>
  <EntityModalEdit
    :entity="plantRow"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/rows"
    sprite-icon="rows"
    :subtitle="t('plantRows.title', 1)"
    :make-label="hasTextTemplate() ? getLabel : undefined"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/rows/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <PlantRowEntityForm
        :ref="(el) => setFormRef(el)"
        :plant-row="plantRow"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <PlantRowButtonDelete
        v-if="'id' in plantRow && !plantRow.disabled"
        :plant-row-id="plantRow.id"
        @deleted="() => $router.push({ path: '/rows', query: $route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import type { PlantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { graphql } from 'src/graphql';
import PlantRowButtonDelete from 'src/components/PlantRow/PlantRowButtonDelete.vue';
import PlantRowEntityForm from 'src/components/PlantRow/PlantRowEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';
import { makeTextLabel, hasTextTemplate } from 'src/utils/labelUtils';
import { useGetEntityById } from 'src/composables/useGetEntityById';

export type PlantRowEditInput = Omit<
  PlantRowFragment,
  'created' | 'modified' | 'orchard'
>;
export type PlantRowInsertInput = Omit<PlantRowEditInput, 'id' | 'orchard_id'> &
  Partial<Pick<PlantRowEditInput, 'orchard_id'>>;

export interface PlantRowModalEditProps {
  plantRow: PlantRowEditInput | PlantRowInsertInput;
}

defineProps<PlantRowModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertPlantRow($entity: plant_rows_insert_input!) {
      insert_plant_rows_one(object: $entity) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const editMutation = graphql(
  `
    mutation UpdatePlantRow($id: Int!, $entity: plant_rows_set_input!) {
      update_plant_rows_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const { t } = useI18n();

const labelQuery = graphql(`
  query PlantRowLabel($id: Int!) {
    plant_rows_by_pk(id: $id) {
      id
      name
    }
  }
`);

const { getEntity } = useGetEntityById({
  query: labelQuery,
  additionalTypenames: ['plant_rows'],
});

async function getLabel(id: number) {
  const data = await getEntity(id);
  const text = data.value?.plant_rows_by_pk?.name;
  if (!text) {
    throw new Error('Failed to fetch label data');
  }
  const label = makeTextLabel({ text, caption: t('plantRows.title', 1) });
  if (!label) {
    throw new Error('Failed to make label');
  }
  return label;
}
</script>
