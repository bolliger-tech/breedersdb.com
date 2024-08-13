<template>
  <EntityModalEdit
    :entity="crossing"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/crossing"
    sprite-icon="blossom"
    :subtitle="t('crossings.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <CrossingEntityForm
        :ref="(el) => setFormRef(el)"
        :crossing="crossing"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <CrossingButtonDelete
        v-if="'id' in crossing"
        :crossing-id="crossing.id"
        @deleted="
          () => $router.push({ path: '/crossing', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import CrossingEntityForm from 'src/components/Crossing/CrossingEntityForm.vue';
import CrossingButtonDelete from 'src/components/Crossing/CrossingButtonDelete.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { graphql } from 'src/graphql';
import {
  CrossingFragment,
  crossingFragment,
} from 'src/components/Crossing/crossingFragment';
import { useI18n } from 'vue-i18n';

export type CrossingEditInput = Omit<CrossingFragment, 'created' | 'modified'>;
export type CrossingInsertInput = Omit<
  CrossingEditInput,
  'id' | 'mother_cultivar_id' | 'father_cultivar_id'
> &
  Partial<Pick<CrossingEditInput, 'mother_cultivar_id' | 'father_cultivar_id'>>;

export interface CrossingModalEditProps {
  crossing: CrossingEditInput | CrossingInsertInput;
}

defineProps<CrossingModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertCrossing(
      $entity: crossings_insert_input!
      $CultivarWithLot: Boolean = false
    ) {
      insert_crossings_one(object: $entity) {
        ...crossingFragment
      }
    }
  `,
  [crossingFragment],
);

export type CrossingEditInsertMutation = typeof insertMutation;

const editMutation = graphql(
  `
    mutation UpdateCrossing(
      $id: Int!
      $entity: crossings_set_input!
      $CultivarWithLot: Boolean = false
    ) {
      update_crossings_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...crossingFragment
      }
    }
  `,
  [crossingFragment],
);

const { t } = useI18n();
</script>
