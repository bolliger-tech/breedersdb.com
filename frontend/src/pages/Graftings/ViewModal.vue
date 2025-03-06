<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="grafting"
      sprite-icon="grafting"
      :title="grafting.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <EntityViewTable>
          <EntityViewTableRow :label="t('entity.commonColumns.name')">
            {{ grafting.name }}
          </EntityViewTableRow>
          <EntityTableViewTimestampRows
            :created="grafting.created"
            :modified="grafting.modified"
          />
        </EntityViewTable>
      </template>

      <template #action-left>
        <GraftingButtonDelete
          :grafting-id="grafting.id"
          @deleted="
            () => $router.push({ path: '/graftings', query: route.query })
          "
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import GraftingButtonDelete from 'src/components/Grafting/GraftingButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { graftingFragment } from 'src/components/Grafting/graftingFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Grafting($id: Int!) {
      graftings_by_pk(id: $id) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['graftings'] },
});

const grafting = computed(() => data.value?.graftings_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/graftings/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
