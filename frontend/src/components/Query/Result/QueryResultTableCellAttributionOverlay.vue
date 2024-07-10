<template>
  <BaseSpinner v-if="fetching" size="xl" />
  <BaseGraphqlError v-else-if="error" :error="error" />
  <QueryResultTableCellAttributionOverlayDetails
    v-else-if="attribution"
    :data="attribution"
  />
  <div v-else>{{ t('result.noData') }}</div>
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import { ResultOf, graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import QueryResultTableCellAttributionOverlayDetails from './QueryResultTableCellAttributionOverlayDetails.vue';
import {
  plantFragment,
  type PlantFragment,
} from 'src/components/Plant/plantFragment';
import {
  entityAttributionsViewFragment,
  type EntityAttributionsViewFragment,
} from 'src/components/Entity/entityAttributionsViewFragment';
import { computed } from 'vue';

export interface QueryResultTableCellAttributionOverlayProps {
  id: number;
}

type QueryResult = ResultOf<typeof query>['attributions_view'][0];
export type AttributionDetails = EntityAttributionsViewFragment & {
  plant: PlantFragment;
  plant_group: QueryResult['plant_group'];
  cultivar: QueryResult['cultivar'];
  lot: QueryResult['lot'];
};

const props = defineProps<QueryResultTableCellAttributionOverlayProps>();

const query = graphql(
  `
    query QueryResultTableCellAttributionDetails(
      $id: Int!
      $withAttributions: Boolean! = false
      $withSegments: Boolean! = true
    ) {
      attributions_view(where: { id: { _eq: $id } }) {
        ...entityAttributionsViewFragment
        plant {
          ...plantFragment
        }
        plant_group {
          id
          display_name
          note
        }
        cultivar {
          id
          display_name
          acronym
          breeder
          registration
          note
        }
        lot {
          id
          display_name
          date_sowed
          numb_seeds_sowed
          numb_seedlings_grown
          seed_tray
          date_planted
          numb_seedlings_planted
          plot
          note
        }
      }
    }
  `,
  [plantFragment, entityAttributionsViewFragment],
);

const { data, fetching, error } = useQuery({
  query,
  variables: { id: props.id },
  requestPolicy: 'cache-first',
});

const attribution = computed(() =>
  data.value
    ? (data.value.attributions_view[0] as AttributionDetails)
    : undefined,
);

const { t } = useI18n();
</script>
