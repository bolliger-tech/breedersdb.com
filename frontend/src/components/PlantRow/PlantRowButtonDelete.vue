<template>
  <EntityButtonDelete
    :label="plantRowHasPlants ? t('plantRows.disable') : t('plantRows.delete')"
    :error="queryError || deleteError || disableError"
    :fetching="queryFetching || deleting || disabling"
    @delete="() => (plantRowHasPlants ? disablePlantRow() : deletePlantRow())"
    @reset-errors="resetErrors"
  >
    <template v-if="plantRowHasPlants" #message>
      <div class="col-auto">
        <q-avatar icon="warning" color="negative" text-color="white" />
      </div>
      <div class="col">
        {{ t('plantRows.disableConfirmation') }}
      </div>
    </template>
    <template v-else #message>
      <div class="col-auto">
        <q-avatar icon="warning" color="negative" text-color="white" />
      </div>
      <div class="col">
        <span class="text-negative">{{
          t('plantRows.deleteConfirmation')
        }}</span>
      </div>
    </template>
  </EntityButtonDelete>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';

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
});

const plantRowHasPlants = computed(() => {
  return plantRowData.value?.plant_rows_by_pk?.plants_aggregate?.aggregate
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
