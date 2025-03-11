<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <AttributeModalEdit
      v-if="attribute"
      :attribute="attribute"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { attributeFragment } from 'src/components/Attribute/attributeFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import AttributeModalEdit from 'src/components/Attribute/AttributeModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['attributes'] },
});
const attribute = computed(
  () => (data.value?.attributes_by_pk ?? null) as AttributeFragment,
);

const { t } = useI18n();
</script>
