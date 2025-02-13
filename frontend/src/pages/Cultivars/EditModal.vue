<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <CultivarModalEdit
      v-if="cultivar"
      :cultivar="cultivar"
      :is-variety="cultivar.is_variety"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import CultivarModalEdit from 'src/components/Cultivar/CultivarModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Cultivar(
      $id: Int!
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      cultivars_by_pk(id: $id) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['cultivars'] },
});
const cultivar = computed(() => data.value?.cultivars_by_pk);

const { t } = useI18n();
</script>
