<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="attribute"
      sprite-icon="form"
      :title="attribute.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <AttributeEntityTable :attribute="attribute" />

        <h3 class="q-my-md">{{ t('attributes.preview') }}</h3>
        <AttributePreview :attribute="attribute" />
      </template>

      <template #action-left>
        <AttributeButtonDelete
          v-if="!attribute.disabled"
          :attribute-id="attribute.id"
          @deleted="
            () => $router.push({ path: '/attributes', query: route.query })
          "
        />
        <div v-else></div>
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import AttributeButtonDelete from 'src/components/Attribute/AttributeButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { attributeFragment } from 'src/components/Attribute/attributeFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import AttributePreview from 'src/components/Attribute/AttributePreview.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import AttributeEntityTable from 'src/components/Attribute/AttributeEntityTable.vue';

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

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['attributes'] },
});

const attribute = computed(
  () => (data.value?.attributes_by_pk || null) as AttributeFragment | null,
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/attributes/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
