<template>
  <EntityModalEdit
    :entity="lot"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/lots"
    sprite-icon="lot"
    :subtitle="t('lots.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <LotEntityForm
        :ref="(el) => setFormRef(el)"
        :lot="lot"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <LotButtonDelete
        v-if="'id' in lot"
        :lot-id="lot.id"
        @deleted="() => $router.push({ path: '/lots', query: $route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import { LotFragment, lotFragment } from 'src/components/Lot/lotFragment';
import { graphql } from 'src/graphql';
import LotButtonDelete from 'src/components/Lot/LotButtonDelete.vue';
import LotEntityForm from 'src/components/Lot/LotEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';

export type LotEditInput = Omit<
  LotFragment,
  | 'created'
  | 'modified'
  | 'crossing'
  | 'orchard'
  | 'full_name'
  | 'display_name'
  | 'is_variety'
>;
export type LotInsertInput = Omit<
  LotEditInput,
  'id' | 'orchard_id' | 'crossing_id'
> &
  Partial<Pick<LotEditInput, 'orchard_id' | 'crossing_id'>>;

export interface LotModalEditProps {
  lot: LotEditInput | LotInsertInput;
}

defineProps<LotModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertLot(
      $entity: lots_insert_input!
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      insert_lots_one(object: $entity) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);

const editMutation = graphql(
  `
    mutation UpdateLot(
      $id: Int!
      $entity: lots_set_input!
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      update_lots_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);

const { t } = useI18n();
</script>
