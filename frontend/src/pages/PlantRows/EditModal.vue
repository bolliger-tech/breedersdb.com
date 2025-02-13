<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PlantRowModalEdit
      v-if="plantRow"
      :plant-row="plantRow"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import PlantRowModalEdit from 'src/components/PlantRow/PlantRowModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantRow($id: Int!) {
      plant_rows_by_pk(id: $id) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['plant_rows'] },
});
const plantRow = computed(() => data.value?.plant_rows_by_pk);

const { t } = useI18n();
</script>
