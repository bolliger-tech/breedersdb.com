<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PlantRowModalEdit
      v-if="plantRow"
      :plant-row="plantRow"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PlantRowModalEdit, {
  PlantRowInsertInput,
} from 'src/components/PlantRow/PlantRowModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyPlantRow: PlantRowInsertInput = {
  name: '',
  disabled: false,
  date_created: null,
  date_eliminated: null,
};

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
  variables: { id: props.templateId },
  context: { additionalTypenames: ['plant_rows'] },
  pause: !props.templateId,
});

const plantRow = computed(() => {
  if (props.templateId) {
    if (!data.value?.plant_rows_by_pk) {
      return;
    }
    return {
      ...emptyPlantRow,
      disabled: data.value.plant_rows_by_pk.disabled,
      date_created: data.value.plant_rows_by_pk.date_created,
      date_eliminated: data.value.plant_rows_by_pk.date_eliminated,
      orchard_id: data.value.plant_rows_by_pk.orchard_id,
    };
  } else {
    return emptyPlantRow;
  }
});

const { t } = useI18n();
</script>
