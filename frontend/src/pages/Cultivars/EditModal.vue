<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <CultivarModalEdit
    v-else-if="cultivar"
    :cultivar="cultivar"
    :is-variety="cultivar.is_variety"
    :title="t('base.edit')"
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
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import CultivarModalEdit from 'src/components/Cultivar/CultivarModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

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
