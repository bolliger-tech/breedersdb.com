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
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import { cachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
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
    query CachedAttributions(
      $id: Int!
      $CachedAttributionsWithEntites: Boolean = true
    ) {
      cached_attributions(where: { id: { _eq: $id } }) {
        ...cachedAttributionsFragment
        attribute {
          ...attributeFragment
        }
      }
    }
  `,
  [cachedAttributionsFragment, attributeFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['cached_attributions'] },
});
const attribution = computed(
  () =>
    data.value?.cached_attributions[0] as
      | (CachedAttributionsFragment & { attribute: AttributeFragment })
      | undefined,
);

const { t } = useI18n();
</script>
