<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <AttributionFormModalEdit
    v-else-if="attributionForm"
    :attribution-form="attributionForm"
    :title="t('base.edit')"
  />

  <q-card v-else>
    <BaseSpinner size="xl" />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionFormModalEdit from 'src/components/AttributionForm/AttributionFormModalEdit.vue';

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

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const attributionForm = computed(
  () =>
    (data.value?.attribution_forms_by_pk ?? null) as AttributionFormFragment,
);

const { t } = useI18n();
</script>
