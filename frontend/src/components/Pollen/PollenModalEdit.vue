<template>
  <EntityModalEdit
    :entity="pollen"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/crossings/pollen"
    sprite-icon="male"
    :subtitle="t('pollen.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <PollenEntityForm
        :ref="(el) => setFormRef(el)"
        :pollen="pollen"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <PollenButtonDelete
        v-if="'id' in pollen"
        :pollen-id="pollen.id"
        @deleted="
          () => $router.push({ path: '/crossings/pollen', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import PollenEntityForm from 'src/components/Pollen/PollenEntityForm.vue';
import PollenButtonDelete from 'src/components/Pollen/PollenButtonDelete.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { graphql } from 'src/graphql';
import {
  PollenFragment,
  pollenFragment,
} from 'src/components/Pollen/pollenFragment';
import { useI18n } from 'vue-i18n';

export type PollenEditInput = Omit<PollenFragment, 'created' | 'modified'>;
export type PollenInsertInput = Omit<PollenEditInput, 'id'>;

export interface PollenModalEditProps {
  pollen: PollenEditInput | PollenInsertInput;
}

defineProps<PollenModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertPollen(
      $entity: pollen_insert_input!
      $withCultivar: Boolean = false
      $withMotherPlants: Boolean = false
    ) {
      insert_pollen_one(object: $entity) {
        ...pollenFragment
      }
    }
  `,
  [pollenFragment],
);

export type PollenEditInsertMutation = typeof insertMutation;

const editMutation = graphql(
  `
    mutation UpdatePollen(
      $id: Int!
      $entity: pollen_set_input!
      $withCultivar: Boolean = false
      $withMotherPlants: Boolean = false
    ) {
      update_pollen_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...pollenFragment
      }
    }
  `,
  [pollenFragment],
);

const { t } = useI18n();
</script>
