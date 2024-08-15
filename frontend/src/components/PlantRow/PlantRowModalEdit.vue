<template>
  <EntityModalEdit
    :entity="plantRow"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/rows"
    sprite-icon="rows"
    :subtitle="t('plantRows.title', 1)"
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
import {
  PlantRowFragment,
  plantRowFragment,
} from 'src/components/PlantRow/plantRowFragment';
import { graphql } from 'src/graphql';
import PlantRowButtonDelete from 'src/components/PlantRow/PlantRowButtonDelete.vue';
import PlantRowEntityForm from 'src/components/PlantRow/PlantRowEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';

export type PlantRowEditInput = Omit<PlantRowFragment, 'created' | 'modified'>;
export type PlantRowInsertInput = Omit<PlantRowEditInput, 'id' | 'orchard'> &
  Partial<Pick<PlantRowEditInput, 'orchard'>>;

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
</script>
