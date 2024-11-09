<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <OrchardModalEdit
    v-else-if="orchard"
    :orchard="orchard"
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
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import OrchardModalEdit from 'src/components/Orchard/OrchardModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

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
