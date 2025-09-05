<template>
  <EntityModalEdit
    :entity="crossing"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    :edit-mutation-context="{
      additionalTypenames: ['lots', 'cultivars', 'plant_groups', 'plants'],
    }"
    index-path="/crossings"
    sprite-icon="blossom"
    :subtitle="t('crossings.title', 1)"
    :make-label="hasTextTemplate() ? getLabel : undefined"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/crossings/new/${templateId}`,
          query: $route.query,
        });
      }
    "
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
import type { CrossingFragment } from 'src/components/Crossing/crossingFragment';
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { useI18n } from 'vue-i18n';
import { makeTextLabel, hasTextTemplate } from 'src/utils/labelUtils';
import { useGetEntityById } from 'src/composables/useGetEntityById';

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
    mutation InsertCrossing($entity: crossings_insert_input!) {
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
    mutation UpdateCrossing($id: Int!, $entity: crossings_set_input!) {
      update_crossings_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...crossingFragment
      }
    }
  `,
  [crossingFragment],
);

const { t } = useI18n();

const labelQuery = graphql(`
  query CrossingLabel($id: Int!) {
    crossings_by_pk(id: $id) {
      id
      name
    }
  }
`);

const { getEntity } = useGetEntityById({
  query: labelQuery,
  additionalTypenames: ['crossings'],
});

async function getLabel(id: number) {
  const data = await getEntity(id);
  const text = data.value?.crossings_by_pk?.name;
  if (!text) {
    throw new Error('Failed to fetch label data');
  }
  const label = makeTextLabel({ text, caption: t('crossings.title', 1) });
  if (!label) {
    throw new Error('Failed to make label');
  }
  return label;
}
</script>
