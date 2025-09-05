<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="attribution"
      sprite-icon="star"
      :title="attribution.attribute_name || 'Unknown'"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <AttributionEntityTable :attribution="attribution" />
      </template>

      <template #action-left>
        <AttributionButtonDelete
          :attribution-id="attribution.attribution_id"
          :attribution-value-id="attribution.id"
          @deleted="
            () => $router.push({ path: '/attributions', query: route.query })
          "
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import AttributionButtonDelete from 'src/components/Attribution/AttributionButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import { cachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import type { AttributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { attributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { computed } from 'vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import AttributionEntityTable from 'src/components/Attribution/AttributionEntityTable.vue';
import { useQuery } from '@urql/vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query CachedAttributions(
      $id: Int!
      $CachedAttributionsWithEntites: Boolean = true
    ) {
      cached_attributions(where: { id: { _eq: $id } }) {
        ...cachedAttributionsFragment
        attribution_form {
          ...attributionFormFragment
        }
      }
    }
  `,
  [cachedAttributionsFragment, attributionFormFragment],
);

const { data, fetching, error } = await useQuery({
  requestPolicy: 'cache-and-network',
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['cached_attributions'] },
});

const attribution = computed(
  () =>
    data.value?.cached_attributions[0] as
      | (CachedAttributionsFragment & {
          attribution_form: AttributionFormFragment;
        })
      | undefined,
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/attributions/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
