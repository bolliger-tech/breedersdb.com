<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <LotModalEdit
    v-else-if="lot"
    :lot="lot"
    :title="t('base.edit')"
    :is-variety="lot.is_variety"
  />

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import LotModalEdit from 'src/components/Lot/LotModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Lot(
      $id: Int!
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = false
    ) {
      lots_by_pk(id: $id) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const lot = computed(() => data.value?.lots_by_pk);

const { t } = useI18n();
</script>
