<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <LotModalEdit
      v-if="lot"
      :lot="lot"
      :title="t('base.edit')"
      :is-variety="lot.is_variety"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import LotModalEdit from 'src/components/Lot/LotModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

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
  context: { additionalTypenames: ['lots'] },
});
const lot = computed(() => data.value?.lots_by_pk);

const { t } = useI18n();
</script>
