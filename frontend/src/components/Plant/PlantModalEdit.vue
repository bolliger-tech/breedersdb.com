<template>
  <EntityModalEdit
    :entity="plant"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/plants"
    sprite-icon="tree"
    :subtitle="t('plants.title', 1)"
    :title="title"
    :make-label="hasQrTemplate() ? getLabel : undefined"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/plants/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <PlantEntityForm
        :ref="(el) => setFormRef(el)"
        :plant="plant"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <PlantButtonEliminate
        v-if="!plant.disabled && 'id' in plant"
        :plant-id="plant.id"
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import type { PlantFragment } from 'src/components/Plant/plantFragment';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import PlantEntityForm from 'src/components/Plant/PlantEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';
import { makeQrLabel, hasQrTemplate } from 'src/utils/labelUtils';
import { useGetEntityById } from 'src/composables/useGetEntityById';

export type PlantEditInput = Omit<
  PlantFragment,
  'created' | 'modified' | 'cached_attributions'
>;
export type PlantInsertInput = Omit<
  PlantEditInput,
  'id' | 'label_id' | 'cultivar_name' | 'plant_group_name'
>;

export interface PlantModalEditProps {
  plant: PlantEditInput | PlantInsertInput;
  title: string;
}

defineProps<PlantModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertPlant(
      $entity: plants_insert_input!
      $PlantWithSegments: Boolean = true
    ) {
      insert_plants_one(object: $entity) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const editMutation = graphql(
  `
    mutation UpdatePlant(
      $id: Int!
      $entity: plants_set_input!
      $PlantWithSegments: Boolean = true
    ) {
      update_plants_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const labelQuery = graphql(`
  query PlantLabel($id: Int!) {
    plants_by_pk(id: $id) {
      id
      label_id
      plant_group_name
    }
  }
`);

const { getEntity } = useGetEntityById({
  query: labelQuery,
  additionalTypenames: ['plants'],
});

async function getLabel(id: number) {
  const data = await getEntity(id);
  const label_id = data.value?.plants_by_pk?.label_id;
  const plant_group_name = data.value?.plants_by_pk?.plant_group_name;
  if (!label_id || !plant_group_name) {
    throw new Error('Failed to fetch label data');
  }
  const label = makeQrLabel({
    code: label_id,
    desc: plant_group_name,
  });
  if (!label) {
    throw new Error('Failed to make label');
  }
  return label;
}

const { t } = useI18n();
</script>
