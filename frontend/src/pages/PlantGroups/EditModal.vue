<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PlantGroupModalEdit
      v-if="plantGroup"
      :plant-group="plantGroup"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import PlantGroupModalEdit from 'src/components/PlantGroup/PlantGroupModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantGroup(
      $id: Int!
      $PlantGroupWithCultivar: Boolean! = false
      $CultivarWithLot: Boolean! = false
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      plant_groups_by_pk(id: $id) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['plant_groups'] },
});
const plantGroup = computed(() => data.value?.plant_groups_by_pk);

const { t } = useI18n();
</script>
