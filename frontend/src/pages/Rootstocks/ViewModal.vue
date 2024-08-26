<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="rootstock"
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

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import RootstockButtonDelete from 'src/components/Rootstock/RootstockButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { rootstockFragment } from 'src/components/Rootstock/rootstockFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
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
