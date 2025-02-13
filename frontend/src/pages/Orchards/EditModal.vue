<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <OrchardModalEdit
      v-if="orchard"
      :orchard="orchard"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import OrchardModalEdit from 'src/components/Orchard/OrchardModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Orchard($id: Int!) {
      orchards_by_pk(id: $id) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['orchards'] },
});
const orchard = computed(() => data.value?.orchards_by_pk);

const { t } = useI18n();
</script>
