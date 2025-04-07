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
import type { AttributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { attributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import type { AttributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { attributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { computed } from 'vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import AttributionEntityTable from 'src/components/Attribution/AttributionEntityTable.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query AttributionsView(
      $id: Int!
      $AttributionsViewWithEntites: Boolean = true
    ) {
      attributions_view(where: { id: { _eq: $id } }) {
        ...attributionsViewFragment
        attribution_form {
          ...attributionFormFragment
        }
      }
    }
  `,
  [attributionsViewFragment, attributionFormFragment],
);

const { data, error, fetching } = await useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const attribution = computed(
  () =>
    data.value?.attributions_view[0] as
      | (AttributionsViewFragment & {
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
