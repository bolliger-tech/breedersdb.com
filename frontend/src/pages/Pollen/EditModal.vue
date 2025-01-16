<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PollenModalEdit v-if="pollen" :pollen="pollen" :title="t('base.edit')" />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import PollenModalEdit from 'src/components/Pollen/PollenModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Pollen(
      $id: Int!
      $PollenWithCultivar: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      pollen_by_pk(id: $id) {
        ...pollenFragment
      }
    }
  `,
  [pollenFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['pollen'] },
});
const pollen = computed(() => data.value?.pollen_by_pk);

const { t } = useI18n();
</script>
