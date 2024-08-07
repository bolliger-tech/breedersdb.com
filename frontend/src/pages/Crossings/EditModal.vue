<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <CrossingModalEdit
    v-else-if="crossing"
    :crossing="crossing"
    :title="t('base.edit')"
  />

  <q-card v-else>
    <BaseSpinner size="xl" />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import CrossingModalEdit from 'src/components/Crossing/CrossingModalEdit.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Crossing(
      $id: Int!
      $withParentCultivar: Boolean = false
      $withLot: Boolean = false
      $withLots: Boolean = false
      $withMotherPlants: Boolean = false
    ) {
      crossings_by_pk(id: $id) {
        ...crossingFragment
      }
    }
  `,
  [crossingFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const crossing = computed(() => data.value?.crossings_by_pk);

const { t } = useI18n();
</script>
