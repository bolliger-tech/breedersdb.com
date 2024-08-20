<template>
  <BaseSpinner v-if="fetching" size="xl" />
  <BaseGraphqlError v-else-if="error" :error="error" />
  <AnalyzeResultTableCellAttributionOverlayDetails
    v-else-if="attribution"
    :data="attribution"
  />
  <div v-else>{{ t('base.noData') }}</div>
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import { ResultOf, graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import AnalyzeResultTableCellAttributionOverlayDetails from './AnalyzeResultTableCellAttributionOverlayDetails.vue';
import {
  plantFragment,
  type PlantFragment,
} from 'src/components/Plant/plantFragment';
import {
  entityAttributionsViewFragment,
  type EntityAttributionsViewFragment,
} from 'src/components/Entity/entityAttributionsViewFragment';
import { computed } from 'vue';

export interface AnalyzeResultTableCellAttributionOverlayProps {
  id: number;
}

type AnalyzeResult = ResultOf<typeof query>['attributions_view'][0];
export type AttributionDetails = EntityAttributionsViewFragment & {
  plant: PlantFragment;
  plant_group: AnalyzeResult['plant_group'];
  cultivar: AnalyzeResult['cultivar'];
  lot: AnalyzeResult['lot'];
};

const props = defineProps<AnalyzeResultTableCellAttributionOverlayProps>();

const query = graphql(
  `
    query AnalyzeResultTableCellAttributionDetails(
      $id: Int!
      $PlantWithSegments: Boolean! = true
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
