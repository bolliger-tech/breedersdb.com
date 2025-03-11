<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PlantGroupModalEdit
      v-if="plantGroup"
      :plant-group="plantGroup"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { PlantGroupInsertInput } from 'src/components/PlantGroup/PlantGroupModalEdit.vue';
import PlantGroupModalEdit from 'src/components/PlantGroup/PlantGroupModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyPlantGroup: PlantGroupInsertInput = {
  name_segment: '',
  name_override: null,
  note: null,
  disabled: false,
};

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
  variables: { id: props.templateId },
  context: { additionalTypenames: ['plant_groups'] },
  pause: !props.templateId,
});

const plantGroup = computed(() => {
  if (props.templateId) {
    if (!data.value?.plant_groups_by_pk) {
      return;
    }
    return {
      ...emptyPlantGroup,
      cultivar_id: data.value.plant_groups_by_pk.cultivar_id,
      disabled: data.value.plant_groups_by_pk.disabled,
    };
  } else {
    return emptyPlantGroup;
  }
});

const { t } = useI18n();
</script>
