<template>
  <EntityModalEdit
    :entity="cultivar"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/cultivars"
    sprite-icon="cultivar"
    :subtitle="t('cultivars.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <CultivarEntityForm
        :ref="(el) => setFormRef(el)"
        :cultivar="cultivar"
        :is-variety="isVariety"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <CultivarButtonDelete
        v-if="'id' in cultivar"
        :cultivar-id="cultivar.id"
        @deleted="
          () => $router.push({ path: '/cultivar', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import CultivarEntityForm from 'src/components/Cultivar/CultivarEntityForm.vue';
import CultivarButtonDelete from 'src/components/Cultivar/CultivarButtonDelete.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { graphql } from 'src/graphql';
import {
  CultivarFragment,
  cultivarFragment,
} from 'src/components/Cultivar/cultivarFragment';
import { useI18n } from 'vue-i18n';

export type CultivarEditInput = Omit<
  CultivarFragment,
  'created' | 'modified' | 'lot' | 'is_variety'
>;
export type CultivarInsertInput = Omit<CultivarEditInput, 'id' | 'lot_id'> &
  Partial<Pick<CultivarEditInput, 'lot_id'>>;

export interface CultivarModalEditProps {
  cultivar: CultivarEditInput | CultivarInsertInput;
  isVariety: boolean;
}

defineProps<CultivarModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertCultivar(
      $entity: cultivars_insert_input!
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      insert_cultivars_one(object: $entity) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);

export type CultivarEditInsertMutation = typeof insertMutation;

const editMutation = graphql(
  `
    mutation UpdateCultivar(
      $id: Int!
      $entity: cultivars_set_input!
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      update_cultivars_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);

const { t } = useI18n();
</script>
