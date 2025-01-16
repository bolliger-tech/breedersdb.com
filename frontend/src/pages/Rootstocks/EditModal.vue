<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <RootstockModalEdit
      v-if="rootstock"
      :rootstock="rootstock"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { rootstockFragment } from 'src/components/Rootstock/rootstockFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import RootstockModalEdit from 'src/components/Rootstock/RootstockModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

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
  context: { additionalTypenames: ['rootstocks'] },
});
const rootstock = computed(() => data.value?.rootstocks_by_pk);

const { t } = useI18n();
</script>
