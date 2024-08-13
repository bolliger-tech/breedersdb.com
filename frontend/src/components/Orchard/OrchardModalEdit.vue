<template>
  <EntityModalEdit
    :entity="orchard"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/orchard"
    sprite-icon="orchard"
    :subtitle="t('orchards.title', 1)"
  >
    <template #form="{ setFormRef, onChange }">
      <OrchardEntityForm
        :ref="(el) => setFormRef(el)"
        :orchard="orchard"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <OrchardButtonDelete
        v-if="'id' in orchard"
        :orchard-id="orchard.id"
        @deleted="() => $router.push({ path: '/orchard', query: $route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import OrchardEntityForm from 'src/components/Orchard/OrchardEntityForm.vue';
import OrchardButtonDelete from 'src/components/Orchard/OrchardButtonDelete.vue';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { graphql } from 'src/graphql';
import {
  OrchardFragment,
  orchardFragment,
} from 'src/components/Orchard/orchardFragment';
import { useI18n } from 'vue-i18n';

export type OrchardEditInput = Omit<OrchardFragment, 'created' | 'modified'>;
export type OrchardInsertInput = Omit<OrchardEditInput, 'id'>;

export interface OrchardModalEditProps {
  orchard: OrchardEditInput | OrchardInsertInput;
}

defineProps<OrchardModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertOrchard($entity: orchards_insert_input!) {
      insert_orchards_one(object: $entity) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);

export type OrchardEditInsertMutation = typeof insertMutation;

const editMutation = graphql(
  `
    mutation UpdateOrchard($id: Int!, $entity: orchards_set_input!) {
      update_orchards_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);

const { t } = useI18n();
</script>
