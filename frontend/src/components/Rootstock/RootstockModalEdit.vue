<template>
  <EntityModalEdit
    :entity="rootstock"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/rootstocks"
    sprite-icon="rootstock"
    :subtitle="t('rootstocks.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <RootstockEntityForm
        :ref="(el) => setFormRef(el)"
        :rootstock="rootstock"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <RootstockButtonDelete
        v-if="'id' in rootstock"
        :rootstock-id="rootstock.id"
        @deleted="
          () => $router.push({ path: '/rootstocks', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import {
  RootstockFragment,
  rootstockFragment,
} from 'src/components/Rootstock/rootstockFragment';
import { graphql } from 'src/graphql';
import RootstockButtonDelete from 'src/components/Rootstock/RootstockButtonDelete.vue';
import RootstockEntityForm from 'src/components/Rootstock/RootstockEntityForm.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';

export type RootstockEditInput = Omit<
  RootstockFragment,
  'created' | 'modified'
>;
export type RootstockInsertInput = Omit<RootstockEditInput, 'id'>;

export interface RootstockModalEditProps {
  rootstock: RootstockEditInput | RootstockInsertInput;
}

defineProps<RootstockModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertRootstock($entity: rootstocks_insert_input!) {
      insert_rootstocks_one(object: $entity) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);

const editMutation = graphql(
  `
    mutation UpdateRootstock($id: Int!, $entity: rootstocks_set_input!) {
      update_rootstocks_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);

const { t } = useI18n();
</script>
