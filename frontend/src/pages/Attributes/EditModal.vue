<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <AttributeModalEdit
    v-else-if="attribute"
    :attribute="attribute"
    :title="t('base.edit')"
  />

  <q-card v-else>
    <BaseSpinner size="xl" />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import {
  AttributeFragment,
  attributeFragment,
} from 'src/components/Attribute/attributeFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributeModalEdit from 'src/components/Attribute/AttributeModalEdit.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Attribute($id: Int!) {
      attributes_by_pk(id: $id) {
        ...attributeFragment
      }
    }
  `,
  [attributeFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const attribute = computed(
  () => (data.value?.attributes_by_pk ?? null) as AttributeFragment,
);

const { t } = useI18n();
</script>
