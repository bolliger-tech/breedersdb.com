<template>
  <EntityButtonDelete
    :label="plantRowHasPlants ? t('base.disable') : t('base.delete')"
    :error="queryError || deleteError || disableError"
    :fetching="queryFetching || deleting || disabling"
    @delete="() => (plantRowHasPlants ? disablePlantRow() : deletePlantRow())"
    @reset-errors="resetErrors"
  >
    <template v-if="plantRowHasPlants" #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        :message="t('plantRows.disableConfirmation')"
      />
    </template>
    <template v-else #message>
      <BaseMessage
        type="warning"
        icon-size="xl"
        icon-color="negative"
        :message="t('plantRows.deleteConfirmation')"
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

export interface PlantRowButtonDeleteProps {
  plantRowId: number;
}
const props = defineProps<PlantRowButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  deleteError.value = undefined;
  disableError.value = undefined;
}

const {
  data: plantRowData,
  error: queryError,
  fetching: queryFetching,
} = useQuery({
  query: graphql(`
    query PlantRowsCountPlants($id: Int!) {
      plant_rows_by_pk(id: $id) {
        plants_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `),
  variables: { id: props.plantRowId },
  requestPolicy: 'network-only',
});

const plantRowHasPlants = computed(() => {
  return !!plantRowData.value?.plant_rows_by_pk?.plants_aggregate?.aggregate
    ?.count;
});

const {
  error: deleteError,
  executeMutation: executeDeletePlantRow,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeletePlantRow($id: Int!) {
      delete_plant_rows_by_pk(id: $id) {
        id
      }
    }
  `),
);

const {
  error: disableError,
  executeMutation: executeDisablePlantRow,
  fetching: disabling,
} = useMutation(
  graphql(`
    mutation DisablePlantRow($id: Int!) {
      update_plant_rows_by_pk(
        pk_columns: { id: $id }
        _set: { date_eliminated: "now()" }
      ) {
        id
      }
    }
  `),
);

function deletePlantRow() {
  executeDeletePlantRow({ id: props.plantRowId }).then((result) => {
    if (!result.data?.delete_plant_rows_by_pk) {
      console.error(`Failed to delete plantRow ${props.plantRowId}`);
    } else {
      emit('deleted');
    }
  });
}

function disablePlantRow() {
  executeDisablePlantRow({ id: props.plantRowId }).then((result) => {
    if (!result.data?.update_plant_rows_by_pk) {
      console.error(`Failed to disable plantRow ${props.plantRowId}`);
    } else {
      emit('deleted');
    }
  });
}

const { t } = useI18n();
</script>
