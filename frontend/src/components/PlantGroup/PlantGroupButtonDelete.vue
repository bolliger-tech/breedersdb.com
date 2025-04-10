<template>
  <EntityButtonDelete
    :label="
      plantGroupHasPlantsOrAttributions ? t('base.disable') : t('base.delete')
    "
    :error="queryError || deleteError || disableError"
    :fetching="queryFetching || deleting || disabling"
    @delete="
      () =>
        plantGroupHasPlantsOrAttributions
          ? disablePlantGroup()
          : deletePlantGroup()
    "
    @reset-errors="resetErrors"
  >
    <template v-if="plantGroupHasPlantsOrAttributions" #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        :message="t('plantGroups.disableConfirmation')"
      />
    </template>
    <template v-else #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        icon-color="negative"
        :message="t('plantGroups.deleteConfirmation')"
      />
    </template>
  </EntityButtonDelete>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import BaseMessage from '../Base/BaseMessage.vue';

export interface PlantGroupButtonDeleteProps {
  plantGroupId: number;
}
const props = defineProps<PlantGroupButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  deleteError.value = undefined;
  disableError.value = undefined;
}

const {
  data: plantGroupData,
  error: queryError,
  fetching: queryFetching,
} = useQuery({
  query: graphql(`
    query PlantGroupsCountPlants($id: Int!) {
      plant_groups_by_pk(id: $id) {
        plants_aggregate {
          aggregate {
            count
          }
        }
        attributions_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `),
  variables: { id: props.plantGroupId },
  requestPolicy: 'network-only',
});

const plantGroupHasPlantsOrAttributions = computed(() => {
  return (
    !!plantGroupData.value?.plant_groups_by_pk?.plants_aggregate?.aggregate
      ?.count ||
    !!plantGroupData.value?.plant_groups_by_pk?.attributions_aggregate
      ?.aggregate?.count
  );
});

const {
  error: deleteError,
  fetching: deleting,
  ...urqlDelete
} = useMutation(
  graphql(`
    mutation DeletePlantGroup($id: Int!) {
      delete_plant_groups_by_pk(id: $id) {
        id
      }
    }
  `),
);

const {
  error: disableError,
  fetching: disabling,
  ...urqlDisable
} = useMutation(
  graphql(`
    mutation DisablePlantGroup($id: Int!) {
      update_plant_groups_by_pk(
        pk_columns: { id: $id }
        _set: { disabled: true }
      ) {
        id
      }
    }
  `),
);

async function deletePlantGroup() {
  await urqlDelete
    .executeMutation({ id: props.plantGroupId })
    .then((result) => {
      if (!result.data?.delete_plant_groups_by_pk) {
        console.error(`Failed to delete plantGroup ${props.plantGroupId}`);
      } else {
        emit('deleted');
      }
    });
}

async function disablePlantGroup() {
  await urqlDisable
    .executeMutation({ id: props.plantGroupId })
    .then((result) => {
      if (!result.data?.update_plant_groups_by_pk) {
        console.error(`Failed to disable plantGroup ${props.plantGroupId}`);
      } else {
        emit('deleted');
      }
    });
}

const { t } = useI18n();
</script>
