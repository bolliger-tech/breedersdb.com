<template>
  <EntityModalEdit
    :entity="motherPlant"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/crossings/mother-plant"
    sprite-icon="female"
    :subtitle="t('motherPlants.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <MotherPlantEntityForm
        :ref="(el) => setFormRef(el)"
        :mother-plant="motherPlant"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <MotherPlantButtonDelete
        v-if="'id' in motherPlant"
        :mother-plant-id="motherPlant.id"
        @deleted="
          () =>
            $router.push({
              path: '/crossings/mother-plant',
              query: $route.query,
            })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import MotherPlantEntityForm from 'src/components/MotherPlant/MotherPlantEntityForm.vue';
import MotherPlantButtonDelete from 'src/components/MotherPlant/MotherPlantButtonDelete.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { graphql } from 'src/graphql';
import {
  MotherPlantFragment,
  motherPlantFragment,
} from 'src/components/MotherPlant/motherPlantFragment';
import { useI18n } from 'vue-i18n';

export type MotherPlantEditInput = Omit<
  MotherPlantFragment,
  'created' | 'modified'
>;
export type MotherPlantInsertInput = Omit<
  MotherPlantEditInput,
  | 'id'
  | 'plant_id'
  | 'pollen_id'
  | 'crossing_id'
  | 'plant'
  | 'pollen'
  | 'crossing'
> &
  Partial<
    Pick<
      MotherPlantEditInput,
      'plant' | 'pollen' | 'crossing' | 'plant_id' | 'pollen_id' | 'crossing_id'
    >
  >;

export interface MotherPlantModalEditProps {
  motherPlant: MotherPlantEditInput | MotherPlantInsertInput;
}

defineProps<MotherPlantModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertMotherPlant(
      $entity: mother_plants_insert_input!
      $withPlant: Boolean = false
      $withPollen: Boolean = false
      $withCrossing: Boolean = false
      $withParentCultivar: Boolean = false
      $withCultivar: Boolean = false
      $withMotherPlants: Boolean = false
      $withSegments: Boolean = false
      $withAttributions: Boolean = false
    ) {
      insert_mother_plants_one(object: $entity) {
        ...motherPlantFragment
      }
    }
  `,
  [motherPlantFragment],
);

export type MotherPlantEditInsertMutation = typeof insertMutation;

const editMutation = graphql(
  `
    mutation UpdateMotherPlant(
      $id: Int!
      $entity: mother_plants_set_input!
      $withPlant: Boolean = false
      $withPollen: Boolean = false
      $withCrossing: Boolean = false
      $withParentCultivar: Boolean = false
      $withCultivar: Boolean = false
      $withMotherPlants: Boolean = false
      $withSegments: Boolean = false
      $withAttributions: Boolean = false
    ) {
      update_mother_plants_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...motherPlantFragment
      }
    }
  `,
  [motherPlantFragment],
);

const { t } = useI18n();
</script>
