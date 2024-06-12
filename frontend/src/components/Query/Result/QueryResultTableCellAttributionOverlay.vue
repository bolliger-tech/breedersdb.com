<template>
  <BaseSpinner v-if="fetching" size="xl" />
  <BaseGraphqlError v-else-if="error" :error="error" />
  <QueryResultTableCellAttributionOverlayDetails
    v-else-if="data?.attributions_view[0]"
    :data="data?.attributions_view[0]"
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

export interface QueryResultTableCellAttributionOverlayProps {
  id: number;
}

export type AttributionDetails = ResultOf<typeof query>['attributions_view'][0];

const props = defineProps<QueryResultTableCellAttributionOverlayProps>();

const query = graphql(`
  query QueryResultTableCellAttributionDetails($id: Int!) {
    attributions_view(where: { id: { _eq: $id } }) {
      id
      integer_value
      float_value
      text_value
      boolean_value
      date_value
      note
      exceptional_attribution
      attribute_name
      attribute_id
      data_type
      attribute_type
      attribution_id
      plant {
        id
        label_id
        cultivar_name
        date_grafted
        date_planted
        date_eliminated
        plant_row {
          id
          name
          orchard {
            id
            name
          }
        }
        serial_in_plant_row
        distance_plant_row_start
        note
      }
      cultivar {
        id
        name
        common_name
        acronym
        breeder
        registration
        note
      }
      lot {
        id
        name
        date_sowed
        numb_seeds_sowed
        numb_seedlings_grown
        seed_tray
        date_planted
        numb_seedlings_planted
        plot
        note
      }
      author
      date_attributed
    }
  }
`);

const { data, fetching, error } = useQuery({
  query,
  variables: { id: props.id },
  requestPolicy: 'cache-first',
});

const { t } = useI18n();
</script>
