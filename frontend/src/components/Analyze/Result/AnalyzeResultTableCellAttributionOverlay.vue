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
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import AnalyzeResultTableCellAttributionOverlayDetails from './AnalyzeResultTableCellAttributionOverlayDetails.vue';
import {
  plantFragment,
  type PlantFragment,
} from 'src/components/Plant/plantFragment';
import { lotFragment, type LotFragment } from 'src/components/Lot/lotFragment';
import {
  attributionsViewFragment,
  type AttributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import {
  plantGroupFragment,
  type PlantGroupFragment,
} from 'src/components/PlantGroup/plantGroupFragment';
import {
  cultivarFragment,
  type CultivarFragment,
} from 'src/components/Cultivar/cultivarFragment';
import { computed } from 'vue';

export interface AnalyzeResultTableCellAttributionOverlayProps {
  id: number;
}

export type AttributionDetails = AttributionsViewFragment & {
  plant:
    | null
    | (Omit<PlantFragment, 'plant_group'> & {
        plant_group: Required<PlantFragment['plant_group']>;
      });
  plant_group:
    | null
    | (Omit<PlantGroupFragment, 'cultivar'> & {
        cultivar: Required<PlantGroupFragment['cultivar']>;
      });
  cultivar:
    | null
    | (Omit<CultivarFragment, 'lot'> & {
        lot: Required<CultivarFragment['lot']>;
      });
  lot:
    | null
    | (Omit<LotFragment, 'orchard' | 'crossing'> & {
        crossing: Required<LotFragment['crossing']>;
      });
  attribution_form: ResultOf<
    typeof query
  >['attributions_view'][0]['attribution_form'];
};

const props = defineProps<AnalyzeResultTableCellAttributionOverlayProps>();

const query = graphql(
  `
    query AnalyzeResultTableCellAttributionDetails(
      $id: Int!
      $PlantWithSegments: Boolean! = true
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $AttributionsViewWithEntites: Boolean! = false
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = true
    ) {
      attributions_view(where: { id: { _eq: $id } }) {
        ...attributionsViewFragment
        plant {
          ...plantFragment
        }
        plant_group {
          ...plantGroupFragment
        }
        cultivar {
          ...cultivarFragment
        }
        lot {
          ...lotFragment
        }
        attribution_form {
          id
          name
        }
      }
    }
  `,
  [
    attributionsViewFragment,
    plantFragment,
    plantGroupFragment,
    cultivarFragment,
    lotFragment,
  ],
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
