<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="rootstock"
      sprite-icon="rootstock"
      :title="rootstock.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <EntityViewTable>
          <EntityViewTableRow :label="t('entity.commonColumns.name')">
            {{ rootstock.name }}
          </EntityViewTableRow>
          <EntityTableViewTimestampRows
            :created="rootstock.created"
            :modified="rootstock.modified"
          />
        </EntityViewTable>
      </template>

      <template #action-left>
        <RootstockButtonDelete
          :rootstock-id="rootstock.id"
          @deleted="
            () => router.push({ path: '/rootstocks', query: route.query })
          "
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import RootstockButtonDelete from 'src/components/Rootstock/RootstockButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { rootstockFragment } from 'src/components/Rootstock/rootstockFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Rootstock($id: Int!) {
      rootstocks_by_pk(id: $id) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['rootstocks'] },
});

const rootstock = computed(() => data.value?.rootstocks_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/rootstocks/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
