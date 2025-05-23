<template>
  <EntityModalEdit
    :entity="plantGroup"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/groups"
    sprite-icon="tree-group"
    :subtitle="t('plantGroups.title', 1)"
    :make-label="hasQrTemplate() ? getLabel : undefined"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/groups/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <PlantGroupEntityForm
        :ref="(el) => setFormRef(el)"
        :plant-group="plantGroup"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <PlantGroupButtonDelete
        v-if="'id' in plantGroup && !plantGroup.disabled"
        :plant-group-id="plantGroup.id"
        @deleted="() => $router.push({ path: '/groups', query: $route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import type { PlantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { graphql } from 'src/graphql';
import PlantGroupButtonDelete from 'src/components/PlantGroup/PlantGroupButtonDelete.vue';
import PlantGroupEntityForm from 'src/components/PlantGroup/PlantGroupEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';
import { makeQrLabel, hasQrTemplate } from 'src/utils/labelUtils';
import { useGetEntityById } from 'src/composables/useGetEntityById';

export type PlantGroupEditInput = Omit<
  PlantGroupFragment,
  | 'created'
  | 'modified'
  | 'cultivar'
  | 'full_name'
  | 'display_name'
  | 'label_id'
  | 'cultivar_name'
>;
export type PlantGroupInsertInput = Omit<
  PlantGroupEditInput,
  'id' | 'cultivar_id'
> &
  Partial<Pick<PlantGroupEditInput, 'cultivar_id'>>;

export interface PlantGroupModalEditProps {
  plantGroup: PlantGroupEditInput | PlantGroupInsertInput;
}

defineProps<PlantGroupModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertPlantGroup(
      $entity: plant_groups_insert_input!
      $PlantGroupWithCultivar: Boolean! = false
      $CultivarWithLot: Boolean! = false
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      insert_plant_groups_one(object: $entity) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);

const editMutation = graphql(
  `
    mutation UpdatePlantGroup(
      $id: Int!
      $entity: plant_groups_set_input!
      $PlantGroupWithCultivar: Boolean! = false
      $CultivarWithLot: Boolean! = false
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      update_plant_groups_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);

const labelQuery = graphql(`
  query PlantGroupLabel($id: Int!) {
    plant_groups_by_pk(id: $id) {
      id
      label_id
      display_name
    }
  }
`);

const { getEntity } = useGetEntityById({
  query: labelQuery,
  additionalTypenames: ['plant_groups'],
});

async function getLabel(id: number) {
  const data = await getEntity(id);
  const label_id = data.value?.plant_groups_by_pk?.label_id;
  const display_name = data.value?.plant_groups_by_pk?.display_name;
  if (!label_id || !display_name) {
    throw new Error('Failed to fetch label data');
  }
  const label = makeQrLabel({
    code: label_id,
    desc: display_name,
  });
  if (!label) {
    throw new Error('Failed to make label');
  }
  return label;
}

const { t } = useI18n();
</script>
