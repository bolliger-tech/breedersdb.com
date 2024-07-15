<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <PlantRowModalEdit
    v-else-if="plantRow"
    :plant-row="plantRow"
    :title="t('base.edit')"
  />

  <q-card v-else>
    <BaseSpinner size="xl" />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import PlantRowModalEdit from 'src/components/PlantRow/PlantRowModalEdit.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantRow($id: Int!, $withPlants: Boolean = false) {
      plant_rows_by_pk(id: $id) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const plantRow = computed(() => data.value?.plant_rows_by_pk);

const { t } = useI18n();
</script>
