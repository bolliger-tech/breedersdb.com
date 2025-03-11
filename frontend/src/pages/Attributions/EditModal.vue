<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <AttributionModalEdit
      v-if="attribution"
      :attribution="attribution"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import type { AttributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { attributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionModalEdit from 'src/components/Attribution/AttributionModalEdit.vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { attributeFragment } from 'src/components/Attribute/attributeFragment';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

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
  context: { additionalTypenames: ['attributions_view'] },
});
const attribution = computed(
  () =>
    data.value?.attributions_view[0] as
      | (AttributionsViewFragment & { attribute: AttributeFragment })
      | undefined,
);

const { t } = useI18n();
</script>
