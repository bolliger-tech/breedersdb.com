<template>
  <EntityModalEdit
    :entity="cultivar"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    :edit-mutation-context="{
      additionalTypenames: ['plant_groups', 'plants'],
    }"
    index-path="/cultivars"
    sprite-icon="cultivar"
    :subtitle="t('cultivars.title', 1)"
    :make-label="hasTextTemplate() ? getLabel : undefined"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/cultivars/new/${templateId}`,
          query: $route.query,
        });
      }
    "
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
import type { CultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { useI18n } from 'vue-i18n';
import { makeTextLabel, hasTextTemplate } from 'src/utils/labelUtils';
import { useGetEntityById } from 'src/composables/useGetEntityById';

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

const labelQuery = graphql(`
  query CultivarLabel($id: Int!) {
    cultivars_by_pk(id: $id) {
      id
      display_name
    }
  }
`);

const { getEntity } = useGetEntityById({
  query: labelQuery,
  additionalTypenames: ['cultivars'],
});

async function getLabel(id: number) {
  const data = await getEntity(id);
  const text = data.value?.cultivars_by_pk?.display_name;
  if (!text) {
    throw new Error('Failed to fetch label data');
  }
  const label = makeTextLabel({ text, caption: t('cultivars.title', 1) });
  if (!label) {
    throw new Error('Failed to make label');
  }
  return label;
}
</script>
