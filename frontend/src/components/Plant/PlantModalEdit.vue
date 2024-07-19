<template>
  <EntityModalEdit
    :entity="plant"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/plants"
    sprite-icon="tree"
    :subtitle="t('plants.title', 1)"
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
import {
  PlantFragment,
  plantFragment,
} from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import PlantEntityForm from 'src/components/Plant/PlantEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';

export type PlantEditInput = PlantFragment;
export type PlantInsertInput = Omit<
  PlantFragment,
  | 'id'
  | 'label_id'
  | 'cultivar_name'
  | 'plant_group_name'
  | 'created'
  | 'modified'
  | 'attributions_views'
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
      $withSegments: Boolean = true
      $withAttributions: Boolean = false
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
      $withSegments: Boolean = true
      $withAttributions: Boolean = false
    ) {
      update_plants_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const { t } = useI18n();
</script>
