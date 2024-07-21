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
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(rootstock.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            rootstock.modified
              ? localizeDate(rootstock.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
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
    <BaseSpinner />
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
import { localizeDate } from 'src/utils/dateUtils';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

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
