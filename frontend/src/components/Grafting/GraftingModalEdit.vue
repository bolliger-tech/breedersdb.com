<template>
  <EntityModalEdit
    :entity="grafting"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/graftings"
    sprite-icon="grafting"
    :subtitle="t('graftings.title', 1)"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/graftings/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <GraftingEntityForm
        :ref="(el) => setFormRef(el)"
        :grafting="grafting"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <GraftingButtonDelete
        v-if="'id' in grafting"
        :grafting-id="grafting.id"
        @deleted="
          () => $router.push({ path: '/grafting', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import {
  GraftingFragment,
  graftingFragment,
} from 'src/components/Grafting/graftingFragment';
import { graphql } from 'src/graphql';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import GraftingButtonDelete from 'src/components/Grafting/GraftingButtonDelete.vue';
import GraftingEntityForm from 'src/components/Grafting/GraftingEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';

export type GraftingEditInput = Omit<GraftingFragment, 'created' | 'modified'>;
export type GraftingInsertInput = Omit<GraftingEditInput, 'id'>;

export interface GraftingModalEditProps {
  grafting: GraftingEditInput | GraftingInsertInput;
}

defineProps<GraftingModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertGrafting($entity: graftings_insert_input!) {
      insert_graftings_one(object: $entity) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);

const editMutation = graphql(
  `
    mutation UpdateGrafting($id: Int!, $entity: graftings_set_input!) {
      update_graftings_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);

const { t } = useI18n();
</script>
