<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <CrossingModalEdit
      v-if="crossing"
      :crossing="crossing"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import CrossingModalEdit from 'src/components/Crossing/CrossingModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Crossing($id: Int!) {
      crossings_by_pk(id: $id) {
        ...crossingFragment
      }
    }
  `,
  [crossingFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['crossings'] },
});
const crossing = computed(() => data.value?.crossings_by_pk);

const { t } = useI18n();
</script>
