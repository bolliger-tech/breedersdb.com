<template>
  <EntityModalEdit
    :entity="motherPlant"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/mother-plants"
    sprite-icon="female"
    :subtitle="t('motherPlants.title', 1)"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/mother-plants/new/${templateId}`,
          query: $route.query,
        });
      }
    "
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
              path: '/mother-plants',
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
import type { MotherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { useI18n } from 'vue-i18n';

export type MotherPlantEditInput = Omit<
  MotherPlantFragment,
  'created' | 'modified' | 'plant' | 'pollen' | 'crossing'
>;
export type MotherPlantInsertInput = Omit<
  MotherPlantEditInput,
  'id' | 'plant_id' | 'pollen_id' | 'crossing_id'
> &
  Partial<Pick<MotherPlantEditInput, 'plant_id' | 'pollen_id' | 'crossing_id'>>;

export interface MotherPlantModalEditProps {
  motherPlant: MotherPlantEditInput | MotherPlantInsertInput;
}

defineProps<MotherPlantModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertMotherPlant(
      $entity: mother_plants_insert_input!
      $MotherPlantWithPlant: Boolean = false
      $MotherPlantWithCrossing: Boolean = false
      $MotherPlantWithPollen: Boolean = false
      $PollenWithCultivar: Boolean = false
      $PlantWithSegments: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
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
      $MotherPlantWithPlant: Boolean = false
      $MotherPlantWithCrossing: Boolean = false
      $MotherPlantWithPollen: Boolean = false
      $PollenWithCultivar: Boolean = false
      $PlantWithSegments: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
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
