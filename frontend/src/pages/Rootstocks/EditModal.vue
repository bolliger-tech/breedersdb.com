<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <RootstockModalEdit
    v-else-if="rootstock"
    :rootstock="rootstock"
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
import { rootstockFragment } from 'src/components/Rootstock/rootstockFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import RootstockModalEdit from 'src/components/Rootstock/RootstockModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Rootstock($id: Int!) {
      rootstocks_by_pk(id: $id) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const rootstock = computed(() => data.value?.rootstocks_by_pk);

const { t } = useI18n();
</script>
