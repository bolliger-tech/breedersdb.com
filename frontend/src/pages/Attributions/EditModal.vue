<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <AttributionModalEdit
    v-else-if="attribution"
    :attribution="attribution"
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
import {
  AttributionsViewFragment,
  attributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionModalEdit from 'src/components/Attribution/AttributionModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import {
  AttributeFragment,
  attributeFragment,
} from 'src/components/Attribute/attributeFragment';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query AttributionsView(
      $id: Int!
      $AttributionsViewWithEntites: Boolean = true
    ) {
      attributions_view(where: { id: { _eq: $id } }) {
        ...attributionsViewFragment
        attribute {
          ...attributeFragment
        }
      }
    }
  `,
  [attributionsViewFragment, attributeFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const attribution = computed(
  () =>
    data.value?.attributions_view[0] as
      | (AttributionsViewFragment & { attribute: AttributeFragment })
      | undefined,
);

const { t } = useI18n();
</script>
