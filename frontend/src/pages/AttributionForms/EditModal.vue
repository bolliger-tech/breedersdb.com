<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <AttributionFormModalEdit
      v-if="attributionForm"
      :attribution-form="attributionForm"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionFormModalEdit from 'src/components/AttributionForm/AttributionFormModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query AttributionForm($id: Int!) {
      attribution_forms_by_pk(id: $id) {
        ...attributionFormFragment
      }
    }
  `,
  [attributionFormFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['attribution_forms'] },
});
const attributionForm = computed(
  () =>
    (data.value?.attribution_forms_by_pk ?? null) as AttributionFormFragment,
);

const { t } = useI18n();
</script>
