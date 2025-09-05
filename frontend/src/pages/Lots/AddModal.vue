<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <LotModalEdit
      v-if="lot"
      :lot="lot"
      :title="t('base.new')"
      :is-variety="false"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { LotInsertInput } from 'src/components/Lot/LotModalEdit.vue';
import LotModalEdit from 'src/components/Lot/LotModalEdit.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { cachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyLot: LotInsertInput = {
  name_segment: '',
  note: null,
  name_override: null,
  date_sowed: null,
  numb_seeds_sowed: null,
  numb_seedlings_grown: null,
  seed_tray: null,
  date_planted: null,
  numb_seedlings_planted: null,
  plot: null,
};

const query = graphql(
  `
    query Lot(
      $id: Int!
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
      $CachedAttributionsWithEntites: Boolean! = false
    ) {
      lots_by_pk(id: $id) {
        ...lotFragment
        cultivars {
          id
          display_name
          created
        }
        cached_attributions {
          ...cachedAttributionsFragment
        }
      }
    }
  `,
  [lotFragment, cachedAttributionsFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['lots'] },
  pause: !props.templateId,
});

const lot = computed(() => {
  if (props.templateId) {
    if (!data.value?.lots_by_pk) {
      return;
    }
    return {
      ...emptyLot,
      orchard_id: data.value.lots_by_pk.orchard_id,
      crossing_id: data.value.lots_by_pk.crossing_id,
      date_sowed: data.value.lots_by_pk.date_sowed,
      seed_tray: data.value.lots_by_pk.seed_tray,
      date_planted: data.value.lots_by_pk.date_planted,
      plot: data.value.lots_by_pk.plot,
    };
  } else {
    return emptyLot;
  }
});

const { t } = useI18n();
</script>
