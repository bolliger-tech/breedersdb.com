<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <PlantModalEdit v-else-if="plant" :plant="plant" :title="t('base.edit')" />

  <q-card v-else>
    <BaseSpinner size="xl" />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import PlantModalEdit from 'src/components/Plant/PlantModalEdit.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant(
      $id: Int!
      $withAttributions: Boolean = false
      $withSegments: Boolean = true
    ) {
      plants_by_pk(id: $id) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);
const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const plant = computed(() => data.value?.plants_by_pk);

const { t } = useI18n();
</script>
